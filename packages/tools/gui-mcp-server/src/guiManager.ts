/* eslint-disable babylonjs/available */
/**
 * GuiManager – holds an in-memory representation of one or more
 * AdvancedDynamicTexture GUIs that the MCP tools build up incrementally.
 * When the user is satisfied the GUI can be exported as native Babylon.js
 * GUI JSON that `AdvancedDynamicTexture.parseSerializedObject()` understands.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – pure JSON data model.
 * 2. **Mirrors the serialisation format** so export is essentially a direct dump.
 * 3. **Stateful & idempotent** – controls can be added, removed, moved, etc.
 */

import { ValidateGuiAttachmentPayload } from "@tools/mcp-server-core";

import { ControlRegistry, BaseControlProperties, type IControlTypeInfo } from "./catalog.js";

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Serialized form of a single GUI control.
 * This mirrors what `Control.serialize()` produces.
 */
export interface ISerializedControl {
    /** Unique name within the GUI */
    name: string;
    /** Babylon.js className string (e.g. "TextBlock", "Rectangle") */
    className: string;
    /** Children (only present on containers) */
    children?: ISerializedControl[];
    /** For Grid – row definitions */
    rows?: Array<{ value: number; unit: number }>;
    /** For Grid – column definitions */
    columns?: Array<{ value: number; unit: number }>;
    /** For Grid children – their cell position tags */
    tags?: string[];
    /** For Button – name of the internal TextBlock child */
    textBlockName?: string;
    /** For Button – name of the internal Image child */
    imageName?: string;
    /** All other serialized properties (color, fontSize, text, etc.) */
    [key: string]: unknown;
}

/**
 * Represents a complete GUI texture in memory.
 */
export interface IGuiTexture {
    /** Unique name */
    name: string;
    /** Width of the texture in pixels */
    width: number;
    /** Height of the texture in pixels */
    height: number;
    /** Whether this is fullscreen GUI */
    isFullscreen: boolean;
    /** Optional ideal width for adaptive scaling */
    idealWidth?: number;
    /** Optional ideal height for adaptive scaling */
    idealHeight?: number;
    /** The root container */
    root: ISerializedControl;
    /** Next auto-incrementing control id (internal) */
    _nextId: number;
    /** Flat index of all controls by name for fast lookup */
    _controlIndex: Map<string, ISerializedControl>;
    /** Map from child name → parent name for hierarchy traversal */
    _parentIndex: Map<string, string>;
    /** For Grid: map from child name → "row:column" */
    _gridCellIndex: Map<string, string>;
}

// ─── Manager ──────────────────────────────────────────────────────────────

/**
 *
 */
export class GuiManager {
    private _textures = new Map<string, IGuiTexture>();

    // ── Texture lifecycle ─────────────────────────────────────────────

    /**
     * Create a new GUI texture (AdvancedDynamicTexture) in memory.
     * @param name - The name for the new texture
     * @param options - Optional configuration for width, height, fullscreen, etc.
     */
    createTexture(
        name: string,
        options?: {
            /**
             *
             */
            width?: number /**
             *
             */;
            height?: number /**
             *
             */;
            isFullscreen?: boolean /**
             *
             */;
            idealWidth?: number /**
             *
             */;
            idealHeight?: number;
        }
    ): void {
        const width = options?.width ?? 1920;
        const height = options?.height ?? 1080;
        const isFullscreen = options?.isFullscreen ?? true;

        const root: ISerializedControl = {
            name: "root",
            className: "Container",
            children: [],
        };

        const tex: IGuiTexture = {
            name,
            width,
            height,
            isFullscreen,
            idealWidth: options?.idealWidth,
            idealHeight: options?.idealHeight,
            root,
            _nextId: 1,
            _controlIndex: new Map([["root", root]]),
            _parentIndex: new Map(),
            _gridCellIndex: new Map(),
        };

        this._textures.set(name, tex);
    }

    deleteTexture(name: string): boolean {
        return this._textures.delete(name);
    }

    /**
     * Remove all GUI textures from memory, resetting the manager to its initial state.
     */
    clearAll(): void {
        this._textures.clear();
    }

    listTextures(): string[] {
        return Array.from(this._textures.keys());
    }

    getTexture(name: string): IGuiTexture | undefined {
        return this._textures.get(name);
    }

    // ── Control CRUD ──────────────────────────────────────────────────

