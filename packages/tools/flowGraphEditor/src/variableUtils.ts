/**
 * Pure utility functions for the flow graph variable feature.
 * Extracted from component code to enable unit testing in a Node.js environment.
 */

import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";

// -------------------------------------------------------
// Variable type system (editor-side)
// -------------------------------------------------------

/**
 * The set of variable type names supported by the editor.
 * Primitive types match FlowGraphTypes enum values; scene-object types
 * use the Babylon class names returned by getClassName().
 */
export type VariableTypeName =
    | "any"
    | "string"
    | "number"
    | "boolean"
    | "FlowGraphInteger"
    | "Vector2"
    | "Vector3"
    | "Vector4"
    | "Color3"
    | "Color4"
    | "Mesh"
    | "TransformNode"
    | "Camera"
    | "Light"
    | "Material"
    | "AnimationGroup";

/**
 * Categorized groups of variable types for the type selector dropdown.
 */
export const VariableTypeGroups: { label: string; types: { name: VariableTypeName; label: string }[] }[] = [
    {
        label: "Primitives",
        types: [
            { name: "string", label: "String" },
            { name: "number", label: "Number" },
            { name: "boolean", label: "Boolean" },
            { name: "FlowGraphInteger", label: "Integer" },
        ],
    },
    {
        label: "Vectors & Colors",
        types: [
            { name: "Vector2", label: "Vector2" },
            { name: "Vector3", label: "Vector3" },
            { name: "Vector4", label: "Vector4" },
            { name: "Color3", label: "Color3" },
            { name: "Color4", label: "Color4" },
        ],
    },
    {
        label: "Scene Objects",
        types: [
            { name: "Mesh", label: "Mesh" },
            { name: "TransformNode", label: "Transform Node" },
            { name: "Camera", label: "Camera" },
            { name: "Light", label: "Light" },
            { name: "Material", label: "Material" },
            { name: "AnimationGroup", label: "Animation Group" },
        ],
    },
    {
        label: "Other",
        types: [{ name: "any", label: "Any" }],
    },
];

/**
 * Whether the given type name represents a scene object (resolved by name/id from scene).
 * @param typeName - the variable type name to check
 * @returns true if the type represents a scene object
 */
export function IsSceneObjectType(typeName: VariableTypeName): boolean {
    return typeName === "Mesh" || typeName === "TransformNode" || typeName === "Camera" || typeName === "Light" || typeName === "Material" || typeName === "AnimationGroup";
}

/**
 * Whether the given type name represents a vector or color with numeric components.
 * @param typeName - the variable type name to check
 * @returns true if the type is a vector or color
 */
export function IsVectorOrColorType(typeName: VariableTypeName): boolean {
    return typeName === "Vector2" || typeName === "Vector3" || typeName === "Vector4" || typeName === "Color3" || typeName === "Color4";
}

/**
 * Get the number of numeric components for a vector/color type.
 * @param typeName - the variable type name
 * @returns the number of components (0 for non-vector types)
 */
export function GetComponentCount(typeName: VariableTypeName): number {
    switch (typeName) {
        case "Vector2":
            return 2;
        case "Vector3":
        case "Color3":
            return 3;
        case "Vector4":
        case "Color4":
            return 4;
        default:
            return 0;
    }
}

/**
 * Component labels for vector/color types.
 * @param typeName - the variable type name
 * @returns array of component labels (e.g. ["x","y","z"])
 */
export function GetComponentLabels(typeName: VariableTypeName): string[] {
    switch (typeName) {
        case "Vector2":
            return ["x", "y"];
        case "Vector3":
            return ["x", "y", "z"];
        case "Vector4":
            return ["x", "y", "z", "w"];
        case "Color3":
            return ["r", "g", "b"];
        case "Color4":
            return ["r", "g", "b", "a"];
        default:
            return [];
    }
}

/**
 * Get the numeric components from a vector/color value.
 * @param value - the runtime value to extract components from
 * @param typeName - the variable type name
 * @returns array of numeric component values
 */
export function GetComponents(value: unknown, typeName: VariableTypeName): number[] {
    if (!value || typeof value !== "object") {
        return new Array(GetComponentCount(typeName)).fill(0);
    }
    const v = value as Record<string, number>;
    switch (typeName) {
        case "Vector2":
            return [v.x ?? 0, v.y ?? 0];
        case "Vector3":
            return [v.x ?? 0, v.y ?? 0, v.z ?? 0];
        case "Vector4":
            return [v.x ?? 0, v.y ?? 0, v.z ?? 0, v.w ?? 0];
        case "Color3":
            return [v.r ?? 0, v.g ?? 0, v.b ?? 0];
        case "Color4":
            return [v.r ?? 0, v.g ?? 0, v.b ?? 0, v.a ?? 0];
        default:
            return [];
    }
}

/**
 * Build a vector/color instance from numeric components.
 * @param components - array of numeric values
 * @param typeName - the variable type name
 * @returns a new vector/color instance, or undefined for unsupported types
 */
