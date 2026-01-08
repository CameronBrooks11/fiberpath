#!/usr/bin/env python3
"""
Generate JSON Schema from Pydantic models for the .wind file format.
This ensures GUI and CLI stay in sync.
"""

import json
from pathlib import Path
from fiberpath.config.schemas import WindDefinition

def main():
    # Generate schema
    schema = WindDefinition.model_json_schema(mode='serialization')
    
    # Add metadata
    schema['$schema'] = 'http://json-schema.org/draft-07/schema#'
    schema['title'] = 'FiberPath Wind Definition'
    schema['description'] = 'Schema for FiberPath filament winding pattern definitions'
    
    # Output path
    output_path = Path(__file__).parent.parent / 'fiberpath_gui' / 'schemas' / 'wind-schema.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write schema
    with open(output_path, 'w') as f:
        json.dump(schema, f, indent=2)
    
    print(f"✓ Generated schema: {output_path}")
    print(f"  Schema version: {schema.get('version', 'N/A')}")
    print(f"  Definitions: {len(schema.get('$defs', {}))}")

if __name__ == '__main__':
    main()
