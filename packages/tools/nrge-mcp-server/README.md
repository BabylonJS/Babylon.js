# @tools/nrge-mcp-server

MCP server for AI-driven Babylon.js Node Render Graph authoring.

## Provides

- create and manage custom render graphs in memory
- add render-graph blocks, connect ports, and set properties
- inspect graph structure and validate output pipelines
- export and import NRGE-compatible JSON
- import from and save to Babylon.js snippets

## Typical Workflow

```text
create_render_graph -> add_block -> connect_blocks -> set_block_properties -> validate_graph -> export_graph_json
```

In practice, a usable render graph usually includes an input block, render or post-process blocks, and an output block.

## Binary

```bash
babylonjs-node-render-graph
```

## Build And Run

```bash
npm run build -w @tools/nrge-mcp-server
npm run start -w @tools/nrge-mcp-server
```

## Integration

Exported Node Render Graph JSON can be attached to the Scene MCP server through `attach_node_render_graph`, either inline or via `nrgJsonFile`.

## Related Files

- `src/index.ts`: MCP tool registration
- `src/renderGraph.ts`: graph manager and import/export logic
- `src/blockRegistry.ts`: Node Render Graph block catalog
