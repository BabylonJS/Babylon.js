# @tools/nme-mcp-server

MCP server for AI-driven Babylon.js Node Material authoring.

## Provides

- create, inspect, and delete in-memory Node Material graphs
- add blocks, connect ports, and update block properties
- import and export NME JSON
- import from and save to Babylon.js snippets
- optional live session bridge support for the Node Material Editor

## Typical Workflow

```text
create_material -> add_block -> connect_blocks -> set_block_properties -> validate_material -> export_material_json
```

For scene integration, export the material JSON and hand it to Scene MCP through `add_material`.

## Binary

```bash
babylonjs-node-material
```

## Build And Run

```bash
npm run build -w @tools/nme-mcp-server
npm run start -w @tools/nme-mcp-server
```

## Integration

The exported NME JSON can be handed to the Scene MCP server through `add_material`, either inline or via `nmeJsonFile`.

## Related Files

- `src/index.ts`: MCP tool registration
- `src/materialGraph.ts`: in-memory graph manager
- `src/sessionServer.ts`: optional live session bridge
