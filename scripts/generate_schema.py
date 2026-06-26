#!/usr/bin/env python3
"""
Generate JSON Schema from Pydantic models for the .wind file format.
This ensures GUI and CLI stay in sync.
"""

import json
from pathlib import Path

from fiberpath.config.schemas import WindDefinition


def main() -> None:
    # Generate schema
    schema = WindDefinition.model_json_schema(mode="serialization")

    # Add metadata
    schema["$schema"] = "http://json-schema.org/draft-07/schema#"
    schema["title"] = "FiberPath Wind Definition"
    schema["description"] = "Schema for FiberPath filament winding pattern definitions"

    # schemaVersion is a native field on WindDefinition (default "1.0", pattern
    # ^1\.\d+$), so it is already present in the generated schema: absent is
    # treated as 1.0, any 1.x minor is accepted, and an incompatible major
    # (2.0+) is rejected. It is intentionally not `required` for backwards compat.

    # Output path
    output_path = Path(__file__).parent.parent / "fiberpath_gui" / "schemas" / "wind-schema.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write schema
    with open(output_path, "w") as f:
        json.dump(schema, f, indent=2)

    schema_version = WindDefinition.model_fields["schema_version"].default
    print(f"✓ Generated schema: {output_path}")
    print(f"  Default schemaVersion: {schema_version}")
    print(f"  Definitions: {len(schema.get('$defs', {}))}")


if __name__ == "__main__":
    main()
