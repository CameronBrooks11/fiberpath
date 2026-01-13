# CLI Integration Architecture

How FiberPath GUI bridges to the Python CLI backend via Tauri commands.

## Architecture Overview

```text
┌─────────────────────────────────────┐
│  React Components                   │  User interactions
│  (PlanForm, PlotPanel, etc.)        │
└─────────────┬───────────────────────┘
              │ TypeScript functions
              ▼
┌─────────────────────────────────────┐
│  Command Layer (commands.ts)        │  Type-safe wrappers
│  - planWind()                       │  - Retry logic
│  - simulateProgram()                │  - Error handling
│  - plotPreview()                    │  - Zod validation
└─────────────┬───────────────────────┘
              │ invoke()
              ▼
┌─────────────────────────────────────┐
│  Tauri IPC Bridge                   │  Async serialization
│  (invoke_handler)                   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Rust Commands (main.rs)            │  Process spawning
│  #[tauri::command]                  │  - File I/O
│  - plan_wind                        │  - JSON parsing
│  - simulate_program                 │  - Error mapping
│  - plot_preview                     │
└─────────────┬───────────────────────┘
              │ std::process::Command
              ▼
┌─────────────────────────────────────┐
│  FiberPath CLI (Python)             │  Core algorithms
│  $ fiberpath plan input.wind        │
│  $ fiberpath simulate out.gcode     │
│  $ fiberpath plot out.gcode         │
└─────────────────────────────────────┘
```

## Frontend Layer

### Command Wrappers (`src/lib/commands.ts`)

```typescript
export const planWind = withRetry(
  async (
    inputPath: string,
    outputPath?: string,
    axisFormat?: AxisFormat
  ): Promise<PlanSummary> => {
    try {
      const result = await invoke("plan_wind", {
        inputPath,
        outputPath,
        axisFormat,
      });
      return validateData(PlanSummarySchema, result, "plan_wind response");
    } catch (error) {
      throw new CommandError(
        "Failed to plan wind definition",
        "plan_wind",
        error
      );
    }
  },
  { maxAttempts: 2 }
);
```

**Features:**

- **Type Safety:** Returns typed `PlanSummary` not `unknown`
- **Validation:** Zod schema validates CLI response structure
- **Retry Logic:** Automatic retry on transient failures
- **Error Wrapping:** Converts raw errors to `CommandError`

### Retry Logic (`src/lib/retry.ts`)

```typescript
export function withRetry<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: RetryOptions = {}
): (...args: Args) => Promise<T> {
  const { maxAttempts = 3, delayMs = 1000 } = options;

  return async (...args: Args): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await delay(delayMs);
        }
      }
    }

    throw lastError;
  };
}
```

**Configuration:**

- `maxAttempts`: 2-3 for most commands (default 3)
- `delayMs`: 1000ms between attempts
- **Use Cases:** Network timeouts, file locks, temporary I/O errors

### Error Classes (`src/lib/validation.ts`)

```typescript
export class CommandError extends Error {
  constructor(
    message: string,
    public command: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "CommandError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class FileError extends Error {
  constructor(
    message: string,
    public filePath: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "FileError";
  }
}

export class ConnectionError extends Error {
  constructor(
    message: string,
    public port: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "ConnectionError";
  }
}
```

**Usage:**

```typescript
try {
  await planWind(inputPath);
} catch (error) {
  if (error instanceof CommandError) {
    console.error(`Command ${error.command} failed: ${error.message}`);
  } else if (error instanceof ValidationError) {
    error.errors.forEach((e) => console.error(`${e.field}: ${e.message}`));
  }
}
```

## Rust Backend Layer

### Command Definitions (`src-tauri/src/main.rs`)

#### Plan Command

```rust
#[tauri::command]
async fn plan_wind(
    input_path: String,
    output_path: Option<String>,
    axis_format: Option<String>,
) -> Result<Value, String> {
    let output_file = output_path.unwrap_or_else(|| temp_path("gcode"));
    let mut args = vec![
        "plan".to_string(),
        input_path,
        "--output".into(),
        output_file.clone(),
        "--json".into(),
    ];

    if let Some(format) = axis_format {
        args.push("--axis-format".into());
        args.push(format);
    }

    let output = exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    parse_json_payload(output).map(|mut payload| {
        if let Value::Object(ref mut obj) = payload {
            obj.insert("output".to_string(), Value::String(output_file));
        }
        payload
    })
}
```

