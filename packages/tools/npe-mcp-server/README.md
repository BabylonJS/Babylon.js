# @tools/npe-mcp-server

MCP server for AI-driven Babylon.js Node Particle authoring.

## Provides

- create and manage particle graph sets in memory
- add blocks, connect ports, and update block properties
- inspect and validate particle systems
- export and import NPE-compatible JSON
- import from and save to Babylon.js snippets

## Typical Workflow

```text
create_particle_system -> add_block -> connect_blocks -> set_block_properties -> validate_particle_system -> export_particle_system_json
```

Most particle graphs end with a `SystemBlock` and require their mandatory inputs to be connected before export.

## Binary

```bash
babylonjs-node-particle
```

## Build And Run

```bash
npm run build -w @tools/npe-mcp-server
npm run start -w @tools/npe-mcp-server
```

## Integration

The server produces Babylon.js Node Particle JSON for editor and runtime workflows, and can participate in broader scene-authoring pipelines alongside the Scene MCP server.

## Related Files

- `src/index.ts`: MCP tool registration
- `src/particleGraph.ts`: graph manager and validation logic
- `src/blockRegistry.ts`: Node Particle block catalog
