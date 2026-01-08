#!/usr/bin/env python3
"""Export Pydantic schema to JSON Schema for GUI consumption."""

import json
from pathlib import Path

from fiberpath.config.schemas import WindDefinition


def main():
    # Generate JSON Schema from Pydantic model
    schema = WindDefinition.model_json_schema(by_alias=True, mode="serialization")
    
    # Add schema metadata
    schema["$schema"] = "http://json-schema.org/draft-07/schema#"
    schema["$id"] = "https://github.com/CameronBrooks11/fiberpath/schemas/wind-definition.json"
    
    # Write to GUI schemas directory
    output_path = Path(__file__).parent.parent / "fiberpath_gui" / "schemas" / "wind-schema.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w") as f:
        json.dump(schema, f, indent=2)
    
    print(f"✓ Exported JSON Schema to {output_path}")
    print(f"  Schema contains {len(schema.get('properties', {}))} top-level properties")


if __name__ == "__main__":
    main()
