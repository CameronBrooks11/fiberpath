# FiberPath Roadmap - Future Backlog (Low Priority / Speculative)

**Focus:** Speculative features with unclear value or disproportionate complexity  
**Status:** Backlog - only implement with strong user demand and clear value proposition  
**Priority:** Low to None

---

## Category 1: Complex Visualization Features

### 3D Streaming Visualization (32+ tasks)

**Description:** Real-time 3D toolpath visualization during Marlin streaming using Three.js

**Why Low Priority:**

- User already has plot visualization in Main tab for planning
- Real-time 3D is "eye candy" without clear functional value
- 32 tasks is massive scope for marginal benefit
- Three.js adds significant bundle size (~600KB)
- Progress bar + log provides sufficient feedback
- Complexity vs value ratio is poor

**Tasks (if ever implemented):**

- [ ] Add three.js and @react-three/fiber dependencies
- [ ] Refactor StreamTab to 3-panel layout (controls | log | visualization)
- [ ] Set up Canvas with camera, lights, OrbitControls
- [ ] Add coordinate axes helper and grid
- [ ] Create gcode-parser.ts utility for movement commands
- [ ] Parse G0/G1 commands, handle G90/G91 positioning
- [ ] Create Toolpath component with BufferGeometry
- [ ] Color-code by move type (travel vs extrude)
- [ ] Add current position marker during streaming
- [ ] Update marker in real-time with stream progress
- [ ] Optimize rendering performance (60fps target)
- [ ] Add Show/Hide toggle and camera controls
- [ ] Add layer slider, move type filters
- [ ] Test with various G-code file sizes
- [ ] Handle very large files (50k+ commands)
- [ ] Add error handling for invalid G-code
- [ ] Add WebGL fallback UI

**Evaluation Criteria:**

- User feedback explicitly requesting this feature
- Evidence that current visualization is insufficient
- Willingness to accept bundle size increase
- Developer bandwidth available for maintenance

---

### WebGL-based Toolpath Rendering

**Description:** Hardware-accelerated toolpath rendering for Main tab visualization

**Why Low Priority:**

- Current PNG-based preview works fine
- Would require complete rewrite of visualization system
- Performance benefits unclear for typical use cases
- Users aren't complaining about current visualization speed

**Decision:** Not worth the effort unless performance becomes a real problem.

---

## Category 2: Internationalization

### Multi-language Support (i18n)

**Description:** Translate UI to multiple languages (Spanish, Chinese, German, etc.)

**Why Low Priority:**

- No evidence of international user base yet
- G-code and winding terminology mostly English anyway
- Adds significant maintenance burden
- Translation quality requires native speakers
- 500+ UI strings to translate and maintain

**Tasks (if ever implemented):**

- [ ] Set up i18next or react-intl
- [ ] Extract all UI strings to translation files
- [ ] Create English base translation
- [ ] Set up translation workflow
- [ ] Add language selector UI
- [ ] Handle date/number formatting per locale
- [ ] Test with various languages
- [ ] Find translators for target languages
- [ ] Maintain translations as UI changes

**Evaluation Criteria:**

- Clear evidence of international users
- Users requesting non-English support
- Funding or volunteer translators available
- Commitment to maintain translations

---

## Category 3: Advanced Data Features

### Coverage Analysis and Visualization

**Description:** Analyze fiber coverage patterns and show visual heatmaps

**Why Low Priority:**

- Extremely complex to implement correctly
- Requires deep understanding of composite physics
- Most users trust the math without visualization
- Would require 3D engine (Three.js) anyway
- Academic research territory, not practical tool

**Decision:** Out of scope for FiberPath. Users can export to specialized analysis tools.

---

### Real-time G-code Preview in Canvas

**Description:** Show highlighted toolpath in Main tab as G-code is generated

**Why Low Priority:**

- Current workflow is: plan → preview → export
- Real-time preview doesn't fit the workflow
- Would require streaming G-code generation
- PNG preview is already very fast
- Adds complexity for unclear benefit

**Decision:** Current preview workflow is sufficient.

---

## Category 4: Integration Features

### REST API Enhancements

**Description:** Expand REST API for external tool integration

**Why Low Priority:**

