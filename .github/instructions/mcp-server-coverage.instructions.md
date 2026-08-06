---
applyTo: "packages/dev/core/src/{FlowGraph,Materials/Node,Meshes/Node,FrameGraph,Particles/Node}/**/*.{ts,tsx},packages/dev/smartFilterBlocks/src/**/*.ts,packages/dev/gui/src/2D/controls/**/*.ts,packages/tools/{flow-graph-mcp-server,nme-mcp-server,nge-mcp-server,nrge-mcp-server,npe-mcp-server,smart-filters-mcp-server,gui-mcp-server}/**/*.{ts,tsx}"
---

# MCP Server Coverage

When adding, removing, or renaming a graph block or GUI control, update the matching MCP server registry or catalog in the same change:

- Flow Graph blocks: `packages/tools/flow-graph-mcp-server/src/blockRegistry.ts`
- Node Material blocks: `packages/tools/nme-mcp-server/src/blockRegistry.ts`
- Node Geometry blocks: `packages/tools/nge-mcp-server/src/blockRegistry.ts`
- Node Render Graph blocks: `packages/tools/nrge-mcp-server/src/blockRegistry.ts`
- Node Particle blocks: `packages/tools/npe-mcp-server/src/blockRegistry.ts`
- Smart Filters blocks: `packages/tools/smart-filters-mcp-server/src/blockRegistry.ts`
- GUI controls: `packages/tools/gui-mcp-server/src/catalog.ts`

Keep the MCP metadata aligned with the runtime block/control class name, serialized class name, public inputs, public outputs, configurable properties, and default serialized properties. If a block/control is intentionally omitted because it is abstract, a base class, editor-internal, or non-creatable, leave the omission clear in nearby registry comments or tests.

After changing coverage, run the affected MCP server tests or build and also rebuild `@babylonjs/mcp-servers` so the public package stays current.

Every graph/GUI MCP server has a `registryDrift.test.ts` guard that checks its registry/catalog against the real Babylon definitions and fails on drift. If you add or change a block's ports (or a control's properties), update the registry so these guards stay green:

- Node Material, Node Geometry, Node Particle: construct the real block via `GetClass` and compare input/output port names.
- Node Render Graph: construct the real block under a `NullEngine`/`FrameGraph` harness and compare input/output port names.
- Flow Graph: resolve each block via the async block factory, construct it, and compare signal/data input/output names.
- Smart Filters: parse annotated-GLSL blocks with `ImportCustomBlockDefinition`, construct hand-written TS blocks via their factory, and compare connection point names.
- GUI: construct the real control and verify every catalog property name exists as a real member.
