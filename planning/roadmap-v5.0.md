# FiberPath Roadmap v5 - Streaming State & Control Refinements

**Focus:** Fix critical streaming state management issues and improve pause/resume/cancel workflow  
**Prerequisites:** v4 (Basic Marlin Streaming) must be complete  
**Timeline:** 1 week  
**Priority:** Critical - resolve production-blocking issues before feature additions

---

TODO: MAJOR CHANGES AROUND CONNECTION CONCTRIC MANAGEMENT AND STREAMING STATE HANDLING CAME BEFORE THIS, NEED TO UPDATE TO REFLECT THAT.

## Phase 1: Pause/Resume Architecture Fix

**Problem:** Progress events queue up during pause, causing 400+ phantom commands to display after pause button clicked, making system appear broken.

- [x] Identify root cause: Queue-based progress architecture creates unbounded lag
- [x] Design solution: Replace event queue with shared state polling
- [x] Remove `progress_queue` from StreamingSession
- [x] Add `_last_command` field to track current command for display
- [x] Implement `get_progress()` method returning current state
- [x] Update main loop to poll `get_progress()` every 0.1s instead of draining queue
- [x] Test: Pause shows instant stop with no phantom progress
- [x] Test: Resume continues from exact position
- [x] Verify zero-lag architecture (UI matches reality immediately)

**Progress:** 9/9 tasks complete (100%) ✅

**Impact:** Eliminates queue lag entirely - pause is now instantaneous and accurate.

---

## Phase 2: Cancel Job Feature

**Problem:** Only emergency stop (M112 + disconnect) available during pause. Need clean cancellation option.

- [x] Add `"cancel"` action to interactive.py backend
- [x] Implement graceful worker thread shutdown without M112
- [x] Add `MarlinResponse::Cancelled` variant to Rust enum
- [x] Create `marlin_cancel` Tauri command
- [x] Register command in Tauri builder
- [x] Add `cancelStream()` to marlin-api.ts
- [x] Implement `handleCancel()` in FileStreamingSection
- [x] Add conditional button rendering: "Cancel Job" when paused, "Stop" when streaming
- [x] Style cancel button (orange) vs stop button (red) for visual distinction
- [x] Add `--color-warning-orange-hover` CSS variable
- [x] Test: Cancel while paused stays connected and ready for new job
- [x] Test: Stop while streaming executes M112 and disconnects

**Progress:** 12/12 tasks complete (100%) ✅

**Impact:** Provides proper workflow distinction between planned cancellation and emergency stop.

---

## Phase 3: State Cleanup & Reset

**Problem:** After emergency stop, file/progress remain visible. After cancel, restarting shows blank commands.

- [x] Add `clearStreamingState()` action to streamStore
- [x] Call `clearStreamingState()` on successful reconnection
- [x] Add manual X button to clear selected file anytime
- [x] Style clear file button (subtle, visible only when file selected)
- [x] Fix cancel state reset: Clear `streamer._paused` flag in backend
- [x] Fix cancel state reset: Set `status = "connected"` in frontend
- [x] Fix cancel state reset: Clear progress display after cancel
- [x] Test: Emergency stop → reconnect → clean slate
- [x] Test: Cancel → start same file → streams properly (no blank commands)
- [x] Test: Manual clear button works anytime (except during streaming)

**Progress:** 10/10 tasks complete (100%) ✅

**Impact:** Proper state management ensures system is always in expected state after any operation.

---

## Summary

**Total Tasks:** 31/31 complete (100%) ✅  
**Branch:** stream-rehaul  
**Status:** Complete

### Key Achievements

1. **Zero-Lag Architecture**: Replaced queue-based progress with shared state polling, eliminating all phantom progress during pause
2. **Proper Cancel Workflow**: Added Cancel Job button as distinct from Emergency Stop, providing clean exit option
3. **State Consistency**: Fixed all state reset issues - cancel, stop, and reconnect now properly clean up for next operation

### Technical Debt Resolved

- Queue lag (400+ commands delayed during pause)
- Pause flag not cleared after cancel (blocking new streams)
- Frontend status stuck in "paused" after cancel
- File/progress persistence after emergency stop

### User Experience Improvements

- Pause is now instantaneous and accurate
- Cancel vs Stop distinction clear (orange vs red, different titles)
- Clean slate after reconnect
- Manual file clear option added
- Can restart same file immediately after cancel

---

## Phase 4: Documentation Overhaul

**Focus:** Comprehensive documentation accuracy review and release preparation

- [x] Transform landing page with hero banner and card grids for visual appeal
- [x] Fix critical errors in getting-started guide (skipIndex, CLI commands, flags)
- [x] Review and enhance API documentation (verbose field, axisFormat, HTTP codes)
- [x] Complete examples documentation with usage instructions
- [x] Fix license classifier mismatch (MIT → AGPL-3.0 in pyproject.toml)
- [x] Remove broken asset references from README
- [x] Correct architecture diagram data flow (CLI and API both import from Core)
- [x] Add sync_gui_docs.py to CI workflows (docs-ci and docs-deploy)
- [x] Add GUI docs path triggers to CI workflows
- [x] Exclude fiberpath_gui/docs/\*\* from GUI packaging/CI workflows
- [x] Verify documentation builds successfully with --strict mode

**Progress:** 11/11 tasks complete (100%) ✅

**Impact:** Professional documentation site with accurate technical content, proper release readiness verification.

---

## Phase 5: Release Preparation (v0.5.0)

**Focus:** Version management and final release checks

- [x] Update version numbers to 0.5.0 across all files
- [x] Run full test suite and verify all pass (75/75 ✅)
- [x] Build frontend and verify no errors (passing ✅)
- [x] Build Rust backend and verify no errors (passing ✅)
- [x] Run all tools/lints/formatters on both stacks

**Progress:** 5/5 tasks complete (100%) ✅

**Impact:** Formal release with proper semantic versioning marking completion of streaming refinements.

---

## Final Summary

**Total Tasks:** 46/46 (100% complete)  
**Core Features:** 100% ✅  
**Documentation:** 100% ✅
**Release Prep:** Complete ✅

**Key Documentation Improvements:**

- Hero-style landing page with card grids
- Fixed all invalid code examples (skipIndex: 1, correct CLI flags)
- Enhanced API docs with complete request/response schemas
- Corrected architecture diagram showing parallel imports
- CI workflows now sync GUI docs automatically
- All documentation validated with strict mode

**Next:** Proceed to v6 (Streaming Enhancements & Core Polish) for quality-of-life improvements.
