#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Node Render Graph MCP Server  (babylonjs-node-render-graph)
 * ───────────────────────────────────────────────
 * A Model Context Protocol server that lets AI agents build Babylon.js
 * Node Render Graph (NRG / NRGE) pipelines programmatically.
 *
 * An agent can:
 *   • Create and manage render-graph definitions in memory
 *   • Add any NRG block from the full catalog (renderers, post-processes, layers, etc.)
 *   • Wire blocks together (texture / camera / object-list / shadow flows)
 *   • Set block-specific properties (e.g. bloom intensity, clear color, DOF blur level)
 *   • Validate the graph (required inputs, OutputBlock present, etc.)
 *   • Export NRG-compatible JSON (consumed by NodeRenderGraph.ParseAsync() in Babylon.js)
 *   • Import existing NRGE JSON for further editing
 *   • Query the block catalog and type documentation
 *
 * Integration with Scene MCP
 * ──────────────────────────
 * This server generates JSON that can be attached to a Babylon.js scene via the
 * Scene MCP server's `attach_node_render_graph` tool.  Typical workflow:
 *   1. Node Render Graph MCP → build & export graph JSON
 *   2. Scene MCP → `attach_node_render_graph { sceneName, nrgJson }`
 *
 * Transport: stdio  (standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import {
    CreateErrorResponse,
    CreateInlineJsonSchema,
    CreateJsonFileSchema,
    CreateJsonImportSummaryResponse,
    CreateOutputFileSchema,
    CreateOverwriteSchema,
    CreateSnippetIdSchema,
    CreateTextResponse,
    CreateTypedSnippetImportSummaryResponse,
    McpEditorSessionController,
    ParseJsonText,
    RunSnippetResponse,
    WriteTextFileEnsuringDirectory,
} from "@tools/mcp-server-core";

import { BlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { RenderGraphManager } from "./renderGraph.js";
import { LoadSnippet, SaveSnippet, type IDataSnippetResult } from "@tools/snippet-loader";

// ─── Singleton graph manager ─────────────────────────────────────────────
const manager = new RenderGraphManager();
const sessionController = new McpEditorSessionController<RenderGraphManager>(
    {
        serverName: "NRGE MCP Session Server",
        documentKind: "node-render-graph",
        managerUnavailableMessage: "Render graph manager is not available",
        getDocument: (manager, session) => manager.exportJson(session.name),
        setDocument: (manager, session, document) => {
            try {
                manager.importJson(session.name, document, true);
                return undefined;
            } catch (e) {
                return (e as Error).message;
            }
        },
    },
    {
        defaultPort: 3001,
        statusTitle: "NRGE MCP Session Server",
    }
);

/**
 * Notify SSE subscribers if a session exists for the given render graph.
 * @param graphName - The render graph name to check for active sessions.
 */
function _notifyIfSession(graphName: string): void {
    const sessionId = sessionController.getSessionIdForName(graphName);
    if (sessionId) {
        sessionController.notifySessionUpdate(sessionId);
    }
}

/**
 * Import render graph JSON and notify a matching live session on success.
 * @param graphName - The render graph name to import into.
 * @param jsonText - Serialized NRGE JSON.
 * @param overwrite - Whether to overwrite an existing graph with the same name.
 * @returns The imported graph.
 */
function _importGraphJson(graphName: string, jsonText: string, overwrite: boolean = false) {
    const graph = manager.importJson(graphName, jsonText, overwrite);
    _notifyIfSession(graphName);
    return graph;
}

// ─── MCP Server ──────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-node-render-graph",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build Babylon.js Node Render Graphs (custom render pipelines). Workflow: create_render_graph → add blocks (NodeRenderGraphInputBlock, object/geometry renderers, post-process blocks, NodeRenderGraphOutputBlock) → connect ports → validate_graph → export_graph_json.",
            "Every render graph needs an InputBlock (provides camera/scene) and an OutputBlock (final framebuffer). Use get_block_type_info to discover ports.",
            "Output JSON can be consumed by the Scene MCP via attach_node_render_graph.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources  (read-only reference data an agent can always consult)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("block-catalog", "nrg://block-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# NRG Block Catalog\n\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.registerResource("enums", "nrg://enums", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# NRG Enumerations Reference",
                "",
                "## NodeRenderGraphBlockConnectionPointTypes",
                "These numeric values are used as `additionalConstructionParameters[0]` for **NodeRenderGraphInputBlock**.",
                "",
                "| Type name | Value (hex) | Value (decimal) | Description |",
                "|-----------|------------|-----------------|-------------|",
                "| Texture | 0x00000001 | 1 | Generic colour texture (RGBA) |",
                "| TextureBackBuffer | 0x00000002 | 2 | The engine's back-buffer render target |",
                "| TextureBackBufferDepthStencilAttachment | 0x00000004 | 4 | Depth/stencil attachment of the back buffer |",
                "| TextureDepthStencilAttachment | 0x00000008 | 8 | Depth/stencil attachment for off-screen textures |",
                "| TextureViewDepth | 0x00000010 | 16 | View-space depth (geometry renderer output) |",
                "| TextureViewNormal | 0x00000020 | 32 | View-space normal (geometry renderer output) |",
                "| TextureAlbedo | 0x00000040 | 64 | Albedo/diffuse G-buffer texture |",
                "| TextureReflectivity | 0x00000080 | 128 | Reflectivity G-buffer texture |",
                "| TextureWorldPosition | 0x00000100 | 256 | World-space position G-buffer texture |",
                "| TextureVelocity | 0x00000200 | 512 | Screen-space velocity (motion vectors) |",
                "| TextureIrradiance | 0x00000400 | 1024 | Irradiance G-buffer texture |",
                "| TextureLinearVelocity | 0x00000800 | 2048 | Linear (camera-space) velocity |",
                "| TextureLocalPosition | 0x00001000 | 4096 | Local/object-space position |",
                "| TextureWorldNormal | 0x00002000 | 8192 | World-space normal |",
                "| TextureAlbedoSqrt | 0x00004000 | 16384 | Sqrt-mapped albedo for IBL |",
                "| ResourceContainer | 0x00100000 | 1048576 | Shared GPU resource container |",
                "| ShadowGenerator | 0x00200000 | 2097152 | Shadow generator output |",
                "| ShadowLight | 0x00400000 | 4194304 | Directional/spot/point light for shadow casting |",
                "| Camera | 0x01000000 | 16777216 | Scene camera |",
                "| ObjectList | 0x02000000 | 33554432 | List of renderable objects/meshes |",
                "| Object | 0x80000000 | 2147483648 | Generic internal task object (e.g. ObjectRendererTask) |",
                "| AutoDetect | 0x10000000 | 268435456 | Type is resolved automatically at build time |",
                "| BasedOnInput | 0x20000000 | 536870912 | Output type mirrors a specific input |",
                "",
                "## Using InputBlock types",
                "When adding a `NodeRenderGraphInputBlock` you must pass the connection-point type as",
                "`additionalConstructionParameters[0]` (an integer from the table above).",
                "",
                "Common examples:",
                "  • Back-buffer colour:  `additionalConstructionParameters: [2]`   (TextureBackBuffer)",
                "  • Off-screen texture:  `additionalConstructionParameters: [1]`   (Texture)",
                "  • Depth/stencil:       `additionalConstructionParameters: [8]`   (TextureDepthStencilAttachment)",
                "  • Back-buffer depth:   `additionalConstructionParameters: [4]`   (TextureBackBufferDepthStencilAttachment)",
                "  • Camera:              `additionalConstructionParameters: [16777216]` (Camera)",
                "  • Object list:         `additionalConstructionParameters: [33554432]` (ObjectList)",
                "  • Shadow light:        `additionalConstructionParameters: [4194304]`  (ShadowLight)",
                "",
                "## Key additionalConstructionParameters for other blocks",
                "",
                "**NodeRenderGraphObjectRendererBlock**",
                "`[doNotChangeAspectRatio (boolean), enableClusteredLights (boolean)]`",
                "Default: `[true, false]`",
                "",
                "**NodeRenderGraphGeometryRendererBlock**  (same as ObjectRenderer)",
                "Default: `[true, false]`",
                "",
                "**NodeRenderGraphBloomPostProcessBlock**",
                "`[hdr (boolean), bloomScale (number)]`  — hdr enables HDR pipeline; bloomScale controls texture scale.",
                "Default: `[false, 0.5]`",
                "",
                "**NodeRenderGraphDepthOfFieldPostProcessBlock**",
                "`[blurLevel (0|1|2 = Low|Medium|High), hdr (boolean)]`",
                "Default: `[0, false]`",
                "",
                "**NodeRenderGraphSSRPostProcessBlock**",
                "`[textureType (number)]`  — Engine.TEXTURETYPE_UNSIGNED_BYTE=0, TEXTURETYPE_HALF_FLOAT=2.",
                "Default: `[0]`",
                "",
                "**NodeRenderGraphTAAPostProcessBlock**",
                "`[samples (number), factor (number)]`  — Defaults: 8 samples, factor 1.0.",
                "Default: `[8, 1.0]`",
                "",
                "**NodeRenderGraphGlowLayerBlock**",
                "`[ldrMerge (boolean), ratio (number), fixedSize (number|undefined), type (number|undefined)]`",
                "Default: `[false, 0.5, undefined, undefined]`",
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "nrg://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Node Render Graph (NRG) Concepts",
                "",
                "## What is a Node Render Graph?",
                "The Node Render Graph is Babylon.js's frame-graph-based render pipeline builder.",
                "Instead of writing custom render loops, you connect typed blocks that represent render",
                "operations — clearing textures, rendering objects, applying post-processes, adding layers —",
                "and Babylon.js executes them in the correct order at runtime.",
                "",
                "## Graph Execution Model",
                "NRG graphs are **directed acyclic graphs** of render tasks.  Data flows",
                "**left-to-right**: source blocks produce textures/objects/cameras that downstream",
                "blocks consume.  The graph evaluates every frame.",
                "",
                "## Required Output Block",
                "Every render graph MUST contain exactly **one** `NodeRenderGraphOutputBlock`.",
                "Its `texture` input must be connected with the final rendered colour texture.",
                "The block's `id` is stored as `outputNodeId` in the serialised JSON.",
                "",
                "## Block Categories",
                "",
                "### Input  (sources of external data)",
                "  • **NodeRenderGraphInputBlock** — exposes an external resource (texture, camera,",
                "    object list, shadow light) as a graph input.  Set `additionalConstructionParameters[0]`",
                "    to the desired connection-point type (see nrg://enums).",
                "  • **NodeRenderGraphOutputBlock** — the required graph sink.  Connect the final",
                "    colour texture to its `texture` input.",
                "",
                "### Textures  (GPU texture operations)",
                "  • **NodeRenderGraphClearBlock** — clears a texture with a solid colour /",
                "    optional depth clear.  Usually the first block that processes a texture.",
                "  • **NodeRenderGraphCopyTextureBlock** — copies one texture to another.",
                "  • **NodeRenderGraphGenerateMipmapsBlock** — generates mipmaps for sampled textures.",
                "",
                "### Rendering  (draw calls)",
                "  • **NodeRenderGraphObjectRendererBlock** — the standard forward-rendering block.",
                "    Needs: objectList, camera, texture (colour RT), textureDepth (depth/stencil RT).",
                "  • **NodeRenderGraphGeometryRendererBlock** — deferred G-buffer renderer.  Writes",
                "    multiple G-buffer textures (viewDepth, viewNormal, albedo, reflectivity, ...).",
                "  • **NodeRenderGraphShadowGeneratorBlock** — renders a shadow map for one light.",
                "  • **NodeRenderGraphCascadedShadowGeneratorBlock** — cascaded shadow-map generator.",
                "  • **NodeRenderGraphCullObjectsBlock** — culls objects to a frustum.  Outputs",
                "    separate lists for opaque / alpha-test / transparent objects.",
                "",
                "### Post-Process  (screen-space effects applied to a texture)",
                "All post-process blocks accept `source` (the input texture) and output `output`",
                "(the processed texture).  They also require a `camera` input.",
                "Notable blocks: Bloom, Blur, FXAA, Sharpen, ChromaticAberration, Grain,",
                "BlackAndWhite, Tonemap, DepthOfField, SSR, SSAO2, TAA, MotionBlur,",
                "ImageProcessing, ColorCorrection, Convolution, Filter, Pass, and more.",
                "",
                "### Layers  (translucent overlay passes)",
                "  • **NodeRenderGraphGlowLayerBlock** — adds a halo-glow effect.",
                "  • **NodeRenderGraphHighlightLayerBlock** — adds coloured outlines/glow to",
                "    specific meshes.",
                "  • **NodeRenderGraphSelectionOutlineLayerBlock** — renders an outline around",
                "    selected objects.",
                "",
                "### Utility  (graph helpers)",
                "  • **NodeRenderGraphResourceContainerBlock** — groups GPU resources for sharing.",
                "  • **NodeRenderGraphElbowBlock** — re-routes a connection wire (cosmetic).",
                "  • **NodeRenderGraphTeleportInBlock / TeleportOutBlock** — split long-distance",
                "    wires into a named teleport pair.",
                "  • **NodeRenderGraphExecuteBlock** — runs an arbitrary custom callback inside",
                "    the frame graph.",
                "",
                "## The Simplest Render Graph",
                "```",
                "InputBlock(BackBuffer)  →  ClearBlock.target  →  ObjectRendererBlock.texture",
                "InputBlock(BackBufferDepth)  →  ObjectRendererBlock.textureDepth",
                "InputBlock(Camera)  →  ObjectRendererBlock.camera",
                "InputBlock(ObjectList)  →  ObjectRendererBlock.objects",
                "ObjectRendererBlock.texture  →  OutputBlock.texture",
                "```",
                "",
                "## Adding a Post-Process",
                "Post-process blocks sit BETWEEN the renderer output and the OutputBlock:",
                "```",
                "...ObjectRendererBlock.texture  →  BloomBlock.source",
                "InputBlock(Camera)  →  BloomBlock.camera",
                "BloomBlock.output  →  OutputBlock.texture",
                "```",
                "",
                "## Scene MCP Integration",
                "After exporting NRG JSON with `export_graph_json`, pass it to the",
                "Scene MCP server's `attach_node_render_graph` tool to apply it to a scene.",
                "The scene MCP will store the JSON and emit the appropriate",
                "`NodeRenderGraph.ParseAsync(...)` code in the generated scene script.",
                "",
                "## Common Mistakes",
                "1. Forgetting NodeRenderGraphOutputBlock — graph cannot evaluate.",
                "2. Not setting `additionalConstructionParameters` on InputBlock.",
                "3. Not connecting a camera to post-process blocks.",
                "4. Leaving ObjectRendererBlock.objects or .camera disconnected.",
                "5. Using wrong texture types — colour targets need Texture (1) or",
                "   TextureBackBuffer (2); depth targets need the depth-stencil types (4 or 8).",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts  (reusable step-by-step templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt(
    "basic-render-graph",
    {
        description: "Step-by-step instructions for building the simplest possible render graph " + "(clear + object renderer + output) for use with the Scene MCP.",
    },
    () => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: [
                        "Build a minimal render graph that renders a scene's objects to the back-buffer.",
                        "",
                        "Steps:",
                        "1. create_render_graph  name='BasicPipeline'",
                        "2. add_block  blockType='NodeRenderGraphInputBlock'  blockName='BackBuffer'",
                        "   additionalConstructionParameters=[2]        ← TextureBackBuffer",
                        "3. add_block  blockType='NodeRenderGraphInputBlock'  blockName='DepthBuffer'",
                        "   additionalConstructionParameters=[4]        ← TextureBackBufferDepthStencilAttachment",
                        "4. add_block  blockType='NodeRenderGraphInputBlock'  blockName='MainCamera'",
                        "   additionalConstructionParameters=[16777216] ← Camera",
                        "5. add_block  blockType='NodeRenderGraphInputBlock'  blockName='Objects'",
                        "   additionalConstructionParameters=[33554432] ← ObjectList",
                        "6. add_block  blockType='NodeRenderGraphClearBlock'  blockName='Clear'",
                        "7. add_block  blockType='NodeRenderGraphObjectRendererBlock'  blockName='Renderer'",
                        "8. add_block  blockType='NodeRenderGraphOutputBlock'  blockName='Output'",
                        "",
                        "Connections:",
                        "9.  connect  BackBuffer.output → Clear.target",
                        "10. connect  Clear.output → Renderer.texture",
                        "11. connect  DepthBuffer.output → Renderer.textureDepth",
                        "12. connect  MainCamera.output → Renderer.camera",
                        "13. connect  Objects.output → Renderer.objects",
                        "14. connect  Renderer.texture → Output.texture",
                        "",
                        "15. validate_graph",
                        "16. export_graph_json",
                        "17. Optionally: pass the JSON to the Scene MCP `attach_node_render_graph` tool.",
                    ].join("\n"),
                },
            },
        ],
    })
);

