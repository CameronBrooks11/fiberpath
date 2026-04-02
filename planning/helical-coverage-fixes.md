# Helical Coverage — Design & Documentation Fixes

**Created:** 2026-04-01  
**Status:** Planning  
**Target Release:** v0.8.0 (after v7 tooling phase)  
**Priority:** High — silent data-quality defect; users can produce structurally incomplete parts without any warning

---

## Background

A review of `plan_helical_layer`, `compute_helical_kinematics`, and the `.wind` schema against observed machine output revealed four discrete problems: two are code defects (silent or wrong behaviour), one is a schema type inconsistency, and one is a phantom feature that is validated but never implemented. All four are compounded by documentation that either misdescribes the behaviour or omits the critical constraints entirely.

The concrete trigger: a single-layer 45° helical wind on a 151.5 mm diameter mandrel with `lockDegrees=270` and `patternNumber=3` produces only ~67% surface coverage — the remaining ~33% is bare mandrel in evenly spaced axial diamond gaps. The planner emits no warning. Validation passes. G-code is generated and executed successfully. The part is structurally compromised without any indication of a problem.

---

## Root Cause Analysis

### Why `lockDegrees` controls coverage

`plan_helical_layer` advances `mandrel_position` by the following amount for each complete circuit (two passes, out and back):

```
per_pass = pass_rotation_degrees + lock_degrees - (pass_rotation_degrees % 360)
         = floor(pass_rotation_degrees / 360) × 360 + lock_degrees

per_circuit = 2 × per_pass
per_circuit % 360 = (2 × lock_degrees) % 360
```

The key result: **the fractional-revolution component of a circuit's mandrel advance is determined entirely by `lockDegrees`, independent of wind angle, mandrel size, or lead-in/out parameters.** Then, after each circuit, `start_position_increment = 360 / patternNumber` is added to bump the next circuit's start position.

The effective angular slot-step between consecutive in-pattern circuits is:
```
slot_step = (per_circuit % 360 + 360 / patternNumber) % 360
           = ((2 × lockDegrees) % 360 + 360 / patternNumber) % 360
```

For `patternNumber=3` circuits to land at three **distinct, evenly distributed** positions, this slot_step must be `120°`, `240°` (i.e., a non-zero multiple of `360/3`).

| `lockDegrees` | `per_circuit % 360` | slot_step | In-pattern positions (mod 360) | Coverage |
|---|---|---|---|---|
| 270 | 180° | (180 + 120) % 360 = **300°** | 0°, 300°, 240° (uneven; two overlap on same slots as others) | ~67% |
| 540 | 0° | (0 + 120) % 360 = **120°** | 0°, 120°, 240° (evenly spaced) | 100%+ |
| 360 | 0° | 120° | 0°, 120°, 240° | 100%+ |
| 180 | 0° | 120° | 0°, 120°, 240° | 100%+ |

The general validity condition: `(2 × lockDegrees) % (360 / patternNumber) == 0`.

Equivalently as an integer check: `(2 × lockDegrees × patternNumber) mod 360 == 0`.

Note: any `lockDegrees` that is a multiple of 180° satisfies this for all `patternNumber` values, since `(2 × 180k) = 360k`, and `360k mod (360/P) = 0` for any integer P.

---

## Issue 1 — `lockDegrees` Compatibility Not Validated (Design — High)

**File:** `fiberpath/planning/validators.py` → `validate_helical_layer`

**Problem:** `validate_helical_layer` checks coprimality of `skipIndex`/`patternNumber` and circuit divisibility, but does **not** check whether `lockDegrees` is compatible with `patternNumber` for even circuit distribution. An incompatible `lockDegrees` causes circuits to double-up on already-wound positions, leaving bare mandrel strips, with no error or warning emitted.

### Code Change

Add a compatibility check at the end of `validate_helical_layer`, after the circuit divisibility check.

The validation requires **two conditions** (both algebraically derived and numerically verified against simulation across all example and reference fixture values):

