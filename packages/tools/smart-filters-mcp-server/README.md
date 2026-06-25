# Smart Filters MCP Server

An MCP (Model Context Protocol) server for authoring, editing, validating, and exporting **Babylon.js Smart Filter** graphs. This server lets MCP clients (AI assistants, editors, automation pipelines) build Smart Filter post-processing chains entirely through tool calls — no GUI required.

## Binary

```
babylonjs-smart-filters
```

## Build & Run

```bash
# From the workspace root
npm install
npm run build -w @tools/smart-filters-mcp-server

# Run the server (stdio transport)
npx babylonjs-smart-filters
```

## Tool Categories

| Category          | Tools                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Lifecycle**     | `create_filter_graph`, `list_filter_graphs`, `delete_filter_graph`, `clone_filter_graph`, `clear_all` |
| **Discovery**     | `list_block_types`, `get_block_type_info`, `list_categories`, `describe_graph`, `describe_block`      |
| **Block Editing** | `add_block`, `add_blocks_batch`, `remove_block`, `set_block_properties`, `get_block_properties`       |
| **Connections**   | `connect_blocks`, `connect_blocks_batch`, `disconnect_input`, `list_connections`                      |
| **Validation**    | `validate_graph`, `list_issues`                                                                       |
| **Import/Export** | `export_filter_graph_json`, `import_filter_graph_json`                                                |
| **Search**        | `find_blocks`, `find_block_types`                                                                     |

## Resources

| URI                             | Description                        |
| ------------------------------- | ---------------------------------- |
| `smart-filters://block-catalog` | Full block type catalog            |
| `smart-filters://enums`         | ConnectionPointType enum reference |
| `smart-filters://concepts`      | Key Smart Filter concepts          |

## Prompts

| Name                       | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `create-basic-filter`      | Step-by-step: single-effect filter chain         |
| `create-blur-filter`       | Step-by-step: blur filter with configurable size |
| `create-tinted-desaturate` | Step-by-step: desaturate + tint composition      |

## Example Workflow

```text
1. create_filter_graph  name="myFilter"
2. add_block            graphId="myFilter"  blockType="Texture"           name="source"
3. add_block            graphId="myFilter"  blockType="BlackAndWhiteBlock" name="bw"
4. connect_blocks       graphId="myFilter"  outputBlockId=<source.id>  outputName="output"
                                             inputBlockId=<bw.id>      inputName="input"
5. connect_blocks       graphId="myFilter"  outputBlockId=<bw.id>     outputName="output"
                                             inputBlockId=1            inputName="input"
6. validate_graph       graphId="myFilter"
7. export_filter_graph_json  graphId="myFilter"  outputFile="myFilter.json"
```

## Output Format

Exports conform to the **Smart Filter V1** serialization format:

```json
{
  "format": "smartFilter",
  "formatVersion": 1,
  "name": "myFilter",
  "blocks": [ ... ],
  "connections": [ ... ]
}
```

## Available Block Types

### Effects

BlackAndWhiteBlock, KaleidoscopeBlock, PosterizeBlock, DesaturateBlock, ContrastBlock, GreenScreenBlock, PixelateBlock, ExposureBlock, MaskBlock, SpritesheetBlock, BlurBlock, DirectionalBlurBlock, PremultiplyAlphaBlock

### Transitions

CompositionBlock, TintBlock, WipeBlock

### Inputs

Float, Color3, Color4, Texture, Vector2, Boolean

### Output

OutputBlock (auto-created with every new graph)

## Limitations

- **No snippet integration** — save/load from the Babylon.js snippet server is not yet supported.
- **No runtime hooks** — `export_runtime_descriptor` and `validate_against_runtime` are deferred (would require Babylon.js engine dependencies).
- **No live-preview** — the server operates on an in-memory model; real-time preview requires a running Babylon.js scene.
