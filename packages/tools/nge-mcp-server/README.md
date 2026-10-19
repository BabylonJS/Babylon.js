# @tools/nge-mcp-server

MCP server for AI-driven Babylon.js Node Geometry authoring.

## Provides

- create and manage in-memory Node Geometry graphs
- add blocks, connect ports, and set block properties
- inspect graph structure and validate geometry graphs
- export and import NGE JSON
- import from and save to Babylon.js snippets

## Typical Workflow

```text
create_geometry -> add_block -> connect_blocks -> set_block_properties -> validate_geometry -> export_geometry_json
```

The exported JSON can be used directly in Scene MCP to create a mesh at runtime.

## Binary

```bash
babylonjs-node-geometry
```

## Build And Run

```bash
npm run build -w @tools/nge-mcp-server
npm run start -w @tools/nge-mcp-server
```

## Integration

Exported NGE JSON can be consumed by the Scene MCP server through `add_node_geometry_mesh`, either inline or via `ngeJsonFile`.

## Related Files

- `src/index.ts`: MCP tool registration
- `../ngeMcpCommon/src/geometryGraph.ts`: shared browser-safe graph manager and serialization logic
- `../ngeMcpCommon/src/blockRegistry.ts`: shared Node Geometry block catalog
- `../ngeMcpCommon/src/referenceData.ts`: shared enum and concepts reference data
- `src/geometryGraph.ts` and `src/blockRegistry.ts`: compatibility re-exports
