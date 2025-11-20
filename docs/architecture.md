# Architecture Overview

- **Core Engine (`fiberpath/`)** – deterministic planning pipelines, geometry utilities, and
  G-code emission.
- **Interfaces (`fiberpath_cli/`, `fiberpath_api/`, `gui/`)** – user experiences that call into the
  engine.