server.registerPrompt(
    "post-process-pipeline",
    {
        description: "Step-by-step instructions for building a render graph with Bloom and FXAA post-processes.",
    },
    () => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: [
                        "Build a render graph: clear → render objects → Bloom → FXAA → output.",
                        "",
                        "1. create_render_graph  name='BloomFxaaPipeline'",
                        "2-5. Add InputBlocks for BackBuffer, DepthBuffer, MainCamera, Objects (same types as basic-render-graph).",
                        "6. add_block  NodeRenderGraphClearBlock  'Clear'",
                        "7. add_block  NodeRenderGraphObjectRendererBlock  'Renderer'",
                        "8. add_block  NodeRenderGraphBloomPostProcessBlock  'Bloom'",
                        "   additionalConstructionParameters=[false, 0.5]   ← hdr=false, bloomScale=0.5",
                        "9. add_block  NodeRenderGraphFXAAPostProcessBlock  'FXAA'",
                        "10. add_block NodeRenderGraphOutputBlock  'Output'",
                        "",
                        "Connections:",
                        "11. BackBuffer.output → Clear.target",
                        "12. Clear.output → Renderer.texture",
                        "13. DepthBuffer.output → Renderer.textureDepth",
                        "14. MainCamera.output → Renderer.camera",
                        "15. Objects.output → Renderer.objects",
                        "16. Renderer.texture → Bloom.source",
                        "17. MainCamera.output → Bloom.camera",
                        "18. Bloom.output → FXAA.source",
                        "19. MainCamera.output → FXAA.camera",
                        "20. FXAA.output → Output.texture",
                        "",
                        "21. validate_graph",
                        "22. export_graph_json",
                    ].join("\n"),
                },
            },
        ],
    })
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Graph lifecycle ──────────────────────────────────────────────────────

