#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Node Material MCP Server (babylonjs-node-material)
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Node Materials programmatically.  An AI agent (or any MCP client) can:
 *
 *   • Create / manage material graphs
 *   • Add blocks from the full NME block catalog
 *   • Connect blocks together
 *   • Set block properties (uniform values, system values, etc.)
 *   • Validate the graph
 *   • Export the final material JSON (loadable by NME / NodeMaterial.parseSerializedObject)
 *   • Import existing NME JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio  (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { BlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { MaterialGraphManager } from "./materialGraph.js";
import {
    CreateErrorResponse,
    CreateJsonExportResponse,
    CreateInlineJsonSchema,
    CreateJsonImportResponse,
    CreateJsonFileSchema,
    CreateOutputFileSchema,
    CreateSnippetIdSchema,
    CreateTextResponse,
    CreateTypedSnippetImportResponse,
    McpEditorSessionController,
    ParseJsonText,
    RunSnippetResponse,
} from "@tools/mcp-server-core";
import { LoadSnippet, SaveSnippet, type IDataSnippetResult } from "@tools/snippet-loader";

// ─── Singleton graph manager ──────────────────────────────────────────────
const manager = new MaterialGraphManager();
const sessionController = new McpEditorSessionController<MaterialGraphManager>(
    {
        serverName: "NME MCP Session Server",
        documentKind: "node-material",
        managerUnavailableMessage: "Material manager is not available",
        getDocument: (manager, session) => manager.exportJSON(session.name),
        setDocument: (manager, session, document) => {
            const result = manager.importJSON(session.name, document);
            return result && result !== "OK" ? result : undefined;
        },
    },
    {
        defaultPort: 3001,
        legacyDocumentRoutes: ["material"],
        statusTitle: "NME MCP Session Server",
    }
);

/**
 * Notify SSE subscribers if a session exists for the given material.
 * @param materialName - The material name to check for active sessions.
 */
function _notifyIfSession(materialName: string): void {
    const sid = sessionController.getSessionIdForName(materialName);
    if (sid) {
        sessionController.notifySessionUpdate(sid);
    }
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-node-material",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build Babylon.js Node Materials (shader graphs). Workflow: create_material → add blocks (InputBlock for attributes/uniforms, then processing blocks, then output blocks) → connect ports → validate_material → export_material_json.",
            "Every material needs at minimum: position attribute → TransformBlock → VertexOutputBlock, and a FragmentOutputBlock.",
            "Use get_block_type_info to discover a block's ports before connecting. Enum properties (e.g. TrigonometryBlock.operation) must be set by name (e.g. 'Sin'), not numeric value.",
            "Output JSON can be loaded in the Scene MCP via add_material with type NodeMaterial, or opened in the NME web editor.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("block-catalog", "nme://block-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# NME Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.registerResource("enums", "nme://enums", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# NME Enumerations Reference",
                "",
                "## NodeMaterialModes",
                "Material (0), PostProcess (1), Particle (2), ProceduralTexture (3), GaussianSplatting (4), SFE (5)",
                "",
                "## NodeMaterialBlockConnectionPointTypes",
                "Float (1), Int (2), Vector2 (4), Vector3 (8), Vector4 (16), Color3 (32), Color4 (64), Matrix (128), Object (256), AutoDetect (1073741824)",
                "",
                "## NodeMaterialSystemValues (for InputBlock)",
                "World (1), View (2), Projection (3), ViewProjection (4), WorldView (5), WorldViewProjection (6), CameraPosition (7), FogColor (8), DeltaTime (9), CameraParameters (10), MaterialAlpha (11)",
                "",
                "## Common Attributes (for InputBlock)",
                "position, normal, tangent, uv, uv2, uv3, uv4, uv5, uv6, color, matricesIndices, matricesWeights",
                "",
                "## TrigonometryBlockOperations",
                "Cos, Sin, Abs, Exp, Exp2, Round, Floor, Ceiling, Sqrt, Log, Tan, ArcTan, ArcCos, ArcSin, Fract, Sign, Radians, Degrees",
                "",
                "## ConditionalBlockConditions",
                "Equal, NotEqual, LessThan, GreaterThan, LessOrEqual, GreaterOrEqual, Xor, Or, And",
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "nme://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Node Material Concepts",
                "",
                "## What is a Node Material?",
                "A Node Material is a visual, graph-based shader builder in Babylon.js. Instead of writing",
                "GLSL/HLSL code directly, you connect typed blocks that represent shader operations.",
                "The graph compiles into a GPU shader program at runtime.",
                "",
                "## Graph Structure — Two Required Outputs",
                "Every standard material (mode='Material') MUST have exactly these two output blocks:",
                "  • **VertexOutputBlock** — receives the clip-space position (the final transformed vertex position)",
                "  • **FragmentOutputBlock** — receives the final pixel color (rgb and/or rgba)",
                "Without BOTH, the material will fail to compile.",
                "",
                "## InputBlock — The Most Important Block Type",
                "InputBlock is the source of all data entering the graph. It has three modes:",
                "",
                "### Mode 1: Attribute (mode=1)",
                "Reads per-vertex data from the mesh's vertex buffer.",
                "  • Set `attributeName` to one of: position, normal, tangent, uv, uv2, color, etc.",
                "  • Set `type` to the matching type: Vector3 for position/normal, Vector2 for uv, etc.",
                "  • Example: `{ type: 'Vector3', attributeName: 'position' }`",
                "",
                "### Mode 2: Uniform / Constant (mode=0)",
                "Provides a constant or system-provided value.",
                "  • For **system values**: set `systemValue` (e.g. 'WorldViewProjection', 'World', 'CameraPosition')",
                "    and set `type` to the matching type (Matrix for transforms, Vector3 for CameraPosition).",
                "    Example: `{ type: 'Matrix', systemValue: 'WorldViewProjection' }`",
                "  • For **custom constants**: set `type` and `value`.",
                "    Example: `{ type: 'Color3', value: { r: 0.8, g: 0.2, b: 0.2 } }`",
                "    Example: `{ type: 'Float', value: 0.5 }`",
                "",
                "### ⚠ InputBlock Gotcha",
                "An InputBlock MUST have a `type` property. Without it, the block cannot determine",
                "what kind of data it provides and connections will fail silently.",
                "Additionally, every InputBlock needs at least one of:",
                "  • `attributeName` — for mesh vertex data",
                "  • `systemValue` — for engine-provided values (matrices, camera pos, etc.)",
                "  • `value` — for custom constant values",
                "An InputBlock with none of these is effectively useless.",
                "",
                "## The Minimal Vertex Pipeline",
                "Every material needs to transform vertex positions from object space to clip space:",
                "```",
                "InputBlock(position, attribute, Vector3)",
                "  └→ TransformBlock.vector",
                "InputBlock(worldViewProjection, systemValue, Matrix)",
                "  └→ TransformBlock.transform",
                "TransformBlock.output",
                "  └→ VertexOutputBlock.vector",
                "```",
                "This is the minimum vertex shader — it positions the mesh correctly on screen.",
                "",
                "## The Minimal Fragment Pipeline",
                "At minimum, the fragment output needs an rgb (Color3) or rgba (Color4) color:",
                "```",
                "InputBlock(color, constant, Color3, value={r:1,g:0,b:0})",
                "  └→ FragmentOutputBlock.rgb",
                "```",
                "",
                "## PBR Materials — Additional Requirements",
                "PBRMetallicRoughnessBlock needs several inputs connected:",
                "  • **worldPosition** — from TransformBlock(position × world matrix), NOT the clip-space position",
                "  • **worldNormal** — from TransformBlock(normal × world matrix)",
                "  • **view** — from InputBlock(systemValue: 'View')",
                "  • **cameraPosition** — from InputBlock(systemValue: 'CameraPosition')",
                "  • **baseColor** — Color3 input for the material's base color",
                "  • **metallic** — Float input (0=dielectric, 1=metal)",
                "  • **roughness** — Float input (0=smooth/mirror, 1=rough/matte)",
                "Then connect PBRMetallicRoughnessBlock.lighting → FragmentOutputBlock.rgb",
                "",
                "## Connection Rules",
                "• Connections go from an output of one block to an input of another",
                "• Types must be compatible (Color3→Color3, Float→Float, etc.)",
                "• Some inputs accept AutoDetect and will adapt to whatever is connected",
                "• Use describe_block or get_block_type_info to see available inputs/outputs",
                "",
                "## Common Mistakes",
                "1. Forgetting VertexOutputBlock or FragmentOutputBlock → material won't compile",
                "2. Creating InputBlock without `type` → block is broken",
                "3. Creating InputBlock without value/systemValue/attributeName → useless block",
                "4. Connecting position directly to VertexOutput without TransformBlock → mesh renders at origin",
                "5. Using the wrong transform matrix (World instead of WorldViewProjection for vertex output)",
                "6. Not connecting worldPosition/worldNormal/view/cameraPosition to PBR block → black material",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("create-pbr-material", { description: "Step-by-step instructions for building a basic PBR material" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a basic PBR metallic-roughness material. Steps:",
                    "1. create_material with name 'MyPBR', mode 'Material'",
                    "2. Add InputBlock for 'position' attribute (type Vector3, attributeName 'position')",
                    "3. Add InputBlock for 'normal' attribute (type Vector3, attributeName 'normal')",
                    "4. Add InputBlock for 'worldViewProjection' system value (type Matrix, systemValue 'WorldViewProjection')",
                    "5. Add InputBlock for 'world' system value (type Matrix, systemValue 'World')",
                    "6. Add InputBlock for 'view' system value (type Matrix, systemValue 'View')",
                    "7. Add InputBlock for 'cameraPosition' system value (type Vector3, systemValue 'CameraPosition')",
                    "8. Add TransformBlock named 'worldPos' — connect world → transform, position → vector",
                    "9. Add TransformBlock named 'clipPos' — connect worldViewProjection → transform, position → vector",
                    "10. Add VertexOutputBlock — connect clipPos.output → vector",
                    "11. Add PBRMetallicRoughnessBlock — connect worldPos output → worldPosition, normal → worldNormal, etc.",
                    "12. Add InputBlock for baseColor (type Color3, value {r:0.8, g:0.2, b:0.2})",
                    "13. Add InputBlock for metallic (type Float, value 0.0)",
                    "14. Add InputBlock for roughness (type Float, value 0.5)",
                    "15. Connect baseColor, metallic, roughness to the PBR block",
                    "16. Add FragmentOutputBlock — connect PBR.lighting → rgb",
                    "17. validate_material, then export_material_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-simple-color-material", { description: "Create the simplest possible unlit colored material" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create the simplest unlit material that outputs a solid color. Steps:",
                    "1. create_material 'SimpleColor'",
                    "2. Add InputBlock type Vector3, attributeName 'position', name 'position'",
                    "3. Add InputBlock type Matrix, systemValue 'WorldViewProjection', name 'wvp'",
                    "4. Add TransformBlock name 'transform' — connect wvp→transform, position→vector",
                    "5. Add VertexOutputBlock — connect transform.output→vector",
                    "6. Add InputBlock type Color3, value {r:1, g:0, b:0}, name 'color'",
                    "7. Add FragmentOutputBlock — connect color.output→rgb",
                    "8. validate_material, then export_material_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-textured-material", { description: "Create a PBR material that samples a diffuse texture using UV coordinates" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a PBR material with a diffuse texture. Steps:",
                    "1. create_material 'TexturedPBR'",
                    "2. Add InputBlock type Vector3, attributeName 'position', name 'position'",
                    "3. Add InputBlock type Matrix, systemValue 'WorldViewProjection', name 'wvp'",
                    "4. Add InputBlock type Matrix, systemValue 'World', name 'world'",
                    "5. Add InputBlock type Matrix, systemValue 'View', name 'view'",
                    "6. Add InputBlock type Vector3, systemValue 'CameraPosition', name 'cameraPosition'",
                    "7. Add InputBlock type Vector3, attributeName 'normal', name 'normal'",
                    "8. Add InputBlock type Vector2, attributeName 'uv', name 'uv'",
                    "9. Add TransformBlock 'worldPos' — connect world→transform, position→vector",
                    "10. Add TransformBlock 'clipPos' — connect wvp→transform, position→vector",
                    "11. Add VertexOutputBlock — connect clipPos.output→vector",
                    "12. Add TextureBlock 'diffuseTex'",
                    "13. set_block_properties on diffuseTex: { texture: 'https://playground.babylonjs.com/textures/floor.png' }",
                    "    (A bare URL string is auto-converted to a full texture descriptor on export)",
                    "14. Connect uv.output → diffuseTex.uv",
                    "15. Add PBRMetallicRoughnessBlock 'pbr'",
                    "16. Connect worldPos.output→pbr.worldPosition, normal→pbr.worldNormal, view→pbr.view, cameraPosition→pbr.cameraPosition",
                    "17. Connect diffuseTex.rgb → pbr.baseColor",
                    "18. Add InputBlock type Float, value 0.0, name 'metallic' → pbr.metallic",
                    "19. Add InputBlock type Float, value 0.5, name 'roughness' → pbr.roughness",
                    "20. Add FragmentOutputBlock — connect pbr.lighting→rgb",
                    "21. validate_material, then export_material_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Material lifecycle ─────────────────────────────────────────────────

server.registerTool(
    "create_material",
    {
        description: "Create a new empty Node Material graph in memory. This is always the first step.",
        inputSchema: {
            name: z.string().describe("Unique name for the material (e.g. 'MyPBR', 'GlowEffect')"),
            mode: z
                .enum(["Material", "PostProcess", "Particle", "ProceduralTexture", "GaussianSplatting", "SFE"])
                .default("Material")
                .describe("The material mode. Use 'Material' for standard mesh materials."),
            comment: z.string().optional().describe("An optional description of what this material does"),
        },
    },
    async ({ name, mode, comment }) => {
        manager.createMaterial(name, mode, comment);

        // Auto-create a live session for this material
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(name);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);

        return {
            content: [
                {
                    type: "text",
                    text: `Created material "${name}" (mode: ${mode}). Now add blocks with add_block, connect them with connect_blocks, then export with export_material_json.\n\nMCP Session URL: ${sessionUrl}\nPaste this URL in the Node Material Editor's "Connect to MCP Session" panel to see live updates.`,
                },
            ],
        };
    }
);

server.registerTool(
    "get_session_url",
    {
        description: "Get or create a live-session URL for a material. The URL can be pasted into the Node Material Editor's 'Connect to MCP Session' panel.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
        },
    },
    async ({ materialName }) => {
        // Verify material exists
        const materials = manager.listMaterials();
        if (!materials.includes(materialName)) {
            return { content: [{ type: "text", text: `Material "${materialName}" not found.` }], isError: true };
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(materialName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return {
            content: [
                {
                    type: "text",
                    text: `MCP Session URL: ${sessionUrl}\nPaste this URL in the Node Material Editor's "Connect to MCP Session" panel to see live updates.`,
                },
            ],
        };
    }
);

server.registerTool(
    "start_session",
    {
        description:
            "Start a live session for an existing material. Returns a URL that can be pasted into the Node Material Editor. If a session already exists for this material, returns the existing URL.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
        },
    },
    async ({ materialName }) => {
        const materials = manager.listMaterials();
        if (!materials.includes(materialName)) {
            return { content: [{ type: "text", text: `Material "${materialName}" not found.` }], isError: true };
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(materialName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return {
            content: [
                {
                    type: "text",
                    text: `MCP Session URL: ${sessionUrl}\nPaste this URL in the Node Material Editor's "Connect to MCP Session" panel to see live updates.`,
                },
            ],
        };
    }
);

server.registerTool(
    "close_session",
    {
        description: "Close a live session for a material. Disconnects all SSE subscribers in the editor and removes the session. The material itself is NOT deleted.",
        inputSchema: {
            materialName: z.string().describe("Name of the material whose session to close"),
        },
    },
    async ({ materialName }) => {
        const closed = sessionController.closeSessionForName(materialName);
        if (!closed) {
            return { content: [{ type: "text", text: `No active session for "${materialName}".` }] };
        }
        return { content: [{ type: "text", text: `Session for "${materialName}" closed. The editor will disconnect.` }] };
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
    "delete_material",
    {
        description: "Delete a material graph from memory. Also closes any active session for it.",
        inputSchema: {
            name: z.string().describe("Name of the material to delete"),
        },
    },
    async ({ name }) => {
        sessionController.closeSessionForName(name);
        const ok = manager.deleteMaterial(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Material "${name}" not found.` }],
        };
    }
);

server.registerTool("clear_all", { description: "Remove all material graphs from memory, resetting the server to a clean state. Also closes all active sessions." }, async () => {
    const names = manager.listMaterials();
    for (const n of names) {
        sessionController.closeSessionForName(n);
    }
    manager.clearAll();
    return {
        content: [{ type: "text", text: names.length > 0 ? `Cleared ${names.length} material(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty." }],
    };
});

server.registerTool("list_materials", { description: "List all material graphs currently in memory." }, async () => {
    const names = manager.listMaterials();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Materials in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No materials in memory.",
            },
        ],
    };
});

// ── Block operations ────────────────────────────────────────────────────

server.registerTool(
    "add_block",
    {
        description: "Add a new block to a material graph. Returns the block's id for use in connect_blocks.",
        inputSchema: {
            materialName: z.string().describe("Name of the material to add the block to"),
            blockType: z
                .string()
                .describe(
                    "The block type from the registry (e.g. 'InputBlock', 'MultiplyBlock', 'PBRMetallicRoughnessBlock', 'TransformBlock', etc.). Use list_block_types to see all."
                ),
            name: z.string().optional().describe("Human-friendly name for this block instance (e.g. 'myColor', 'worldMatrix')"),
            properties: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Key-value properties to set on the block. For InputBlock: type (Float/Vector2/Vector3/Vector4/Color3/Color4/Matrix), " +
                        "value (the constant value), systemValue (World/View/Projection/etc.), attributeName (position/normal/uv/etc.), " +
                        "isConstant (boolean), animationType (None/Time), min/max (number). " +
                        "For TrigonometryBlock: operation (Cos/Sin/Abs/etc.). " +
                        "For ConditionalBlock: condition (Equal/LessThan/etc.)."
                ),
        },
    },
    async ({ materialName, blockType, name, properties }) => {
        const result = manager.addBlock(materialName, blockType, name, properties as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const lines = [`Added block [${result.block.id}] "${result.block.name}" (${blockType}). Use this id (${result.block.id}) to connect it.`];
        if (result.warnings) {
            lines.push("", "Warnings:", ...result.warnings);
        }
        _notifyIfSession(materialName);
        return {
            content: [
                {
                    type: "text",
                    text: lines.join("\n"),
                },
            ],
        };
    }
);

server.registerTool(
    "remove_block",
    {
        description: "Remove a block from a material graph by its numeric block id. Also removes any connections to/from it. Use describe_material to find valid block ids.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            blockId: z.number().describe("The block id to remove"),
        },
    },
    async ({ materialName, blockId }) => {
        const result = manager.removeBlock(materialName, blockId);
        if (result === "OK") {
            _notifyIfSession(materialName);
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
        description:
            "Set or update properties on an existing block. Use get_block_type_info to see available properties for the block's type. " +
            "Common: for InputBlock set 'value', 'type', 'systemValue'; for TrigonometryBlock set 'operation'; for ConditionalBlock set 'condition'.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            blockId: z.number().describe("The block id to modify"),
            properties: z.record(z.string(), z.unknown()).describe("Key-value properties to set. Use get_block_type_info to discover valid keys for a given block type."),
        },
    },
    async ({ materialName, blockId, properties }) => {
        const result = manager.setBlockProperties(materialName, blockId, properties as Record<string, unknown>);
        if (result === "OK") {
            _notifyIfSession(materialName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Connections ──────────────────────────────────────────────────────────

server.registerTool(
    "connect_blocks",
    {
        description: "Connect an output of one block to an input of another block. Data flows from source output → target input.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            sourceBlockId: z.number().describe("Block id to connect FROM (the one with the output)"),
            outputName: z.string().describe("Name of the output on the source block (e.g. 'output', 'rgb', 'xyz')"),
            targetBlockId: z.number().describe("Block id to connect TO (the one with the input)"),
            inputName: z.string().describe("Name of the input on the target block (e.g. 'vector', 'left', 'color')"),
        },
    },
    async ({ materialName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectBlocks(materialName, sourceBlockId, outputName, targetBlockId, inputName);
        const isOk = result.startsWith("OK");
        if (isOk) {
            _notifyIfSession(materialName);
        }
        return {
            content: [
                {
                    type: "text",
                    text: isOk
                        ? `Connected [${sourceBlockId}].${outputName} → [${targetBlockId}].${inputName}${result === "OK" ? "" : `. ${result.slice(3)}`}`
                        : `Error: ${result}`,
                },
            ],
            isError: !isOk,
        };
    }
);

server.registerTool(
    "disconnect_input",
    {
        description: "Disconnect an input on a block (remove the incoming connection). Use describe_block to find connected input names.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            blockId: z.number().describe("The block id whose input to disconnect"),
            inputName: z.string().describe("Name of the input to disconnect"),
        },
    },
    async ({ materialName, blockId, inputName }) => {
        const result = manager.disconnectInput(materialName, blockId, inputName);
        if (result === "OK") {
            _notifyIfSession(materialName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected [${blockId}].${inputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.registerTool(
    "describe_material",
    {
        description: "Get a human-readable description of the current state of a material graph, " + "including all blocks and their connections.",
        inputSchema: {
            materialName: z.string().describe("Name of the material to describe"),
        },
    },
    async ({ materialName }) => {
        const desc = manager.describeMaterial(materialName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "describe_block",
    {
        description: "Get detailed information about a specific block instance in a material, including its connections and properties.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            blockId: z.number().describe("The block id to describe"),
        },
    },
    async ({ materialName, blockId }) => {
        const desc = manager.describeBlock(materialName, blockId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "list_block_types",
    {
        description: "List all available NME block types, grouped by category. Use this to discover which blocks you can add.",
        inputSchema: {
            category: z.string().optional().describe("Optionally filter by category (Input, Math, Vector, Color, Texture, PBR, Output, etc.)"),
        },
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(BlockRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
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
            blockType: z.string().describe("The block type name (e.g. 'PBRMetallicRoughnessBlock', 'InputBlock')"),
        },
    },
    async ({ blockType }) => {
        const info = GetBlockTypeDetails(blockType);
        if (!info) {
            return {
                content: [{ type: "text", text: `Block type "${blockType}" not found. Use list_block_types to see available types.` }],
                isError: true,
            };
        }

        const lines: string[] = [];
        lines.push(`## ${blockType}`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Target: ${info.target}`);
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

// ── Validation ──────────────────────────────────────────────────────────

server.registerTool(
    "validate_material",
    {
        description: "Run validation checks on a material graph. Reports missing outputs, unconnected required inputs, and broken references.",
        inputSchema: {
            materialName: z.string().describe("Name of the material to validate"),
        },
    },
    async ({ materialName }) => {
        const issues = manager.validateMaterial(materialName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ─────────────────────────────────────────────────────

server.registerTool(
    "export_material_json",
    {
        description:
            "Export the material graph as NME-compatible JSON. This JSON can be loaded in the Babylon.js Node Material Editor " +
            "or via NodeMaterial.Parse() at runtime. " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned " +
            "(avoids large JSON payloads in the conversation context).",
        inputSchema: {
            materialName: z.string().describe("Name of the material to export"),
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ materialName, outputFile }) => {
        return CreateJsonExportResponse({
            jsonText: manager.exportJSON(materialName),
            outputFile,
            missingMessage: `Material "${materialName}" not found.`,
            fileLabel: "NME JSON",
        });
    }
);

server.registerTool(
    "import_material_json",
    {
        description:
            "Import an existing NME JSON into memory for editing. You can then modify blocks, connections, etc. " +
            "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            materialName: z.string().describe("Name to give the imported material"),
            json: CreateInlineJsonSchema(z, "The NME JSON string to import"),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a file containing the NME JSON to import (alternative to inline json)"),
        },
    },
    async ({ materialName, json, jsonFile }) => {
        return CreateJsonImportResponse({
            json,
            jsonFile,
            fileDescription: "NME JSON file",
            importJson: (jsonText) => manager.importJSON(materialName, jsonText),
            describeImported: () => manager.describeMaterial(materialName),
        });
    }
);

server.registerTool(
    "import_from_snippet",
    {
        description:
            "Import a Node Material from the Babylon.js Snippet Server by its snippet ID. " +
            "The snippet is fetched, validated as a nodeMaterial type, and loaded into memory for editing. " +
            'Snippet IDs look like "ABC123" or "ABC123#2" (with revision).',
        inputSchema: {
            materialName: z.string().describe("Name to give the imported material in memory"),
            snippetId: CreateSnippetIdSchema(z),
        },
    },
    async ({ materialName, snippetId }) => {
        return await RunSnippetResponse({
            snippetId,
            loadSnippet: async (requestedSnippetId: string) => (await LoadSnippet(requestedSnippetId)) as IDataSnippetResult,
            createResponse: (snippetResult: IDataSnippetResult) =>
                CreateTypedSnippetImportResponse({
                    snippetId,
                    snippetResult,
                    expectedType: "nodeMaterial",
                    importJson: (jsonText) => manager.importJSON(materialName, jsonText),
                    describeImported: () => manager.describeMaterial(materialName),
                    successMessage: `Imported snippet "${snippetId}" as "${materialName}" successfully.`,
                }),
        });
    }
);

// ── Snippet / URL helpers ───────────────────────────────────────────────

server.registerTool(
    "get_snippet_url",
    {
        description:
            "Export the material JSON and provide instructions for loading it in the Babylon.js Node Material Editor. " +
            "Optionally writes the JSON to a file. The user can then load it via the NME editor's 'Load' button, " +
            "or use NodeMaterial.Parse() at runtime.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            outputFile: z.string().optional().describe("Optional absolute file path to write the JSON to. If not provided, instructions are returned with inline JSON."),
        },
    },
    async ({ materialName, outputFile }) => {
        const json = manager.exportJSON(materialName);
        if (!json) {
            return { content: [{ type: "text", text: `Material "${materialName}" not found.` }], isError: true };
        }

        const lines: string[] = [];
        lines.push("## How to load this material in the Node Material Editor\n");
        lines.push("1. Open https://nme.babylonjs.com");
        lines.push("2. Click the hamburger menu (☰) → 'Load'");
        lines.push("3. Select the exported JSON file or paste the JSON content\n");

        if (outputFile) {
            try {
                mkdirSync(dirname(outputFile), { recursive: true });
                writeFileSync(outputFile, json, "utf-8");
                lines.push(`JSON written to: ${outputFile}`);
            } catch (e) {
                return { content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }], isError: true };
            }
        } else {
            lines.push("Use export_material_json with an outputFile to save to disk for easier loading.");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Batch operations ────────────────────────────────────────────────────

server.registerTool(
    "add_blocks_batch",
    {
        description:
            "Add multiple blocks at once (processed sequentially, so earlier blocks exist before later ones). " +
            "More efficient than calling add_block repeatedly. Returns all created block ids. " +
            "If one block fails, the rest still proceed.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            blocks: z
                .array(
                    z.object({
                        blockType: z.string().describe("Block type name"),
                        blockName: z.string().optional().describe("Instance name for the block"),
                        name: z.string().optional().describe("Instance name (alias for blockName)"),
                        properties: z.record(z.string(), z.unknown()).optional().describe("Block properties"),
                    })
                )
                .describe("Array of blocks to add"),
        },
    },
    async ({ materialName, blocks }) => {
        const results: string[] = [];
        for (const blockDef of blocks) {
            const bName = blockDef.blockName ?? blockDef.name;
            const result = manager.addBlock(materialName, blockDef.blockType, bName, blockDef.properties as Record<string, unknown>);
            if (typeof result === "string") {
                results.push(`Error adding ${blockDef.blockType}: ${result}`);
            } else {
                let line = `[${result.block.id}] ${result.block.name} (${blockDef.blockType})`;
                if (result.warnings) {
                    line += `\n  ⚠ ${result.warnings.join("\n  ⚠ ")}`;
                }
                results.push(line);
            }
        }
        _notifyIfSession(materialName);
        return { content: [{ type: "text", text: `Added blocks:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "connect_blocks_batch",
    {
        description:
            "Connect multiple block pairs at once (processed sequentially). More efficient than calling connect_blocks repeatedly. " +
            "If one connection fails, the rest still proceed.",
        inputSchema: {
            materialName: z.string().describe("Name of the material"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number().describe("Block id to connect FROM (the one with the output)"),
                        outputName: z.string().describe("Name of the output on the source block (e.g. 'output', 'rgb', 'xyz')"),
                        targetBlockId: z.number().describe("Block id to connect TO (the one with the input)"),
                        inputName: z.string().describe("Name of the input on the target block (e.g. 'vector', 'left', 'color')"),
                    })
                )
                .describe("Array of connections to make"),
        },
    },
    async ({ materialName, connections }) => {
        const results: string[] = [];
        let hasError = false;
        for (const conn of connections) {
            const result = manager.connectBlocks(materialName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            if (result.startsWith("OK")) {
                const suffix = result === "OK" ? "" : ` ${result.slice(3)}`;
                results.push(`[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}${suffix}`);
            } else {
                hasError = true;
                results.push(`Error ([${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}): ${result}`);
            }
        }
        _notifyIfSession(materialName);
        return { content: [{ type: "text", text: `Connections:\n${results.join("\n")}` }], isError: hasError };
    }
);

// ── Snippet server ──────────────────────────────────────────────────────

server.registerTool(
    "save_snippet",
    {
        description:
            "Save the material to the Babylon.js Snippet Server and return the snippet ID and version. " +
            "The snippet can later be loaded in the Node Material Editor via its snippet ID, or fetched with import_from_snippet. " +
            "To create a new revision of an existing snippet, pass the previous snippetId.",
        inputSchema: {
            materialName: z.string().describe("Name of the material to save"),
            snippetId: z.string().optional().describe('Optional existing snippet ID to create a new revision of (e.g. "ABC123" or "ABC123#1")'),
            name: z.string().optional().describe("Optional human-readable title for the snippet"),
            description: z.string().optional().describe("Optional description"),
            tags: z.string().optional().describe("Optional comma-separated tags"),
        },
    },
    async ({ materialName, snippetId, name, description, tags }) => {
        const json = manager.exportJSON(materialName);
        if (!json) {
            return { content: [{ type: "text", text: `Material "${materialName}" not found.` }], isError: true };
        }
        try {
            const result = await SaveSnippet(
                { type: "nodeMaterial", data: ParseJsonText({ jsonText: json, jsonLabel: "NME JSON" }) },
                { snippetId, metadata: { name, description, tags } }
            );
            return CreateTextResponse(
                `Saved material "${materialName}" to snippet server.\n\nSnippet ID: ${result.id}\nVersion: ${result.version}\nFull ID: ${result.snippetId}\n\nLoad in NME editor: https://nme.babylonjs.com/#${result.snippetId}`
            );
        } catch (e) {
            return CreateErrorResponse(`Error saving snippet: ${(e as Error).message}`);
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js Node Material Editor MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

// Graceful shutdown — stop the session server so the port is released immediately
const _shutdown = () => {
    void sessionController.stopAsync();
    process.exit(0);
};
process.on("SIGINT", _shutdown);
process.on("SIGTERM", _shutdown);
