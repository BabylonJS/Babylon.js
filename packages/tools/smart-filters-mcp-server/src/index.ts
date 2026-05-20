#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Smart Filters MCP Server (babylonjs-smart-filters)
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Smart Filter graphs programmatically.  An AI agent (or any MCP client) can:
 *
 *   • Create / manage Smart Filter graphs
 *   • Add blocks from the Smart Filters block catalog
 *   • Connect blocks together
 *   • Set block properties
 *   • Validate the graph
 *   • Export the final Smart Filter JSON (loadable by the Smart Filters editor/runtime)
 *   • Import existing Smart Filter JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio  (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import {
    CreateErrorResponse,
    CreateInlineJsonSchema,
    CreateJsonFileSchema,
    CreateJsonImportResponse,
    CreateOutputFileSchema,
    CreateTextResponse,
    McpEditorSessionController,
    WriteTextFileEnsuringDirectory,
} from "@tools/mcp-server-core";

import { BlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { SmartFiltersGraphManager } from "./smartFiltersGraph.js";

// ─── Singleton graph manager ──────────────────────────────────────────────
const manager = new SmartFiltersGraphManager();
const sessionController = new McpEditorSessionController<SmartFiltersGraphManager>(
    {
        serverName: "Smart Filters MCP Session Server",
        documentKind: "smart-filter",
        managerUnavailableMessage: "Smart Filters graph manager is not available",
        getDocument: (manager, session) => manager.exportJSON(session.name),
        setDocument: (manager, session, document) => {
            const result = manager.importJSON(session.name, document);
            return result && result !== "OK" ? result : undefined;
        },
    },
    {
        defaultPort: 3001,
        statusTitle: "Smart Filters MCP Session Server",
    }
);

/**
 * Notify SSE subscribers if a session exists for the given Smart Filter graph.
 * @param graphName - The graph name to check for active sessions.
 */
function _notifyIfSession(graphName: string): void {
    const sessionId = sessionController.getSessionIdForName(graphName);
    if (sessionId) {
        sessionController.notifySessionUpdate(sessionId);
    }
}

/**
 * Import Smart Filter JSON and notify a matching live session on success.
 * @param graphName - The graph name to import into.
 * @param jsonText - Serialized Smart Filter JSON.
 * @returns "OK" on success, or an error string.
 */
function _importFilterGraphJson(graphName: string, jsonText: string): string {
    const result = manager.importJSON(graphName, jsonText);
    if (result === "OK") {
        _notifyIfSession(graphName);
    }
    return result;
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-smart-filters",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build Babylon.js Smart Filter graphs (post-processing effect chains).",
            "Workflow: create_filter_graph → add_block (input blocks for textures/values, then effect blocks) → connect_blocks → set_block_properties → validate_graph → export_filter_graph_json.",
            "Every graph auto-creates an OutputBlock. Connect your final effect block's output to the OutputBlock's input.",
            "Smart Filters are Texture-in, Texture-out chains. Most effect blocks have a 'input' (Texture) and 'output' (Texture).",
            "Use get_block_type_info to discover ports before connecting.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("block-catalog", "smart-filters://block-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Smart Filters Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.registerResource("enums", "smart-filters://enums", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Smart Filters Enumerations Reference",
                "",
                "## ConnectionPointType",
                "Float (1), Texture (2), Color3 (3), Color4 (4), Boolean (5), Vector2 (6)",
                "",
                "## CompositionBlock.alphaMode",
                "ALPHA_DISABLE (0), ALPHA_ADD (1), ALPHA_COMBINE (2), ALPHA_SUBTRACT (3), ALPHA_MULTIPLY (4)",
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "smart-filters://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Smart Filters Concepts",
                "",
                "## What is a Smart Filter?",
                "A Smart Filter is a visual, graph-based post-processing effect chain in Babylon.js.",
                "Instead of writing shader code, you connect typed blocks that represent image processing",
                "operations. The graph evaluates at runtime to produce a final output texture.",
                "",
                "## Graph Structure",
                "Every Smart Filter graph has an OutputBlock (auto-created) that receives the final processed texture.",
                "You build a chain: Input textures → Effect blocks → OutputBlock.",
                "",
                "## Data Flow: Texture In, Texture Out",
                "Most effect blocks take a Texture input and produce a Texture output.",
                "Some blocks also accept Float, Color3, or other parameters to control the effect.",
                "",
                "## Input Blocks",
                "Input blocks provide values to the graph:",
                "  • Texture — a source image/video",
                "  • Float — a numeric parameter (intensity, amount, etc.)",
                "  • Color3 — an RGB color",
                "  • Color4 — an RGBA color",
                "  • Vector2 — a 2D vector",
                "  • Boolean — a toggle",
                "",
                "## Effect Blocks",
                "Process textures: BlackAndWhite, Blur, Contrast, Desaturate, Exposure, GreenScreen,",
                "Kaleidoscope, Mask, Pixelate, Posterize, Spritesheet, Composition, Tint, DirectionalBlur.",
                "",
                "## Transition Blocks",
                "Blend between textures: Wipe.",
                "",
                "## Utility Blocks",
                "Helper operations: PremultiplyAlpha.",
                "",
                "## The Simplest Smart Filter",
                "```",
                "Texture input → BlackAndWhiteBlock.input → BlackAndWhiteBlock.output → OutputBlock.input",
                "```",
                "",
                "## Common Mistakes",
                "1. Not connecting to OutputBlock — the filter produces no output",
                "2. Connecting incompatible types (e.g. Float to Texture input)",
                "3. Creating cycles in the graph",
                "4. Input blocks (Float, Color3, etc.) have output ports named 'output' — not 'value'",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("create-basic-filter", { description: "Step-by-step instructions for building a simple black and white filter" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a simple black and white Smart Filter. Steps:",
                    "1. create_filter_graph with name 'BasicBW'",
                    "2. Add a Texture input block named 'source'",
                    "3. Add a BlackAndWhiteBlock named 'bw'",
                    "4. Connect source.output → bw.input",
                    "5. Connect bw.output → outputBlock.input (OutputBlock has uniqueId 1)",
                    "6. validate_graph, then export_filter_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-blur-filter", { description: "Step-by-step instructions for building a blur filter with adjustable intensity" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a blur Smart Filter with adjustable blur size. Steps:",
                    "1. create_filter_graph with name 'AdjustableBlur'",
                    "2. Add a Texture input block named 'source'",
                    "3. Add a BlurBlock named 'blur' with properties { blurSize: 4 }",
                    "4. Connect source.output → blur.input",
                    "5. Connect blur.output → outputBlock.input (OutputBlock has uniqueId 1)",
                    "6. validate_graph, then export_filter_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-tinted-desaturate", { description: "Step-by-step instructions for combining desaturate with a color tint" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a Smart Filter that desaturates then tints the image. Steps:",
                    "1. create_filter_graph with name 'TintedDesaturate'",
                    "2. Add a Texture input block named 'source'",
                    "3. Add a Float input block named 'desatAmount' with properties { value: 0.7 }",
                    "4. Add a DesaturateBlock named 'desat'",
                    "5. Connect source.output → desat.input",
                    "6. Connect desatAmount.output → desat.intensity",
                    "7. Add a Color3 input block named 'tintColor' with properties { value: { r: 0.8, g: 0.6, b: 0.4 } }",
                    "8. Add a Float input block named 'tintAmount' with properties { value: 0.3 }",
                    "9. Add a TintBlock named 'tint'",
                    "10. Connect desat.output → tint.input",
                    "11. Connect tintColor.output → tint.tint",
                    "12. Connect tintAmount.output → tint.amount",
                    "13. Connect tint.output → outputBlock.input (OutputBlock has uniqueId 1)",
                    "14. validate_graph, then export_filter_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Graph lifecycle ─────────────────────────────────────────────────────

server.registerTool(
    "create_filter_graph",
    {
        description:
            "Create a new empty Smart Filter graph in memory. This is always the first step. " +
            "An OutputBlock (uniqueId=1) is automatically created — connect your final effect to it.",
        inputSchema: {
            name: z.string().describe("Unique name for the filter graph (e.g. 'MyBlurFilter', 'GreenScreenEffect')"),
            comments: z.string().optional().describe("Optional description of what this filter does"),
        },
    },
    async ({ name, comments }) => {
        manager.createGraph(name, comments);
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(name);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(
            `Created Smart Filter graph "${name}" with OutputBlock [1]. Add blocks with add_block, connect with connect_blocks, then export with export_filter_graph_json.\n\nMCP Session URL: ${sessionUrl}`
        );
    }
);

server.registerTool(
    "list_filter_graphs",
    {
        description: "List all Smart Filter graphs currently in memory.",
    },
    async () => {
        const names = manager.listGraphs();
        return {
            content: [
                {
                    type: "text",
                    text: names.length > 0 ? `Filter graphs in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No filter graphs in memory.",
                },
            ],
        };
    }
);

server.registerTool(
    "delete_filter_graph",
    {
        description: "Delete a Smart Filter graph from memory.",
        inputSchema: {
            name: z.string().describe("Name of the filter graph to delete"),
        },
    },
    async ({ name }) => {
        const ok = manager.deleteGraph(name);
        if (ok) {
            sessionController.closeSessionForName(name);
        }
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Filter graph "${name}" not found.` }],
        };
    }
);

server.registerTool(
    "clone_filter_graph",
    {
        description: "Clone an existing Smart Filter graph under a new name.",
        inputSchema: {
            sourceName: z.string().describe("Name of the filter graph to clone"),
            targetName: z.string().describe("New name for the cloned graph"),
        },
    },
    async ({ sourceName, targetName }) => {
        const result = manager.cloneGraph(sourceName, targetName);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        _notifyIfSession(targetName);
        return {
            content: [{ type: "text", text: `Cloned "${sourceName}" → "${targetName}" (${result.blocks.length} blocks, ${result.connections.length} connections).` }],
        };
    }
);

server.registerTool(
    "clear_all",
    {
        description: "Remove all Smart Filter graphs from memory, resetting the server to a clean state.",
    },
    async () => {
        const names = manager.listGraphs();
        manager.clearAll();
        for (const name of names) {
            sessionController.closeSessionForName(name);
        }
        return {
            content: [
                {
                    type: "text",
                    text: names.length > 0 ? `Cleared ${names.length} filter graph(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty.",
                },
            ],
        };
    }
);

server.registerTool(
    "get_session_url",
    {
        description: "Get or create a live-session URL for a Smart Filter graph. The URL can be pasted into the Smart Filters Editor MCP session panel.",
        inputSchema: {
            graphName: z.string().describe("Name of the Smart Filter graph"),
        },
    },
    async ({ graphName }) => {
        const graphs = manager.listGraphs();
        if (!graphs.includes(graphName)) {
            return CreateErrorResponse(`Filter graph "${graphName}" not found.`);
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
        description: "Start a live editor session for a Smart Filter graph and return its URL.",
        inputSchema: {
            graphName: z.string().describe("Name of the Smart Filter graph"),
        },
    },
    async ({ graphName }) => {
        const graphs = manager.listGraphs();
        if (!graphs.includes(graphName)) {
            return CreateErrorResponse(`Filter graph "${graphName}" not found.`);
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(graphName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(`Started Smart Filters editor session for "${graphName}".\n\nMCP Session URL: ${sessionUrl}`);
    }
);

server.registerTool(
    "close_session",
    {
        description: "Close the live editor session for a Smart Filter graph.",
        inputSchema: {
            graphName: z.string().describe("Name of the Smart Filter graph"),
        },
    },
    async ({ graphName }) => {
        const closed = sessionController.closeSessionForName(graphName);
        return CreateTextResponse(closed ? `Closed Smart Filters editor session for "${graphName}".` : `No active Smart Filters editor session for "${graphName}".`);
    }
);

server.registerTool("stop_session_server", { description: "Stop the local Smart Filters MCP HTTP/SSE session server and close all active sessions." }, async () => {
    await sessionController.stopAsync();
    return CreateTextResponse("Smart Filters MCP session server stopped.");
});

// ── Block operations ────────────────────────────────────────────────────

server.registerTool(
    "add_block",
    {
        description: "Add a new block to a Smart Filter graph. Returns the block's uniqueId for use in connect_blocks. " + "Do NOT add OutputBlock — it is auto-created.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph to add the block to"),
            blockType: z.string().describe("The block type from the registry (e.g. 'BlackAndWhiteBlock', 'BlurBlock', 'Float', 'Texture'). " + "Use list_block_types to see all."),
            name: z.string().optional().describe("Human-friendly name for this block instance"),
            properties: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Key-value properties. For input blocks: { value: ... }. " +
                        "For BlurBlock: { blurSize: 4, blurTextureRatioPerPass: 0.5 }. " +
                        "For CompositionBlock: { alphaMode: 2 }."
                ),
        },
    },
    async ({ graphName, blockType, name, properties }) => {
        const result = manager.addBlock(graphName, blockType, name, properties as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        _notifyIfSession(graphName);
        const lines = [`Added block [${result.block.uniqueId}] "${result.block.name}" (${blockType}). Use uniqueId ${result.block.uniqueId} to connect it.`];
        if (result.warnings) {
            lines.push("", "Warnings:", ...result.warnings);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

server.registerTool(
    "add_blocks_batch",
    {
        description: "Add multiple blocks at once. More efficient than calling add_block repeatedly.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            blocks: z
                .array(
                    z.object({
                        blockType: z.string().describe("Block type name"),
                        name: z.string().optional().describe("Instance name for the block"),
                        properties: z.record(z.string(), z.unknown()).optional().describe("Block properties"),
                    })
                )
                .describe("Array of blocks to add"),
        },
    },
    async ({ graphName, blocks }) => {
        const results: string[] = [];
        let changed = false;
        for (const blockDef of blocks) {
            const result = manager.addBlock(graphName, blockDef.blockType, blockDef.name, blockDef.properties as Record<string, unknown>);
            if (typeof result === "string") {
                results.push(`Error adding ${blockDef.blockType}: ${result}`);
            } else {
                changed = true;
                let line = `[${result.block.uniqueId}] ${result.block.name} (${blockDef.blockType})`;
                if (result.warnings) {
                    line += `\n  ⚠ ${result.warnings.join("\n  ⚠ ")}`;
                }
                results.push(line);
            }
        }
        if (changed) {
            _notifyIfSession(graphName);
        }
        return { content: [{ type: "text", text: `Added blocks:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "remove_block",
    {
        description: "Remove a block from a Smart Filter graph. Also removes any connections to/from it.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            blockId: z.number().describe("The block uniqueId to remove"),
        },
    },
    async ({ graphName, blockId }) => {
        const result = manager.removeBlock(graphName, blockId);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_block_properties",
    {
        description: "Set or update properties on an existing block. For input blocks, set 'value'. " + "For BlurBlock, set 'blurSize'. For CompositionBlock, set 'alphaMode'.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            blockId: z.number().describe("The block uniqueId to modify"),
            properties: z.record(z.string(), z.unknown()).describe("Key-value properties to set."),
        },
    },
    async ({ graphName, blockId, properties }) => {
        const result = manager.setBlockProperties(graphName, blockId, properties as Record<string, unknown>);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "get_block_properties",
    {
        description: "Get the current properties of a block.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            blockId: z.number().describe("The block uniqueId to inspect"),
        },
    },
    async ({ graphName, blockId }) => {
        const result = manager.getBlockProperties(graphName, blockId);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
);

// ── Connections ──────────────────────────────────────────────────────────

server.registerTool(
    "connect_blocks",
    {
        description: "Connect an output of one block to an input of another block. " + "Data flows from source output → target input. Types must match.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            sourceBlockId: z.number().describe("Block uniqueId to connect FROM (the one with the output)"),
            outputName: z.string().describe("Name of the output on the source block (e.g. 'output')"),
            targetBlockId: z.number().describe("Block uniqueId to connect TO (the one with the input)"),
            inputName: z.string().describe("Name of the input on the target block (e.g. 'input', 'intensity')"),
        },
    },
    async ({ graphName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectBlocks(graphName, sourceBlockId, outputName, targetBlockId, inputName);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Connected [${sourceBlockId}].${outputName} → [${targetBlockId}].${inputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "connect_blocks_batch",
    {
        description: "Connect multiple block pairs at once. More efficient than calling connect_blocks repeatedly.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number(),
                        outputName: z.string(),
                        targetBlockId: z.number(),
                        inputName: z.string(),
                    })
                )
                .describe("Array of connections to make"),
        },
    },
    async ({ graphName, connections }) => {
        const results: string[] = [];
        let changed = false;
        for (const conn of connections) {
            const result = manager.connectBlocks(graphName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            if (result === "OK") {
                changed = true;
                results.push(`[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}`);
            } else {
                results.push(`Error: ${result}`);
            }
        }
        if (changed) {
            _notifyIfSession(graphName);
        }
        return { content: [{ type: "text", text: `Connections:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "disconnect_input",
    {
        description: "Disconnect an input on a block (remove an existing connection).",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            blockId: z.number().describe("The block uniqueId whose input to disconnect"),
            inputName: z.string().describe("Name of the input to disconnect"),
        },
    },
    async ({ graphName, blockId, inputName }) => {
        const result = manager.disconnectInput(graphName, blockId, inputName);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Disconnected [${blockId}].${inputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "list_connections",
    {
        description: "List all connections in a filter graph.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
        },
    },
    async ({ graphName }) => {
        const result = manager.listConnections(graphName);
        return { content: [{ type: "text", text: result }] };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.registerTool(
    "describe_graph",
    {
        description: "Get a human-readable description of the current state of a Smart Filter graph, " + "including all blocks and their connections.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph to describe"),
        },
    },
    async ({ graphName }) => {
        const desc = manager.describeGraph(graphName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "describe_block",
    {
        description: "Get detailed information about a specific block instance in a filter graph.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph"),
            blockId: z.number().describe("The block uniqueId to describe"),
        },
    },
    async ({ graphName, blockId }) => {
        const desc = manager.describeBlock(graphName, blockId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "list_block_types",
    {
        description: "List all available Smart Filter block types, grouped by category.",
        inputSchema: {
            category: z.string().optional().describe("Optionally filter by category (Effects, Transitions, Utilities, Inputs)"),
        },
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(BlockRegistry)
                .filter(([key, info]) => key !== "OutputBlock" && info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key}: ${info.description.split(".")[0]}`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: matching.length > 0 ? `## ${category} Blocks\n${matching}` : `No blocks found in category "${category}".`,
                    },
                ],
            };
        }
        return { content: [{ type: "text", text: GetBlockCatalogSummary() }] };
    }
);

server.registerTool(
    "get_block_type_info",
    {
        description: "Get detailed info about a specific block type — its inputs, outputs, properties, and description.",
        inputSchema: {
            blockType: z.string().describe("The block type name (e.g. 'BlurBlock', 'BlackAndWhiteBlock', 'Float')"),
        },
    },
    async ({ blockType }) => {
        const info = GetBlockTypeDetails(blockType);
        if (!info) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Block type "${blockType}" not found. Use list_block_types to see available types.`,
                    },
                ],
                isError: true,
            };
        }

        const lines: string[] = [];
        lines.push(`## ${blockType}`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Namespace: ${info.namespace}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Inputs:");
        if (info.inputs.length === 0) {
            lines.push("  (none)");
        }
        for (const inp of info.inputs) {
            const opt = inp.isOptional ? " (optional)" : " (required)";
            lines.push(`  • ${inp.name}: ${inp.type}${opt}`);
        }

        lines.push("\n### Outputs:");
        if (info.outputs.length === 0) {
            lines.push("  (none)");
        }
        for (const out of info.outputs) {
            lines.push(`  • ${out.name}: ${out.type}`);
        }

        if (info.properties) {
            lines.push("\n### Configurable Properties:");
            for (const [k, v] of Object.entries(info.properties)) {
                lines.push(`  • ${k}: ${v}`);
            }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

server.registerTool(
    "list_categories",
    {
        description: "List all block categories available in the Smart Filters system.",
    },
    async () => {
        const categories = new Set<string>();
        for (const [key, info] of Object.entries(BlockRegistry)) {
            if (key !== "OutputBlock") {
                categories.add(info.category);
            }
        }
        const lines = Array.from(categories).map((c) => `  • ${c}`);
        return {
            content: [{ type: "text", text: `Block categories:\n${lines.join("\n")}` }],
        };
    }
);

// ── Validation ──────────────────────────────────────────────────────────

server.registerTool(
    "validate_graph",
    {
        description: "Run validation checks on a Smart Filter graph. Reports missing connections, type mismatches, orphan blocks, and more.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph to validate"),
        },
    },
    async ({ graphName }) => {
        const issues = manager.validateGraph(graphName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

server.registerTool(
    "list_issues",
    {
        description: "Same as validate_graph — returns all validation issues for a graph.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph to check"),
        },
    },
    async ({ graphName }) => {
        const issues = manager.validateGraph(graphName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ─────────────────────────────────────────────────────

server.registerTool(
    "export_filter_graph_json",
    {
        description:
            "Export the Smart Filter graph as V1 JSON. This JSON can be loaded in the Babylon.js Smart Filters Editor " +
            "or via SmartFilterDeserializer at runtime. " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph to export"),
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ graphName, outputFile }) => {
        const json = manager.exportJSON(graphName);
        if (!json) {
            return {
                content: [{ type: "text", text: `Filter graph "${graphName}" not found.` }],
                isError: true,
            };
        }
        if (outputFile) {
            try {
                WriteTextFileEnsuringDirectory(outputFile, json);
                return { content: [{ type: "text", text: `Smart Filter JSON written to: ${outputFile}` }] };
            } catch (e) {
                return {
                    content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }],
                    isError: true,
                };
            }
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.registerTool(
    "import_filter_graph_json",
    {
        description: "Import an existing Smart Filter V1 JSON into memory for editing. " + "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            graphName: z.string().describe("Name to give the imported filter graph"),
            json: CreateInlineJsonSchema(z, "The Smart Filter JSON string to import"),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a file containing the Smart Filter JSON (alternative to inline json)"),
        },
    },
    async ({ graphName, json, jsonFile }) => {
        return CreateJsonImportResponse({
            json,
            jsonFile,
            fileDescription: "Smart Filter JSON file",
            importJson: (jsonText: string) => _importFilterGraphJson(graphName, jsonText),
            describeImported: () => manager.describeGraph(graphName),
        });
    }
);

// ── Search helpers ──────────────────────────────────────────────────────

server.registerTool(
    "find_blocks",
    {
        description: "Search for blocks in a filter graph by name, type, or namespace substring.",
        inputSchema: {
            graphName: z.string().describe("Name of the filter graph to search"),
            query: z.string().describe("Search string (matches against block name, type, and namespace)"),
        },
    },
    async ({ graphName, query }) => {
        const result = manager.findBlocks(graphName, query);
        return { content: [{ type: "text", text: result }] };
    }
);

server.registerTool(
    "find_block_types",
    {
        description: "Search block types in the registry by name, category, or description substring.",
        inputSchema: {
            query: z.string().describe("Search string (matches against block type name, category, and description)"),
        },
    },
    async ({ query }) => {
        const q = query.toLowerCase();
        const matches = Object.entries(BlockRegistry)
            .filter(
                ([key, info]) =>
                    key !== "OutputBlock" &&
                    (key.toLowerCase().includes(q) ||
                        info.category.toLowerCase().includes(q) ||
                        info.description.toLowerCase().includes(q) ||
                        info.namespace.toLowerCase().includes(q))
            )
            .map(([key, info]) => `  ${key} (${info.category}): ${info.description.split(".")[0]}`);

        if (matches.length === 0) {
            return {
                content: [{ type: "text", text: `No block types matching "${query}" found.` }],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${matches.length} block type(s) matching "${query}":\n${matches.join("\n")}`,
                },
            ],
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js Smart Filters MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

const _shutdownAsync = async () => {
    await sessionController.stopAsync();
    process.exit(0);
};

process.on("SIGINT", _shutdownAsync);
process.on("SIGTERM", _shutdownAsync);
