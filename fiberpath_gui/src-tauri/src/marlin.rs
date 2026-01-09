use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MarlinError {
    #[error("Failed to spawn subprocess: {0}")]
    SpawnFailed(String),
    #[error("Subprocess not running")]
    NotRunning,
    #[error("Failed to send command: {0}")]
    SendFailed(String),
    #[error("Failed to read response: {0}")]
    ReadFailed(String),
    #[error("Invalid JSON response: {0}")]
    InvalidJson(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerialPort {
    pub port: String,
    pub description: String,
    pub hwid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum MarlinResponse {
    #[serde(rename = "ok")]
    Ok {
        #[serde(skip_serializing_if = "Option::is_none")]
        ports: Option<Vec<SerialPort>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        command: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        responses: Option<Vec<String>>,
    },
    #[serde(rename = "connected")]
    Connected {
        port: String,
        #[serde(rename = "baudRate")]
        baud_rate: u32,
    },
    #[serde(rename = "disconnected")]
    Disconnected {
        #[serde(skip_serializing_if = "Option::is_none")]
        message: Option<String>,
    },
    #[serde(rename = "streaming")]
    Streaming {
        file: String,
        #[serde(rename = "totalCommands")]
        total_commands: usize,
    },
    #[serde(rename = "progress")]
    Progress {
        #[serde(rename = "commandsSent")]
        commands_sent: usize,
        #[serde(rename = "commandsTotal")]
        commands_total: usize,
        command: String,
        #[serde(rename = "dryRun")]
        dry_run: bool,
    },
    #[serde(rename = "complete")]
    Complete {
        #[serde(rename = "commandsSent")]
        commands_sent: usize,
        #[serde(rename = "commandsTotal")]
        commands_total: usize,
    },
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "resumed")]
    Resumed,
    #[serde(rename = "exiting")]
    Exiting,
    #[serde(rename = "error")]
    Error { code: String, message: String },
}

pub struct MarlinSubprocess {
    child: Child,
    stdin: ChildStdin,
    stdout_reader: Arc<Mutex<BufReader<ChildStdout>>>,
}

impl MarlinSubprocess {
    pub fn spawn() -> Result<Self, MarlinError> {
        let mut child = Command::new("fiberpath")
            .arg("interactive")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| MarlinError::SpawnFailed(e.to_string()))?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| MarlinError::SpawnFailed("Failed to capture stdin".to_string()))?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| MarlinError::SpawnFailed("Failed to capture stdout".to_string()))?;

        let stdout_reader = Arc::new(Mutex::new(BufReader::new(stdout)));

        Ok(Self {
            child,
            stdin,
            stdout_reader,
        })
    }

    pub fn send_command(&mut self, command: serde_json::Value) -> Result<(), MarlinError> {
        let json_str = serde_json::to_string(&command)
            .map_err(|e| MarlinError::SendFailed(format!("Failed to serialize command: {}", e)))?;

        writeln!(self.stdin, "{}", json_str).map_err(|e| MarlinError::SendFailed(e.to_string()))?;

        self.stdin
            .flush()
            .map_err(|e| MarlinError::SendFailed(e.to_string()))?;

        Ok(())
    }

    pub fn read_response(&self) -> Result<MarlinResponse, MarlinError> {
        let mut stdout_reader = self
            .stdout_reader
            .lock()
            .map_err(|e| MarlinError::ReadFailed(format!("Failed to lock stdout reader: {}", e)))?;

        let mut line = String::new();
        stdout_reader
            .read_line(&mut line)
            .map_err(|e| MarlinError::ReadFailed(e.to_string()))?;

        let response: MarlinResponse = serde_json::from_str(&line)
            .map_err(|e| MarlinError::InvalidJson(format!("{}: {}", e, line)))?;

        Ok(response)
    }

    pub fn cleanup(mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

pub struct MarlinState {
    subprocess: Option<MarlinSubprocess>,
}

impl MarlinState {
    pub fn new() -> Self {
        Self { subprocess: None }
    }

    pub fn start_subprocess(&mut self) -> Result<(), MarlinError> {
        if self.subprocess.is_some() {
            return Ok(()); // Already running
        }

        let subprocess = MarlinSubprocess::spawn()?;
        self.subprocess = Some(subprocess);
        Ok(())
    }

    pub fn send_command(&mut self, command: serde_json::Value) -> Result<(), MarlinError> {
        let subprocess = self.subprocess.as_mut().ok_or(MarlinError::NotRunning)?;

        subprocess.send_command(command)
    }

    pub fn read_response(&self) -> Result<MarlinResponse, MarlinError> {
        let subprocess = self.subprocess.as_ref().ok_or(MarlinError::NotRunning)?;

        subprocess.read_response()
    }
}

// Tauri commands

#[tauri::command]
pub async fn marlin_list_ports() -> Result<Vec<SerialPort>, String> {
    // For list_ports, we'll spawn a one-off subprocess
    // This avoids needing to start the interactive subprocess just to list ports
    let mut subprocess = MarlinSubprocess::spawn().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "list_ports"
    });

    subprocess
        .send_command(command)
        .map_err(|e| e.to_string())?;

    let response = subprocess.read_response().map_err(|e| e.to_string())?;

    // Clean up subprocess
    subprocess.cleanup();

    match response {
        MarlinResponse::Ok {
            ports: Some(ports), ..
        } => Ok(ports),
        MarlinResponse::Error { message, .. } => Err(message),
        other => Err(format!("Unexpected response from list_ports: {:?}", other)),
    }
}

