#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose::STANDARD as Base64, Engine};
use serde_json::Value;
use std::fs;
use std::process::Output;
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;

#[derive(Debug, Error)]
enum FiberpathError {
    #[error("fiberpath exited with an error: {0}")]
    Process(String),
    #[error("Unable to parse JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("File error: {0}")]
    File(String),
}

#[tauri::command]
async fn plan_wind(input_path: String, output_path: Option<String>, axis_format: Option<String>) -> Result<Value, String> {
    let output_file = output_path.unwrap_or_else(|| temp_path("gcode"));
    let mut args = vec!["plan".to_string(), input_path, "--output".into(), output_file.clone(), "--json".into()];
    
    // Add axis format flag if specified
    if let Some(format) = axis_format {
        args.push("--axis-format".into());
        args.push(format);
    }
    
    let output = exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    parse_json_payload(output).map(|mut payload| {
        if let Value::Object(ref mut obj) = payload {
            obj.entry("output".to_string()).or_insert(Value::String(output_file));
        }
        payload
    })
}

#[tauri::command]
async fn simulate_program(gcode_path: String) -> Result<Value, String> {
    let args = vec!["simulate".into(), gcode_path, "--json".into()];
    let output = exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    parse_json_payload(output)
}

#[derive(serde::Serialize)]
struct PlotPreview {
    path: String,
    #[serde(rename = "imageBase64")]
    image_base64: String,
    warnings: Vec<String>,
}

#[tauri::command]
async fn plot_preview(gcode_path: String, scale: f64, output_path: Option<String>) -> Result<PlotPreview, String> {
    let output_file = output_path.unwrap_or_else(|| temp_path("png"));
    let args = vec![
        "plot".into(),
        gcode_path,
        "--output".into(),
        output_file.clone(),
        "--scale".into(),
        scale.to_string(),
    ];
    exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    let bytes = fs::read(&output_file).map_err(|err| FiberpathError::File(err.to_string()).to_string())?;
    Ok(PlotPreview {
        path: output_file,
        image_base64: Base64.encode(bytes),
        warnings: vec![], // plot command doesn't generate warnings like plan does
    })
}

#[tauri::command]
async fn stream_program(gcode_path: String, port: Option<String>, baud_rate: u32, dry_run: bool) -> Result<Value, String> {
    let mut args = vec!["stream".into(), gcode_path, "--baud-rate".into(), baud_rate.to_string(), "--json".into()];
    if dry_run {
        args.push("--dry-run".into());
    } else if let Some(port_value) = port {
        args.push("--port".into());
        args.push(port_value);
    }
    let output = exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    parse_json_payload(output)
}

#[tauri::command]
async fn plot_definition(definition_json: String, visible_layer_count: usize, output_path: Option<String>) -> Result<PlotPreview, String> {
    let mut warnings = Vec::new();
    
    // Create temporary .wind file
    let wind_file = temp_path("wind");
    fs::write(&wind_file, &definition_json)
        .map_err(|err| FiberpathError::File(format!("Failed to write temp .wind file: {err}")).to_string())?;
    
    // Create temporary .gcode file
    let gcode_file = temp_path("gcode");
    
    // First, run plan to convert .wind to .gcode
    let plan_args = vec![
        "plan".into(),
        wind_file.clone(),
        "--output".into(),
        gcode_file.clone(),
    ];
    let plan_output = exec_fiberpath(plan_args).await.map_err(|err| format!("Planning failed: {err}"))?;
    
    // Capture stderr warnings from planner
    let stderr = String::from_utf8_lossy(&plan_output.stderr);
    if !stderr.is_empty() {
        for line in stderr.lines() {
            if !line.trim().is_empty() {
                warnings.push(line.trim().to_string());
            }
        }
    }
    
    // Generate output path for PNG
    let output_file = output_path.unwrap_or_else(|| temp_path("png"));
    
    // Build plot command args with scale for better visibility
    let args = vec![
        "plot".into(),
        gcode_file.clone(),
        "--output".into(),
        output_file.clone(),
        "--scale".into(),
        "0.5".into(), // Scale down for overview
    ];
    
    // Execute plot command
    exec_fiberpath(args).await.map_err(|err| format!("Plotting failed: {err}"))?;
    
    // Read and encode image
    let bytes = fs::read(&output_file)
        .map_err(|err| FiberpathError::File(format!("Failed to read plot output: {err}")).to_string())?;
    
    // Clean up temp files
    let _ = fs::remove_file(&wind_file);
    let _ = fs::remove_file(&gcode_file);
    let _ = fs::remove_file(&output_file);
    
    Ok(PlotPreview {
        path: output_file,
        image_base64: Base64.encode(&bytes),
        warnings,
    })
}

fn temp_path(extension: &str) -> String {
    let mut path = std::env::temp_dir();
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    path.push(format!("fiberpath-{millis}.{extension}"));
    path.to_string_lossy().into_owned()
}

async fn exec_fiberpath(args: Vec<String>) -> Result<Output, FiberpathError> {
    let joined = args.join(" ");
    let output = tauri::async_runtime::spawn_blocking(move || std::process::Command::new("fiberpath").args(args).output())
        .await
        .map_err(|err| FiberpathError::Process(format!("Failed to run fiberpath: {err}")))?
        .map_err(|err| {
            let message = format!("{err}");
            FiberpathError::Process(format!("{message} while running `{joined}`"))
        })?;
    
    // Check if command succeeded
    if !output.status.success() {
        return Err(FiberpathError::Process(format_cli_error(&output)));
    }
    
    Ok(output)
}

fn parse_json_payload(output: Output) -> Result<Value, String> {
    if !output.status.success() {
        return Err(format_cli_error(&output));
    }
    serde_json::from_slice::<Value>(&output.stdout)
        .map_err(|err| FiberpathError::Json(err).to_string())
}

fn format_cli_error(output: &Output) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    format!(
        "fiberpath exited with status {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status.code(), stdout.trim(), stderr.trim()
    )
}

#[tauri::command]
async fn save_wind_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|err| FiberpathError::File(format!("Failed to write .wind file: {err}")).to_string())
}

#[tauri::command]
async fn load_wind_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|err| FiberpathError::File(format!("Failed to read .wind file: {err}")).to_string())
}

#[tauri::command]
async fn validate_wind_definition(definition_json: String) -> Result<Value, String> {
    // Create temporary .wind file
    let wind_file = temp_path("wind");
    fs::write(&wind_file, &definition_json)
        .map_err(|err| FiberpathError::File(format!("Failed to write temp .wind file: {err}")).to_string())?;
    
    // Run validate command
    let args = vec!["validate".into(), wind_file.clone(), "--json".into()];
    let output = exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    
    // Clean up temp file
    let _ = fs::remove_file(&wind_file);
    
    parse_json_payload(output)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            plan_wind,
            simulate_program,
            plot_preview,
            plot_definition,
            stream_program,
            save_wind_file,
            load_wind_file,
            validate_wind_definition
        ])
        .run(tauri::generate_context!())
        .expect("error while running FiberPath GUI");
}
