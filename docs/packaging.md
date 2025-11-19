# Packaging Plan

Last updated: 2025-11-19

FiberPath ships a cross-platform desktop GUI (Tauri + React) that shells out to the Python CLI. Our
packaging goal for Phase 6 is to produce signed/unsigned installers for Windows, macOS, and Linux on
every push so we can test the bundles ahead of release tagging. This document captures the current
plan for local builds and CI automation.

## Deliverables

- **Windows:** `.msi` + `.exe` bundles emitted by `npm run tauri build` on a Windows host.
- **macOS:** `.dmg` + `.app` bundles built natively on macOS runners (arm64 by default).
- **Linux:** `.AppImage` + `.deb` artifacts generated on Ubuntu runners with GTK/WebKit deps.
- **Artifacts:** Uploaded per-platform in GitHub Actions for manual QA and smoke testing.

> The GUI still shells out to the Python CLI at runtime, so end users must install `fiberpath`
> separately. Bundling the interpreter plus CLI will be evaluated after the core packaging
> infrastructure is stable.

## Local Build Requirements (Windows)

Install the following once per machine:

1. **Node.js 20+** – aligns with the `engines` field in `fiberpath_gui/package.json`.
2. **Rust toolchain** – via `rustup`, includes `cargo`, `clippy`, and `rustfmt`.
3. **Python environment with `fiberpath` installed** – `uv pip install -e .[cli]` ensures the CLI is
   available on `PATH` for runtime testing.
4. **Microsoft Visual C++ Build Tools** – required by Rust on Windows (usually present on GitHub
   runners and most dev machines running VS Build Tools 2022).
5. **NSIS 3.x** – installer generator used by Tauri for `.exe` bundles (`winget install
NSIS.NSIS -e --accept-package-agreements --accept-source-agreements`).

Once installed, run the packaging command from a PowerShell prompt inside `fiberpath_gui`:

```pwsh
npm install
npm run package
```

`npm run package` wraps `tauri build --ci`, which emits artifacts under
`fiberpath_gui/src-tauri/target/release/bundle/` (NSIS `.exe` and WiX `.msi` on Windows).

## CI Build Strategy

We run a dedicated GitHub Actions workflow (`.github/workflows/gui-package.yml`) that triggers on
every push affecting the GUI workspace (plus manual dispatch). The job matrix covers Windows,
macOS, and Ubuntu runners with OS-specific prep steps and shared packaging logic. Highlights:

- **Checkout** the repo and enable a `tauri-build-cache` keyed by OS + `package-lock.json` hash to
  speed up Node and Cargo builds between runs.
- **Install toolchains**
  - Node.js 20 via `actions/setup-node@v4`.
  - Rust via `dtolnay/rust-toolchain@stable` (ensures nightly updates automatically).
  - Linux-only: install `pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev
libayatana-appindicator3-dev librsvg2-dev patchelf`. (Ubuntu 24.04 dropped the 4.0-era
    WebKit/JavaScriptCore headers, so we rely on the newer 4.1 packages.)
- **Dependencies:** `npm ci` under `fiberpath_gui` (linting already handled by the smoke workflow).
- **Packaging:** `npm run package` (which wraps `tauri build --ci` to keep the CLI non-interactive
  inside GitHub Actions).
- **Artifacts:** Upload the entire `src-tauri/target/release/bundle/**/*` directory for later
  download. Artifact names encode the platform (`fiberpath-gui-windows`, `fiberpath-gui-macos`,
  `fiberpath-gui-linux`).

> Tip: if GitHub bumps `ubuntu-latest` before Tauri updates its instructions, temporarily pin the
> Linux matrix entry to `ubuntu-22.04` to keep the older packages available.

The workflow intentionally separates smoke testing (`gui-smoke.yml`) from packaging so lint/build
failures are caught earlier and packaging can remain focused on producing installers.

## Future Enhancements

- Wire releases to tags (e.g., `v0.1.0`) and automatically attach the installers.
- Add codesigning for macOS (`developer-id`) and Windows (`signtool` + certificate) when credentials
  are available.
- Evaluate bundling a minimal Python runtime or verifying `fiberpath` CLI availability at app start.
- Consider caching `.venv`/CLI assets if we eventually run end-to-end GUI tests as part of the
  packaging job.

## Local Verification

After running `npm run package`, verify the installer artifacts before pushing:

1. **Inspect bundles** – confirm files exist under
   `src-tauri/target/release/bundle/<target>/` (e.g., `nsis/FiberPath GUI_0.1.0_x64-setup.exe`).
2. **Run the app** – either execute the generated installer or launch the raw binary using
   `Start-Process '.\src-tauri\target\release\FiberPath GUI.exe'` (PowerShell) to ensure the GUI
   opens and can reach the CLI on `PATH`.
3. **Manual smoke test** – plan/plot a small `.wind` via the GUI to confirm the packaged build can
   locate the Python CLI before uploading artifacts or pushing to CI.
