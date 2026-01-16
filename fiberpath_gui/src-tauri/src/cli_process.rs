use std::ffi::OsStr;
use std::process::Command;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn command_for_cli<S: AsRef<OsStr>>(program: S) -> Command {
    #[cfg(target_os = "windows")]
    let mut command = Command::new(program);
    #[cfg(not(target_os = "windows"))]
    let command = Command::new(program);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command
}
