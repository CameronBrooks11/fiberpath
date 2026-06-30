//! `.wind` file-association support.
//!
//! Declaring the association in `tauri.conf.json` (`bundle.fileAssociations`)
//! makes the OS launch FiberPath when a `.wind` file is opened. The *path* then
//! arrives differently per platform:
//!
//! - **Windows / Linux** — as a command-line argument to the launched process.
//!   First launch is read from [`std::env::args`]; a second launch while the app
//!   is running is forwarded by the single-instance plugin as `argv`.
//! - **macOS** — via an Apple Event surfaced as `tauri::RunEvent::Opened`.
//!
//! This module owns the one piece of real logic both channels share: picking the
//! `.wind` path out of an argument list.

use std::path::{Path, PathBuf};

/// The file extension FiberPath registers.
const WIND_EXT: &str = "wind";

/// Whether `path` names a `.wind` file (case-insensitive extension).
pub fn is_wind_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case(WIND_EXT))
}

/// Pick the first `.wind` file path out of a process argument list.
///
/// `args` is the full `argv`, so the leading binary path (`argv[0]`) is skipped.
/// Flags and non-`.wind` arguments are ignored by matching on the extension, so
/// the function is robust to extra launch arguments the OS may append.
pub fn wind_path_from_args<I, S>(args: I) -> Option<PathBuf>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    args.into_iter()
        .skip(1)
        .map(|arg| PathBuf::from(arg.as_ref()))
        .find(|path| is_wind_file(path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_wind_path_after_binary_name() {
        let path = wind_path_from_args(["fiberpath_gui", "/home/u/spool.wind"]);
        assert_eq!(path, Some(PathBuf::from("/home/u/spool.wind")));
    }

    #[test]
    fn skips_flags_and_picks_the_wind_file() {
        let path = wind_path_from_args(["fiberpath_gui", "--flag", "/tmp/a.wind"]);
        assert_eq!(path, Some(PathBuf::from("/tmp/a.wind")));
    }

    #[test]
    fn ignores_the_binary_even_if_it_ends_in_wind() {
        // argv[0] is always skipped, so a binary path is never mistaken for input.
        assert_eq!(wind_path_from_args(["only.wind"]), None);
    }

    #[test]
    fn extension_match_is_case_insensitive() {
        let path = wind_path_from_args(["gui", "C:\\spools\\PART.WIND"]);
        assert_eq!(path, Some(PathBuf::from("C:\\spools\\PART.WIND")));
    }

    #[test]
    fn no_wind_argument_yields_none() {
        assert_eq!(wind_path_from_args(["gui", "--port", "/dev/ttyUSB0"]), None);
        assert_eq!(wind_path_from_args(Vec::<String>::new()), None);
    }
}