**Flow:**

1. Accept input path and optional output/format
2. Generate temp file if output not specified
3. Build CLI args with `--json` flag
4. Execute `fiberpath plan ...`
5. Parse JSON response
6. Inject output path into response

#### Simulate Command

```rust
#[tauri::command]
async fn simulate_program(gcode_path: String) -> Result<Value, String> {
    let args = vec!["simulate".into(), gcode_path, "--json".into()];
    let output = exec_fiberpath(args).await.map_err(|err| err.to_string())?;
    parse_json_payload(output)
}
```

**Simpler:** No temp files, just execute and parse.

#### Plot Command

```rust
#[tauri::command]
async fn plot_preview(
    gcode_path: String,
    scale: f64,
    output_path: Option<String>,
) -> Result<PlotPreview, String> {
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

    // Read PNG and encode as base64
    let bytes = fs::read(&output_file)
        .map_err(|err| FiberpathError::File(err.to_string()).to_string())?;

    Ok(PlotPreview {
        path: output_file,
        image_base64: Base64.encode(bytes),
        warnings: vec![],
    })
}
```

**Special:** Returns base64-encoded image for embedding in React.

### Process Execution (`exec_fiberpath`)

```rust
async fn exec_fiberpath(args: Vec<String>) -> Result<Output, FiberpathError> {
    let output = std::process::Command::new("fiberpath")
        .args(&args)
        .output()
        .map_err(|e| FiberpathError::Process(e.to_string()))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(FiberpathError::Process(stderr.to_string()));
    }

    Ok(output)
}
```

**Error Handling:**

- Checks exit code
- Captures stderr on failure
- Returns typed error

### JSON Parsing (`parse_json_payload`)

```rust
fn parse_json_payload(output: Output) -> Result<Value, String> {
    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(&stdout).map_err(|e| e.to_string())
}
```

**Assumption:** CLI outputs valid JSON to stdout when `--json` flag present.

### Temporary Files

```rust
fn temp_path(extension: &str) -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

    let temp_dir = std::env::temp_dir();
    temp_dir
        .join(format!("fiberpath-{}.{}", timestamp, extension))
        .to_string_lossy()
        .to_string()
}
```

**Pattern:** Timestamp-based names prevent collisions.

## Data Flow Examples

### Planning Workflow

```text
1. User clicks "Generate G-code" in PlanForm
   ↓
2. Component calls planWind(inputPath, outputPath, axisFormat)
   ↓
3. Command wrapper invokes Tauri command
   ↓
4. Rust plan_wind() spawns: fiberpath plan input.wind --output out.gcode --axis-format xab --json
   ↓
5. Python CLI reads input.wind, generates G-code, writes out.gcode
   ↓
6. Python prints JSON summary to stdout: {"commands": 1234, "duration": 56.7, ...}
   ↓
7. Rust parses JSON, returns to frontend
   ↓
8. Frontend validates with PlanSummarySchema
   ↓
9. Component updates UI with plan metrics
```

### Plotting Workflow

```text
1. User clicks "Preview" in PlotPanel
   ↓
2. Component calls plotPreview(gcodePath, scale)
   ↓
3. Rust plot_preview() spawns: fiberpath plot out.gcode --output preview.png --scale 2.0
   ↓
4. Python CLI reads G-code, generates PNG plot
   ↓
5. Rust reads PNG bytes, encodes as base64
   ↓
6. Frontend receives {path: "...", imageBase64: "iVBORw0KG...", warnings: []}
   ↓
7. Component renders <img src={`data:image/png;base64,${imageBase64}`} />
```

### Simulation Workflow

