#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * GUI MCP Server
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * GUI layouts (AdvancedDynamicTexture / 2D controls) programmatically.
 *
 * An AI agent (or any MCP client) can:
 *   • Create / manage GUI textures (AdvancedDynamicTexture)
 *   • Add any GUI control (TextBlock, Button, Slider, Grid, etc.)
 *   • Build hierarchical control trees
 *   • Configure Grid rows / columns
 *   • Set control properties
 *   • Reparent controls
 *   • Validate the GUI layout
 *   • Export GUI JSON (loadable via AdvancedDynamicTexture.parseSerializedObject)
 *   • Import existing GUI JSON for editing
 *
 * Transport: stdio
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
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
    ResolveDefinedInput,
} from "@tools/mcp-server-core";

import { ControlRegistry, BaseControlProperties, GetControlCatalogSummary, GetControlTypeDetails } from "./catalog.js";
import { GuiManager } from "./guiManager.js";
import { LoadSnippet, SaveSnippet, type IDataSnippetResult } from "@tools/snippet-loader";

// ─── Singleton manager ────────────────────────────────────────────────────
const manager = new GuiManager();
const sessionController = new McpEditorSessionController<GuiManager>(
    {
        serverName: "GUI MCP Session Server",
        documentKind: "gui",
        managerUnavailableMessage: "GUI manager is not available",
        getDocument: (manager, session) => manager.exportJSON(session.name) ?? undefined,
        setDocument: (manager, session, document) => {
            const result = manager.importJSON(session.name, document);
            return result && result !== "OK" ? result : undefined;
        },
    },
    {
        defaultPort: 3001,
        statusTitle: "GUI MCP Session Server",
    }
);

/**
 * Notify SSE subscribers if a session exists for the given GUI.
 * @param guiName - The GUI name to check for active sessions.
 */
function _notifyIfSession(guiName: string): void {
    const sessionId = sessionController.getSessionIdForName(guiName);
    if (sessionId) {
        sessionController.notifySessionUpdate(sessionId);
    }
}

/**
 * Import GUI JSON and notify a matching live session on success.
 * @param guiName - The GUI name to import into.
 * @param jsonText - Serialized GUI JSON.
 * @returns "OK" on success, or an error string.
 */
function _importGuiJson(guiName: string, jsonText: string): string {
    const result = manager.importJSON(guiName, jsonText);
    if (result === "OK") {
        _notifyIfSession(guiName);
    }
    return result;
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-gui",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build Babylon.js 2D GUI layouts (AdvancedDynamicTexture). Workflow: create_gui → add controls (containers first, then leaf controls inside them) → set properties → validate_gui → export_gui_json.",
            "All controls must have a parent. The root container is created automatically. Use Grid for complex layouts, StackPanel for linear layouts.",
            "Sizes accept '200px', '50%', or a number. Output JSON can be consumed by the Scene MCP via attach_gui.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("control-catalog", "gui://control-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# GUI Control Catalog\n${GetControlCatalogSummary()}`,
        },
    ],
}));

server.registerResource("base-properties", "gui://base-properties", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Base Control Properties",
                "These properties are available on ALL controls:\n",
                ...Object.entries(BaseControlProperties).map(([k, v]) => `• **${k}** (${v.type}): ${v.description}`),
            ].join("\n"),
        },
    ],
}));

