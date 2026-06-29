# Motion IR

The **Motion IR** is FiberPath's typed, machine-agnostic toolpath representation —
the single place motion math lives. The planner lowers a validated
[`.wind`](../guides/wind-format.md) definition to a `Program` of `Move`s, and every
downstream consumer (G-code serialization, simulation, plotting, metrics) reads the
IR instead of re-parsing G-code text.

| | |
|---|---|
| **Status** | Secondary format — **weaker** stability guarantees than `.wind` |
| **Current version** | `irVersion` `1.0` |
| **Serialized form** | the emitted G-code (a build artifact); the `; Parameters` header carries the IR metadata |
| **Source** | `fiberpath/planning/ir.py` |

> **Format tiering.** The [`.wind`](../guides/wind-format.md) format is the
> **flagship**, stable, independently-versioned interchange format. The Motion IR is a
> **secondary** format documented here, and emitted G-code is a **build artifact**, not
> a standard. Author and exchange `.wind`; treat the IR/G-code as compiler output.

## Vocabulary

The IR is a small, pure data vocabulary (construction is the lowering's job; there is
no per-kind validation — the IR is internal, not a trust boundary).

### `MoveKind`

Each kind lowers to exactly one emitted line:

| Kind | Emits | Meaning |
|---|---|---|
| `RAPID` | `G0 <axes>` | absolute positioning (also the all-zero init move) |
| `SET_FEED` | `G0 F<rate>` | feed-rate state op (no targets; not a `G1` cut) |
| `SET_POSITION` | `G92 <subset>` | zero / redefine the listed axes |
| `COMMENT` | `; <text>` | annotation |

### `Move`

- `kind: MoveKind`
- `targets: dict[Axis, float]` — absolute, ordered. A `RAPID` carries all three axes in
  `CARRIAGE, MANDREL, DELIVERY_HEAD` order; a `SET_POSITION` carries only the axes it sets,
  in caller order.
- `feed: float | None` — set only for `SET_FEED`.
- `text: str | None` — set only for `COMMENT`.

**Logical axes** stay in the IR (`Axis.CARRIAGE`, `MANDREL`, `DELIVERY_HEAD`); the machine
letters (X/A/B), opcode strings, and header formatting are **dialect** concerns resolved
only in `serialize()`. The IR is **post-segmentation**: one `Move` renders to exactly one
G-code line, so a carriage move is already split into its interpolated steps.

### `Program` and `ProgramMeta`

- `Program` — `meta: ProgramMeta` plus an ordered `moves: list[Move]`.
- `ProgramMeta` — program-level parameters consumers need without re-parsing the body:
  `mandrel_diameter`, `wind_length`, `tow_width`, `tow_thickness`, and `ir_version`
  (default `IR_VERSION`). For a cone, `mandrel_diameter` is the large-end (nominal)
  diameter — a documented approximation for time/material metrics.

## Serialized form

The IR's interchange form is the emitted G-code. The first line is the metadata header:

```gcode
; Parameters {"irVersion":"1.0","mandrel":{"diameter":70,"windLength":500},"tow":{"width":7,"thickness":0.5}}
```

`serialize(program, dialect)` writes it; `read_program(lines)` parses it back into a
`Program` (reconstructing `ProgramMeta` from the header). A reader **MUST** treat an
absent `irVersion` as `1.0` (pre-`irVersion` artifacts).

## Versioning policy

`irVersion` is versioned **independently** of the `.wind` `schemaVersion` and offers
**weaker** stability guarantees: the IR tracks the engine's internals and **MAY** change
across minor engine releases (new move kinds, header fields, or axis semantics). Bump
`IR_VERSION` (`fiberpath/planning/ir.py`) on any change to the IR's observable shape.
Consumers that persist or exchange IR-derived G-code should record the `irVersion` they
were produced under rather than assuming cross-version byte-stability.
