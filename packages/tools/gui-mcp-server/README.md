# @tools/gui-mcp-server

MCP server for AI-driven Babylon.js GUI layout authoring.

## Provides

- create and manage GUIs and controls in memory
- add controls, reparent them, and update control properties
- manage grid rows and columns
- inspect GUI/control structure
- export and import Babylon.js GUI JSON
- import from and save to Babylon.js snippets

## Typical Workflow

```text
create_gui -> add_control -> set_properties -> describe_gui -> export_gui_json
```

Grid-based UIs typically also use the row and column management tools before adding child controls.

## Binary

```bash
babylonjs-gui
```

## Build And Run

```bash
npm run build -w @tools/gui-mcp-server
npm run start -w @tools/gui-mcp-server
```

## Integration

GUI JSON can be attached to the Scene MCP server through `attach_gui`, either inline or via `guiJsonFile`.

## Related Files

- `src/index.ts`: MCP tool registration
- `src/guiManager.ts`: GUI state and serialization logic
- `src/catalog.ts`: control catalog and shared property metadata