server.registerResource("enums", "gui://enums", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# GUI Enumerations Reference",
                "",
                "## Horizontal Alignment",
                "LEFT (0), RIGHT (1), CENTER (2)",
                "",
                "## Vertical Alignment",
                "TOP (0), BOTTOM (1), CENTER (2)",
                "",
                "## Text Wrapping",
                "Clip (0), WordWrap (1), Ellipsis (2), WordWrapEllipsis (3), HTML (4)",
                "",
                "## Image Stretch",
                "STRETCH_NONE (0), STRETCH_FILL (1), STRETCH_UNIFORM (2), STRETCH_EXTEND (3), STRETCH_NINE_PATCH (4)",
                "",
                "## Grid Definition Units",
                "Fraction (0) — value is 0–1 ratio, Pixel (1) — value is in pixels",
                "",
                "## Size Strings",
                'Width/height accept: "200px" (pixels), "50%" (percentage), "0.5" (fraction), or a number',
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "gui://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# GUI Concepts",
                "",
                "## What is a Babylon.js GUI?",
                "Babylon.js GUI is a 2D interface layer (AdvancedDynamicTexture) that renders controls",
                "like buttons, text, sliders, and images as an overlay on top of a 3D scene.",
                "The GUI is built as a tree of controls, starting from a root container.",
                "",
                "## Container Hierarchy",
                "Controls are organized in a parent-child tree:",
                "  • **Containers** (Rectangle, StackPanel, Grid, ScrollViewer, Ellipse) can hold children.",
                "  • **Leaf controls** (TextBlock, Image, Slider, Checkbox, ColorPicker) cannot.",
                "  • The root container is always named 'root' and is created automatically.",
                "  • Every control must be added to a container parent.",
                "",
                "## ⚠ Grid Layout — CRITICAL Rules",
                "Grid is the most powerful layout container but has strict requirements:",
                "",
                "1. **Define rows and columns BEFORE adding children.**",
                "   Use `add_grid_row` and `add_grid_column` to define the grid structure first.",
                "   A Grid with no rows/columns will not display children correctly.",
                "",
                "2. **Specify gridRow and gridColumn when adding children to a Grid.**",
                "   If you omit these, the child is placed at cell [0, 0] by default.",
                "   This is almost never what you want — be explicit!",
                "",
                "3. **Row/column indices are 0-based** and must be within the defined range.",
                "",
                "4. **Row/column sizes** use fractions (0–1, unit=0) or pixels (unit=1).",
                "   Fractions are ratios of remaining space. `0.5` means 50% of the available space.",
                "",
                "## StackPanel Layout",
                "StackPanel arranges children in a single direction:",
                "  • `isVertical: true` (default) — children stack top to bottom",
                "  • `isVertical: false` — children stack left to right",
                "  • `spacing` — gap between children in pixels",
                "  • ⚠ Children in a StackPanel should set their height (for vertical) or width (for horizontal)",
                "    since StackPanel does NOT stretch children to fill.",
                "",
                "## Size System",
                "Controls accept sizes in multiple formats:",
                "  • `'200px'` — absolute pixels",
                "  • `'50%'` — percentage of parent",
                "  • `'0.5'` — fraction of parent (equivalent to 50%)",
                "  • A number — treated as pixels",
                "If no width/height is set, controls stretch to fill their parent container.",
                "",
                "## Alignment",
                "Controls are positioned within their parent using alignment:",
                "  • `horizontalAlignment`: LEFT (0), RIGHT (1), CENTER (2)",
                "  • `verticalAlignment`: TOP (0), BOTTOM (1), CENTER (2)",
                "  • Default is CENTER for both. Use alignment with explicit width/height.",
                "  • `left` and `top` provide pixel offsets from the aligned position.",
                "",
                "## Button Special Behavior",
                "Button is a container that auto-creates internal child controls:",
                "  • Set `buttonText: 'Click me'` in properties — this creates an internal TextBlock.",
                "  • Set `buttonImage: 'icon.png'` — this creates an internal Image child.",
                "  • Do NOT manually add TextBlock children to a Button; use `buttonText` instead.",
                "  • Style the button itself with `background`, `color` (border color), `cornerRadius`, `thickness`.",
                "",
                "## Common Patterns",
                "",
                "### Simple text overlay:",
                "1. create_gui, 2. add_control TextBlock to root with text, fontSize, color",
                "",
                "### Grid-based layout (HUD):",
                "1. create_gui",
                "2. add_control Grid to root",
                "3. add_grid_row × N, add_grid_column × N",
                "4. add_control children with explicit gridRow, gridColumn for each",
                "",
                "### Settings panel with sliders:",
                "1. create_gui",
                "2. add_control Rectangle (panel background) to root",
                "3. add_control StackPanel to the rectangle, isVertical: true",
                "4. For each setting: add a horizontal StackPanel row, with TextBlock + Slider inside",
                "",
                "## Common Mistakes",
                "1. Adding children to a Grid before defining rows/columns → misplaced controls",
                "2. Forgetting gridRow/gridColumn when adding to a Grid → everything stacks at [0,0]",
                "3. Adding a TextBlock child to a Button manually instead of using buttonText property",
                "4. Not setting height on StackPanel children → children may collapse to zero height",
                "5. Using alignment without explicit size → alignment has no visible effect",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("create-hud", { description: "Step-by-step instructions for building a basic game HUD" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a game HUD with health bar, score, and minimap placeholder. Steps:",
                    "1. create_gui 'GameHUD' (fullscreen, 1920×1080)",
                    "2. Add a Grid 'mainGrid' as the layout root, parent 'root'",
                    "3. Add 3 rows to the grid: 0.1 (top bar), 0.8 (main area), 0.1 (bottom bar)",
                    "4. Add 3 columns: 0.25 (left), 0.5 (center), 0.25 (right)",
                    "5. Top-left: Add Rectangle 'healthBarBg' (cell 0,0), background '#333', cornerRadius 10",
                    "6. Inside healthBarBg: Add Rectangle 'healthBarFill', background '#00ff00', width '80%', height '60%', horizontalAlignment 0",
                    "7. Top-center: Add TextBlock 'scoreText' (cell 0,1), text 'Score: 0', fontSize '32px', color 'white'",
                    "8. Top-right: Add Rectangle 'minimapBg' (cell 0,2), background '#222', cornerRadius 5",
                    "9. Bottom-center: Add StackPanel 'bottomBar' (cell 2,1), isVertical false, spacing 20",
                    "10. Inside bottomBar: Add Button 'inventoryBtn' with buttonText 'Inventory'",
                    "11. Inside bottomBar: Add Button 'menuBtn' with buttonText 'Menu'",
                    "12. validate_gui, then export_gui_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-menu", { description: "Step-by-step instructions for building a settings/options menu" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a settings menu panel with controls. Steps:",
                    "1. create_gui 'SettingsMenu' (fullscreen, 1920×1080)",
                    "2. Add Rectangle 'panel' to root, width '400px', height '600px', background '#1a1a2e', cornerRadius 20, thickness 2, color '#e94560'",
                    "3. Add TextBlock 'title' to panel, text 'Settings', fontSize '36px', color 'white', height '60px', verticalAlignment 0",
                    "4. Add StackPanel 'settingsList' to panel, isVertical true, spacing 15, top '80px', height '450px', width '80%'",
                    "5. Add a StackPanel 'volumeRow' to settingsList, isVertical false, height '40px'",
                    "6. Inside volumeRow: TextBlock 'volumeLabel', text 'Volume', width '40%', color 'white', textHorizontalAlignment 0",
                    "7. Inside volumeRow: Slider 'volumeSlider', width '60%', minimum 0, maximum 100, value 75, color '#e94560'",
                    "8. Repeat for 'Brightness' and 'FOV' sliders",
                    "9. Add Checkbox row: StackPanel 'fullscreenRow', with TextBlock 'Fullscreen' + Checkbox",
                    "10. Add Button 'applyBtn' to panel, buttonText 'Apply', background '#e94560', height '50px', width '60%', verticalAlignment 1, top '-30px'",
                    "11. validate_gui, then export_gui_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-dialog", { description: "Step-by-step instructions for building a modal dialog" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a confirmation dialog. Steps:",
                    "1. create_gui 'ConfirmDialog' (fullscreen, 1920×1080)",
                    "2. Add Rectangle 'overlay' to root, width '100%', height '100%', background 'rgba(0,0,0,0.5)', thickness 0",
                    "3. Add Rectangle 'dialog' to overlay, width '400px', height '200px', background '#ffffff', cornerRadius 12, thickness 0",
                    "4. Add TextBlock 'title' to dialog, text 'Confirm', fontSize '24px', color '#333', height '50px', verticalAlignment 0",
                    "5. Add TextBlock 'message' to dialog, text 'Are you sure?', color '#666', textWrapping 1",
                    "6. Add StackPanel 'buttons' to dialog, isVertical false, spacing 20, height '50px', verticalAlignment 1, top '-20px'",
                    "7. Add Button 'cancelBtn' to buttons, buttonText 'Cancel', width '120px', background '#ccc', color '#333'",
                    "8. Add Button 'confirmBtn' to buttons, buttonText 'Confirm', width '120px', background '#4CAF50', color 'white'",
                    "9. validate_gui, export_gui_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── GUI Texture lifecycle ─────────────────────────────────────────────

server.registerTool(
    "create_gui",
    {
        description:
            "Create a new empty GUI (AdvancedDynamicTexture) in memory. This is always the first step. " +
            "The GUI starts with an empty root container; add controls to 'root' to begin building.",
        inputSchema: {
            name: z.string().optional().describe("Unique name for this GUI (e.g. 'MainHUD', 'SettingsPanel')"),
            guiName: z.string().optional().describe("Alias for name — unique name for this GUI"),
            width: z.number().default(1920).describe("Texture width in pixels"),
            height: z.number().default(1080).describe("Texture height in pixels"),
            isFullscreen: z.boolean().default(true).describe("Whether this is a fullscreen overlay GUI"),
            idealWidth: z.number().optional().describe("Ideal width for adaptive scaling (optional)"),
            idealHeight: z.number().optional().describe("Ideal height for adaptive scaling (optional)"),
        },
    },
    async ({ name, guiName, width, height, isFullscreen, idealWidth, idealHeight }) => {
        let resolvedName: string;
        try {
            resolvedName = ResolveDefinedInput({
                candidates: [
                    { label: "name", value: name },
                    { label: "guiName", value: guiName },
                ],
            });
        } catch (e) {
            return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
        manager.createTexture(resolvedName, { width, height, isFullscreen, idealWidth, idealHeight });
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(resolvedName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return {
            content: [
                {
                    type: "text",
                    text: `Created GUI "${resolvedName}" (${width}×${height}, fullscreen: ${isFullscreen}). The root container is named "root". Add controls to it with add_control.\n\nMCP Session URL: ${sessionUrl}`,
                },
            ],
        };
    }
);

server.registerTool(
    "delete_gui",
    { description: "Delete a GUI texture from memory.", inputSchema: { name: z.string().describe("Name of the GUI to delete") } },
    async ({ name }) => {
        const ok = manager.deleteTexture(name);
        if (ok) {
            sessionController.closeSessionForName(name);
        }
        return { content: [{ type: "text", text: ok ? `Deleted "${name}".` : `GUI "${name}" not found.` }] };
    }
);

server.registerTool("clear_all", { description: "Remove all GUI textures from memory, resetting the server to a clean state." }, async () => {
    const names = manager.listTextures();
    manager.clearAll();
    for (const name of names) {
        sessionController.closeSessionForName(name);
    }
    return {
        content: [{ type: "text", text: names.length > 0 ? `Cleared ${names.length} GUI(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty." }],
    };
});

server.registerTool("list_guis", { description: "List all GUI textures currently in memory." }, async () => {
    const names = manager.listTextures();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `GUIs in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No GUIs in memory.",
            },
        ],
    };
});

server.registerTool(
    "get_session_url",
    {
        description: "Get or create a live-session URL for a GUI. The URL can be pasted into the GUI Editor MCP session panel.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI"),
        },
    },
    async ({ guiName }) => {
        const guis = manager.listTextures();
        if (!guis.includes(guiName)) {
            return CreateErrorResponse(`GUI "${guiName}" not found.`);
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(guiName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(`MCP Session URL: ${sessionUrl}`);
    }
);

server.registerTool(
    "start_session",
    {
        description: "Start a live editor session for a GUI and return its URL.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI"),
        },
    },
    async ({ guiName }) => {
        const guis = manager.listTextures();
        if (!guis.includes(guiName)) {
            return CreateErrorResponse(`GUI "${guiName}" not found.`);
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(guiName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return CreateTextResponse(`Started GUI editor session for "${guiName}".\n\nMCP Session URL: ${sessionUrl}`);
    }
);

server.registerTool(
    "close_session",
    {
        description: "Close the live editor session for a GUI without stopping the MCP server.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI"),
        },
    },
    async ({ guiName }) => {
        const closed = sessionController.closeSessionForName(guiName);
        return CreateTextResponse(closed ? `Closed MCP session for "${guiName}".` : `No active MCP session found for "${guiName}".`);
    }
);

server.registerTool("stop_session_server", { description: "Stop the local GUI MCP HTTP/SSE session server and close all active sessions." }, async () => {
    await sessionController.stopAsync();
    return CreateTextResponse("GUI MCP session server stopped.");
});

// ── Control operations ────────────────────────────────────────────────

server.registerTool(
    "add_control",
    {
        description:
            "Add a new GUI control to a GUI texture. Returns the control's name for use in further operations. " +
            "The control is added as a child of the specified parent (defaults to 'root'). " +
            "For Grid parents, you can specify gridRow and gridColumn to place the control in a specific cell.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            controlType: z
                .string()
                .describe(
                    "The control type from the catalog (e.g. 'TextBlock', 'Rectangle', 'Button', 'Slider', 'Grid', 'StackPanel'). " +
                        "Use list_control_types to see all available types."
                ),
            controlName: z.string().optional().describe("Name for the control (must be unique within the GUI). Auto-generated if omitted."),
            name: z.string().optional().describe("Alias for controlName — name for the control."),
            parentName: z.string().default("root").describe("Name of the parent container to add this control to. Defaults to 'root'."),
            properties: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Key-value properties to set on the control. Examples: " +
                        '{ text: "Hello", fontSize: "24px", color: "white" } for TextBlock, ' +
                        '{ background: "#333", cornerRadius: 10, thickness: 2 } for Rectangle, ' +
                        "{ minimum: 0, maximum: 100, value: 50 } for Slider, " +
                        '{ buttonText: "Click me", background: "#4CAF50" } for Button (buttonText creates the internal TextBlock), ' +
                        '{ buttonImage: "icon.png" } for Button with image.'
                ),
            // Gap 16 — convenience aliases for common control properties at top level
            text: z.string().optional().describe("Shorthand for properties.text (TextBlock, Button)"),
            fontSize: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.fontSize"),
            color: z.string().optional().describe("Shorthand for properties.color"),
            background: z.string().optional().describe("Shorthand for properties.background"),
            width: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.width"),
            height: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.height"),
            top: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.top"),
            left: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.left"),
            buttonText: z.string().optional().describe("Shorthand for properties.buttonText (Button)"),
            isVertical: z.boolean().optional().describe("Shorthand for properties.isVertical (StackPanel)"),
            thickness: z.number().optional().describe("Shorthand for properties.thickness"),
            cornerRadius: z.number().optional().describe("Shorthand for properties.cornerRadius"),
            horizontalAlignment: z.number().optional().describe("Shorthand for properties.horizontalAlignment (0=left,1=right,2=center)"),
            verticalAlignment: z.number().optional().describe("Shorthand for properties.verticalAlignment (0=top,1=bottom,2=center)"),
            gridRow: z.number().optional().describe("Row index when adding to a Grid parent (0-based)"),
            gridColumn: z.number().optional().describe("Column index when adding to a Grid parent (0-based)"),
        },
    },
    async ({
        guiName,
        controlType,
        controlName,
        name: nameAlias,
        parentName,
        properties,
        gridRow,
        gridColumn,
        text,
        fontSize,
        color,
        background,
        width,
        height,
        top,
        left,
        buttonText,
        isVertical,
        thickness,
        cornerRadius,
        horizontalAlignment,
        verticalAlignment,
    }) => {
        // Gap 17 — resolve name alias for controlName
        const resolvedControlName = controlName ?? nameAlias;
        // Gap 16 — merge top-level convenience properties into properties object
        const mergedProps: Record<string, unknown> = { ...((properties as Record<string, unknown>) || {}) };
        const aliases: Record<string, unknown> = {
            text,
            fontSize,
            color,
            background,
            width,
            height,
            top,
            left,
            buttonText,
            isVertical,
            thickness,
            cornerRadius,
            horizontalAlignment,
            verticalAlignment,
        };
        for (const [k, v] of Object.entries(aliases)) {
            if (v !== undefined && !(k in mergedProps)) {
                mergedProps[k] = v;
            }
        }
        // Gap 49 fix: auto-map text -> buttonText for Button controls
        if ((controlType === "Button" || controlType === "FocusableButton") && mergedProps.text !== undefined && mergedProps.buttonText === undefined) {
            mergedProps.buttonText = mergedProps.text;
            delete mergedProps.text;
        }
        const resolvedProps = Object.keys(mergedProps).length > 0 ? mergedProps : (properties as Record<string, unknown>);
        const result = manager.addControl(guiName, controlType, resolvedControlName, parentName, resolvedProps, gridRow, gridColumn);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        _notifyIfSession(guiName);
        const cellInfo = gridRow !== undefined || gridColumn !== undefined ? ` in cell [${gridRow ?? 0}, ${gridColumn ?? 0}]` : "";
        const lines = [`Added ${controlType} "${result.name}" to "${parentName}"${cellInfo}. Use "${result.name}" to reference this control.`];
        if (result.warnings) {
            lines.push("", "Warnings:", ...result.warnings);
        }
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
    "remove_control",
    {
        description: "Remove a control (and all its descendants) from the GUI. Use describe_gui to find valid control names.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            controlName: z.string().describe("Name of the control to remove"),
        },
    },
    async ({ guiName, controlName }) => {
        const result = manager.removeControl(guiName, controlName);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed "${controlName}" and all its children.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_control_properties",
    {
        description:
            "Set or update properties on an existing control. Use get_control_type_info to discover available properties for the control's type. " +
            "Common base properties: width, height, color, fontSize, text, background, isVisible, horizontalAlignment, verticalAlignment. " +
            "For Buttons, use 'buttonText' to update the internal TextBlock's text.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            controlName: z.string().describe("Name of the control to modify"),
            properties: z
                .record(z.string(), z.unknown())
                .describe(
                    "Key-value properties to set. Any base Control property (width, height, color, fontSize, etc.) " +
                        "or type-specific property (text, source, isChecked, minimum, maximum, etc.). " +
                        "For Buttons, use 'buttonText' to update the internal TextBlock's text."
                ),
        },
    },
    async ({ guiName, controlName, properties }) => {
        const result = manager.setControlProperties(guiName, controlName, properties as Record<string, unknown>);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated "${controlName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "reparent_control",
    {
        description: "Move a control to a different parent container.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            controlName: z.string().describe("Name of the control to move"),
            newParentName: z.string().describe("Name of the new parent container"),
            gridRow: z.number().optional().describe("Row index if new parent is a Grid"),
            gridColumn: z.number().optional().describe("Column index if new parent is a Grid"),
        },
    },
    async ({ guiName, controlName, newParentName, gridRow, gridColumn }) => {
        const result = manager.reparentControl(guiName, controlName, newParentName, gridRow, gridColumn);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        const cellInfo = gridRow !== undefined || gridColumn !== undefined ? ` in cell [${gridRow ?? 0}, ${gridColumn ?? 0}]` : "";
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Moved "${controlName}" to "${newParentName}"${cellInfo}.` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

// ── Grid operations ───────────────────────────────────────────────────

server.registerTool(
    "add_grid_row",
    {
        description: "Add a row definition to a Grid control. Call this before placing controls in that row.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            value: z.number().describe("Size value — fraction (0–1) if isPixel=false, or pixel count if isPixel=true"),
            isPixel: z.boolean().default(false).describe("Whether the value is in pixels (true) or a fraction (false)"),
        },
    },
    async ({ guiName, gridName, value, isPixel }) => {
        const result = manager.addGridRow(guiName, gridName, value, isPixel);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        const unitStr = isPixel ? `${value}px` : `${value} (fraction)`;
        return {
            content: [{ type: "text", text: result === "OK" ? `Added row (${unitStr}) to Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "add_grid_column",
    {
        description: "Add a column definition to a Grid control. Call this before placing controls in that column.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            value: z.number().describe("Size value — fraction (0–1) if isPixel=false, or pixel count if isPixel=true"),
            isPixel: z.boolean().default(false).describe("Whether the value is in pixels (true) or a fraction (false)"),
        },
    },
    async ({ guiName, gridName, value, isPixel }) => {
        const result = manager.addGridColumn(guiName, gridName, value, isPixel);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        const unitStr = isPixel ? `${value}px` : `${value} (fraction)`;
        return {
            content: [{ type: "text", text: result === "OK" ? `Added column (${unitStr}) to Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_grid_row",
    {
        description: "Update an existing row definition on a Grid (changes the size of the row at the given index). Use describe_gui to see current grid definitions.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            index: z.number().describe("Row index (0-based)"),
            value: z.number().describe("New size value"),
            isPixel: z.boolean().default(false).describe("Whether the value is in pixels"),
        },
    },
    async ({ guiName, gridName, index, value, isPixel }) => {
        const result = manager.setGridRow(guiName, gridName, index, value, isPixel);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated row ${index} on Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_grid_column",
    {
        description: "Update an existing column definition on a Grid (changes the size of the column at the given index). Use describe_gui to see current grid definitions.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            index: z.number().describe("Column index (0-based)"),
            value: z.number().describe("New size value"),
            isPixel: z.boolean().default(false).describe("Whether the value is in pixels"),
        },
    },
    async ({ guiName, gridName, index, value, isPixel }) => {
        const result = manager.setGridColumn(guiName, gridName, index, value, isPixel);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated column ${index} on Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "remove_grid_row",
    {
        description: "Remove a row definition from a Grid. WARNING: this shifts subsequent row indices downward and may orphan controls that were in the removed row.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            index: z.number().describe("Row index to remove (0-based)"),
        },
    },
    async ({ guiName, gridName, index }) => {
        const result = manager.removeGridRow(guiName, gridName, index);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed row ${index} from Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "remove_grid_column",
    {
        description: "Remove a column definition from a Grid. WARNING: this shifts subsequent column indices and may orphan controls that were in the removed column.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            index: z.number().describe("Column index to remove (0-based)"),
        },
    },
    async ({ guiName, gridName, index }) => {
        const result = manager.removeGridColumn(guiName, gridName, index);
        if (result === "OK") {
            _notifyIfSession(guiName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed column ${index} from Grid "${gridName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ───────────────────────────────────────────────────────

server.registerTool(
    "describe_gui",
    {
        description: "Get a human-readable description of the GUI, including the full control tree with properties.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture to describe"),
        },
    },
    async ({ guiName }) => {
        const desc = manager.describeTexture(guiName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "describe_control",
    {
        description: "Get detailed information about a specific control, including its properties, parent, and children.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            controlName: z.string().describe("Name of the control to describe"),
        },
    },
    async ({ guiName, controlName }) => {
        const desc = manager.describeControl(guiName, controlName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "list_control_types",
    {
        description: "List all available GUI control types, grouped by category.",
        inputSchema: {
            category: z.string().optional().describe("Optionally filter by category (Container, Layout, Text, Input, Button, Indicator, Shape, Image, Misc)"),
        },
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(ControlRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key}: ${info.description.split(".")[0]}`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: matching.length > 0 ? `## ${category} Controls\n${matching}` : `No controls found in category "${category}".`,
                    },
                ],
            };
        }
        return { content: [{ type: "text", text: GetControlCatalogSummary() }] };
    }
);

server.registerTool(
    "get_control_type_info",
    {
        description: "Get detailed info about a specific control type — its properties, whether it's a container, and description.",
        inputSchema: {
            controlType: z.string().describe("The control type name (e.g. 'TextBlock', 'Grid', 'Slider')"),
        },
    },
    async ({ controlType }) => {
        const info = GetControlTypeDetails(controlType);
        if (!info) {
            return {
                content: [{ type: "text", text: `Control type "${controlType}" not found. Use list_control_types to see available types.` }],
                isError: true,
            };
        }

        const lines: string[] = [];
        lines.push(`## ${controlType}`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Container: ${info.isContainer ? "Yes (can hold children)" : "No (leaf control)"}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Type-Specific Properties:");
        if (Object.keys(info.properties).length === 0) {
            lines.push("  (none beyond base properties)");
        }
        for (const [k, v] of Object.entries(info.properties)) {
            const def = v.defaultValue !== undefined ? ` [default: ${JSON.stringify(v.defaultValue)}]` : "";
            lines.push(`  • ${k} (${v.type}): ${v.description}${def}`);
        }

        lines.push("\n### Base Properties (available on all controls):");
        lines.push("  width, height, left, top, color, alpha, fontSize, fontFamily, fontWeight,");
        lines.push("  horizontalAlignment, verticalAlignment, paddingLeft/Right/Top/Bottom,");
        lines.push("  isVisible, isEnabled, zIndex, rotation, scaleX, scaleY, shadow*, clipChildren, clipContent");

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Validation ────────────────────────────────────────────────────────

server.registerTool(
    "validate_gui",
    {
        description: "Run validation checks on a GUI. Reports issues like empty containers, invalid Grid cell assignments, and duplicates.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI to validate"),
        },
    },
    async ({ guiName }) => {
        const issues = manager.validateTexture(guiName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ───────────────────────────────────────────────────

server.registerTool(
    "export_gui_json",
    {
        description:
            "Export the GUI as Babylon.js-compatible JSON. This JSON can be loaded with " +
            "AdvancedDynamicTexture.parseSerializedObject() or AdvancedDynamicTexture.ParseFromFileAsync(). " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned " +
            "(avoids large JSON payloads in the conversation context).",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI to export"),
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ guiName, outputFile }) => {
        return CreateJsonExportResponse({
            jsonText: manager.exportJSON(guiName),
            outputFile,
            missingMessage: `GUI "${guiName}" not found.`,
            fileLabel: "GUI JSON",
        });
    }
);

server.registerTool(
    "import_gui_json",
    {
        description:
            "Import existing GUI JSON into memory for editing. You can then modify controls, rearrange hierarchy, etc. " +
            "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            guiName: z.string().describe("Name to give the imported GUI"),
            json: CreateInlineJsonSchema(z, "The Babylon.js GUI JSON string to import"),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a file containing the GUI JSON to import (alternative to inline json)"),
        },
    },
    async ({ guiName, json, jsonFile }) => {
        return CreateJsonImportResponse({
            json,
            jsonFile,
            fileDescription: "GUI JSON file",
            importJson: (jsonText) => _importGuiJson(guiName, jsonText),
            describeImported: () => manager.describeTexture(guiName),
        });
    }
);

server.registerTool(
    "import_from_snippet",
    {
        description:
            "Import a GUI layout from the Babylon.js Snippet Server by its snippet ID. " +
            "The snippet is fetched, validated as a gui type, and loaded into memory for editing. " +
            'Snippet IDs look like "ABC123" or "ABC123#2" (with revision).',
        inputSchema: {
            guiName: z.string().describe("Name to give the imported GUI in memory"),
            snippetId: CreateSnippetIdSchema(z),
        },
    },
    async ({ guiName, snippetId }) => {
        return await RunSnippetResponse({
            snippetId,
            loadSnippet: async (requestedSnippetId: string) => (await LoadSnippet(requestedSnippetId)) as IDataSnippetResult,
            createResponse: (snippetResult: IDataSnippetResult) =>
                CreateTypedSnippetImportResponse({
                    snippetId,
                    snippetResult,
                    expectedType: "gui",
                    importJson: (jsonText) => _importGuiJson(guiName, jsonText),
                    describeImported: () => manager.describeTexture(guiName),
                    successMessage: `Imported snippet "${snippetId}" as "${guiName}" successfully.`,
                }),
        });
    }
);

// ── Batch operations ──────────────────────────────────────────────────

server.registerTool(
    "add_controls_batch",
    {
        description:
            "Add multiple controls at once (processed sequentially, so earlier controls can be parents for later ones). " +
            "More efficient than calling add_control repeatedly. If one control fails, the rest still proceed.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            controls: z
                .array(
                    z.object({
                        controlType: z.string().describe("Control type name"),
                        controlName: z.string().optional().describe("Name for the control"),
                        name: z.string().optional().describe("Alias for controlName"),
                        parentName: z.string().default("root").describe("Parent container name"),
                        properties: z.record(z.string(), z.unknown()).optional().describe("Control properties"),
                        // Gap 16 — convenience aliases for common control properties
                        text: z.string().optional().describe("Shorthand for properties.text"),
                        fontSize: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.fontSize"),
                        color: z.string().optional().describe("Shorthand for properties.color"),
                        background: z.string().optional().describe("Shorthand for properties.background"),
                        width: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.width"),
                        height: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.height"),
                        top: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.top"),
                        left: z.union([z.string(), z.number()]).optional().describe("Shorthand for properties.left"),
                        buttonText: z.string().optional().describe("Shorthand for properties.buttonText"),
                        isVertical: z.boolean().optional().describe("Shorthand for properties.isVertical"),
                        thickness: z.number().optional().describe("Shorthand for properties.thickness"),
                        cornerRadius: z.number().optional().describe("Shorthand for properties.cornerRadius"),
                        horizontalAlignment: z.number().optional().describe("Shorthand for properties.horizontalAlignment"),
                        verticalAlignment: z.number().optional().describe("Shorthand for properties.verticalAlignment"),
                        gridRow: z.number().optional().describe("Grid row index"),
                        gridColumn: z.number().optional().describe("Grid column index"),
                    })
                )
                .describe("Array of controls to add"),
        },
    },
    async ({ guiName, controls }) => {
        const results: string[] = [];
        let didMutate = false;
        for (const def of controls) {
            // Gap 17 — resolve name alias
            const resolvedName = def.controlName ?? def.name;
            // Gap 16 — merge top-level convenience properties into properties
            const mergedProps: Record<string, unknown> = { ...((def.properties as Record<string, unknown>) || {}) };
            const aliases: Record<string, unknown> = {
                text: def.text,
                fontSize: def.fontSize,
                color: def.color,
                background: def.background,
                width: def.width,
                height: def.height,
                top: def.top,
                left: def.left,
                buttonText: def.buttonText,
                isVertical: def.isVertical,
                thickness: def.thickness,
                cornerRadius: def.cornerRadius,
                horizontalAlignment: def.horizontalAlignment,
                verticalAlignment: def.verticalAlignment,
            };
            for (const [k, v] of Object.entries(aliases)) {
                if (v !== undefined && !(k in mergedProps)) {
                    mergedProps[k] = v;
                }
            }
            // Gap 49 fix: auto-map text -> buttonText for Button controls
            if ((def.controlType === "Button" || def.controlType === "FocusableButton") && mergedProps.text !== undefined && mergedProps.buttonText === undefined) {
                mergedProps.buttonText = mergedProps.text;
                delete mergedProps.text;
            }
            const resolvedProps = Object.keys(mergedProps).length > 0 ? mergedProps : (def.properties as Record<string, unknown>);
            const result = manager.addControl(guiName, def.controlType, resolvedName, def.parentName, resolvedProps, def.gridRow, def.gridColumn);
            if (typeof result === "string") {
                results.push(`Error adding ${def.controlType}: ${result}`);
            } else {
                didMutate = true;
                let line = `"${result.name}" (${def.controlType}) → "${def.parentName}"`;
                if (result.warnings) {
                    line += `\n  ⚠ ${result.warnings.join("\n  ⚠ ")}`;
                }
                results.push(line);
            }
        }
        if (didMutate) {
            _notifyIfSession(guiName);
        }
        return { content: [{ type: "text", text: `Added controls:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "setup_grid",
    {
        description: "Configure a Grid all at once: add multiple row and column definitions in a single call.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI texture"),
            gridName: z.string().describe("Name of the Grid control"),
            rows: z
                .array(
                    z.object({
                        value: z.number().describe("Size value"),
                        isPixel: z.boolean().default(false).describe("Pixel (true) or fraction (false)"),
                    })
                )
                .describe("Array of row definitions"),
            columns: z
                .array(
                    z.object({
                        value: z.number().describe("Size value"),
                        isPixel: z.boolean().default(false).describe("Pixel (true) or fraction (false)"),
                    })
                )
                .describe("Array of column definitions"),
        },
    },
    async ({ guiName, gridName, rows, columns }) => {
        const results: string[] = [];
        let didMutate = false;
        for (const row of rows) {
            const r = manager.addGridRow(guiName, gridName, row.value, row.isPixel);
            if (r !== "OK") {
                results.push(`Row error: ${r}`);
            } else {
                didMutate = true;
            }
        }
        for (const col of columns) {
            const c = manager.addGridColumn(guiName, gridName, col.value, col.isPixel);
            if (c !== "OK") {
                results.push(`Column error: ${c}`);
            } else {
                didMutate = true;
            }
        }

        if (didMutate) {
            _notifyIfSession(guiName);
        }

        if (results.length > 0) {
            return { content: [{ type: "text", text: `Errors:\n${results.join("\n")}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Configured Grid "${gridName}": ${rows.length} rows, ${columns.length} columns.`,
                },
            ],
        };
    }
);

// ── Snippet server ──────────────────────────────────────────────────────

server.registerTool(
    "save_snippet",
    {
        description:
            "Save the GUI layout to the Babylon.js Snippet Server and return the snippet ID and version. " +
            "The snippet can later be loaded in the GUI Editor via its snippet ID, or fetched with import_from_snippet. " +
            "To create a new revision of an existing snippet, pass the previous snippetId.",
        inputSchema: {
            guiName: z.string().describe("Name of the GUI to save"),
            snippetId: z.string().optional().describe('Optional existing snippet ID to create a new revision of (e.g. "ABC123" or "ABC123#1")'),
            name: z.string().optional().describe("Optional human-readable title for the snippet"),
            description: z.string().optional().describe("Optional description"),
            tags: z.string().optional().describe("Optional comma-separated tags"),
        },
    },
    async ({ guiName, snippetId, name, description, tags }) => {
        const json = manager.exportJSON(guiName);
        if (!json) {
            return { content: [{ type: "text", text: `GUI "${guiName}" not found.` }], isError: true };
        }
        try {
            const result = await SaveSnippet({ type: "gui", data: ParseJsonText({ jsonText: json, jsonLabel: "GUI JSON" }) }, { snippetId, metadata: { name, description, tags } });
            return {
                content: [
                    {
                        type: "text",
                        text: `Saved GUI "${guiName}" to snippet server.\n\nSnippet ID: ${result.id}\nVersion: ${result.version}\nFull ID: ${result.snippetId}`,
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error saving snippet: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js GUI MCP Server running on stdio");
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
