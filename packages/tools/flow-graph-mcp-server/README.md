# @tools/flow-graph-mcp-server

MCP server for AI-driven Babylon.js Flow Graph authoring.

## Provides

- create, inspect, validate, and delete flow graphs
- add blocks and connect data or signal ports
- update block properties and context variables
- export coordinator JSON or graph-only JSON
- import previously exported flow graph JSON

## Typical Workflow

```text
create_graph -> add_block -> connect_data/connect_signal -> set_block_properties -> validate_graph -> export_graph_json
```

Use the full coordinator JSON when handing the result to Scene MCP.

## Binary

```bash
babylonjs-flow-graph
```

## Build And Run

```bash
npm run build -w @tools/flow-graph-mcp-server
npm run start -w @tools/flow-graph-mcp-server
```

## Integration

The exported coordinator JSON can be attached to the Scene MCP server through `attach_flow_graph`, either inline or via `coordinatorJsonFile`.

## Related Files

- `src/index.ts`: MCP tool registration
- `src/flowGraphManager.ts`: graph manager and export/import logic
- `src/blockRegistry.ts`: Flow Graph block catalog
