# Babylon.js MCP Servers

`@babylonjs/mcp-servers` packages the Babylon.js Model Context Protocol servers as executable Node.js binaries. MCP-compatible clients can use these servers to create, edit, validate, import, export, and live-sync Babylon.js authoring graphs.

## Included Servers

| Server                   | Dispatcher name | Direct binary                        | Purpose                                                                  |
| ------------------------ | --------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| Node Material Editor     | `nme`           | `babylonjs-nme-mcp-server`           | Node Material graph authoring and import/export workflows.               |
| Node Geometry Editor     | `nge`           | `babylonjs-nge-mcp-server`           | Node Geometry graph authoring and export/import workflows.               |
| Node Render Graph Editor | `nrge`          | `babylonjs-nrge-mcp-server`          | Node Render Graph authoring and render-pipeline export/import workflows. |
| Node Particle Editor     | `npe`           | `babylonjs-npe-mcp-server`           | Node Particle graph authoring and export/import workflows.               |
| GUI Editor               | `gui`           | `babylonjs-gui-mcp-server`           | Babylon.js GUI authoring, layout, export/import, and snippet flows.      |
| Flow Graph Editor        | `flow-graph`    | `babylonjs-flow-graph-mcp-server`    | Flow Graph authoring and coordinator JSON export/import workflows.       |
| Smart Filters Editor     | `smart-filters` | `babylonjs-smart-filters-mcp-server` | Smart Filters graph authoring and export/import workflows.               |

## Run With npx

Use the dispatcher when you want a compact command:

```sh
npx -y @babylonjs/mcp-servers nme
```

Use direct binaries when your MCP client expects a command name:

```sh
npx -y -p @babylonjs/mcp-servers babylonjs-nme-mcp-server
```

## MCP Client Configuration

Most MCP clients accept a command plus arguments. This example starts the Node Material Editor MCP server through the dispatcher:

```json
{
    "mcpServers": {
        "babylonjs-node-material": {
            "command": "npx",
            "args": ["-y", "@babylonjs/mcp-servers", "nme"]
        }
    }
}
```

This equivalent form uses the direct binary:

```json
{
    "mcpServers": {
        "babylonjs-node-material": {
            "command": "npx",
            "args": ["-y", "-p", "@babylonjs/mcp-servers", "babylonjs-nme-mcp-server"]
        }
    }
}
```

## Live Editor Sessions

The graph MCP servers can start a local editor session server and return a session URL. Paste that URL into the matching Babylon.js editor's MCP session panel to see live updates from the MCP server and to push editor changes back to the MCP server.

The local editor session server binds to `127.0.0.1` by default. It stops when the MCP process exits, when the `stop_session_server` MCP tool is called, or after 15 minutes without MCP/editor activity.

## Local Development

From the Babylon.js repository, build the package with:

```sh
npm run build -w @babylonjs/mcp-servers
```

The build compiles the private MCP server workspaces and copies their bundled `dist/index.js` outputs into this package's `dist/` directory.