    /**
     * Add a control to the GUI.
     * @param textureName - The name of the target GUI texture
     * @param controlType - The type of control to create
     * @param controlName - Optional custom name for the control
     * @param parentName - Optional parent control name (defaults to "root")
     * @param properties - Optional properties to set on the control
     * @param gridRow - Optional grid row index for Grid placement
     * @param gridColumn - Optional grid column index for Grid placement
     * @returns The created control's name, or an error string.
     */
    addControl(
        textureName: string,
        controlType: string,
        controlName?: string,
        parentName?: string,
        properties?: Record<string, unknown>,
        gridRow?: number,
        gridColumn?: number
    ):
        | {
              /**
               *
               */
              name: string;
              /**
               *
               */
              warnings?: string[];
          }
        | string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const typeInfo = ControlRegistry[controlType];
        if (!typeInfo) {
            return `Unknown control type "${controlType}". Use list_control_types to see available types.`;
        }

        // Generate or validate name
        const name = controlName ?? `${controlType.toLowerCase()}_${tex._nextId}`;
        if (tex._controlIndex.has(name)) {
            return `A control named "${name}" already exists in this GUI.`;
        }

        // Build the serialized control
        const ctrl: ISerializedControl = {
            name,
            className: typeInfo.className,
        };

        // Containers get a children array
        if (typeInfo.isContainer) {
            ctrl.children = [];
        }

        // Grid gets empty row/column definitions and tags
        if (controlType === "Grid") {
            ctrl.rows = [];
            ctrl.columns = [];
            ctrl.tags = [];
        }

        // Apply user properties
        if (properties) {
            this._applyProperties(ctrl, typeInfo, properties);
        }

        // Special handling for Button with inline text/image
        if (controlType === "Button" || controlType === "FocusableButton") {
            this._initButtonChildren(ctrl, tex, properties);
        }

        // Determine parent
        const targetParent = parentName ?? "root";
        const parent = tex._controlIndex.get(targetParent);
        if (!parent) {
            return `Parent "${targetParent}" not found.`;
        }
        if (!parent.children) {
            const pType = ControlRegistry[parent.className];
            if (!pType?.isContainer) {
                return `Parent "${targetParent}" (${parent.className}) is not a container and cannot hold children.`;
            }
            parent.children = [];
        }

        // Grid cell placement
        if (parent.className === "Grid" && (gridRow !== undefined || gridColumn !== undefined)) {
            const row = gridRow ?? 0;
            const col = gridColumn ?? 0;
            const tag = `${row}:${col}`;
            tex._gridCellIndex.set(name, tag);
            if (!parent.tags) {
                parent.tags = [];
            }
            parent.tags.push(tag);
        }

        parent.children.push(ctrl);
        tex._controlIndex.set(name, ctrl);
        tex._parentIndex.set(name, targetParent);
        tex._nextId++;

        // ── Warnings ──────────────────────────────────────────────────
        const warnings: string[] = [];

        // Warn about Grid children without explicit cell placement
        if (parent.className === "Grid" && gridRow === undefined && gridColumn === undefined) {
            warnings.push(
                `⚠ Control "${name}" was added to Grid "${targetParent}" without specifying gridRow/gridColumn. ` +
                    `It will default to cell [0, 0]. Set gridRow and gridColumn explicitly to place it correctly.`
            );
        }

        // Warn about Grid children when Grid has no rows/columns defined
        if (parent.className === "Grid") {
            if (!parent.rows || parent.rows.length === 0) {
                warnings.push(`⚠ Grid "${targetParent}" has no row definitions yet. Use add_grid_row to define rows before adding children.`);
            }
            if (!parent.columns || parent.columns.length === 0) {
                warnings.push(`⚠ Grid "${targetParent}" has no column definitions yet. Use add_grid_column to define columns before adding children.`);
            }
        }

        // Warn about Button without buttonText
        if ((controlType === "Button" || controlType === "FocusableButton") && (!properties || properties.buttonText === undefined)) {
            warnings.push(`⚠ Button "${name}" has no buttonText. Set buttonText in properties to give it a label.`);
        }