export function BuildFromComponents(components: number[], typeName: VariableTypeName): unknown {
    switch (typeName) {
        case "Vector2":
            return new Vector2(components[0], components[1]);
        case "Vector3":
            return new Vector3(components[0], components[1], components[2]);
        case "Vector4":
            return new Vector4(components[0], components[1], components[2], components[3]);
        case "Color3":
            return new Color3(components[0], components[1], components[2]);
        case "Color4":
            return new Color4(components[0], components[1], components[2], components[3]);
        default:
            return undefined;
    }
}

/**
 * Get the default value for a given variable type.
 * @param typeName - the variable type name
 * @returns the default value, or undefined for scene object / any types
 */
export function GetDefaultValueForType(typeName: VariableTypeName): unknown {
    switch (typeName) {
        case "string":
            return "";
        case "number":
            return 0;
        case "boolean":
            return false;
        case "FlowGraphInteger":
            return new FlowGraphInteger(0);
        case "Vector2":
            return Vector2.Zero();
        case "Vector3":
            return Vector3.Zero();
        case "Vector4":
            return Vector4.Zero();
        case "Color3":
            return Color3.Black();
        case "Color4":
            return new Color4(0, 0, 0, 1);
        default:
            return undefined;
    }
}

/**
 * Infer a VariableTypeName from an existing runtime value.
 * Returns "any" when the type cannot be determined.
 * @param value - the runtime value to inspect
 * @returns the inferred variable type name
 */
export function InferVariableType(value: unknown): VariableTypeName {
    if (value === undefined || value === null) {
        return "any";
    }
    switch (typeof value) {
        case "string":
            return "string";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
    }
    if (typeof value === "object" && value !== null) {
        const cn = (value as { getClassName?: () => string }).getClassName?.() ?? "";
        switch (cn) {
            case "Vector2":
                return "Vector2";
            case "Vector3":
                return "Vector3";
            case "Vector4":
                return "Vector4";
            case "Color3":
                return "Color3";
            case "Color4":
                return "Color4";
            case "FlowGraphInteger":
                return "FlowGraphInteger";
            case "Mesh":
            case "AbstractMesh":
            case "GroundMesh":
            case "InstancedMesh":
            case "InstanceMesh":
            case "LinesMesh":
            case "GoldbergMesh":
            case "GreasedLineMesh":
            case "TrailMesh":
                return "Mesh";
            case "TransformNode":
                return "TransformNode";
            case "ArcRotateCamera":
            case "FreeCamera":
            case "UniversalCamera":
            case "TargetCamera":
            case "FollowCamera":
            case "ArcFollowCamera":
                return "Camera";
            case "PointLight":
            case "DirectionalLight":
            case "SpotLight":
            case "HemisphericLight":
                return "Light";
            case "StandardMaterial":
            case "PBRMaterial":
            case "PBRMetallicRoughnessMaterial":
            case "PBRSpecularGlossinessMaterial":
            case "NodeMaterial":
            case "ShaderMaterial":
                return "Material";
            case "AnimationGroup":
                return "AnimationGroup";
        }
    }
    return "any";
}

/**
 * Represents a variable entry found across the graph's blocks and contexts.
 */
export interface IVariableEntry {
    /** Variable name */
    name: string;
    /** Number of GetVariable blocks referencing this name */
    getCount: number;
    /** Number of SetVariable blocks referencing this name */
    setCount: number;
}

/**
 * Scan all blocks and context user variables in the flow graph to build a
 * sorted list of variable entries.
 * @param fg - The flow graph to scan.
 * @returns Sorted array of variable entries.
 */
export function GatherVariables(fg: FlowGraph): IVariableEntry[] {
    const varMap = new Map<string, IVariableEntry>();

    const ensureVar = (name: string): IVariableEntry => {
        let entry = varMap.get(name);
        if (!entry) {
            entry = { name, getCount: 0, setCount: 0 };
            varMap.set(name, entry);
        }
        return entry;
    };

    for (const block of fg.getAllBlocks()) {
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable) {
            if (config?.variable) {
                ensureVar(config.variable).getCount++;
            }
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                for (const v of config.variables) {
                    ensureVar(v).setCount++;
                }
            } else if (config?.variable) {
                ensureVar(config.variable).setCount++;
            }
        }
    }

    // Also include variables defined on the context but not yet referenced
    // by any block — these are created from the "+ Add" button.
    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        for (const key of Object.keys(ctx.userVariables)) {
            ensureVar(key);
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }

    return Array.from(varMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gather all variable names from a flow graph, excluding variables owned
 * by a specific block (to avoid self-reference in pickers).
 * @param fg - The flow graph to scan.
 * @param excludeBlock - A block to exclude from the scan.
 * @returns Sorted array of variable names.
 */
export function GatherVariableNames(fg: FlowGraph, excludeBlock?: FlowGraphBlock): string[] {
    const names = new Set<string>();
    for (const block of fg.getAllBlocks()) {
        if (block === excludeBlock) {
            continue;
        }
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable) {
            if (config?.variable) {
                names.add(config.variable);
            }
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                for (const v of config.variables) {
                    names.add(v);
                }
            } else if (config?.variable) {
                names.add(config.variable);
            }
        }
    }

    // Also include context user variables
    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        for (const key of Object.keys(ctx.userVariables)) {
            names.add(key);
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }

    return Array.from(names).sort();
}

