# Babylon.js MCP Tools

This directory contains the Babylon.js Model Context Protocol tooling packages used to expose Babylon.js authoring workflows to MCP-compatible clients.

## Packages

| Package                    | Purpose                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `mcp-server-core`          | Shared internal helpers for MCP response shaping, schema fragments, validation, and file handoff behavior. |
| `nme-mcp-server`           | Node Material graph authoring and import/export workflows.                                                 |
| `flow-graph-mcp-server`    | Flow Graph authoring and coordinator JSON export/import workflows.                                         |
| `gui-mcp-server`           | Babylon.js GUI authoring, layout, export/import, and snippet flows.                                        |
| `nge-mcp-server`           | Node Geometry graph authoring and export/import workflows.                                                 |
| `nrge-mcp-server`          | Node Render Graph authoring and render-pipeline export/import workflows.                                   |
| `npe-mcp-server`           | Node Particle graph authoring and export/import workflows.                                                 |
| `smart-filters-mcp-server` | Smart Filters graph authoring and export/import workflows.                                                 |

## How The Packages Fit Together

The MCP packages are organized as specialized graph or authoring servers, each managing one Babylon.js subsystem in memory. Each server can independently create, edit, validate, and export its graph format.

A future Scene MCP server will act as an orchestrator, consuming exported JSON from these servers to produce runnable scenes.

## Typical Workflow

Each server follows the same general pattern:

```text
1. Create a graph/document in memory
2. Add blocks/controls/nodes and configure them
3. Connect ports or set properties
4. Validate the graph
5. Export to JSON (inline or to a file via outputFile)
```

## Common Development Flow

Most MCP server packages in this folder support the same development commands:

```bash
npm run build -w @tools/<package-name>
npm run start -w @tools/<package-name>
```

The MCP servers are built with Rollup and consume the shared helpers from `@tools/mcp-server-core`.

## Shared Conventions

- JSON export tools generally support `outputFile`
- JSON import tools generally support `json` and `jsonFile`
- snippet-enabled servers generally support `snippetId`
- shared schema, validation, and response helpers live in `mcp-server-core`

## Workspace MCP Configuration

The workspace-level MCP server command mapping lives in `.vscode/mcp.json` at the repository root. That file is useful when testing the servers locally from VS Code or another MCP-aware client.
