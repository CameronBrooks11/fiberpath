# CLI Health Check Architecture

This document describes the CLI health monitoring system implemented in FiberPath GUI.

## Overview

The CLI health check system provides real-time monitoring of the FiberPath CLI backend, ensuring users are immediately notified when the CLI becomes unavailable and file operations are disabled.

## Architecture

### Backend (Rust/Tauri)

**Location:** `src-tauri/src/main.rs`

#### `check_cli_health` Command

```rust
#[tauri::command]
async fn check_cli_health() -> Result<CliHealthResponse, String>
```

**Purpose:** Verifies that the `fiberpath` CLI is available and executable.

**Implementation:**

- Executes `fiberpath --version` as a subprocess
- Parses the output to extract the version string
- Returns health status, version, and error messages

**Response Schema:**

```rust
struct CliHealthResponse {
    healthy: bool,
    version: Option<String>,
    error_message: Option<String>,
}
```

### Frontend (TypeScript/React)

#### 1. Hook: `useCliHealth`

**Location:** `src/hooks/useCliHealth.ts`

**Purpose:** Encapsulates CLI health checking logic with polling support.

**Features:**

- Automatic health check on mount (optional)
- Configurable polling interval (default: 30 seconds)
- Manual refresh capability
- Error handling and recovery
- Cleanup on unmount

**Usage:**

```typescript
const {
  status, // 'ready' | 'checking' | 'unavailable' | 'unknown'
  version, // CLI version string or null
  errorMessage,
  lastChecked, // Date of last check
  refresh, // Manual refresh function
  isHealthy,
  isChecking,
  isUnavailable,
} = useCliHealth({
  enablePolling: true,
  pollingInterval: 30000,
  checkOnMount: true,
});
```

#### 2. Context: `CliHealthContext`

**Location:** `src/contexts/CliHealthContext.tsx`

**Purpose:** Provides CLI health state to all components via React Context.

**Implementation:**

- Wraps `useCliHealth` hook
- Polls every 30 seconds
- Checks health on mount
- Shares state across entire application

**Usage:**

```typescript
// In main.tsx
<CliHealthProvider>
  <App />
</CliHealthProvider>

// In any component
const { status, version, isHealthy } = useCliHealthContext();
```

#### 3. Components

##### CliHealthWarning

**Location:** `src/components/CliHealthWarning.tsx`

**Purpose:** Displays a warning banner when CLI is unavailable.

**Features:**

- Persistent banner at top of application
- "Retry" button to refresh health check
- "Details" button to open troubleshooting dialog
- Automatically hidden when CLI is healthy

##### CliUnavailableDialog

**Location:** `src/components/dialogs/CliUnavailableDialog.tsx`

**Purpose:** Detailed troubleshooting dialog for CLI connection issues.

**Features:**

- Error message display
- Step-by-step troubleshooting instructions
- Retry button
- Last known version display

##### StatusBar

**Location:** `src/components/StatusBar.tsx`

**Updated:** Now uses real CLI health status from context.

**Displays:**

- "CLI: Ready" (green) when healthy
- "CLI: Checking..." (gray) during health check
- "CLI: Unavailable" (red) when CLI not detected
- "CLI: Unknown" (gray) when status is unknown

##### DiagnosticsDialog

**Location:** `src/components/dialogs/DiagnosticsDialog.tsx`

**Updated:** Shows real CLI health data.

**Displays:**

- Health status with color coding
- CLI version string
- Error message (if unhealthy)
- Last checked timestamp
- Manual refresh button

## State Flow

```text
App Launch
    ↓
CliHealthProvider mounts
    ↓
useCliHealth hook initializes
    ↓
Initial health check runs
    ↓
┌─────────────────────────────────────┐
│ Every 30 seconds (polling)          │
│   ↓                                 │
│ invoke('check_cli_health')          │
│   ↓                                 │
│ Tauri runs: fiberpath --version     │
│   ↓                                 │
│ Response validated with Zod schema  │
│   ↓                                 │
│ Context state updated               │
│   ↓                                 │
│ All components re-render            │
│   ↓                                 │
│ UI updates (banner, status bar)     │
└─────────────────────────────────────┘
```

## Health Check States

### 1. `ready`

- CLI is available and responding
- Version detected successfully
- All file operations enabled
- Status bar: green indicator
- No warning banner

### 2. `checking`

- Health check in progress
- Status bar: gray indicator
- Brief transition state

### 3. `unavailable`

- CLI not detected or errored
- File operations disabled
- Status bar: red indicator
- Warning banner visible
- Error message available

### 4. `unknown`

- Initial state before first check
- Status bar: gray indicator

## Error Handling

### Backend Errors

- CLI not found → `healthy: false, error_message: "CLI not found or not executable"`
- Version command failed → `healthy: false` with stderr message
- Spawn error → Error message captured and returned

### Frontend Errors

- Network errors → Caught and displayed
- Validation errors → Schema validation with Zod
- Timeout handling → Built into Tauri invoke

## User Experience

### Healthy CLI

- No UI interruption
- Background polling continues
- Status bar shows green indicator

### CLI Becomes Unavailable

1. Warning banner slides down from top
2. Status bar indicator turns red
3. User can click "Details" for troubleshooting
4. User can click "Retry" to check immediately
5. User can continue working (editing project, viewing layers)
6. File operations (plan, simulate, export) show errors if attempted

### Recovery

1. User fixes CLI installation
2. User clicks "Retry" or waits for next poll
3. Health check succeeds
4. Warning banner disappears
5. Status bar turns green
6. File operations re-enabled

## Configuration

### Polling Interval

Default: 30 seconds

To change, edit `CliHealthContext.tsx`:

```typescript
const health = useCliHealth({
  enablePolling: true,
  pollingInterval: 60000, // 60 seconds
  checkOnMount: true,
});
```

### Disable Polling

In `CliHealthContext.tsx`:

```typescript
const health = useCliHealth({
  enablePolling: false, // Manual checks only
  checkOnMount: true,
});
```

## Testing

### Manual Testing

1. **Healthy CLI:**

   ```bash
   # Install fiberpath
   pip install fiberpath
   # Launch GUI - should show "CLI: Ready"
   ```

2. **Unavailable CLI:**

   ```bash
   # Uninstall or rename fiberpath CLI
   pip uninstall fiberpath
   # Launch GUI - should show warning banner
   ```

3. **Recovery:**

   ```bash
   # While GUI is running with unavailable CLI
   pip install fiberpath
   # Click "Retry" in banner - should turn green
   ```

### Automated Testing

Currently manual testing only. Future additions could include:

- Mock Tauri commands in tests
- Component tests for CliHealthWarning
- Integration tests for context provider
- E2E tests for full health check flow

## Troubleshooting

### CLI version not detected

- Ensure `fiberpath --version` works in terminal
- Check system PATH includes Python/pip bin directory
- Verify fiberpath package installed: `pip list | grep fiberpath`

### Polling not working

- Check browser console for errors
- Verify polling interval is reasonable (>1000ms)
- Ensure CliHealthProvider is above App in component tree

### Warning banner stuck

- Manually refresh with diagnostics dialog
- Check browser console for connection errors
- Restart application

## Future Enhancements

- [ ] Configurable polling interval in settings
- [ ] Notification when CLI recovers
- [ ] Automatic retry on failure
- [ ] CLI installation wizard
- [ ] Health check history/logs
- [ ] Performance metrics (check duration)
