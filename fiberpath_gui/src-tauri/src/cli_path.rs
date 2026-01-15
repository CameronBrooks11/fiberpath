use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the path to the fiberpath CLI executable.
///
/// This function checks for a bundled CLI executable in the resources directory first,
/// then falls back to the system PATH if not found (for development scenarios).
///
/// # Platform-specific resource paths:
/// - Windows: `_up_/bundled-cli/fiberpath.exe`
/// - macOS: `bundled-cli/fiberpath`
/// - Linux: `bundled-cli/fiberpath`
///
/// # Returns
/// - `Ok(PathBuf)` - Path to the fiberpath executable (bundled or system)
/// - `Err(String)` - Error message if CLI not found
pub fn get_fiberpath_executable(app: &AppHandle) -> Result<PathBuf, String> {
    log::info!("=== FiberPath CLI Resolution Debug ===");
    
    // Get resource directory first for diagnostics
    let resource_dir_result = app.path().resource_dir();
    log::info!("Resource dir result: {:?}", resource_dir_result);
    
    // Try to get the bundled CLI from resources directory
    match get_bundled_cli_path(app) {
        Ok(bundled_path) => {
            log::info!("Bundled CLI path constructed: {:?}", bundled_path);
            log::info!("Checking if path exists...");
            
            if bundled_path.exists() {
                log::info!("✓ Bundled CLI found and exists!");
                
                // Check if it's a file
                if bundled_path.is_file() {
                    log::info!("✓ Path is a file");
                    return Ok(bundled_path);
                } else {
                    log::error!("✗ Path exists but is not a file (directory?)");
                }
            } else {
                log::warn!("✗ Bundled CLI path does not exist");
                
                // Try to list parent directory contents for debugging
                if let Some(parent) = bundled_path.parent() {
                    log::info!("Parent directory: {:?}", parent);
                    if parent.exists() {
                        log::info!("Parent exists, listing contents:");
                        if let Ok(entries) = std::fs::read_dir(parent) {
                            for entry in entries.flatten() {
                                log::info!("  - {:?}", entry.path());
                            }
                        } else {
                            log::error!("Failed to read parent directory");
                        }
                    } else {
                        log::error!("Parent directory does not exist");
                    }
                }
            }
        }
        Err(e) => {
            log::error!("Failed to construct bundled CLI path: {}", e);
        }
    }

    // Fallback to system PATH (for development)
    log::info!("Trying system PATH fallback...");
    if let Ok(system_path) = which::which("fiberpath") {
        log::info!("✓ Found fiberpath in system PATH: {:?}", system_path);
        return Ok(system_path);
    } else {
        log::warn!("✗ fiberpath not found in system PATH");
    }

    // No CLI found
    log::error!("=== CLI NOT FOUND ===");
    Err(
        "FiberPath CLI not found. Please ensure the application was installed correctly, \
         or install the Python package with: pip install fiberpath"
            .to_string(),
    )
}

/// Get the path to the bundled CLI executable in the resources directory.
///
/// This function uses Tauri v2's Manager trait to resolve the resource directory
/// and then constructs the platform-specific path to the bundled CLI.
pub fn get_bundled_cli_path(app: &AppHandle) -> Result<PathBuf, String> {
    // Get the resource directory using Tauri v2 API
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to resolve resource directory: {}", e))?;

    // On Windows, Tauri v2 places bundled resources in a "_up_" subdirectory for installed apps,
    // but directly in the resource dir for dev builds.
    // We check both locations.
    let cli_path = if cfg!(target_os = "windows") {
        let exe_name = "fiberpath.exe";
        
        // Try _up_/bundled-cli/fiberpath.exe first (installed app)
        let installed_path = resource_dir.join("_up_").join("bundled-cli").join(exe_name);
        if installed_path.exists() {
            installed_path
        } else {
            // Fall back to bundled-cli/fiberpath.exe (dev build)
            resource_dir.join("bundled-cli").join(exe_name)
        }
    } else if cfg!(target_os = "macos") {
        // macOS: bundled-cli/fiberpath
        resource_dir.join("bundled-cli").join("fiberpath")
    } else if cfg!(target_os = "linux") {
        // Linux: bundled-cli/fiberpath
        resource_dir.join("bundled-cli").join("fiberpath")
    } else {
        return Err(format!("Unsupported platform: {}", std::env::consts::OS));
    };

    Ok(cli_path)
}

/// Convert PathBuf to string for Command::new()
///
/// This helper ensures proper string conversion with error handling.
pub fn path_to_string(path: &PathBuf) -> Result<String, String> {
    path.to_str()
        .ok_or_else(|| format!("Invalid path encoding: {:?}", path))
        .map(|s| s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bundled_path_construction() {
        // This test just verifies the path construction logic compiles
        // Actual testing requires a real Tauri AppHandle which is only available at runtime
        assert!(cfg!(target_os = "windows") || cfg!(target_os = "macos") || cfg!(target_os = "linux"));
    }
}