/**
 * Rename a variable across all GetVariable and SetVariable blocks and
 * across all execution contexts.
 * @param fg - The flow graph.
 * @param oldName - The current variable name.
 * @param newName - The new variable name.
 */
export function RenameVariable(fg: FlowGraph, oldName: string, newName: string): void {
    if (!newName || newName === oldName) {
        return;
    }

    for (const block of fg.getAllBlocks()) {
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable) {
            if (config?.variable === oldName) {
                config.variable = newName;
            }
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                const idx = config.variables.indexOf(oldName);
                if (idx !== -1) {
                    config.variables[idx] = newName;
                    const dataInput = block.getDataInput(oldName);
                    if (dataInput) {
                        dataInput.name = newName;
                    }
                }
            } else if (config?.variable === oldName) {
                config.variable = newName;
            }
        }
    }

    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        if (ctx.hasVariable(oldName)) {
            const value = ctx.getVariable(oldName);
            ctx.setVariable(newName, value);
            delete (ctx as any)._userVariables[oldName];
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }
}

/**
 * Delete a variable by removing all GetVariable and SetVariable blocks that
 * reference it, and removing it from all execution contexts.
 * @param fg - The flow graph.
 * @param name - The variable name to delete.
 */
export function DeleteVariable(fg: FlowGraph, name: string): void {
    const blocksToRemove: FlowGraphBlock[] = [];

    for (const block of fg.getAllBlocks()) {
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable && config?.variable === name) {
            blocksToRemove.push(block);
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                const idx = config.variables.indexOf(name);
                if (idx !== -1) {
                    // Remove the corresponding data input port
                    const dataInput = block.getDataInput(name);
                    if (dataInput) {
                        dataInput.disconnectFromAll();
                        const portIdx = block.dataInputs.indexOf(dataInput);
                        if (portIdx !== -1) {
                            block.dataInputs.splice(portIdx, 1);
                        }
                    }
                    config.variables.splice(idx, 1);
                    if (config.variables.length === 0) {
                        blocksToRemove.push(block);
                    }
                }
            } else if (config?.variable === name) {
                blocksToRemove.push(block);
            }
        }
    }

    for (const block of blocksToRemove) {
        fg.removeBlock(block);
    }

    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        if (ctx.hasVariable(name)) {
            delete (ctx as any)._userVariables[name];
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }
}

/**
 * Format a runtime variable value for display in the variables panel.
 * @param val - The value to format.
 * @returns A human-readable string representation.
 */
export function FormatVariableValue(val: unknown): string {
    if (val === undefined) {
        return "undefined";
    }
    if (val === null) {
        return "null";
    }
    if (typeof val === "object") {
        if (typeof (val as any).toString === "function" && (val as any).toString !== Object.prototype.toString) {
            return (val as any).toString();
        }
        try {
            const json = JSON.stringify(val);
            return json.length > 60 ? json.slice(0, 57) + "..." : json;
        } catch {
            return "[object]";
        }
    }
    const str = String(val);
    return str.length > 60 ? str.slice(0, 57) + "..." : str;
}

/**
 * Parse a user-entered string into a typed value, preserving the original
 * value's type when possible.  Falls back to string if the input doesn't
 * match the current type.
 * @param input - The string the user typed.
 * @param currentValue - The current value of the variable (used for type hint).
 * @returns The parsed value.
 */
export function ParseVariableValue(input: string, currentValue: unknown): unknown {
    const trimmed = input.trim();

    // Boolean keywords
    if (trimmed === "true") {
        return true;
    }
    if (trimmed === "false") {
        return false;
    }

    // null / undefined keywords
    if (trimmed === "null") {
        return null;
    }
    if (trimmed === "undefined") {
        return undefined;
    }

    // If the current value is a number, try to parse as number first
    if (typeof currentValue === "number" || currentValue === undefined) {
        const n = Number(trimmed);
        if (trimmed !== "" && !isNaN(n)) {
            return n;
        }
    }

    // Try JSON parse for objects/arrays
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // fall through to string
        }
    }

    return trimmed;
}

/**
 * Filter autocomplete suggestions by a query string (case-insensitive substring match).
 * @param suggestions - The full list of suggestions.
 * @param query - The filter query.
 * @returns Filtered suggestions. If query is empty, returns all suggestions.
 */
export function FilterSuggestions(suggestions: string[], query: string): string[] {
    const q = query.toLowerCase();
    if (!q) {
        return suggestions;
    }
    return suggestions.filter((s) => s.toLowerCase().includes(q));
}
