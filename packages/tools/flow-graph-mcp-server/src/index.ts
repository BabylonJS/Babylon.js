#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Flow Graph MCP Server
 * ─────────────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Flow Graphs programmatically. An AI agent (or any MCP client) can:
 *
 *   • Create / manage flow graph instances
 *   • Add blocks from the full Flow Graph block catalog (~165 block types)
 *   • Connect blocks with signal connections (execution flow) and data connections
 *   • Set block configuration
 *   • Set context variables
 *   • Validate the graph
 *   • Export the final JSON (loadable by FlowGraphCoordinator.parse())
 *   • Import existing Flow Graph JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import {
    CreateErrorResponse,
    CreateInlineJsonSchema,
    CreateJsonExportResponse,
    CreateJsonFileSchema,
    CreateJsonImportResponse,
    CreateOutputFileSchema,
    CreateTextResponse,
    McpEditorSessionController,
    ResolveDefinedInput,
} from "@tools/mcp-server-core";

import { FlowGraphBlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { FlowGraphManager } from "./flowGraphManager.js";
const manager = new FlowGraphManager();
const sessionController = new McpEditorSessionController<FlowGraphManager>(
    {
        serverName: "Flow Graph MCP Session Server",
        documentKind: "flow-graph",
        managerUnavailableMessage: "Flow graph manager is not available",
        getDocument: (manager, session) => manager.exportJSON(session.name) ?? undefined,
        setDocument: (manager, session, document) => {
            const result = manager.importJSON(session.name, document);
            return result && result !== "OK" ? result : undefined;
        },
    },
    {
        defaultPort: 3001,
        statusTitle: "Flow Graph MCP Session Server",
    }
);

/**
 * Notify SSE subscribers if a session exists for the given flow graph.
 * @param graphName - The graph name to check for active sessions.
 */
function _notifyIfSession(graphName: string): void {
    const sessionId = sessionController.getSessionIdForName(graphName);
    if (sessionId) {
        sessionController.notifySessionUpdate(sessionId);
    }
}

/**
 * Import flow graph JSON and notify a matching live session on success.
 * @param graphName - The graph name to import into.
 * @param jsonText - Serialized Flow Graph JSON.
 * @returns "OK" on success, or an error string.
 */
function _importGraphJson(graphName: string, jsonText: string): string {
    const result = manager.importJSON(graphName, jsonText);
    if (result === "OK") {
        _notifyIfSession(graphName);
    }
    return result;
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-flow-graph",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build Babylon.js Flow Graphs (visual scripting). Workflow: create_graph → add event blocks (entry points) → add action/logic blocks → connect signals (execution flow) and data (typed values) → validate_graph → export_graph_json.",
            "Signal connections drive execution order; data connections carry values. Every graph needs at least one event block as an entry point.",
            "For MeshPickEvent, targetMesh config is required or clicks silently never fire. Use the 'done' signal output (not 'out') for per-event firing.",
            "To act on a mesh that is NOT the one clicked (e.g. click sphere → move box), give GetProperty/SetProperty their own mesh source (GetAsset or GetVariable) connected to the object input — do NOT use pickedMesh, and prefer an explicit connection over a config-only default.",
            "Output JSON can be consumed by the Scene MCP via attach_flow_graph.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("block-catalog", "flow-graph://block-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Flow Graph Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.registerResource("rich-types", "flow-graph://rich-types", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Flow Graph Rich Types Reference",
                "",
                "These are the data types used in Flow Graph data connections:",
                "",
                "| Type | Default Value | Description |",
                "|------|---------------|-------------|",
                "| `any` | undefined | Generic type, accepts any value |",
                '| `string` | "" | Text string |',
                "| `number` | 0 | Floating-point number |",
                "| `boolean` | false | True/false |",
                "| `FlowGraphInteger` | 0 | Integer value |",
                "| `Vector2` | (0, 0) | 2D vector |",
                "| `Vector3` | (0, 0, 0) | 3D vector |",
                "| `Vector4` | (0, 0, 0, 0) | 4D vector |",
                "| `Quaternion` | (0, 0, 0, 1) | Rotation quaternion |",
                "| `Matrix` | Identity 4x4 | 4x4 transformation matrix |",
                "| `Color3` | (0, 0, 0) | RGB color |",
                "| `Color4` | (0, 0, 0, 0) | RGBA color |",
                "",
                "## Serialized Value Formats",
                "",
                "When providing values in config, use these JSON formats:",
                "- **number**: `42`, `3.14`",
                "- **boolean**: `true`, `false`",
                '- **string**: `"hello"`',
                '- **Vector3**: `{ "value": [1, 2, 3], "className": "Vector3" }`',
                '- **Color3**: `{ "value": [1, 0, 0], "className": "Color3" }`',
                '- **Quaternion**: `{ "value": [0, 0, 0, 1], "className": "Quaternion" }`',
                '- **Matrix**: `{ "value": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1], "className": "Matrix" }`',
                '- **Mesh reference**: `{ "name": "myMesh", "className": "Mesh", "id": "mesh-id" }`',
                "",
                "## Connection Types",
                "",
                "Flow Graphs have two types of connections:",
                "1. **Signal connections** — control execution flow (like wires in a circuit). Signal outputs connect to signal inputs.",
                "2. **Data connections** — carry typed values between blocks. Data inputs connect FROM data outputs.",
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "flow-graph://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Flow Graph Concepts",
                "",
                "## What is a Flow Graph?",
                "A Flow Graph is a visual scripting system in Babylon.js that defines scene interactions",
                "using an action-block-based graph. It uses an event-driven execution model where:",
                "",
                "1. **Event blocks** (e.g. SceneReady, MeshPick, SceneTick) serve as entry points",
                "2. **Execution blocks** process logic when triggered by signals (Branch, ForLoop, SetProperty, etc.)",
                "3. **Data blocks** provide values (constants, variables, math operations) that feed into execution blocks",
                "",
                "## Signal Flow vs Data Flow",
                "- **Signal flow** (execution): Event → Execution Block → Execution Block → ...",
                "  - Connected via `connect_signal`: source signal output → target signal input",
                "  - Controls WHEN blocks execute",
                "- **Data flow** (values): Data Block output → Execution Block input",
                "  - Connected via `connect_data`: source data output → target data input",
                "  - Controls WHAT values blocks use",
                "",
                "## Common Patterns",
                "",
                "### On scene ready, log a message:",
                "SceneReadyEvent.out → ConsoleLog.in, with message data input",
                "(SceneReadyEvent.out fires once at startup — correct for initialization.)",
                "",
                "### On click, toggle visibility:",
                "MeshPickEvent.done → Branch.in  ⚠ Use 'done', NOT 'out'! 'out' fires once at startup.",
                "GetProperty(visible).value → Branch.condition",
                "Branch.onTrue → SetProperty(visible=false).in",
                "Branch.onFalse → SetProperty(visible=true).in",
                "config.targetMesh must be set: { type: 'Mesh', name: 'myMeshName' }",
                "",
                "### Animate on click:",
                "MeshPickEvent.done → PlayAnimation.in  ⚠ Use 'done', NOT 'out'!",
                "ValueInterpolation.animation → PlayAnimation.animation",
                "",
                "### Act on a mesh that is NOT the one clicked (e.g. click sphere → move box):",
                "The picked mesh and the mesh you modify are different, so do NOT use pickedMesh for the object.",
                "Give GetProperty/SetProperty their own mesh source:",
                "  • GetAsset (type: 'Mesh') → outputs the target mesh — connect its .value to the object input, OR",
                "  • GetVariable holding a mesh reference → connect its .value to the object input.",
                "MeshPickEvent(targetMesh: sphere).done → SetProperty.in  ⚠ Use 'done'!",
                "GetAsset(Mesh: 'box').value → GetProperty.object AND → SetProperty.object",
                "GetProperty('position').value → Add.a; Constant(Vector3 0,0.1,0).output → Add.b; Add.value → SetProperty.value",
                "SetProperty config: { propertyName: 'position' }",
                "",
                "## ⚠ Binding an object/mesh: connection vs config default",
                "GetProperty.object, SetProperty.object and MeshPickEvent.asset can be bound two ways:",
                "  1. Explicit data CONNECTION (preferred, visible in the editor): connect_data a mesh",
                "     source (pickedMesh / GetAsset.value / GetVariable.value) into the object/asset input.",
                "  2. Config DEFAULT (hidden inline value, no wire shown): set config.object / config.target",
                "     (GetProperty/SetProperty) or config.targetMesh (MeshPickEvent) to a mesh reference",
                "     { name: 'myMesh', className: 'Mesh' }. Use this only when a wire is unnecessary.",
                "Prefer an explicit connection whenever the mesh comes from elsewhere or must be visible/editable.",
                "MeshPickEvent uniquely maps config.targetMesh → its 'asset' input; SetProperty maps config.target → 'object'.",
                "",
                "## ⚠ Event Block Signal Gotcha",
                "Event blocks have TWO signal outputs with very different meanings:",
                "  • 'out' — fires ONCE at graph startup (initialization). Use for setup logic.",
                "  • 'done' — fires EACH TIME the event occurs (click, tick, etc). Use for reactions.",
                "For MeshPickEvent, PointerOverEvent, PointerOutEvent, SceneTickEvent:",
                "  → Always connect 'done' (not 'out') to your reaction logic.",
                "For SceneReadyEvent: 'out' is correct (scene ready fires once).",
                "",
                "## Context Variables",
                "Variables persist across graph executions and can be shared between blocks:",
                "- SetVariable stores a value",
                "- GetVariable retrieves a value",
                "- Use set_variable tool to initialize values before export",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("create-click-handler", { description: "Create a flow graph that responds to mesh clicks" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that responds when a mesh is clicked. Steps:",
                    "1. create_graph with name 'ClickHandler'",
                    "2. Add MeshPickEvent block with config: { targetMesh: { type: 'Mesh', name: 'TARGET_MESH_NAME' } }",
                    "   ⚠ targetMesh is REQUIRED — without it, click events silently never fire.",
                    "3. Add ConsoleLog block to log the picked point",
                    "4. Connect MeshPickEvent.done → ConsoleLog.in  ⚠ Use 'done', NOT 'out'!",
                    "   ('out' fires once at startup; 'done' fires on each click)",
                    "5. Connect data: connect_data MeshPickEvent.pickedPoint → ConsoleLog.message",
                    "6. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-toggle-visibility", { description: "Create a flow graph that toggles mesh visibility on click" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that toggles a mesh's visibility when clicked. Steps:",
                    "1. create_graph 'ToggleVisibility'",
                    "2. Add MeshPickEvent block with config: { targetMesh: { type: 'Mesh', name: 'TARGET_MESH_NAME' } }",
                    "   ⚠ targetMesh is REQUIRED — without it, click events silently never fire.",
                    "3. Add GetProperty block with config { propertyName: 'isVisible' }",
                    "4. Connect MeshPickEvent.pickedMesh → GetProperty.object",
                    "5. Add Branch block",
                    "6. Connect MeshPickEvent.done → Branch.in (signal)  ⚠ Use 'done', NOT 'out'!",
                    "7. Connect GetProperty.value → Branch.condition (data)",
                    "8. Add two SetProperty blocks: one for visible=false, one for visible=true",
                    "   - First SetProperty config: { propertyName: 'isVisible' }, with Constant(false) for value",
                    "   - Second SetProperty config: { propertyName: 'isVisible' }, with Constant(true) for value",
                    "9. Connect Branch.onTrue → SetProperty(false).in",
                    "10. Connect Branch.onFalse → SetProperty(true).in",
                    "11. Connect MeshPickEvent.pickedMesh to both SetProperty.object inputs",
                    "12. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-click-move-other-mesh", { description: "Create a flow graph where clicking one mesh moves a DIFFERENT mesh" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph where clicking one mesh moves a DIFFERENT mesh (e.g. click 'sphere' → move 'box' up 0.1).",
                    "The picked mesh differs from the modified mesh, so the object must come from its OWN mesh source —",
                    "do NOT wire pickedMesh into GetProperty/SetProperty.object. Steps:",
                    "1. create_graph 'ClickMoveOtherMesh'",
                    "2. Add MeshPickEvent with config: { targetMesh: { className: 'Mesh', name: 'PICK_MESH_NAME' } }",
                    "   ⚠ targetMesh is REQUIRED — without it, click events silently never fire.",
                    "3. Add a mesh source for the mesh you want to MOVE. Either:",
                    "   - GetAsset with config { type: 'Mesh', index: TARGET_INDEX } (canonical scene-asset picker), OR",
                    "   - GetVariable with config { variable: 'targetMesh' } and set_variable to { className: 'Mesh', name: 'MOVE_MESH_NAME' }",
                    "4. Add GetProperty with config { propertyName: 'position' }",
                    "5. connect_data mesh source .value → GetProperty.object",
                    "6. Add Constant with config { value: { className: 'Vector3', value: [0, 0.1, 0] } }",
                    "7. Add Add block; connect_data GetProperty.value → Add.a and Constant.output → Add.b",
                    "8. Add SetProperty with config { propertyName: 'position' }",
                    "9. connect_data mesh source .value → SetProperty.object  (the SAME source as step 5)",
                    "10. connect_data Add.value → SetProperty.value",
                    "11. connect_signal MeshPickEvent.done → SetProperty.in  ⚠ Use 'done', NOT 'out'!",
                    "12. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-animation-on-ready", { description: "Create a flow graph that plays an animation when the scene is ready" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that plays an animation when the scene is ready. Steps:",
                    "1. create_graph 'AnimateOnReady'",
                    "2. Add SceneReadyEvent block (entry point)",
                    "3. Add PlayAnimation block",
                    "4. Connect SceneReadyEvent.out → PlayAnimation.in (signal)",
                    "5. Add GetAsset block to get an animation group, with appropriate config",
                    "6. Connect GetAsset.value → PlayAnimation.animationGroup (data)",
                    "7. Add Constant block for speed (e.g. config { value: 1 })",
                    "8. Connect Constant.output → PlayAnimation.speed (data)",
                    "9. Add Constant block for loop (config { value: true })",
                    "10. Connect loop Constant.output → PlayAnimation.loop (data)",
                    "11. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-tick-counter", { description: "Create a flow graph that counts frames using SceneTick" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that counts frames and logs every 60 frames. Steps:",
                    "1. create_graph 'TickCounter'",
                    "2. set_variable 'frameCount' to 0",
                    "3. Add SceneTickEvent block",
                    "4. Add GetVariable block (config { variable: 'frameCount' })",
                    "5. Add Constant block with value 1",
                    "6. Add Add block — GetVariable.value + Constant.output",
                    "7. Add SetVariable block (config { variable: 'frameCount' })",
                    "8. Connect SceneTickEvent.out → SetVariable.in (signal)",
                    "9. Connect Add.value → SetVariable.value (data)",
                    "10. Add Modulo block — Add.value % 60",
                    "11. Add Equality block — Modulo.value == 0",
                    "12. Add Branch block",
                    "13. Connect SetVariable.out → Branch.in (signal)",
                    "14. Connect Equality.value → Branch.condition (data)",
                    "15. Add ConsoleLog block",
                    "16. Connect Branch.onTrue → ConsoleLog.in (signal)",
                    "17. Connect Add.value → ConsoleLog.message (data)",
                    "18. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-state-machine", { description: "Create a flow graph that uses variables to track state and switch behavior" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that tracks an on/off state via a variable and toggles it on mesh click.",
                    "This pattern is useful for doors, switches, lamps, or any togglable object.",
                    "",
                    "Steps:",
                    "1. create_graph 'StateMachine'",
                    "2. set_variable 'isActive' to false",
                    "",
                    "## Read state on click",
                    "3. Add MeshPickEvent block with config { targetMesh: { type: 'Mesh', name: 'TARGET_MESH_NAME' } }",
                    "   ⚠ targetMesh is REQUIRED — without it, click events silently never fire.",
                    "4. Add GetVariable block (config { variable: 'isActive' })",
                    "",
                    "## Branch on current state",
                    "5. Add Branch block",
                    "6. Connect MeshPickEvent.done → Branch.in  ⚠ Use 'done', NOT 'out'!",
                    "7. Connect GetVariable.value → Branch.condition",
                    "",
                    "## Turn OFF path (isActive was true → set to false)",
                    "8. Add Constant block with value false",
                    "9. Add SetVariable block (config { variable: 'isActive' })",
                    "10. Connect Branch.onTrue → SetVariable.in (signal)",
                    "11. Connect Constant(false).output → SetVariable.value (data)",
                    "12. Add ConsoleLog block — connect SetVariable.out → ConsoleLog.in",
                    "    Connect a Constant('Deactivated') → ConsoleLog.message",
                    "",
                    "## Turn ON path (isActive was false → set to true)",
                    "13. Add Constant block with value true",
                    "14. Add SetVariable block (config { variable: 'isActive' })",
                    "15. Connect Branch.onFalse → SetVariable.in (signal)",
                    "16. Connect Constant(true).output → SetVariable.value (data)",
                    "17. Add ConsoleLog block — connect SetVariable.out → ConsoleLog.in",
                    "    Connect a Constant('Activated') → ConsoleLog.message",
                    "",
                    "18. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Graph lifecycle ───────────────────────────────────────────────────────

server.registerTool(
    "create_graph",
    {
        description: "Create a new empty Flow Graph in memory. This is always the first step.",
        inputSchema: {
            name: z.string().describe("Unique name for the flow graph (e.g. 'ClickHandler', 'AnimationController')"),
        },
    },
    async ({ name }) => {
        manager.createGraph(name);
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(name);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return {
            content: [
                {
                    type: "text",
                    text: `Created flow graph "${name}". Now add blocks with add_block, connect them with connect_signal/connect_data, then export with export_graph_json.\n\nMCP Session URL: ${sessionUrl}`,
                },
            ],
        };
    }
);

server.registerTool(
    "delete_graph",
    {
        description: "Delete a flow graph from memory.",
        inputSchema: {
            name: z.string().describe("Name of the flow graph to delete"),
        },
    },
    async ({ name }) => {
        const ok = manager.deleteGraph(name);
        if (ok) {
            sessionController.closeSessionForName(name);
        }
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Graph "${name}" not found.` }],
        };
    }
);

server.registerTool("clear_all", { description: "Remove all flow graphs from memory, resetting the server to a clean state." }, async () => {
    const names = manager.listGraphs();
    manager.clearAll();
    for (const name of names) {
        sessionController.closeSessionForName(name);
    }
    return {
        content: [{ type: "text", text: names.length > 0 ? `Cleared ${names.length} flow graph(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty." }],
    };
});

server.registerTool("list_graphs", { description: "List all flow graphs currently in memory." }, async () => {
    const names = manager.listGraphs();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Flow graphs in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No flow graphs in memory.",
            },
        ],
    };
});

server.registerTool(
    "get_session_url",
    {
        description: "Get or create a live-session URL for a flow graph. The URL can be pasted into the Flow Graph Editor MCP session panel.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
        },
    },
    async ({ graphName }) => {
        const graphs = manager.listGraphs();
        if (!graphs.includes(graphName)) {
            return CreateErrorResponse(`Graph "${graphName}" not found.`);
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
        description: "Start a live editor session for a flow graph and return its URL.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
        },
    },
    async ({ graphName }) => {
        const graphs = manager.listGraphs();
        if (!graphs.includes(graphName)) {
            return CreateErrorResponse(`Graph "${graphName}" not found.`);
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(graphName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(`Started Flow Graph editor session for "${graphName}".\n\nMCP Session URL: ${sessionUrl}`);
    }
);

server.registerTool(
    "close_session",
    {
        description: "Close the live editor session for a flow graph without stopping the MCP server.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
        },
    },
    async ({ graphName }) => {
        const closed = sessionController.closeSessionForName(graphName);
        return CreateTextResponse(closed ? `Closed MCP session for "${graphName}".` : `No active MCP session found for "${graphName}".`);
    }
);

server.registerTool("stop_session_server", { description: "Stop the local Flow Graph MCP HTTP/SSE session server and close all active sessions." }, async () => {
    await sessionController.stopAsync();
    return CreateTextResponse("Flow Graph MCP session server stopped.");
});

// ── Block operations ────────────────────────────────────────────────────

server.registerTool(
    "add_block",
    {
        description: "Add a new block to a flow graph. Returns the block's id for use in connect_signal/connect_data.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph to add the block to"),
            blockType: z
                .string()
                .describe(
                    "The block type from the registry (e.g. 'SceneReadyEvent', 'Branch', 'ConsoleLog', 'Add', 'SetProperty'). " + "Use list_block_types to see all available types."
                ),
            name: z.string().optional().describe("Human-friendly name for this block instance (e.g. 'checkCondition', 'logResult')"),
            config: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Block-specific configuration. Examples:\n" +
                        '  - Constant: { value: 42 } or { value: { "value": [1,2,3], "className": "Vector3" } }\n' +
                        '  - GetVariable: { variable: "myVar" }\n' +
                        '  - SetVariable: { variable: "myVar" }\n' +
                        '  - SetProperty: { propertyName: "position" }\n' +
                        '  - GetProperty: { propertyName: "isVisible" }\n' +
                        "  - Sequence: { outputSignalCount: 3 }\n" +
                        "  - Switch: { cases: [0, 1, 2] }\n" +
                        '  - SendCustomEvent/ReceiveCustomEvent: { eventId: "myEvent" }'
                ),
        },
    },
    async ({ graphName, blockType, name, config }) => {
        const result = manager.addBlock(graphName, blockType, name, config as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        _notifyIfSession(graphName);

        let msg = `Added block [${result.id}] "${result.name}" (${blockType}). Use id ${result.id} in connect_signal/connect_data.`;

        // Surface config warnings from the manager
        if (result.warnings && result.warnings.length > 0) {
            msg += `\n⚠ ${result.warnings.join("\n⚠ ")}`;
        }

        // Warn about event blocks that silently fail without a mesh target
        const meshTargetEventTypes = ["MeshPickEvent", "PointerOverEvent", "PointerOutEvent"];
        if (meshTargetEventTypes.includes(blockType)) {
            const cfg = config as Record<string, unknown> | undefined;
            if (!cfg || !("targetMesh" in cfg)) {
                msg +=
                    `\n⚠ "${blockType}" requires a target mesh to fire events. ` +
                    `Set config.targetMesh to a mesh reference, e.g.: { type: "Mesh", name: "myMeshName" }. ` +
                    `Without it, events will silently never fire.`;
            }
        }

        return { content: [{ type: "text", text: msg }] };
    }
);

server.registerTool(
    "remove_block",
    {
        description: "Remove a block from a flow graph. Also removes all connections to/from it.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            blockId: z.number().describe("The block id to remove"),
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
    "set_block_config",
    {
        description:
            "Set or update configuration on an existing block. Config keys depend on the block type — " +
            "use get_block_type_info to discover available config for a given block type.\n\n" +
            "Common config patterns:\n" +
            "- Constant: { value: <any> } — the constant value to output\n" +
            "- GetVariable / SetVariable: { variable: 'varName' } — FlowGraph context variable name\n" +
            "- MeshPickEvent: { targetMesh: { type: 'Mesh', name: 'meshName' } } — REQUIRED or clicks silently fail\n" +
            "- GetProperty / SetProperty: { propertyName: 'propName' } — e.g. 'position', 'isVisible', 'rotation'\n" +
            "- FunctionReference: { code: 'function(params) { ... }' } — inline JS function body. " +
            "Connect inputs via CodeExecution block, read results via GetProperty on the outputs.\n" +
            "- ConsoleLog: no config needed (message received via data input)\n" +
            "- PlayAnimation: { loop: true/false } or receive animationGroup via data input\n\n" +
            "TIP: Rich-type values like Mesh references use { type: 'Mesh', name: 'meshName' } format. " +
            "Read the rich-types resource for the full list.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            blockId: z.number().describe("The block id to modify"),
            config: z
                .record(z.string(), z.unknown())
                .describe("Configuration key-value pairs to set or update. Keys are block-specific — use get_block_type_info to discover them."),
        },
    },
    async ({ graphName, blockId, config }) => {
        const result = manager.setBlockConfig(graphName, blockId, config as Record<string, unknown>);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId} config.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Signal connections ──────────────────────────────────────────────────

server.registerTool(
    "connect_signal",
    {
        description:
            "Connect a signal output of one block to a signal input of another. " +
            "Signal connections control execution flow (WHEN blocks execute). " +
            "Flow: source block's signal output → target block's signal input.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            sourceBlockId: z.number().describe("Block id with the signal output (e.g. the event or execution block)"),
            signalOutputName: z
                .string()
                .optional()
                .describe("Name of the signal output on the source block (e.g. 'out', 'onTrue', 'onFalse', 'executionFlow', 'completed', 'done')"),
            outputName: z.string().optional().describe("Alias for signalOutputName"),
            signalOut: z.string().optional().describe("Alias for signalOutputName"),
            outName: z.string().optional().describe("Alias for signalOutputName"),
            targetBlockId: z.number().describe("Block id with the signal input (the block to trigger)"),
            signalInputName: z.string().optional().describe("Name of the signal input on the target block (usually 'in')"),
            inputName: z.string().optional().describe("Alias for signalInputName"),
            signalIn: z.string().optional().describe("Alias for signalInputName"),
            inName: z.string().optional().describe("Alias for signalInputName"),
        },
    },
    async ({ graphName, sourceBlockId, signalOutputName, outputName: outputNameAlias, signalOut, outName, targetBlockId, signalInputName, inputName, signalIn, inName }) => {
        const resolvedSignalOutputName = signalOutputName ?? outputNameAlias ?? signalOut ?? outName ?? "out";
        const resolvedSignalInputName = signalInputName ?? inputName ?? signalIn ?? inName ?? "in";
        const result = manager.connectSignal(graphName, sourceBlockId, resolvedSignalOutputName, targetBlockId, resolvedSignalInputName);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        // Gap 32: Detect if the manager auto-remapped "out" → "done" for event blocks
        let note = "";
        if (result === "OK" && resolvedSignalOutputName === "out") {
            const graph = manager.getGraph(graphName);
            const block = graph?.blocks.find((b) => b.id === sourceBlockId);
            if (block?.typeInfo.category === "Event" && block.serialized.signalOutputs.some((o) => o.name === "done")) {
                note = ` (Note: auto-remapped "out" → "done" for event block — "done" fires on event trigger, "out" fires on startup)`;
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text:
                        result === "OK"
                            ? `Connected signal: [${sourceBlockId}].${resolvedSignalOutputName} → [${targetBlockId}].${resolvedSignalInputName}${note}`
                            : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "disconnect_signal",
    {
        description: "Disconnect a signal output from its target(s).",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            blockId: z.number().describe("Block id that has the signal output"),
            signalOutputName: z.string().describe("Name of the signal output to disconnect"),
        },
    },
    async ({ graphName, blockId, signalOutputName }) => {
        const result = manager.disconnectSignal(graphName, blockId, signalOutputName);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected signal [${blockId}].${signalOutputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Data connections ────────────────────────────────────────────────────

server.registerTool(
    "connect_data",
    {
        description:
            "Connect a data output of one block to a data input of another. " +
            "Data connections carry typed values (WHAT blocks process). " +
            "Flow: source block's data output → target block's data input.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            sourceBlockId: z.number().describe("Block id with the data output (the value provider)"),
            outputName: z.string().describe("Name of the data output on the source block (e.g. 'value', 'output', 'pickedPoint')"),
            targetBlockId: z.number().describe("Block id with the data input (the value consumer)"),
            inputName: z.string().describe("Name of the data input on the target block (e.g. 'message', 'condition', 'a', 'b')"),
        },
    },
    async ({ graphName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectData(graphName, sourceBlockId, outputName, targetBlockId, inputName);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Connected data: [${sourceBlockId}].${outputName} → [${targetBlockId}].${inputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "disconnect_data",
    {
        description: "Disconnect a data input from its source.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            blockId: z.number().describe("Block id that has the data input"),
            inputName: z.string().describe("Name of the data input to disconnect"),
        },
    },
    async ({ graphName, blockId, inputName }) => {
        const result = manager.disconnectData(graphName, blockId, inputName);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected data [${blockId}].${inputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Context variables ───────────────────────────────────────────────────

server.registerTool(
    "set_variable",
    {
        description: "Set a context variable on the flow graph. Variables can be read by GetVariable blocks and written by SetVariable blocks.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            variableName: z.string().describe("Name of the variable"),
            value: z
                .unknown()
                .describe(
                    "The variable value. For complex types, use serialized format:\n" +
                        '  - number: 42\n  - string: "hello"\n  - boolean: true\n' +
                        '  - Vector3: { "value": [1, 2, 3], "className": "Vector3" }'
                ),
        },
    },
    async ({ graphName, variableName, value }) => {
        const result = manager.setVariable(graphName, variableName, value);
        if (result === "OK") {
            _notifyIfSession(graphName);
        }
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Set variable "${variableName}" = ${JSON.stringify(value)}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.registerTool(
    "describe_graph",
    {
        description: "Get a human-readable description of a flow graph, including all blocks, their connections, and context variables.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph to describe"),
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
        description: "Get detailed information about a specific block instance, including all its connections and configuration.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            blockId: z.number().describe("The block id to describe"),
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
        description: "List all available Flow Graph block types, grouped by category. Use this to discover which blocks you can add.",
        inputSchema: {
            category: z
                .string()
                .optional()
                .describe("Optionally filter by category (Event, Execution, ControlFlow, Animation, Data, Math, Vector, Matrix, Combine, Extract, Conversion, Utility)"),
        },
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(FlowGraphBlockRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key} (${info.className}): ${info.description.split(".")[0]}`)
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
        description: "Get detailed info about a specific block type — its signal/data connections, config options, and description.",
        inputSchema: {
            blockType: z.string().describe("The block type name (e.g. 'Branch', 'SetProperty', 'FlowGraphBranchBlock')"),
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
        lines.push(`## ${blockType} (${info.className})`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Signal Inputs:");
        if (info.signalInputs.length === 0) {
            lines.push("  (none — this is a data-only block)");
        }
        for (const si of info.signalInputs) {
            lines.push(`  • ${si.name}${si.description ? ` — ${si.description}` : ""}`);
        }

        lines.push("\n### Signal Outputs:");
        if (info.signalOutputs.length === 0) {
            lines.push("  (none — this is a data-only block)");
        }
        for (const so of info.signalOutputs) {
            lines.push(`  • ${so.name}${so.description ? ` — ${so.description}` : ""}`);
        }

        lines.push("\n### Data Inputs:");
        if (info.dataInputs.length === 0) {
            lines.push("  (none)");
        }
        for (const di of info.dataInputs) {
            const opt = di.isOptional ? " (optional)" : "";
            lines.push(`  • ${di.name}: ${di.type}${opt}${di.description ? ` — ${di.description}` : ""}`);
        }

        lines.push("\n### Data Outputs:");
        if (info.dataOutputs.length === 0) {
            lines.push("  (none)");
        }
        for (const dout of info.dataOutputs) {
            lines.push(`  • ${dout.name}: ${dout.type}${dout.description ? ` — ${dout.description}` : ""}`);
        }

        if (info.config) {
            lines.push("\n### Configuration (config object):");
            for (const [k, v] of Object.entries(info.config)) {
                lines.push(`  • ${k}: ${v}`);
            }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Validation ──────────────────────────────────────────────────────────

server.registerTool(
    "validate_graph",
    {
        description: "Run validation checks on a flow graph. Reports missing connections, unreachable blocks, and broken references.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph to validate"),
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
    "export_graph_json",
    {
        description:
            "Export the flow graph as Babylon.js-compatible JSON at the coordinator level. " +
            "This JSON can be loaded via FlowGraphCoordinator.parse() at runtime. " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned " +
            "(avoids large JSON payloads in the conversation context).",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph to export"),
            graphOnly: z
                .boolean()
                .default(false)
                .describe("If true, exports only the graph-level JSON (without the coordinator wrapper). Useful for embedding in glTF or other formats."),
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ graphName, graphOnly, outputFile }) => {
        return CreateJsonExportResponse({
            jsonText: graphOnly ? manager.exportGraphJSON(graphName) : manager.exportJSON(graphName),
            outputFile,
            missingMessage: `Graph "${graphName}" not found.`,
            fileLabel: "Flow Graph JSON",
        });
    }
);

server.registerTool(
    "import_graph_json",
    {
        description:
            "Import an existing Flow Graph JSON into memory for editing. Accepts either coordinator-level or graph-level JSON. " +
            "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            graphName: z.string().describe("Name to give the imported flow graph"),
            json: CreateInlineJsonSchema(z, "The Flow Graph JSON string to import"),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a file containing the Flow Graph JSON to import (alternative to inline json)"),
        },
    },
    async ({ graphName, json, jsonFile }) => {
        return CreateJsonImportResponse({
            json,
            jsonFile,
            fileDescription: "Flow Graph JSON file",
            importJson: (jsonText) => _importGraphJson(graphName, jsonText),
            describeImported: () => manager.describeGraph(graphName),
        });
    }
);

// ── Batch operations ────────────────────────────────────────────────────

server.registerTool(
    "add_blocks_batch",
    {
        description: "Add multiple blocks at once. More efficient than calling add_block repeatedly. Returns all created block ids.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            blocks: z
                .array(
                    z.object({
                        blockType: z.string().optional().describe("Block type name from the registry"),
                        type: z.string().optional().describe("Alias for blockType"),
                        name: z.string().optional().describe("Instance name for the block"),
                        config: z.record(z.string(), z.unknown()).optional().describe("Block configuration"),
                    })
                )
                .describe("Array of blocks to add"),
        },
    },
    async ({ graphName, blocks }) => {
        const results: string[] = [];
        let didMutate = false;
        for (const blockDef of blocks) {
            // Gap 18 — resolve type alias for blockType
            const resolvedBlockType = blockDef.blockType ?? blockDef.type;
            if (!resolvedBlockType) {
                results.push(`Error: block definition missing blockType (or type alias)`);
                continue;
            }
            const result = manager.addBlock(graphName, resolvedBlockType, blockDef.name, blockDef.config as Record<string, unknown>);
            if (typeof result === "string") {
                results.push(`Error adding ${resolvedBlockType}: ${result}`);
            } else {
                didMutate = true;
                results.push(`[${result.id}] ${result.name} (${resolvedBlockType})`);
            }
        }
        if (didMutate) {
            _notifyIfSession(graphName);
        }
        return { content: [{ type: "text", text: `Added blocks:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "connect_signals_batch",
    {
        description: "Connect multiple signal pairs at once.",
        inputSchema: {
            graphName: z.string().optional().describe("Name of the flow graph"),
            name: z.string().optional().describe("Alias for graphName"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number(),
                        signalOutputName: z.string().optional().describe("Signal output name on source block"),
                        signalOut: z.string().optional().describe("Alias for signalOutputName"),
                        outputName: z.string().optional().describe("Alias for signalOutputName"),
                        targetBlockId: z.number(),
                        signalInputName: z.string().optional().describe("Signal input name on target block (default: 'in')"),
                        signalIn: z.string().optional().describe("Alias for signalInputName"),
                        inName: z.string().optional().describe("Alias for signalInputName"),
                        inputName: z.string().optional().describe("Alias for signalInputName"),
                        graphName: z.string().optional().describe("Ignored here — use top-level graphName"),
                    })
                )
                .describe("Array of signal connections to make"),
        },
    },
    async ({ graphName, name: nameAlias, connections }) => {
        let resolvedGraphName: string;
        try {
            resolvedGraphName = ResolveDefinedInput({
                candidates: [
                    { label: "'graphName'", value: graphName },
                    { label: "'name'", value: nameAlias },
                ],
            });
        } catch (e) {
            return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
        const results: string[] = [];
        let didMutate = false;
        for (const conn of connections) {
            // Gap 18 / Gap 50 — resolve output and input name aliases
            const resolvedOutputName = conn.signalOutputName ?? conn.signalOut ?? conn.outputName ?? "out";
            const resolvedInputName = conn.signalInputName ?? conn.signalIn ?? conn.inName ?? conn.inputName ?? "in";
            const result = manager.connectSignal(resolvedGraphName, conn.sourceBlockId, resolvedOutputName, conn.targetBlockId, resolvedInputName);
            if (result === "OK") {
                didMutate = true;
            }
            results.push(result === "OK" ? `[${conn.sourceBlockId}].${resolvedOutputName} → [${conn.targetBlockId}].${resolvedInputName}` : `Error: ${result}`);
        }
        if (didMutate) {
            _notifyIfSession(resolvedGraphName);
        }
        return { content: [{ type: "text", text: `Signal connections:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "connect_data_batch",
    {
        description: "Connect multiple data pairs at once.",
        inputSchema: {
            graphName: z.string().describe("Name of the flow graph"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number(),
                        outputName: z.string(),
                        targetBlockId: z.number(),
                        inputName: z.string(),
                    })
                )
                .describe("Array of data connections to make"),
        },
    },
    async ({ graphName, connections }) => {
        const results: string[] = [];
        let didMutate = false;
        for (const conn of connections) {
            const result = manager.connectData(graphName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            if (result === "OK") {
                didMutate = true;
            }
            results.push(result === "OK" ? `[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}` : `Error: ${result}`);
        }
        if (didMutate) {
            _notifyIfSession(graphName);
        }
        return { content: [{ type: "text", text: `Data connections:\n${results.join("\n")}` }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js Flow Graph MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

const _shutdown = () => {
    void sessionController.stopAsync();
    process.exit(0);
};
process.on("SIGINT", _shutdown);
process.on("SIGTERM", _shutdown);
