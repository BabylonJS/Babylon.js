# Node Geometry Editor WebMCP

Node Geometry Editor registers tools through the experimental WebMCP `document.modelContext` API when the hosting browser supports it. These tools operate directly on the Node Geometry currently open in the editor.

The existing stdio MCP server and HTTP/SSE editor session remain supported. WebMCP complements that integration rather than replacing its transport.

## Writer Selection

- Without a legacy MCP session, WebMCP read and mutation tools can use the current document.
- While a legacy MCP session is connected, it is the exclusive MCP writer.
- WebMCP read-only tools remain available during a legacy session.
- WebMCP mutation calls explain that the legacy session must be disconnected or used for the mutation.
- Disconnecting the legacy session immediately restores WebMCP mutation access.

This policy prevents two MCP clients from concurrently replacing the live editor document. It does not prevent normal user edits in the NGE interface.

## Available Tools

### Current document

- `get_current_node_geometry`
- `create_current_node_geometry`
- `replace_current_node_geometry`
- `rebuild_current_node_geometry`
- `describe_current_node_geometry`
- `validate_current_node_geometry`
- `get_current_node_geometry_url`

### Blocks and connections

- `add_block`
- `add_blocks_batch`
- `remove_block`
- `set_block_properties`
- `connect_blocks`
- `connect_blocks_batch`
- `disconnect_input`
- `describe_block`
- `list_block_types`
- `get_block_type_info`
- `get_node_geometry_enums`
- `get_node_geometry_concepts`

### Snippets

- `import_current_node_geometry_from_snippet`
- `save_current_node_geometry_snippet`

The browser tools intentionally omit local server lifecycle, multi-document server storage, and arbitrary filesystem operations. The standard NGE MCP server continues to provide those capabilities.

## Browser Testing

WebMCP is experimental. Follow the current browser instructions linked from the [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md).

For Chrome local development:

1. Enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome.
2. Start the Babylon.js CDN and Node Geometry Editor development servers.
3. Open the local Node Geometry Editor.
4. Confirm that the MCP panel reports WebMCP as `registered`.
5. Use Chrome DevTools' WebMCP inspection surface to list and invoke the registered tools.

An external MCP client cannot consume `document.modelContext` directly. It needs browser integration or an MCP-to-browser bridge such as the experimental WebMCP category in `chrome-devtools-mcp`.

## Lifecycle

Tools register from the root editor lifecycle rather than the MCP property panel. Closing or replacing the editor aborts every registration and closes any legacy editor session connection.
