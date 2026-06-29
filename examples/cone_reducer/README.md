# cone_reducer

The first non-cylindrical example: a **reducing cone (frustum)**, 98 mm → 54 mm
diameter over 120 mm (≈10.4° half-angle) — an HPR-style transition/reducer.

A single helical layer is wound as a **geodesic** (Clairaut). The wind angle
(`30°`) is anchored at the **large end** (z = 0, `diameter`); the achieved fiber
angle grows toward the small end (`endDiameter`) as `sin α(z) = C / r(z)`. The
path is closed-form (a straight line in the unrolled sector) — no ODE/friction
solver, because a cone is developable.

`endDiameter` is a `schemaVersion 1.1` addition; omit it (or set it equal to
`diameter`) for a cylinder. See `docs/guides/wind-format.md`.