```text
1. User clicks "Simulate" in SimulatePanel
   ↓
2. Component calls simulateProgram(gcodePath)
   ↓
3. Rust simulate_program() spawns: fiberpath simulate out.gcode --json
   ↓
4. Python CLI parses G-code, simulates motion
   ↓
5. Python prints JSON: {"total_time": 3456.7, "total_distance": 12345.6, ...}
   ↓
6. Rust parses and returns JSON
   ↓
7. Frontend validates and displays metrics
```

## Health Checking

### CLI Availability

```typescript
export async function checkCliVersion(): Promise<string> {
  try {
    const output = await invoke<string>("check_cli_version");
    return output.trim();
  } catch (error) {
    throw new CommandError(
      "FiberPath CLI not found or not in PATH",
      "check_cli_version",
      error
    );
  }
}
```

```rust
#[tauri::command]
async fn check_cli_version() -> Result<String, String> {
    let output = std::process::Command::new("fiberpath")
        .arg("--version")
        .output()
        .map_err(|e| format!("CLI not found: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

**Usage:** Call on app startup to verify CLI installation.

### Error Recovery

```typescript
try {
  const summary = await planWind(inputPath);
} catch (error) {
  if (error instanceof CommandError && error.cause?.includes("not found")) {
    showInstallInstructions();
  } else {
    showGenericError(error.message);
  }
}
```

## Performance Considerations

### Async Execution

All commands are `async fn` in Rust, preventing UI blocking:

```rust
#[tauri::command]
async fn plan_wind(...) -> Result<...> {
    // Runs on background thread pool
    exec_fiberpath(args).await
}
```

**Benefit:** UI remains responsive during CLI execution.

### Temporary File Cleanup

**Manual cleanup needed:**

```typescript
try {
  const result = await planWind(inputPath, tempOutput);
  // ...use result
} finally {
  await invoke("delete_file", { path: tempOutput });
}
```

**Future Improvement:** Auto-cleanup via RAII or temp directory manager.

### Streaming Progress

For long-running operations, use event emission:

```rust
use tauri::Manager;

#[tauri::command]
async fn long_operation(window: tauri::Window) -> Result<(), String> {
    for i in 0..100 {
        window.emit("progress", i).unwrap();
        // ...work
    }
    Ok(())
}
```

```typescript
import { listen } from "@tauri-apps/api/event";

const unlisten = await listen<number>("progress", (event) => {
  console.log(`Progress: ${event.payload}%`);
});
```

**Use Case:** Large file processing, multi-file operations.

## Testing

### Mock Tauri Commands

```typescript
import { vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

it("should handle plan success", async () => {
  vi.mocked(invoke).mockResolvedValue({
    commands: 1234,
    duration: 56.7,
    output: "/tmp/out.gcode",
  });

  const result = await planWind("input.wind");

  expect(result.commands).toBe(1234);
  expect(invoke).toHaveBeenCalledWith("plan_wind", {
    inputPath: "input.wind",
    outputPath: undefined,
    axisFormat: undefined,
  });
});
```

### Integration Tests

Run actual CLI commands in test environment:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_plan_wind() {
        let result = plan_wind(
            "test_input.wind".into(),
            None,
            Some("xab".into()),
        ).await;

        assert!(result.is_ok());
    }
}
```

## Troubleshooting

### "Command not found"

**Cause:** `fiberpath` not in PATH.

**Solution:** Install CLI, verify with `which fiberpath` (macOS/Linux) or `Get-Command fiberpath` (Windows).

### "Permission denied"

**Cause:** Serial port access (Linux).

**Solution:** Add user to `dialout` group: `sudo usermod -a -G dialout $USER`

### "Invalid JSON"

**Cause:** CLI output includes non-JSON (warnings, logs).

**Solution:** Ensure `--json` flag forces JSON-only output. Check CLI stderr for warnings.

### Slow command execution

**Cause:** Large G-code files, complex patterns.

**Solution:** Add progress events, consider background processing with status updates.

## Next Steps

- [Streaming State Management](streaming-state.md) - Real-time hardware control
- [State Management](state-management.md) - Store → CLI data flow
- [Schema Validation](../guides/schemas.md) - Response validation patterns