server.registerTool(
    "create_render_graph",
    {
        description: "Create a new empty Node Render Graph in memory. This is always the first step.",
        inputSchema: {
            name: z.string().describe("Unique name for the render graph (e.g. 'BloomPipeline', 'DeferredRenderer')"),
            comment: z.string().optional().describe("Optional description of what this pipeline does"),
        },
    },
    async ({ name, comment }) => {
        try {
            manager.create(name, comment);
            const port = await sessionController.startAsync(manager);
            const sessionId = sessionController.createSession(name);
            const sessionUrl = sessionController.getSessionUrl(sessionId, port);
            return {
                content: [
                    {
                        type: "text",
                        text: [
                            `Created render graph "${name}".`,
                            "",
                            "Next steps:",
                            "  1. Add InputBlocks for textures, camera, object list (add_block)",
                            "  2. Add rendering/post-process/layer blocks (add_block)",
                            "  3. Add NodeRenderGraphOutputBlock (add_block)",
                            "  4. Wire them together (connect_blocks)",
                            "  5. Validate (validate_graph) and export (export_graph_json)",
                            "",
                            `MCP Session URL: ${sessionUrl}`,
                            "",
                            "Tip: read nrg://concepts for a full overview and nrg://block-catalog for all block types.",
                        ].join("\n"),
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "get_session_url",
    {
        description: "Get or create a live-session URL for a render graph. The URL can be pasted into the Node Render Graph Editor MCP session panel.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
        },
    },
    async ({ graphName }) => {
        const renderGraphs = manager.list();
        if (!renderGraphs.includes(graphName)) {
            return CreateErrorResponse(`Render graph "${graphName}" not found.`);
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(graphName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(`MCP Session URL: ${sessionUrl}`);
    }
);

server.registerTool(
    "start_session",
    {
        description: "Start a live session for an existing render graph. If a session already exists for this render graph, returns the existing URL.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
        },
    },
    async ({ graphName }) => {
        const renderGraphs = manager.list();
        if (!renderGraphs.includes(graphName)) {
            return CreateErrorResponse(`Render graph "${graphName}" not found.`);
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(graphName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(`MCP Session URL: ${sessionUrl}`);
    }
);

server.registerTool(
    "close_session",
    {
        description: "Close a live session for a render graph. Disconnects all SSE subscribers in the editor and removes the session. The render graph itself is NOT deleted.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph whose session to close"),
        },
    },
    async ({ graphName }) => {
        const closed = sessionController.closeSessionForName(graphName);
        if (!closed) {
            return CreateTextResponse(`No active session for "${graphName}".`);
        }
        return CreateTextResponse(`Session for "${graphName}" closed. The editor will disconnect.`);
    }
);

server.registerTool(
    "stop_session_server",
    {
        description: "Stop the live MCP editor session server started by this MCP process. This closes all active sessions, disconnects editors, and releases the port.",
    },
    async () => {
        await sessionController.stopAsync();
        return CreateTextResponse("MCP session server stopped. Any connected editors have been disconnected.");
    }
);

server.registerTool(
    "delete_render_graph",
    {
        description: "Delete a render graph from memory.",
        inputSchema: {
            name: z.string().describe("Name of the render graph to delete"),
        },
    },
    async ({ name }) => {
        try {
            sessionController.closeSessionForName(name);
            manager.delete(name);
            return { content: [{ type: "text", text: `Deleted render graph "${name}".` }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool("clear_all", { description: "Remove all render graphs from memory, resetting the server to a clean state." }, async () => {
    const names = manager.list();
    for (const name of names) {
        sessionController.closeSessionForName(name);
    }
    manager.clearAll();
    return {
        content: [{ type: "text", text: names.length > 0 ? `Cleared ${names.length} render graph(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty." }],
    };
});

server.registerTool("list_render_graphs", { description: "List all render graphs currently in memory." }, async () => {
    const names = manager.list();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Render graphs in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No render graphs in memory.",
            },
        ],
    };
});

// ── Block operations ─────────────────────────────────────────────────────

server.registerTool(
    "add_block",
    {
        description: [
            "Add a block to a render graph. Returns the block's unique id, which you pass to connect_blocks.",
            "",
            "IMPORTANT for NodeRenderGraphInputBlock:",
            "  You MUST supply additionalConstructionParameters=[<typeValue>] where <typeValue> is the",
            "  integer connection-point type from nrg://enums. For example:",
            "  • Back-buffer colour:        [2]  (TextureBackBuffer)",
            "  • Off-screen texture:        [1]  (Texture)",
            "  • Depth/stencil attachment:  [8]  (TextureDepthStencilAttachment)",
            "  • Back-buffer depth:         [4]  (TextureBackBufferDepthStencilAttachment)",
            "  • Camera:                    [16777216]",
            "  • Object list:               [33554432]",
            "  • Shadow light:              [4194304]",
        ].join("\n"),
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            blockType: z
                .string()
                .describe(
                    "Block class name WITHOUT the 'BABYLON.' prefix " +
                        "(e.g. 'NodeRenderGraphInputBlock', 'NodeRenderGraphClearBlock', " +
                        "'NodeRenderGraphObjectRendererBlock', 'NodeRenderGraphBloomPostProcessBlock', " +
                        "'NodeRenderGraphOutputBlock'). Use list_block_types for the full catalog."
                ),
            blockName: z.string().optional().describe("Human-friendly label for this block (defaults to blockType)"),
            additionalConstructionParameters: z
                .array(z.unknown())
                .optional()
                .describe(
                    "Constructor arguments beyond (name, frameGraph, scene). Required for NodeRenderGraphInputBlock " +
                        "and several post-process blocks. See nrg://enums for values and details."
                ),
        },
    },
    async ({ graphName, blockType, blockName, additionalConstructionParameters }) => {
        try {
            const block = manager.addBlock(graphName, blockType, blockName, additionalConstructionParameters as unknown[] | undefined);
            _notifyIfSession(graphName);
            return {
                content: [
                    {
                        type: "text",
                        text: [
                            `Added block id=${block.id}  name="${block.name}"  type=${blockType}`,
                            `Inputs:  ${block.inputs.map((i) => i.name).join(", ") || "(none)"}`,
                            `Outputs: ${block.outputs.map((o) => o.name).join(", ") || "(none)"}`,
                            "",
                            `Use id ${block.id} in connect_blocks / disconnect_input / set_block_properties.`,
                        ].join("\n"),
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "add_blocks_batch",
    {
        description: "Add multiple blocks in one call. More efficient than repeated add_block calls. Returns all created block ids.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            blocks: z
                .array(
                    z.object({
                        blockType: z.string().describe("Block class name (without 'BABYLON.' prefix)"),
                        blockName: z.string().optional().describe("Human-friendly label"),
                        additionalConstructionParameters: z.array(z.unknown()).optional().describe("Constructor args (required for InputBlock and some post-processes)"),
                    })
                )
                .describe("List of blocks to add"),
        },
    },
    async ({ graphName, blocks }) => {
        try {
            const results = manager.addBlocksBatch(graphName, blocks as Array<{ blockType: string; blockName?: string; additionalConstructionParameters?: unknown[] }>);
            _notifyIfSession(graphName);
            const lines = results.map(
                (b) =>
                    `  id=${b.id}  "${b.name}"  (${b.customType.replace("BABYLON.", "")})  inputs=[${b.inputs.map((i) => i.name).join(", ")}]  outputs=[${b.outputs.map((o) => o.name).join(", ")}]`
            );
            return {
                content: [
                    {
                        type: "text",
                        text: `Added ${results.length} blocks:\n${lines.join("\n")}`,
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "remove_block",
    {
        description: "Remove a block and all its connections from a render graph.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            blockId: z.number().describe("Block id (from add_block or describe_graph output)"),
        },
    },
    async ({ graphName, blockId }) => {
        try {
            manager.removeBlock(graphName, blockId);
            _notifyIfSession(graphName);
            return { content: [{ type: "text", text: `Removed block id=${blockId} and all its connections.` }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ── Connection operations ─────────────────────────────────────────────────

server.registerTool(
    "connect_blocks",
    {
        description: [
            "Connect an output port of one block to an input port of another block.",
            "",
            "How to read port names:",
            "  • Call describe_block or describe_graph to see each block's exact input and output port names.",
            "  • Call get_block_type_info to see the canonical port names defined in the catalog.",
            "",
            "Common connections:",
            "  InputBlock(BackBuffer).output → ClearBlock.target",
            "  ClearBlock.output → ObjectRendererBlock.texture",
            "  ObjectRendererBlock.texture → BloomBlock.source",
            "  BloomBlock.output → OutputBlock.texture",
        ].join("\n"),
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            sourceBlockId: z.number().describe("Id of the block providing the output value"),
            sourcePortName: z.string().describe("Output port name on the source block (e.g. 'output', 'texture')"),
            targetBlockId: z.number().describe("Id of the block receiving the input"),
            targetPortName: z.string().describe("Input port name on the target block (e.g. 'target', 'source', 'camera', 'objects')"),
        },
    },
    async ({ graphName, sourceBlockId, sourcePortName, targetBlockId, targetPortName }) => {
        try {
            manager.connect(graphName, sourceBlockId, sourcePortName, targetBlockId, targetPortName);
            _notifyIfSession(graphName);
            return {
                content: [
                    {
                        type: "text",
                        text: `Connected: block[${sourceBlockId}].${sourcePortName} → block[${targetBlockId}].${targetPortName}`,
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "connect_blocks_batch",
    {
        description: "Connect multiple block pairs in one call. More efficient than repeated connect_blocks calls.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number().describe("Id of the source block"),
                        sourcePortName: z.string().describe("Output port name on the source block"),
                        targetBlockId: z.number().describe("Id of the target block"),
                        targetPortName: z.string().describe("Input port name on the target block"),
                    })
                )
                .describe("List of connections to create"),
        },
    },
    async ({ graphName, connections }) => {
        try {
            manager.connectBatch(graphName, connections);
            _notifyIfSession(graphName);
            const lines = connections.map((c) => `  block[${c.sourceBlockId}].${c.sourcePortName} → block[${c.targetBlockId}].${c.targetPortName}`);
            return {
                content: [{ type: "text", text: `Created ${connections.length} connections:\n${lines.join("\n")}` }],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "disconnect_input",
    {
        description: "Remove a connection from an input port of a block.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            blockId: z.number().describe("Id of the block whose input should be disconnected"),
            inputPortName: z.string().describe("Name of the input port to disconnect"),
        },
    },
    async ({ graphName, blockId, inputPortName }) => {
        try {
            manager.disconnectInput(graphName, blockId, inputPortName);
            _notifyIfSession(graphName);
            return { content: [{ type: "text", text: `Disconnected input "${inputPortName}" on block id=${blockId}.` }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ── Properties ────────────────────────────────────────────────────────────

server.registerTool(
    "set_block_properties",
    {
        description: [
            "Set one or more properties on a block, such as custom colours, threshold values,",
            "intensity multipliers, or constructor parameters.",
            "",
            "Properties become top-level keys in the block serialisation, which is how",
            "Babylon.js reads them back at deserialization time.",
            "",
            "Special key:",
            "  `additionalConstructionParameters` (array) — replaces the constructor args.",
            "    Use this to change an InputBlock's texture type after it was added.",
            "",
            "Examples:",
            "  ClearBlock:             { clearColor: {r:0,g:0,b:0,a:1}, clearDepth: true }",
            "  BloomBlock:             { threshold: 0.8, weight: 0.7 }",
            "  TaaBlock:               { additionalConstructionParameters: [16, 0.9] }",
            "  GlowLayerBlock:         { intensity: 1.5, blurKernelSize: 64 }",
        ].join("\n"),
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            blockId: z.number().describe("Id of the block to update"),
            properties: z.record(z.string(), z.unknown()).describe("Key-value properties to set on the block"),
        },
    },
    async ({ graphName, blockId, properties }) => {
        try {
            manager.setBlockProperties(graphName, blockId, properties);
            _notifyIfSession(graphName);
            const keys = Object.keys(properties);
            return { content: [{ type: "text", text: `Updated block id=${blockId}: ${keys.join(", ")}` }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ── Describe / inspect ────────────────────────────────────────────────────

server.registerTool(
    "describe_block",
    {
        description: "Get a detailed description of a single block: its ports, connections, and properties.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
            blockId: z.number().describe("Block id to describe"),
        },
    },
    async ({ graphName, blockId }) => {
        try {
            const text = manager.describeBlock(graphName, blockId);
            return { content: [{ type: "text", text }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "describe_graph",
    {
        description: "Get a full human-readable overview of a render graph: all blocks, connections, and properties.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph"),
        },
    },
    async ({ graphName }) => {
        try {
            const text = manager.describeGraph(graphName);
            return { content: [{ type: "text", text }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ── Validation ────────────────────────────────────────────────────────────

server.registerTool(
    "validate_graph",
    {
        description: [
            "Validate a render graph, checking for common issues:",
            "  • Missing NodeRenderGraphOutputBlock",
            "  • OutputBlock.texture not connected",
            "  • Required inputs left unconnected",
            "  • Dangling references to deleted blocks",
            "  • InputBlocks missing additionalConstructionParameters",
            "",
            "Always call this before export_graph_json.",
        ].join("\n"),
        inputSchema: {
            graphName: z.string().describe("Name of the render graph to validate"),
        },
    },
    async ({ graphName }) => {
        try {
            const { valid, messages } = manager.validate(graphName);
            const header = valid ? `Graph "${graphName}" is valid.` : `Graph "${graphName}" has issues:`;
            const body = messages.length > 0 ? "\n\n" + messages.map((m) => `  • ${m}`).join("\n") : "";
            return { content: [{ type: "text", text: header + body }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ── Export / Import ───────────────────────────────────────────────────────

server.registerTool(
    "export_graph_json",
    {
        description: [
            "Export a render graph as NRGE-compatible JSON string.",
            "",
            "The returned JSON can be:",
            "  • Loaded by Babylon.js via `NodeRenderGraph.ParseAsync(json, scene)`",
            "  • Passed to the Scene MCP server's `attach_node_render_graph` tool",
            "",
            "Always call validate_graph before exporting to catch issues early.",
            "",
            "When outputFile is provided, the JSON is written to disk and only the",
            "file path is returned (avoids large JSON payloads in the conversation context).",
        ].join("\n"),
        inputSchema: {
            graphName: z.string().describe("Name of the render graph to export"),
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ graphName, outputFile }) => {
        try {
            const json = manager.exportJson(graphName);
            if (outputFile) {
                try {
                    WriteTextFileEnsuringDirectory(outputFile, json);
                    return { content: [{ type: "text", text: `NRG JSON written to: ${outputFile}` }] };
                } catch (e) {
                    return { content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }], isError: true };
                }
            }
            return { content: [{ type: "text", text: json }] };
        } catch (e) {
            return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
        }
    }
);

server.registerTool(
    "import_graph_json",
    {
        description: [
            "Import a render graph from an existing NRGE-compatible JSON string.",
            "Useful for editing a previously exported or hand-authored graph.",
            "",
            "The graph is stored under `graphName` (overrides the JSON's internal name).",
            "Blocks from the imported graph can then be modified with set_block_properties,",
            "connect_blocks, etc.",
            "",
            "Provide either the inline json string OR a jsonFile path (not both).",
        ].join("\n"),
        inputSchema: {
            graphName: z.string().describe("Name to assign to the imported graph in memory"),
            json: CreateInlineJsonSchema(z, "NRGE-compatible JSON string (output of export_graph_json or NodeRenderGraph.serialize())"),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a file containing the NRGE JSON to import (alternative to inline json)"),
            overwrite: CreateOverwriteSchema(z),
        },
    },
    async ({ graphName, json, jsonFile, overwrite }) => {
        return CreateJsonImportSummaryResponse({
            json,
            jsonFile,
            fileDescription: "NRGE JSON file",
            importJson: (jsonText: string) => _importGraphJson(graphName, jsonText, overwrite ?? false),
            createSuccessText: (graph: { blocks: unknown[]; outputNodeId?: number | null }) =>
                [
                    `Imported render graph "${graphName}" with ${graph.blocks.length} blocks.`,
                    `outputNodeId: ${graph.outputNodeId ?? "(not set)"}`,
                    "",
                    "Call describe_graph to inspect the imported structure.",
                ].join("\n"),
        });
    }
);

server.registerTool(
    "import_from_snippet",
    {
        description:
            "Import a Node Render Graph from the Babylon.js Snippet Server by its snippet ID. " +
            "The snippet is fetched, validated as a nodeRenderGraph type, and loaded into memory for editing. " +
            'Snippet IDs look like "ABC123" or "ABC123#2" (with revision).',
        inputSchema: {
            graphName: z.string().describe("Name to assign to the imported graph in memory"),
            snippetId: CreateSnippetIdSchema(z),
            overwrite: CreateOverwriteSchema(z),
        },
    },
    async ({ graphName, snippetId, overwrite }) => {
        return await RunSnippetResponse({
            snippetId,
            loadSnippet: async (requestedSnippetId: string) => (await LoadSnippet(requestedSnippetId)) as IDataSnippetResult,
            createResponse: (snippetResult: IDataSnippetResult) =>
                CreateTypedSnippetImportSummaryResponse({
                    snippetId,
                    snippetResult,
                    expectedType: "nodeRenderGraph",
                    importJson: (jsonText: string) => _importGraphJson(graphName, jsonText, overwrite ?? false),
                    createSuccessText: (graph: { blocks: unknown[]; outputNodeId?: number | null }) =>
                        [
                            `Imported snippet "${snippetId}" as render graph "${graphName}" with ${graph.blocks.length} blocks.`,
                            `outputNodeId: ${graph.outputNodeId ?? "(not set)"}`,
                            "",
                            "Call describe_graph to inspect the imported structure.",
                        ].join("\n"),
                }),
        });
    }
);

// ── Block catalog queries ─────────────────────────────────────────────────

server.registerTool("list_block_types", { description: "List all available NRG block types, grouped by category." }, async () => {
    return { content: [{ type: "text", text: GetBlockCatalogSummary() }] };
});

server.registerTool(
    "get_block_type_info",
    {
        description: "Get detailed information about a specific NRG block type: its input/output ports, optional flags, and required additionalConstructionParameters.",
        inputSchema: {
            blockType: z.string().describe("Block class name WITHOUT the 'BABYLON.' prefix (e.g. 'NodeRenderGraphBloomPostProcessBlock')"),
        },
    },
    async ({ blockType }) => {
        const info = BlockRegistry[blockType];
        if (!info) {
            const needle = blockType.toLowerCase().replace("noderendergraph", "");
            const similar = Object.keys(BlockRegistry)
                .filter((k) => k.toLowerCase().includes(needle))
                .slice(0, 5);
            const hint = similar.length > 0 ? `\n\nDid you mean one of: ${similar.join(", ")}?` : "\n\nUse list_block_types to browse the full catalog.";
            return { content: [{ type: "text", text: `Block type "${blockType}" not found.${hint}` }], isError: true };
        }
        return { content: [{ type: "text", text: GetBlockTypeDetails(blockType) }] };
    }
);

// ── Snippet server ──────────────────────────────────────────────────────

server.registerTool(
    "save_snippet",
    {
        description:
            "Save the render graph to the Babylon.js Snippet Server and return the snippet ID and version. " +
            "The snippet can later be loaded in the Node Render Graph Editor via its snippet ID, or fetched with import_from_snippet. " +
            "To create a new revision of an existing snippet, pass the previous snippetId.",
        inputSchema: {
            graphName: z.string().describe("Name of the render graph to save"),
            snippetId: z.string().optional().describe('Optional existing snippet ID to create a new revision of (e.g. "ABC123" or "ABC123#1")'),
            name: z.string().optional().describe("Optional human-readable title for the snippet"),
            description: z.string().optional().describe("Optional description"),
            tags: z.string().optional().describe("Optional comma-separated tags"),
        },
    },
    async ({ graphName, snippetId, name, description, tags }) => {
        const json = manager.exportJson(graphName);
        if (!json) {
            return { content: [{ type: "text", text: `Render graph "${graphName}" not found.` }], isError: true };
        }
        try {
            const result = await SaveSnippet(
                { type: "nodeRenderGraph", data: ParseJsonText({ jsonText: json, jsonLabel: "NRG JSON" }) },
                { snippetId, metadata: { name, description, tags } }
            );
            return {
                content: [
                    {
                        type: "text",
                        text: `Saved render graph "${graphName}" to snippet server.\n\nSnippet ID: ${result.id}\nVersion: ${result.version}\nFull ID: ${result.snippetId}\n\nLoad in NRGE editor: https://nrge.babylonjs.com/#${result.snippetId}`,
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error saving snippet: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start
// ═══════════════════════════════════════════════════════════════════════════

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("babylonjs-node-render-graph MCP server running on stdio");

const _shutdown = () => {
    void sessionController.stopAsync();
    process.exit(0);
};
process.on("SIGINT", _shutdown);
process.on("SIGTERM", _shutdown);