- Current CLI and GUI are sufficient for most users
- API exists but isn't actively used
- No known users building integrations
- Would require documentation, versioning, support

**Evaluation Criteria:**

- Users requesting specific API features
- Third-party tools wanting to integrate
- Clear use cases beyond CLI/GUI

---

### CAD Software Plugins

**Description:** Plugins for SolidWorks, Fusion 360, etc. to export directly to FiberPath

**Why Low Priority:**

- Extremely high development effort per CAD platform
- Each platform has different plugin APIs
- Maintenance burden for multiple CAD versions
- Users can export STL/geometry manually

**Decision:** Not feasible without dedicated plugin team.

---

## Category 5: Workflow Automation

### Automated Winding Pattern Optimization

**Description:** AI/ML-based optimization of winding patterns for coverage or speed

**Why Low Priority:**

- Requires deep domain expertise in composites
- Machine learning infrastructure
- Training data collection
- Validation of optimized patterns
- Research project, not practical feature

**Decision:** Out of scope. Users can use existing research tools separately.

---

### Simulation-based Parameter Tuning

**Description:** Automatically adjust parameters to meet coverage or time goals

**Why Low Priority:**

- Requires sophisticated simulation
- Long computation times for iterative optimization
- Users prefer manual control
- "Magic" automation can produce unexpected results

**Decision:** Manual parameter control is more predictable and trusted.

---

## Category 6: Technical Debt & Refactoring

### Rust Async Timeout for Subprocess Operations

**Priority:** Low  
**Effort:** High (3-4 hours)  
**Deferred From:** v4.0 Phase 6

**Description:** Add timeout protection to `MarlinSubprocess.read_response()` in `src-tauri/src/marlin.rs`

**Problem:**

Currently uses synchronous `BufReader::read_line()` which can block indefinitely if Python subprocess hangs:

```rust
pub fn read_response(&self) -> Result<MarlinResponse, MarlinError> {
    let mut stdout_reader = self.stdout_reader.lock()?;
    let mut line = String::new();
    stdout_reader.read_line(&mut line)?; // ⚠️ Can block indefinitely
    // ...
}
```

**Why Deferred:**

- Python subprocess already has timeout protection (non-critical)
- Requires tokio async/await refactor (complex, 3-4 hours)
- All Tauri commands would need to become async
- Current implementation works in practice
- Better as separate focused PR with comprehensive testing

**Proposed Solution:**

```rust
use tokio::time::{timeout, Duration};
use tokio::io::AsyncBufReadExt;

pub async fn read_response(&self) -> Result<MarlinResponse, MarlinError> {
    let mut stdout_reader = self.stdout_reader.lock().await?;
    let mut line = String::new();
    
    timeout(Duration::from_secs(5), stdout_reader.read_line(&mut line))
        .await
        .map_err(|_| MarlinError::Timeout)?
        .map_err(|e| MarlinError::ReadFailed(e.to_string()))?;
    // Parse response...
}
```

**Implementation Checklist (When Prioritized):**

- [ ] Add `tokio` with `time` and `io-util` features to Cargo.toml
- [ ] Convert `MarlinSubprocess::read_response()` to async
- [ ] Convert all Tauri commands to async handlers
- [ ] Add timeout constants to configuration
- [ ] Update error types to include `Timeout` variant
- [ ] Add tests for timeout scenarios
- [ ] Update documentation

**Best For:** v4.1 or v5.0 as polish improvement

---

## Summary

**Total Backlog Items:** ~70+ tasks across 8 categories

**Implementation Policy:**

- ❌ Do NOT implement without strong user demand
- ❌ Do NOT implement if complexity >> value
- ✅ Re-evaluate if multiple users request feature
- ✅ Consider if use case is clear and common
- ✅ Only proceed if maintenance burden is acceptable

**Evaluation Questions:**

1. Are users asking for this feature?
2. Is current functionality insufficient?
3. Is the value clear and measurable?
4. Is the complexity reasonable?
5. Can we maintain it long-term?
6. Does it fit FiberPath's core mission?

**Core Mission Reminder:**
FiberPath is a practical tool for planning and generating G-code for composite fiber winding. Features should support this mission directly. Speculative "nice to have" features dilute focus and increase maintenance burden.

**Last Updated:** 2026-01-09