#[tauri::command]
pub async fn marlin_start_interactive(
    state: tauri::State<'_, Arc<Mutex<MarlinState>>>,
) -> Result<(), String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;
    marlin_state.start_subprocess().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn marlin_connect(
    port: String,
    baud_rate: u32,
    state: tauri::State<'_, Arc<Mutex<MarlinState>>>,
) -> Result<(), String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;

    // Ensure subprocess is running
    marlin_state.start_subprocess().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "connect",
        "port": port,
        "baudRate": baud_rate
    });

    marlin_state
        .send_command(command)
        .map_err(|e| e.to_string())?;

    let response = marlin_state.read_response().map_err(|e| e.to_string())?;

    match response {
        MarlinResponse::Connected { .. } => Ok(()),
        MarlinResponse::Error { message, .. } => Err(message),
        other => Err(format!("Unexpected response from connect: {:?}", other)),
    }
}

#[tauri::command]
pub async fn marlin_disconnect(
    state: tauri::State<'_, Arc<Mutex<MarlinState>>>,
) -> Result<(), String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "disconnect"
    });

    marlin_state
        .send_command(command)
        .map_err(|e| e.to_string())?;

    let response = marlin_state.read_response().map_err(|e| e.to_string())?;

    match response {
        MarlinResponse::Disconnected { .. } => Ok(()),
        MarlinResponse::Error { message, .. } => Err(message),
        other => Err(format!("Unexpected response from disconnect: {:?}", other)),
    }
}

#[tauri::command]
pub async fn marlin_send_command(
    gcode: String,
    state: tauri::State<'_, Arc<Mutex<MarlinState>>>,
) -> Result<Vec<String>, String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "send",
        "gcode": gcode
    });

    marlin_state
        .send_command(command)
        .map_err(|e| e.to_string())?;

    let response = marlin_state.read_response().map_err(|e| e.to_string())?;

    match response {
        MarlinResponse::Ok {
            responses: Some(responses),
            ..
        } => Ok(responses),
        MarlinResponse::Error { message, .. } => Err(message),
        other => Err(format!(
            "Unexpected response from send_command: {:?}",
            other
        )),
    }
}

#[tauri::command]
pub async fn marlin_stream_file(
    file_path: String,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<MarlinState>>>,
) -> Result<(), String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "stream",
        "file": file_path
    });

    marlin_state
        .send_command(command)
        .map_err(|e| e.to_string())?;

    // Read streaming started response
    let start_response = marlin_state.read_response().map_err(|e| e.to_string())?;

    match start_response {
        MarlinResponse::Streaming { .. } => {
            // Emit streaming started event
            app.emit("stream-started", &start_response)
                .map_err(|e| e.to_string())?;
        }
        MarlinResponse::Error { message, .. } => return Err(message),
        _ => return Err("Unexpected response from stream_file".to_string()),
    }

    // Clone app handle and state for the spawned task
    let app_clone = app.clone();
    let state_clone = state.inner().clone();

    // Spawn a task to read progress events
    tauri::async_runtime::spawn(async move {
        loop {
            let response = {
                let marlin_state = match state_clone.lock() {
                    Ok(s) => s,
                    Err(_) => break,
                };

                match marlin_state.read_response() {
                    Ok(r) => r,
                    Err(_) => break,
                }
            };

            match response {
                MarlinResponse::Progress { .. } => {
                    let _ = app_clone.emit("stream-progress", &response);
                }
                MarlinResponse::Complete { .. } => {
                    let _ = app_clone.emit("stream-complete", &response);
                    break;
                }
                MarlinResponse::Error { .. } => {
                    let _ = app_clone.emit("stream-error", &response);
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn marlin_pause(state: tauri::State<'_, Arc<Mutex<MarlinState>>>) -> Result<(), String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "pause"
    });

    marlin_state
        .send_command(command)
        .map_err(|e| e.to_string())?;

    let response = marlin_state.read_response().map_err(|e| e.to_string())?;

    match response {
        MarlinResponse::Paused => Ok(()),
        MarlinResponse::Error { message, .. } => Err(message),
        other => Err(format!("Unexpected response from pause: {:?}", other)),
    }
}

#[tauri::command]
pub async fn marlin_resume(state: tauri::State<'_, Arc<Mutex<MarlinState>>>) -> Result<(), String> {
    let mut marlin_state = state.lock().map_err(|e| e.to_string())?;

    let command = serde_json::json!({
        "action": "resume"
    });

    marlin_state
        .send_command(command)
        .map_err(|e| e.to_string())?;

    let response = marlin_state.read_response().map_err(|e| e.to_string())?;

    match response {
        MarlinResponse::Resumed => Ok(()),
        MarlinResponse::Error { message, .. } => Err(message),
        other => Err(format!("Unexpected response from resume: {:?}", other)),
    }
}