        return { name, warnings: warnings.length > 0 ? warnings : undefined };
    }

    /**
     * Remove a control (and all its descendants) from the GUI.
     * @param textureName - The name of the target GUI texture
     * @param controlName - The name of the control to remove
     * @returns Status or error message
     */
    removeControl(textureName: string, controlName: string): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }
        if (controlName === "root") {
            return "Cannot remove the root container.";
        }

        const ctrl = tex._controlIndex.get(controlName);
        if (!ctrl) {
            return `Control "${controlName}" not found.`;
        }

        // Remove from parent
        const parentName = tex._parentIndex.get(controlName);
        if (parentName) {
            const parent = tex._controlIndex.get(parentName);
            if (parent?.children) {
                const idx = parent.children.indexOf(ctrl);
                if (idx >= 0) {
                    parent.children.splice(idx, 1);
                    // Also remove the corresponding Grid tag
                    if (parent.tags && parent.className === "Grid") {
                        parent.tags.splice(idx, 1);
                    }
                }
            }
        }

        // Remove ctrl and all descendants from indices
        this._removeFromIndexRecursive(tex, controlName, ctrl);

        return "OK";
    }

    /**
     * Move a control to a different parent.
     * @param textureName - The name of the target GUI texture
     * @param controlName - The name of the control to move
     * @param newParentName - The name of the new parent control
     * @param gridRow - Optional grid row index for Grid placement
     * @param gridColumn - Optional grid column index for Grid placement
     * @returns Status or error message
     */
    reparentControl(textureName: string, controlName: string, newParentName: string, gridRow?: number, gridColumn?: number): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }
        if (controlName === "root") {
            return "Cannot reparent the root container.";
        }

        const ctrl = tex._controlIndex.get(controlName);
        if (!ctrl) {
            return `Control "${controlName}" not found.`;
        }

        const newParent = tex._controlIndex.get(newParentName);
        if (!newParent) {
            return `New parent "${newParentName}" not found.`;
        }

        const newParentType = ControlRegistry[newParent.className];
        if (!newParentType?.isContainer && !newParent.children) {
            return `"${newParentName}" (${newParent.className}) is not a container.`;
        }

        // Check for circular reference
        if (this._isDescendantOf(tex, newParentName, controlName)) {
            return `Cannot reparent: "${newParentName}" is a descendant of "${controlName}".`;
        }

        // Remove from old parent
        const oldParentName = tex._parentIndex.get(controlName);
        if (oldParentName) {
            const oldParent = tex._controlIndex.get(oldParentName);
            if (oldParent?.children) {
                const idx = oldParent.children.indexOf(ctrl);
                if (idx >= 0) {
                    oldParent.children.splice(idx, 1);
                    if (oldParent.tags && oldParent.className === "Grid") {
                        oldParent.tags.splice(idx, 1);
                    }
                }
            }
        }

        // Add to new parent
        if (!newParent.children) {
            newParent.children = [];
        }

        if (newParent.className === "Grid" && (gridRow !== undefined || gridColumn !== undefined)) {
            const row = gridRow ?? 0;
            const col = gridColumn ?? 0;
            const tag = `${row}:${col}`;
            tex._gridCellIndex.set(controlName, tag);
            if (!newParent.tags) {
                newParent.tags = [];
            }
            newParent.tags.push(tag);
        } else {
            // Remove old grid tag if any
            tex._gridCellIndex.delete(controlName);
        }

        newParent.children.push(ctrl);
        tex._parentIndex.set(controlName, newParentName);

        return "OK";
    }

    /**
     * Set properties on a control.
     * @param textureName - The name of the target GUI texture
     * @param controlName - The name of the control to update
     * @param properties - Key-value pairs of properties to set
     * @returns Status or error message
     */
    setControlProperties(textureName: string, controlName: string, properties: Record<string, unknown>): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const ctrl = tex._controlIndex.get(controlName);
        if (!ctrl) {
            return `Control "${controlName}" not found.`;
        }

        const typeInfo = ControlRegistry[ctrl.className];
        this._applyProperties(ctrl, typeInfo, properties);

        // Update Button internal children if relevant
        if ((ctrl.className === "Button" || ctrl.className === "FocusableButton") && ctrl.children) {
            if (properties.buttonText !== undefined) {
                const textChild = ctrl.children.find((c) => c.className === "TextBlock");
                if (textChild) {
                    textChild.text = properties.buttonText as string;
                }
            }
            if (properties.buttonImage !== undefined) {
                const imgChild = ctrl.children.find((c) => c.className === "Image");
                if (imgChild) {
                    imgChild.source = properties.buttonImage as string;
                }
            }
        }

        return "OK";
    }

    // ── Grid operations ───────────────────────────────────────────────

    /**
     * Add a row definition to a Grid control.
     * @param textureName - The name of the target GUI texture
     * @param gridName - The name of the Grid control
     * @param value - Size value (fraction 0–1 or pixel size)
     * @param isPixel - If true, value is in pixels; if false, it's a fraction
     * @returns Status or error message
     */
    addGridRow(textureName: string, gridName: string, value: number, isPixel: boolean): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const grid = tex._controlIndex.get(gridName);
        if (!grid) {
            return `Control "${gridName}" not found.`;
        }
        if (grid.className !== "Grid") {
            return `"${gridName}" is not a Grid.`;
        }

        if (!grid.rows) {
            grid.rows = [];
        }
        grid.rows.push({ value, unit: isPixel ? 1 : 0 });
        return "OK";
    }

    /**
     * Add a column definition to a Grid control.
     * @param textureName - The name of the target GUI texture
     * @param gridName - The name of the Grid control
     * @param value - Size value (fraction 0–1 or pixel size)
     * @param isPixel - If true, value is in pixels; if false, it's a fraction
     * @returns Status or error message
     */
    addGridColumn(textureName: string, gridName: string, value: number, isPixel: boolean): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const grid = tex._controlIndex.get(gridName);
        if (!grid) {
            return `Control "${gridName}" not found.`;
        }
        if (grid.className !== "Grid") {
            return `"${gridName}" is not a Grid.`;
        }

        if (!grid.columns) {
            grid.columns = [];
        }
        grid.columns.push({ value, unit: isPixel ? 1 : 0 });
        return "OK";
    }

    /**
     * Update an existing row definition.
     * @param textureName - The name of the target GUI texture
     * @param gridName - The name of the Grid control
     * @param index - The row index to update
     * @param value - New size value (fraction 0–1 or pixel size)
     * @param isPixel - If true, value is in pixels; if false, it's a fraction
     * @returns Status or error message
     */
    setGridRow(textureName: string, gridName: string, index: number, value: number, isPixel: boolean): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const grid = tex._controlIndex.get(gridName);
        if (!grid || grid.className !== "Grid") {
            return `"${gridName}" is not a Grid.`;
        }
        if (!grid.rows || index < 0 || index >= grid.rows.length) {
            return `Row index ${index} out of range.`;
        }

        grid.rows[index] = { value, unit: isPixel ? 1 : 0 };
        return "OK";
    }

    /**
     * Update an existing column definition.
     * @param textureName - The name of the target GUI texture
     * @param gridName - The name of the Grid control
     * @param index - The column index to update
     * @param value - New size value (fraction 0–1 or pixel size)
     * @param isPixel - If true, value is in pixels; if false, it's a fraction
     * @returns Status or error message
     */
    setGridColumn(textureName: string, gridName: string, index: number, value: number, isPixel: boolean): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const grid = tex._controlIndex.get(gridName);
        if (!grid || grid.className !== "Grid") {
            return `"${gridName}" is not a Grid.`;
        }
        if (!grid.columns || index < 0 || index >= grid.columns.length) {
            return `Column index ${index} out of range.`;
        }

        grid.columns[index] = { value, unit: isPixel ? 1 : 0 };
        return "OK";
    }

    /**
     * Remove a row definition from a Grid.
     * @param textureName - The name of the target GUI texture
     * @param gridName - The name of the Grid control
     * @param index - The row index to remove
     * @returns Status or error message
     */
    removeGridRow(textureName: string, gridName: string, index: number): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const grid = tex._controlIndex.get(gridName);
        if (!grid || grid.className !== "Grid") {
            return `"${gridName}" is not a Grid.`;
        }
        if (!grid.rows || index < 0 || index >= grid.rows.length) {
            return `Row index ${index} out of range.`;
        }

        grid.rows.splice(index, 1);
        return "OK";
    }

    /**
     * Remove a column definition from a Grid.
     * @param textureName - The name of the target GUI texture
     * @param gridName - The name of the Grid control
     * @param index - The column index to remove
     * @returns Status or error message
     */
    removeGridColumn(textureName: string, gridName: string, index: number): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const grid = tex._controlIndex.get(gridName);
        if (!grid || grid.className !== "Grid") {
            return `"${gridName}" is not a Grid.`;
        }
        if (!grid.columns || index < 0 || index >= grid.columns.length) {
            return `Column index ${index} out of range.`;
        }

        grid.columns.splice(index, 1);
        return "OK";
    }

    // ── Query / Describe ──────────────────────────────────────────────

    /**
     * Get a human-readable description of the full GUI texture.
     * @param textureName - The name of the target GUI texture
     * @returns A formatted string describing the texture and its control tree
     */
    describeTexture(textureName: string): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`# GUI: ${tex.name}`);
        lines.push(`Size: ${tex.width}×${tex.height}  |  Fullscreen: ${tex.isFullscreen}`);
        if (tex.idealWidth) {
            lines.push(`Ideal width: ${tex.idealWidth}`);
        }
        if (tex.idealHeight) {
            lines.push(`Ideal height: ${tex.idealHeight}`);
        }
        lines.push(`Controls: ${tex._controlIndex.size}`);
        lines.push("");
        lines.push("## Control Tree");
        this._describeControlTree(tex, tex.root, lines, 0);

        return lines.join("\n");
    }

    /**
     * Get detailed info about a single control.
     * @param textureName - The name of the target GUI texture
     * @param controlName - The name of the control to describe
     * @returns A formatted string with control details
     */
    describeControl(textureName: string, controlName: string): string {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return `GUI texture "${textureName}" not found.`;
        }

        const ctrl = tex._controlIndex.get(controlName);
        if (!ctrl) {
            return `Control "${controlName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`## ${ctrl.name} (${ctrl.className})`);

        const parentName = tex._parentIndex.get(controlName) ?? "(root)";
        lines.push(`Parent: ${parentName}`);

        const gridCell = tex._gridCellIndex.get(controlName);
        if (gridCell) {
            lines.push(`Grid cell: row ${gridCell.split(":")[0]}, column ${gridCell.split(":")[1]}`);
        }

        // List all set properties
        lines.push("\n### Properties");
        for (const [key, value] of Object.entries(ctrl)) {
            if (key === "name" || key === "className" || key === "children" || key === "rows" || key === "columns" || key === "tags") {
                continue;
            }
            lines.push(`  ${key}: ${JSON.stringify(value)}`);
        }

        // List children if container
        if (ctrl.children && ctrl.children.length > 0) {
            lines.push(`\n### Children (${ctrl.children.length})`);
            for (const child of ctrl.children) {
                const cell = tex._gridCellIndex.get(child.name);
                const cellStr = cell ? ` [cell ${cell}]` : "";
                lines.push(`  • ${child.name} (${child.className})${cellStr}`);
            }
        }

        // Grid definitions
        if (ctrl.className === "Grid") {
            if (ctrl.rows && ctrl.rows.length > 0) {
                lines.push(`\n### Rows (${ctrl.rows.length})`);
                ctrl.rows.forEach((r, i) => {
                    const row = r as {
                        /**
                         *
                         */
                        value: number /**
                         *
                         */;
                        unit: number;
                    };
                    lines.push(`  [${i}] ${row.value}${row.unit === 1 ? "px" : ""}`);
                });
            }
            if (ctrl.columns && ctrl.columns.length > 0) {
                lines.push(`\n### Columns (${ctrl.columns.length})`);
                ctrl.columns.forEach((c, i) => {
                    const col = c as {
                        /**
                         *
                         */
                        value: number /**
                         *
                         */;
                        unit: number;
                    };
                    lines.push(`  [${i}] ${col.value}${col.unit === 1 ? "px" : ""}`);
                });
            }
        }

        return lines.join("\n");
    }

    // ── Validation ────────────────────────────────────────────────────

    /**
     * Run basic validation checks on the GUI.
     * @param textureName - The name of the target GUI texture
     * @returns An array of validation issue strings
     */
    validateTexture(textureName: string): string[] {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return [`GUI texture "${textureName}" not found.`];
        }

        const issues: string[] = [];

        // Check for empty GUI
        if (!tex.root.children || tex.root.children.length === 0) {
            issues.push("WARNING: GUI has no controls — root container is empty.");
        }

        // Check Grid consistency
        this._validateGrids(tex, tex.root, issues);

        // Check for name collisions (shouldn't happen with our index, but sanity check)
        const names = new Set<string>();
        this._collectNames(tex.root, names, issues);

        // Check for controls with no size (common mistake)
        for (const [, ctrl] of tex._controlIndex) {
            if (ctrl.name === "root") {
                continue;
            }
            // Only warn about non-container leaf nodes that haven't set width/height
            const typeInfo = ControlRegistry[ctrl.className];
            if (typeInfo && !typeInfo.isContainer && ctrl.width === undefined && ctrl.height === undefined) {
                // This is fine — they inherit from parent. But if they're direct children of root...
                const parent = tex._parentIndex.get(ctrl.name);
                if (parent === "root") {
                    // Still okay — they'll stretch to root. Don't warn.
                }
            }

            // Warn about Buttons without text
            if (ctrl.className === "Button" || ctrl.className === "FocusableButton") {
                const hasTextChild = ctrl.children?.some((c) => c.className === "TextBlock");
                if (!hasTextChild) {
                    issues.push(`WARNING: Button "${ctrl.name}" has no text label. Set buttonText when creating it or add a TextBlock child.`);
                }
            }
        }

        // Check consistency between index and tree
        const treeNames = new Set<string>();
        this._collectAllNames(tex.root, treeNames);
        for (const [name] of tex._controlIndex) {
            if (name !== "root" && !treeNames.has(name)) {
                issues.push(`ERROR: Control "${name}" is in the index but not in the tree.`);
            }
        }

        if (issues.length === 0) {
            issues.push("No issues found — GUI looks valid.");
        }

        return issues;
    }

    // ── Export / Import ───────────────────────────────────────────────

    /**
     * Export the GUI as Babylon.js-compatible JSON.
     * This JSON can be loaded with `AdvancedDynamicTexture.parseSerializedObject()`.
     * @param textureName - The name of the target GUI texture
     * @returns The serialized JSON string, or null if the texture was not found
     */
    exportJSON(textureName: string): string | null {
        const tex = this._textures.get(textureName);
        if (!tex) {
            return null;
        }

        // Deep-clone the root, stripping internal properties
        const root = this._cloneControlForExport(tex, tex.root);

        const result: Record<string, unknown> = {
            root,
        };

        // Include texture dimensions
        if (tex.width) {
            result.width = tex.width;
        }
        if (tex.height) {
            result.height = tex.height;
        }

        return JSON.stringify(result, null, 2);
    }

    /**
     * Import a GUI JSON into memory for editing.
     * @param textureName - The name to assign to the imported GUI texture
     * @param json - The Babylon.js GUI JSON string to import
     * @returns Status or error message
     */
    importJSON(textureName: string, json: string): string {
        try {
            const parsed = ValidateGuiAttachmentPayload(json);

            const width = typeof parsed.width === "number" ? parsed.width : 1920;
            const height = typeof parsed.height === "number" ? parsed.height : 1080;

            this.createTexture(textureName, { width, height, isFullscreen: true });
            const tex = this._textures.get(textureName)!;

            // Replace root with imported data
            tex.root = parsed.root as ISerializedControl;
            tex._controlIndex.clear();
            tex._parentIndex.clear();
            tex._gridCellIndex.clear();

            // Re-index
            this._indexControlTree(tex, tex.root, undefined);

            return "OK";
        } catch (e) {
            return (e as Error).message;
        }
    }

    // ── Private helpers ───────────────────────────────────────────────

    /**
     * Apply a bag of properties to a serialized control.
     * @param ctrl - The target serialized control
     * @param typeInfo - The control type info from the registry, or undefined
     * @param properties - Key-value pairs of properties to apply
     */
    private _applyProperties(ctrl: ISerializedControl, typeInfo: IControlTypeInfo | undefined, properties: Record<string, unknown>): void {
        for (const [key, value] of Object.entries(properties)) {
            // Skip special button-creation props handled separately
            if (key === "buttonText" || key === "buttonImage") {
                continue;
            }

            // Validate against catalog if we have type info
            if (typeInfo) {
                const isBaseProperty = key in BaseControlProperties;
                const isTypeProperty = key in typeInfo.properties;
                // Allow setting even non-catalog properties — the serializer is flexible
                if (!isBaseProperty && !isTypeProperty) {
                    // Silently accept for extensibility
                }
            }

            ctrl[key] = value;
        }
    }

    /**
     * Create internal TextBlock / Image children for a Button.
     * @param ctrl - The button control to initialize
     * @param tex - The parent GUI texture
     * @param properties - Optional properties containing buttonText and buttonImage
     */
    private _initButtonChildren(ctrl: ISerializedControl, tex: IGuiTexture, properties?: Record<string, unknown>): void {
        const btnName = ctrl.name;

        // Text child
        const textName = `${btnName}_text`;
        const textChild: ISerializedControl = {
            name: textName,
            className: "TextBlock",
            text: (properties?.buttonText as string) ?? "",
        };
        ctrl.children!.push(textChild);
        ctrl.textBlockName = textName;
        tex._controlIndex.set(textName, textChild);
        tex._parentIndex.set(textName, btnName);

        // Image child (only if an image URL was provided)
        if (properties?.buttonImage) {
            const imgName = `${btnName}_image`;
            const imgChild: ISerializedControl = {
                name: imgName,
                className: "Image",
                source: properties.buttonImage as string,
            };
            ctrl.children!.push(imgChild);
            ctrl.imageName = imgName;
            tex._controlIndex.set(imgName, imgChild);
            tex._parentIndex.set(imgName, btnName);
        }
    }

    /**
     * Recursively remove a control and descendants from the indexes.
     * @param tex - The parent GUI texture
     * @param name - The name of the control to remove
     * @param ctrl - The serialized control to remove
     */
    private _removeFromIndexRecursive(tex: IGuiTexture, name: string, ctrl: ISerializedControl): void {
        if (ctrl.children) {
            for (const child of ctrl.children) {
                this._removeFromIndexRecursive(tex, child.name, child);
            }
        }
        tex._controlIndex.delete(name);
        tex._parentIndex.delete(name);
        tex._gridCellIndex.delete(name);
    }

    /**
     * Check if targetName is a descendant of ancestorName.
     * @param tex - The parent GUI texture
     * @param targetName - The name of the potential descendant
     * @param ancestorName - The name of the potential ancestor
     * @returns True if targetName is a descendant of ancestorName
     */
    private _isDescendantOf(tex: IGuiTexture, targetName: string, ancestorName: string): boolean {
        let current: string | undefined = targetName;
        while (current) {
            if (current === ancestorName) {
                return true;
            }
            current = tex._parentIndex.get(current);
        }
        return false;
    }

    /**
     * Build a human-readable tree view of the control hierarchy.
     * @param tex - The parent GUI texture
     * @param ctrl - The current control to describe
     * @param lines - The output lines array to append to
     * @param depth - The current indentation depth
     */
    private _describeControlTree(tex: IGuiTexture, ctrl: ISerializedControl, lines: string[], depth: number): void {
        const indent = "  ".repeat(depth);
        const gridCell = tex._gridCellIndex.get(ctrl.name);
        const cellStr = gridCell ? ` [cell ${gridCell}]` : "";

        // Collect a brief summary of set properties
        const propSummary: string[] = [];
        for (const [key, value] of Object.entries(ctrl)) {
            if (["name", "className", "children", "rows", "columns", "tags", "textBlockName", "imageName"].includes(key)) {
                continue;
            }
            if (value === undefined || value === null) {
                continue;
            }
            const str = typeof value === "string" ? `"${value}"` : JSON.stringify(value);
            propSummary.push(`${key}=${str}`);
        }
        const propsStr = propSummary.length > 0 ? `  {${propSummary.join(", ")}}` : "";

        lines.push(`${indent}${ctrl.name} (${ctrl.className})${cellStr}${propsStr}`);

        // Grid row/column defs
        if (ctrl.className === "Grid") {
            if (ctrl.rows && ctrl.rows.length > 0) {
                const rowStrs = ctrl.rows.map((r) => {
                    const row = r as {
                        /**
                         *
                         */
                        value: number /**
                         *
                         */;
                        unit: number;
                    };
                    return `${row.value}${row.unit === 1 ? "px" : ""}`;
                });
                lines.push(`${indent}  rows: [${rowStrs.join(", ")}]`);
            }
            if (ctrl.columns && ctrl.columns.length > 0) {
                const colStrs = ctrl.columns.map((c) => {
                    const col = c as {
                        /**
                         *
                         */
                        value: number /**
                         *
                         */;
                        unit: number;
                    };
                    return `${col.value}${col.unit === 1 ? "px" : ""}`;
                });
                lines.push(`${indent}  columns: [${colStrs.join(", ")}]`);
            }
        }

        if (ctrl.children) {
            for (const child of ctrl.children) {
                this._describeControlTree(tex, child, lines, depth + 1);
            }
        }
    }

    /**
     * Validate Grid controls for consistency.
     * @param tex - The parent GUI texture
     * @param ctrl - The current control to validate
     * @param issues - The array to collect validation issues into
     */
    private _validateGrids(tex: IGuiTexture, ctrl: ISerializedControl, issues: string[]): void {
        if (ctrl.className === "Grid") {
            if (!ctrl.rows || ctrl.rows.length === 0) {
                issues.push(`WARNING: Grid "${ctrl.name}" has no row definitions. Add at least one row.`);
            }
            if (!ctrl.columns || ctrl.columns.length === 0) {
                issues.push(`WARNING: Grid "${ctrl.name}" has no column definitions. Add at least one column.`);
            }

            // Check that grid children have valid cell tags
            if (ctrl.children && ctrl.rows && ctrl.columns) {
                for (const child of ctrl.children) {
                    const cell = tex._gridCellIndex.get(child.name);
                    if (!cell) {
                        issues.push(`WARNING: Grid child "${child.name}" has no cell assignment.`);
                    } else {
                        const [rowStr, colStr] = cell.split(":");
                        const row = parseInt(rowStr);
                        const col = parseInt(colStr);
                        if (row >= ctrl.rows.length) {
                            issues.push(`WARNING: Grid child "${child.name}" assigned to row ${row}, but grid has only ${ctrl.rows.length} rows.`);
                        }
                        if (col >= ctrl.columns.length) {
                            issues.push(`WARNING: Grid child "${child.name}" assigned to column ${col}, but grid has only ${ctrl.columns.length} columns.`);
                        }
                    }
                }
            }
        }

        if (ctrl.children) {
            for (const child of ctrl.children) {
                this._validateGrids(tex, child, issues);
            }
        }
    }

    /**
     * Collect names and detect duplicates.
     * @param ctrl - The current control to process
     * @param seen - Set of names already seen
     * @param issues - The array to collect duplicate name errors into
     */
    private _collectNames(ctrl: ISerializedControl, seen: Set<string>, issues: string[]): void {
        if (seen.has(ctrl.name)) {
            issues.push(`ERROR: Duplicate control name "${ctrl.name}".`);
        }
        seen.add(ctrl.name);
        if (ctrl.children) {
            for (const child of ctrl.children) {
                this._collectNames(child, seen, issues);
            }
        }
    }

    /**
     * Collect all control names from the tree.
     * @param ctrl - The current control to process
     * @param names - Set to collect control names into
     */
    private _collectAllNames(ctrl: ISerializedControl, names: Set<string>): void {
        names.add(ctrl.name);
        if (ctrl.children) {
            for (const child of ctrl.children) {
                this._collectAllNames(child, names);
            }
        }
    }

    /**
     * Deep-clone a control for export, stripping internal properties.
     * @param tex - The parent GUI texture
     * @param ctrl - The control to clone
     * @returns A plain object suitable for JSON serialization
     */
    private _cloneControlForExport(tex: IGuiTexture, ctrl: ISerializedControl): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(ctrl)) {
            if (key === "children") {
                continue;
            } // handled below
            result[key] = value;
        }

        // Grid: Babylon.js expects rowCount / columnCount for parsing
        if (ctrl.className === "Grid") {
            if (ctrl.rows) {
                result.rowCount = ctrl.rows.length;
            }
            if (ctrl.columns) {
                result.columnCount = ctrl.columns.length;
            }
        }

        if (ctrl.children && ctrl.children.length > 0) {
            result.children = ctrl.children.map((child) => this._cloneControlForExport(tex, child));
        }

        return result;
    }

    /**
     * Re-index all controls from an imported tree.
     * @param tex - The parent GUI texture
     * @param ctrl - The current control to index
     * @param parentName - The name of the parent control, or undefined for root
     */
    private _indexControlTree(tex: IGuiTexture, ctrl: ISerializedControl, parentName: string | undefined): void {
        tex._controlIndex.set(ctrl.name, ctrl);
        if (parentName) {
            tex._parentIndex.set(ctrl.name, parentName);
        }

        // Handle Grid tags
        if (ctrl.tags && ctrl.children) {
            for (let i = 0; i < ctrl.children.length; i++) {
                if (i < ctrl.tags.length) {
                    tex._gridCellIndex.set(ctrl.children[i].name, ctrl.tags[i] as string);
                }
            }
        }

        if (ctrl.children) {
            for (const child of ctrl.children) {
                this._indexControlTree(tex, child, ctrl.name);
            }
        }
    }
}
