"""PyInstaller build script for freezing the FiberPath API into a sidecar binary.

Mirrors ``scripts/freeze_cli.py`` but targets the local API server
(``fiberpath_api.__main__:main``). Kept a separate binary from the CLI so the
uvicorn/FastAPI freeze surface cannot destabilise the shipping CLI executable.

Usage:
    python scripts/freeze_api.py

Output:
    dist/fiberpath-api[.exe] - Standalone API sidecar for current platform
"""

from __future__ import annotations

import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
DIST_DIR = ROOT_DIR / "dist"
BUILD_DIR = ROOT_DIR / "build"

NAME = "fiberpath-api"


def get_extension() -> str:
    system = platform.system()
    if system == "Windows":
        return ".exe"
    if system in ("Darwin", "Linux"):
        return ""
    raise RuntimeError(f"Unsupported platform: {system}")


def get_hidden_imports() -> list[str]:
    """Modules PyInstaller's static analysis may miss.

    The server is pinned to uvicorn's pure-Python stack (asyncio + h11, no
    websockets/uvloop/httptools — see fiberpath_api/__main__.py), so only those
    dynamically-loaded implementations need to be named explicitly.
    """
    return [
        # Core fiberpath engine used by the API routes
        "fiberpath",
        "fiberpath.config",
        "fiberpath.config.schemas",
        "fiberpath.config.validator",
        "fiberpath.gcode",
        "fiberpath.gcode.dialects",
        "fiberpath.gcode.generator",
        "fiberpath.planning",
        "fiberpath.planning.planner",
        "fiberpath.planning.calculations",
        "fiberpath.planning.layer_strategies",
        "fiberpath.planning.machine",
        "fiberpath.planning.validators",
        "fiberpath.planning.exceptions",
        "fiberpath.simulation",
        "fiberpath.simulation.simulator",
        "fiberpath.visualization",
        "fiberpath.visualization.plotter",
        "fiberpath.math_utils",
        "fiberpath.wire",
        # API package
        "fiberpath_api",
        "fiberpath_api.main",
        "fiberpath_api.__main__",
        "fiberpath_api.schemas",
        "fiberpath_api.routes.plan",
        "fiberpath_api.routes.simulate",
        "fiberpath_api.routes.validate",
        "fiberpath_api.routes.plot",
        "fiberpath_api.machine",
        "fiberpath_api.routes.machine",
        # Marlin machine control: the host library + pyserial's dynamically
        # imported platform backend (serialposix/serialwin32 + list_ports).
        "marlin_host",
        "serial",
        "serial.tools.list_ports",
        # Server stack (pinned pure-Python implementations)
        "uvicorn",
        "uvicorn.loops.asyncio",
        "uvicorn.protocols.http.h11_impl",
        "uvicorn.lifespan.off",
        "h11",
        "fastapi",
        "starlette",
        "anyio",
        # Common third-party deps
        "pydantic",
        "pydantic_core",
        "numpy",
        "PIL",
    ]


def build_executable() -> None:
    hidden_imports = get_hidden_imports()
    extension = get_extension()

    pyinstaller_args = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--onefile",
        "--name",
        NAME,
        "--console",  # console for clean stdio (the port handshake) when spawned
        "--clean",
        "--noconfirm",
        *[f"--hidden-import={imp}" for imp in hidden_imports],
        "--collect-all",
        "fiberpath",
        "--collect-all",
        "fiberpath_api",
        "--collect-all",
        "marlin_host",
        "--collect-all",
        "serial",
        "--collect-all",
        "uvicorn",
        "--collect-all",
        "fastapi",
        "--collect-all",
        "starlette",
        "--collect-all",
        "anyio",
        "--collect-all",
        "pydantic",
        "--collect-all",
        "pydantic_core",
        "--collect-all",
        "numpy",
        "--collect-all",
        "PIL",
        "--collect-submodules",
        "h11",
        "--path",
        str(ROOT_DIR),
    ]

    entry_script = ROOT_DIR / "_freeze_api_entry.py"
    entry_script.write_text(
        "# Temporary entry point for PyInstaller\n"
        "from fiberpath_api.__main__ import main\n\n"
        'if __name__ == "__main__":\n'
        "    main()\n"
    )
    pyinstaller_args.append(str(entry_script))

    print("=" * 60)
    print("FiberPath API Freezing with PyInstaller")
    print("=" * 60)
    print(f"Platform: {platform.system()} ({platform.machine()})")
    print(f"Python: {sys.version.split()[0]}")
    print(f"Output: {DIST_DIR / NAME}{extension}")
    print()

    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)

    print("Running PyInstaller...\n")
    try:
        subprocess.run(pyinstaller_args, check=True, cwd=ROOT_DIR)
    finally:
        if entry_script.exists():
            entry_script.unlink()
        spec_file = ROOT_DIR / f"{NAME}.spec"
        if spec_file.exists():
            spec_file.unlink()

    output_exe = DIST_DIR / f"{NAME}{extension}"
    if not output_exe.exists():
        raise RuntimeError(f"Build failed: {output_exe} not found")

    size_mb = output_exe.stat().st_size / (1024 * 1024)
    print("\n" + "=" * 60)
    print("[OK] Build successful!")
    print(f"Executable: {output_exe}")
    print(f"Size: {size_mb:.1f} MB")
    print("\nTo test:")
    print(f"  {output_exe}   # prints a JSON port handshake, then serves")


def check_pyinstaller() -> None:
    try:
        import PyInstaller

        print(f"PyInstaller {PyInstaller.__version__} found")
    except ImportError:
        print("PyInstaller not found, installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)


def main() -> None:
    try:
        check_pyinstaller()
        build_executable()
    except subprocess.CalledProcessError as exc:
        print(f"\nBuild failed: {exc}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(f"\nError: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