**Condition 1** — `per_circuit_mod` must be divisible by `360/P` (slot width):  
`per_circuit_mod = (2 * lockDegrees) % 360`.  
This is independent of `skip_index` (since `skip_index * 360/P` is always a multiple of `360/P`, adding it doesn't change divisibility).

**Condition 2** — the effective intra-pattern slot stride must be coprime with `P`:  
`j = round(slot_step / (360/P)) % P` where `slot_step = (per_circuit_mod + skip_index * 360/P) % 360`.  
`gcd(j, P)` must equal 1. This prevents `slot_step = 0` (all circuits wind the same groove) and other equivalent aliasing cases (e.g., P=3 lock=120°: slot_step=0, every circuit doubles up).

**Important:** Condition 2 uses `skip_index`. Until Issue 2 (skip_index wiring) is implemented, validate with the current effective skip_index which is `1` (implicit, since `start_position_increment = 360/P = 1*(360/P)`). After Issue 2 is implemented, update to use `layer.skip_index`. This coupling means Issues 1 and 2 should ship together in the same PR, not separately as originally ordered.

```python
import math  # add alongside existing 'from math import gcd'

# Validate lockDegrees compatibility with patternNumber (and skip_index).
# The per-circuit mandrel advance mod 360 equals (2 * lock_degrees) % 360.
# For in-pattern circuits to land at evenly distributed distinct positions:
#   Condition 1: per_circuit_mod must be divisible by 360/patternNumber
#   Condition 2: the effective intra-pattern slot stride gcd with patternNumber == 1
#
# NOTE: until skip_index is wired into placement (Issue 2), effective_skip is 1.
# Once Issue 2 is implemented, replace 1 with layer.skip_index here.
pattern_step_deg = 360.0 / layer.pattern_number
per_circuit_mod = (2.0 * layer.lock_degrees) % 360.0
effective_skip = 1  # TODO: replace with layer.skip_index after Issue 2 is implemented
slot_step = (per_circuit_mod + effective_skip * pattern_step_deg) % 360.0

if round(per_circuit_mod % pattern_step_deg, 6) != 0:
    raise LayerValidationError(
        layer_index,
        (
            f"lockDegrees {layer.lock_degrees}° produces a per-circuit mandrel advance of "
            f"{per_circuit_mod:.6g}° (mod 360°), which is not divisible by the required "
            f"in-pattern slot width of {pattern_step_deg:.6g}° (= 360 / patternNumber {layer.pattern_number}). "
            f"Circuits will overlap and leave bare mandrel strips. "
            f"lockDegrees must satisfy: (2 × lockDegrees) mod {pattern_step_deg:.6g} == 0. "
            f"Nearest valid values: {_nearest_valid_lock_degrees(layer.lock_degrees, pattern_step_deg, effective_skip)}"
        ),
    )

j = round(slot_step / pattern_step_deg) % layer.pattern_number
if math.gcd(j, layer.pattern_number) != 1:
    raise LayerValidationError(
        layer_index,
        (
            f"lockDegrees {layer.lock_degrees}° with patternNumber {layer.pattern_number} "
            f"produces an intra-pattern slot stride of {j} (in units of 360/patternNumber={pattern_step_deg:.6g}°), "
            f"which is not coprime with patternNumber (gcd={math.gcd(j, layer.pattern_number)}). "
            f"All in-pattern circuits will land on the same or aliased positions, leaving bare strips. "
            f"Nearest valid values: {_nearest_valid_lock_degrees(layer.lock_degrees, pattern_step_deg, effective_skip)}"
        ),
    )
```

Add a private helper (same file) to suggest the nearest valid alternatives (only multiples of `pattern_step_deg/2` that also satisfy condition 2):

```python
def _nearest_valid_lock_degrees(
    lock_degrees: float, pattern_step_deg: float, effective_skip: int
) -> str:
    """Return a human-readable suggestion of nearby valid lockDegrees values."""
    half_step = pattern_step_deg / 2.0
    P = round(360.0 / pattern_step_deg)
    candidates = []
    for delta in range(-5, 6):
        candidate = math.floor(lock_degrees / half_step) * half_step + delta * half_step
        if candidate <= 0:
            continue
        pcm = (2.0 * candidate) % 360.0
        ss = (pcm + effective_skip * pattern_step_deg) % 360.0
        if round(pcm % pattern_step_deg, 6) != 0:
            continue
        j = round(ss / pattern_step_deg) % P
        if math.gcd(j, P) == 1:
            candidates.append(candidate)
        if len(candidates) >= 3:
            break
    return ", ".join(f"{v:.6g}°" for v in candidates) or "(none found in range; use multiples of 180°)"
```

Add `import math` to the imports at the top of the file (currently only `from math import gcd`).

### Tests to Add (`tests/planning/test_validators.py`)

```python
def test_validate_helical_layer_rejects_lock_degrees_condition1() -> None:
    # lock=270, P=3: (2*270) % 120 = 60 != 0 -- fails condition 1
    layer = HelicalLayer.model_validate({**BASE_LAYER, "patternNumber": 3, "skipIndex": 1, "lockDegrees": 270.0})
    tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})
    with pytest.raises(LayerValidationError, match="lockDegrees"):
        validate_helical_layer(1, layer, MANDREL, tow)


def test_validate_helical_layer_rejects_lock_degrees_condition2() -> None:
    # lock=120, P=3: (2*120)%360=240, 240%120=0 (condition 1 passes).
    # slot_step=(240+120)%360=0, j=0, gcd(0,3)=3 -- fails condition 2.
    # All 3 in-pattern circuits would wind in the same groove.
    layer = HelicalLayer.model_validate({**BASE_LAYER, "patternNumber": 3, "skipIndex": 1, "lockDegrees": 120.0})
    tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})
    with pytest.raises(LayerValidationError, match="lockDegrees"):
        validate_helical_layer(1, layer, MANDREL, tow)


def test_validate_helical_layer_accepts_compatible_lock_degrees() -> None:
    # lock=540, P=3: cond1 and cond2 both pass.
    layer = HelicalLayer.model_validate({**BASE_LAYER, "patternNumber": 3, "skipIndex": 1, "lockDegrees": 540.0})
    tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})
    result = validate_helical_layer(1, layer, MANDREL, tow)
    assert result.num_circuits > 0


def test_validate_helical_layer_accepts_lock_180_any_pattern() -> None:
    # lock=180: per_circuit_mod=0, slot_step=360/P, j=1, gcd(1,P)=1 always.
    # Universally valid for all P (when N%P=0).
    for p in [1, 2, 3, 4]:
        layer = HelicalLayer.model_validate({**BASE_LAYER, "patternNumber": p, "skipIndex": 1, "lockDegrees": 180.0})
        tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})
        try:
            result = validate_helical_layer(1, layer, MANDREL, tow)
            assert result.num_circuits > 0
        except LayerValidationError as e:
            assert "divisible by patternNumber" in str(e)  # only allowed failure mode
```

Also add a smoke-test regression input for the AvBay configuration with `lockDegrees=270` if one doesn't already exist, confirming it rejects.

---

## Issue 2 — `skipIndex` Validated but Never Applied (Design — High)

**Files:** `fiberpath/planning/layer_strategies.py`, `fiberpath/planning/calculations.py`

**Problem:** `skip_index` is stored in `HelicalLayer`, validated for coprimality against `pattern_number`, and validated for range (`skip_index < pattern_number`). It is **never read by `plan_helical_layer` or `compute_helical_kinematics`**. The in-pattern circuit step is always `360 / pattern_number` regardless of `skip_index`. Users setting `skipIndex: 2` vs `skipIndex: 1` get identical G-code output.

### What `skipIndex` actually means (per the existing docs)

`concepts.md` already describes the correct semantics clearly:
> "If patternNumber=3 and skipIndex=1, the path visits bands in order 0→1→2. If patternNumber=3 and skipIndex=2, it visits 0→2→1."

This means `skipIndex` controls the **visit order of the P evenly-spaced bands within each pattern** — not the slot stride globally. The P bands are always at `P` equally spaced positions (unchanged); `skipIndex` only determines which order they are wound. This matters for wet layup: skip=2 avoids placing adjacent wet passes next to each other.

The correct formula (call it **Option D**): `start_position_increment = skip_index * (360 / pattern_number)`

- `skipIndex=1, P=3`: increment = `1 × 120° = 120°` → visits 0°→120°→240° (**same as current code**: `360/3 = 120°`)
- `skipIndex=2, P=3`: increment = `2 × 120° = 240°` → visits 0°→240°→480°≡120° (order 0→2→1)

So **`skipIndex=1` is already implicitly implemented** — the current code hardcodes `360/pattern_number` which equals `1 × 360/pattern_number`. Only `skipIndex>1` changes behaviour.

### What this is NOT

Option D is NOT a global slot-stride winding (where the stride is `skip_index × (360/num_circuits)`). That would be a different skip-wind scheme. The existing coprimality check `gcd(skip_index, pattern_number)==1` is correct for Option D (ensures P distinct visit positions within the pattern). It would NOT be correct for a global-slot-stride scheme (which would need `gcd(skip_index, num_circuits)==1`).

### Implementation (Option D)

- `layer_strategies.py`: change one line:
  ```python
  # Before:
  start_position_increment = 360.0 / pattern_number
  # After:
  start_position_increment = layer.skip_index * (360.0 / pattern_number)
  ```
- `validators.py`: Update the `effective_skip = 1` placeholder in the lockDegrees check (Issue 1) to `effective_skip = layer.skip_index`. **This is why Issues 1 and 2 must ship together.**
- No changes to `calculations.py` or `HelicalKinematics` needed — the start position increment is a planning concern, not a kinematics concern.

### G-code output impact

- `skipIndex=1`: **no change** to any G-code output (1 × 360/P = current behaviour)
- `skipIndex=2` (rocketry examples, helical-balanced L2): visit order changes → G-code changes → **reference outputs need regeneration** for any reference inputs using `skipIndex>1`
- Coverage remains identical (same P positions, different order) — no structural impact, purely an interleave-order change

### Tests

After implementing, verify that `skipIndex=1` and `skipIndex=2` produce the correct position sequences:
```python
def test_helical_skip_index_changes_only_visit_order() -> None:
    # Both skipIndex=1 and skipIndex=2 with P=3 must produce 3 equally-spaced positions at 120° offsets.
    # Only the order should differ.
    # Use a minimal definition and inspect the first 3 circuit-start mandrel positions.
    pass  # implementation TBD when Issue 2 is coded
```

**This item should be implemented together with Issue 1** (due to the `effective_skip` coupling in lockDegrees validation). File a standalone `OUTSTANDING_VALIDATION` finding to track until it ships.

---

## Issue 3 — `skip_initial_near_lock` Schema Type (Design — Low)

**Files:** `fiberpath/config/schemas.py`, `fiberpath_gui/schemas/wind-schema.json`, `scripts/generate_schema.py`

**Problem:** `skip_initial_near_lock: bool | None = Field(default=None, ...)`. The `None` state is semantically identical to `False` (both execute the near-lock move, because `not None` is truthy). Three-valued logic with two identical behaviours is a schema design error.

### Code Change

**`fiberpath/config/schemas.py`:**
```python
# Before:
skip_initial_near_lock: bool | None = Field(default=None, alias="skipInitialNearLock")

# After:
skip_initial_near_lock: bool = Field(default=False, alias="skipInitialNearLock")
```

**`fiberpath_gui/schemas/wind-schema.json`** (regenerate via `scripts/generate_schema.py` after the above change, then verify diff):
```json
// Before:
"skipInitialNearLock": {
  "anyOf": [{"type": "boolean"}, {"type": "null"}],
  "default": null,
  "title": "Skipinitialnearlock"
}

// After (expected after schema regen):
"skipInitialNearLock": {
  "default": false,
  "title": "Skipinitialnearlock",
  "type": "boolean"
}
```

**`fiberpath_gui/src/types/wind-schema.ts`** (regenerate via `scripts/generate-types.json` / `npm run generate-types` after schema update):
```typescript
// Before:
export type Skipinitialnearlock = boolean | null;

// After:
export type Skipinitialnearlock = boolean;
```

**`fiberpath/planning/layer_strategies.py`** — no change needed. `if not layer.skip_initial_near_lock:` works correctly for `bool` (`not False == True` runs the move; `not True == False` skips it).

**Migration:** Existing `.wind` files with `"skipInitialNearLock": null` will be rejected by the updated schema. However, Pydantic `populate_by_name=True` and the field's `default=False` means files that omit the field entirely continue to work. Files explicitly setting `null` need to be updated to `false`. The rocketry examples all use `false`; `examples/multi_layer/input.wind` uses `true`. Audit all example files.

### Tests to Add

None strictly necessary (existing behaviour is unchanged). Optionally add a test confirming that omitting `skipInitialNearLock` from a parsed `HelicalLayer` defaults to `False`:
```python
def test_helical_layer_skip_initial_near_lock_defaults_false() -> None:
    layer = HelicalLayer.model_validate({"windAngle": 45.0, "patternNumber": 3, 
                                         "skipIndex": 1, "lockDegrees": 540.0,
                                         "leadInMM": 80.0, "leadOutDegrees": 60.0})
    assert layer.skip_initial_near_lock is False
```

---

## Issue 4 — Documentation Corrections

### 4a. `lockDegrees` — Coverage mechanics undocumented

**File:** `docs/guides/wind-format.md`, `docs/reference/concepts.md`

**Change:** Expand the `lockDegrees` field description in `wind-format.md` to explain the coverage constraint. Suggested wording:

> **`lockDegrees`**: Mandrel over-rotation applied at each turn-around (lock point) before the next circuit begins. This value has a critical effect on surface coverage:
>
> After each complete circuit (outbound + return pass), the mandrel's net rotational advance mod 360° equals `(2 × lockDegrees) % 360°`. For the `patternNumber` circuits in each pattern to land at evenly distributed, non-overlapping positions, this residue must be divisible by `360 / patternNumber`.
>
> **The rule:** `lockDegrees` must be a multiple of `180 / patternNumber` degrees. For `patternNumber=3`, valid values include 60°, 120°, 180°, 240°, 300°, 360°, 420°, 480°, 540°, etc. Values like 270° with `patternNumber=3` fail this check (270 is not a multiple of 60) and will be rejected by the validator.
>
> In practice, multiples of 180° (360°, 540°, 720°, …) are universally valid for any `patternNumber`.

Update the "Parameter Meaning" table in `wind-format.md` and the `lockDegrees` row in the concepts table similarly.

Update `docs/reference/planner-math.md` to include the coverage constraint formula under "Helical Layers".

### 4b. `patternNumber` description is wrong

**File:** `docs/reference/concepts.md`, `docs/guides/wind-format.md`

**Current (wrong):**
> "Higher numbers create denser coverage with narrower helical bands."

**Correct:**
> `patternNumber` controls the interleave order of circuits — how many circuits are grouped into one pattern before the sequence repeats. It does **not** affect total surface coverage, which is determined by `num_circuits = ceil(circumference / tow_arc_width)`. Use higher `patternNumber` values with wet layup to avoid placing adjacent wet passes next to each other in the same lap (wet-on-wet consolidation issue), not to increase coverage.

### 4c. Layer count vs. ply count vs. coverage — never explained

**File:** `docs/reference/concepts.md` and `docs/guides/wind-format.md`

Add a "Coverage vs. Ply Count" section (or callout):

> **One correctly configured `HelicalLayer` = one complete pass over the full mandrel surface.**
>
> The number of circuits is calculated to achieve at least 100% surface coverage in a single layer call (`num_circuits = ceil(C / tow_arc_width)`). Multiple helical layers in a `.wind` file are for **laminate ply count** (structural thickness), not for completing a single coverage pass. Each additional layer adds one ply of fiber.
>
> Exception: if `lockDegrees` is not compatible with `patternNumber` (see above), a single layer will NOT achieve full coverage — the validator now rejects this case.

### 4d. Feed rate clamping — documented but unimplemented

**File:** `docs/reference/planner-math.md`

The following passage in the Helical Layers section describes behaviour that does not exist in the codebase:

> "Clamp `v_carriage` to machine limits. If clamped, recompute the achievable angle `α' = arctan(v_carriage / v_surface)`."

The planner does not implement feed-rate clamping or angle recomputation. Mark this explicitly as a planned feature, not current behaviour:

> *(Planned — not yet implemented: clamping and angle recomputation are not performed by the current planner. The wind angle is used as-supplied.)*

Also add a cross-reference to the `OUTSTANDING_VALIDATION.md` entry where this is tracked (or add one if there isn't one).

### 4e. `skipIndex` — document current non-effect

**File:** `docs/guides/wind-format.md`, `docs/reference/concepts.md`

Until Issue 2 is implemented, add a note that `skipIndex` is schema-validated (coprimality, range) but **does not currently affect G-code output**. Its accepted values are enforced now so that future implementations do not break existing valid definitions. Mark it clearly as a forward-compatibility field.

---

## Implementation Order

| Step | Change | Files | Notes |
|---|---|---|---|
| 1 | Add `lockDegrees` compatibility validation (both conditions) | `validators.py` | Uses `effective_skip=1` placeholder (coupled to step 2) |
| 2 | Implement `skipIndex` visit-order wiring (Option D) | `layer_strategies.py` | 1-line change; update `effective_skip→layer.skip_index` in validators.py |
| 3 | Add tests for lockDegrees validation | `tests/planning/test_validators.py` | Cover cond1 fail, cond2 fail, and valid cases |
| 4 | Fix example files with invalid lockDegrees | `examples/rocketry/AvBay(470mm).wind` layer 1, `MainChute(585mm).wind` layer 1 | Change `270` → `540` |
| 5 | Fix `skip_initial_near_lock` type to `bool` | `schemas.py` | Needs schema regen |
| 6 | Regenerate JSON schema and TS types | `wind-schema.json`, `wind-schema.ts` | Run `scripts/generate_schema.py` then `npm run generate-types` |
| 7 | Add test for default `False` | `tests/config/` | Optional; small |
| 8 | Update `wind-format.md` lockDegrees | `docs/guides/wind-format.md` | Docs |
| 9 | Fix patternNumber description + add coverage/ply-count section | `docs/reference/concepts.md`, `docs/guides/wind-format.md` | Docs |
| 10 | Update `planner-math.md` (add coverage formula; caveat feed-rate clamping) | `docs/reference/planner-math.md` | Docs |
| 11 | Update `skipIndex` docs to reflect implemented behaviour | `docs/guides/wind-format.md`, `docs/reference/concepts.md` | Remove forward-compat caveat once step 2 is shipped |

Steps 1–4 must ship together (Issues 1 and 2 are coupled via the `effective_skip` in the lockDegrees validator). Steps 5–11 are independent and can be batched or follow in the same PR.

Steps 1–9 are safe to bundle into one PR (no breaking changes to existing valid `.wind` files — `lockDegrees=270` with `patternNumber=3` was already producing wrong output; now it errors). Step 10 is a tracking note. Step 11 is a separate PR due to G-code output changes.

---

## Risk Notes

**Fully audited impact (all .wind files verified against corrected conditions):**

| File | Layer | lock | P | skip | Result | Action needed |
|---|---|---|---|---|---|---|
| `examples/rocketry/AvBay(470mm).wind` | 1 | 270 | 3 | 1 | **FAILS** cond1 | Fix layer 1 to `lockDegrees: 540` |
| `examples/rocketry/AvBay(470mm).wind` | 2–3 | 540 | 3 | 2 | PASS | None |
| `examples/rocketry/CarbonMotorTube(1295mm).wind` | all | 540 | 3 | 2 | PASS | None |
| `examples/rocketry/MainChute(585mm).wind` | 1 | 270 | 3 | 2 | **FAILS** cond1 | Fix layer 1 to `lockDegrees: 540` |
| `examples/multi_layer/input.wind` | helical | 720 | 2 | 1 | PASS | None |
| `tests/cyclone_reference_runs/inputs/helical-balanced.wind` | L1 | 540 | 4 | 1 | FAIL (divisibility, already expected) | No change to test |
| `tests/cyclone_reference_runs/inputs/helical-balanced.wind` | L2 | 720 | 3 | 2 | PASS | None |
| `tests/cyclone_reference_runs/inputs/skip-bias.wind` | L1 | 600 | 2 | 1 | FAIL (divisibility, already expected) | No change to test |
| `tests/cyclone_reference_runs/inputs/skip-bias.wind` | L3 | 540 | 5 | 2 | PASS | None |

**Example files requiring update:** `AvBay(470mm).wind` layer 1 and `MainChute(585mm).wind` layer 1 — both use `lockDegrees: 270` with `patternNumber: 3`, which fails condition 1. Fix both to `lockDegrees: 540`.

**Reference test outcomes unchanged:** The reference tests that currently fail (`helical-balanced`, `skip-bias`) continue to fail — just the failing condition may differ. No currently-passing reference test is broken.

**Issue 2 G-code output impact:** `skipIndex=1` files produce identical G-code after Option D wiring. `skipIndex=2` files change visit order → regenerate reference G-code for any reference using `skipIndex>1`. Check `tests/cyclone_reference_runs/` — `helical-balanced.wind` L2 uses `skipIndex: 2`. If an output file exists for it (currently expected to fail, so likely no output), nothing to regenerate. Rocketry examples are not reference-tested.
