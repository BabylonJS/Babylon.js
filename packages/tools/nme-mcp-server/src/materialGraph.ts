/* eslint-disable @typescript-eslint/naming-convention */
/**
 * MaterialGraphManager – holds an in-memory representation of a Node Material
 * graph that the MCP tools build up incrementally.  When the user is satisfied,
 * the graph can be serialised to the NME JSON format that Babylon.js understands.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server must remain a light,
 *    standalone process.  We therefore work purely with a JSON data model that
 *    mirrors the serialisation format NodeMaterial.serialize() produces.
 * 2. **Idempotent & stateful** – the manager stores the current graph in memory
 *    so an AI agent can add blocks, connect them, tweak properties, and finally
 *    export.  Multiple graphs can coexist (keyed by material name).
 */

import { ValidateNodeMaterialAttachmentPayload } from "@tools/mcp-server-core";

import { BlockRegistry, BlockRegistryByClassName, type IBlockTypeInfo } from "./blockRegistry.js";

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Serialized form of a single connection point (input or output) on a block.
 */
export interface ISerializedConnectionPoint {
    /** Name of the connection point */
    name: string;
    /** Display name shown in the NME editor */
    displayName?: string;
    /** The input-side name this feeds into on the target block */
    inputName?: string;
    /** ID of the block this connection links to */
    targetBlockId?: number;
    /** Name of the output on the linked block */
    targetConnectionName?: string;
    /** Whether exposed on the NME editor frame */
    isExposedOnFrame?: boolean;
    /** Position when exposed on frame */
    exposedPortPosition?: number;
}

/**
 * Serialized form of a single Node Material block.
 */
export interface ISerializedBlock {
    /** The Babylon.js class identifier (e.g. "BABYLON.InputBlock") */
    customType: string;
    /** Unique block identifier within the material */
    id: number;
    /** Human-friendly block name */
    name: string;
    /** NodeMaterialBlockTargets enum value */
    target?: number;
    /** Input connection points */
    inputs: ISerializedConnectionPoint[];
    /** Output connection points */
    outputs: ISerializedConnectionPoint[];
    /** Block-specific values (e.g. min, max, type, value, systemValue …) */
    [key: string]: unknown;
}

/**
 * Serialized form of a complete Node Material.
 */
export interface ISerializedMaterial {
    /** Optional tags for the material */
    tags?: string;
    /** Whether to ignore the alpha channel */
    ignoreAlpha: boolean;
    /** Maximum simultaneous lights */
    maxSimultaneousLights: number;
    /** NodeMaterialModes enum value */
    mode: number;
    /** Whether to force alpha blending */
    forceAlphaBlending: boolean;
    /** All blocks in the material graph */
    blocks: ISerializedBlock[];
    /** Block IDs of output nodes (VertexOutputBlock + FragmentOutputBlock) */
    outputNodes: number[];
    /** NME editor layout data */
    editorData?: {
        /** Block positions in the editor */
        locations: Array<{ /** Block ID */ blockId: number; /** X coordinate */ x: number; /** Y coordinate */ y: number }>;
    };
    /** Metadata the agent can read back */
    comment?: string;
}

/** Nice names for the mode enum */
export const NodeMaterialModes: Record<string, number> = {
    Material: 0,
    PostProcess: 1,
    Particle: 2,
    ProceduralTexture: 3,
    GaussianSplatting: 4,
    SFE: 5,
};

/** Mapping from human-readable target names to Babylon enum values */
export const BlockTargets: Record<string, number> = {
    Vertex: 1,
    Fragment: 2,
    Neutral: 4,
    VertexAndFragment: 3,
};

/** Mapping from human-readable type names to Babylon enum values for InputBlock */
export const ConnectionPointTypes: Record<string, number> = {
    Float: 1,
    Int: 2,
    Vector2: 4,
    Vector3: 8,
    Vector4: 16,
    Color3: 32,
    Color4: 64,
    Matrix: 128,
    Object: 256,
    AutoDetect: 1073741824,
    BasedOnInput: 2048,
};

/** System values valid for InputBlock.systemValue */
export const SystemValues: Record<string, number> = {
    World: 1,
    View: 2,
    Projection: 3,
    ViewProjection: 4,
    WorldView: 5,
    WorldViewProjection: 6,
    CameraPosition: 7,
    FogColor: 8,
    DeltaTime: 9,
    CameraParameters: 10,
    MaterialAlpha: 11,
};

/** AnimatedInputBlockTypes */
export const AnimationTypes: Record<string, number> = {
    None: 0,
    Time: 1,
};

/** TrigonometryBlockOperations — numeric enum values Babylon.js expects */
export const TrigonometryOperations: Record<string, number> = {
    Cos: 0,
    Sin: 1,
    Abs: 2,
    Exp: 3,
    Exp2: 4,
    Round: 5,
    Floor: 6,
    Ceiling: 7,
    Sqrt: 8,
    Log: 9,
    Tan: 10,
    ArcTan: 11,
    ArcCos: 12,
    ArcSin: 13,
    Fract: 14,
    Sign: 15,
    Radians: 16,
    Degrees: 17,
    Set: 18,
};

/** ConditionalBlockConditions — numeric enum values Babylon.js expects */
export const ConditionalConditions: Record<string, number> = {
    Equal: 0,
    NotEqual: 1,
    LessThan: 2,
    GreaterThan: 3,
    LessOrEqual: 4,
    GreaterOrEqual: 5,
    Xor: 6,
    Or: 7,
    And: 8,
};

/** MeshAttributeExistsBlockTypes — numeric enum values Babylon.js expects */
export const MeshAttributeExistsTypes: Record<string, number> = {
    None: 0,
    Normal: 1,
    Tangent: 2,
    VertexColor: 3,
    UV1: 4,
    UV2: 5,
    UV3: 6,
    UV4: 7,
    UV5: 8,
    UV6: 9,
};

/** CurveBlockTypes — numeric enum values Babylon.js expects */
export const CurveTypes: Record<string, number> = {
    EaseInSine: 0,
    EaseOutSine: 1,
    EaseInOutSine: 2,
    EaseInQuad: 3,
    EaseOutQuad: 4,
    EaseInOutQuad: 5,
    EaseInCubic: 6,
    EaseOutCubic: 7,
    EaseInOutCubic: 8,
    EaseInQuart: 9,
    EaseOutQuart: 10,
    EaseInOutQuart: 11,
    EaseInQuint: 12,
    EaseOutQuint: 13,
    EaseInOutQuint: 14,
    EaseInExpo: 15,
    EaseOutExpo: 16,
    EaseInOutExpo: 17,
    EaseInCirc: 18,
    EaseOutCirc: 19,
    EaseInOutCirc: 20,
    EaseInBack: 21,
    EaseOutBack: 22,
    EaseInOutBack: 23,
    EaseInElastic: 24,
    EaseOutElastic: 25,
    EaseInOutElastic: 26,
};

/**
 * Mapping from block class name → property name → enum string-to-number map.
 * Used by setBlockProperties() to convert human-readable enum strings to the
 * numeric values Babylon.js expects during deserialization.
 */
const BlockEnumProperties: Record<string, Record<string, Record<string, number>>> = {
    TrigonometryBlock: { operation: TrigonometryOperations },
    ConditionalBlock: { condition: ConditionalConditions },
    MeshAttributeExistsBlock: { attributeType: MeshAttributeExistsTypes },
    CurveBlock: { curveType: CurveTypes },
};

/**
 * Valid vertex buffer attribute names in Babylon.js.
 * Used to validate and normalise InputBlock attributeName values.
 */
const ValidAttributeNames = new Set([
    "position",
    "normal",
    "tangent",
    "uv",
    "uv2",
    "uv3",
    "uv4",
    "uv5",
    "uv6",
    "color",
    "matricesIndices",
    "matricesWeights",
    "matricesIndicesExtra",
    "matricesWeightsExtra",
]);

/**
 * Common LLM mistakes for attribute names → correct Babylon.js attribute name.
 * The PBR and Light blocks declare a local `vec4 worldPos` in the vertex shader,
 * so using "worldPos" as an attribute name causes a fatal GLSL name collision.
 */
const AttributeNameAliases: Record<string, string> = {
    pos: "position",
    worldpos: "position",
    worldposition: "position",
    world_position: "position",
    vertexposition: "position",
    vertex_position: "position",
    norm: "position", // "norm" is ambiguous but "normal" is more likely
    worldnormal: "normal",
    worldnorm: "normal",
    world_normal: "normal",
    vertexnormal: "normal",
    vertex_normal: "normal",
};
// Fix "norm" — it almost certainly means "normal", not "position"
AttributeNameAliases["norm"] = "normal";

/**
 * Normalise an InputBlock attribute name to a valid Babylon.js vertex attribute.
 * Returns the corrected name and an optional warning if it was remapped.
 * @param raw - The raw attribute name to normalise.
 * @returns An object containing the normalised name and an optional warning message.
 */
function normaliseAttributeName(raw: unknown): { name: string; warning?: string } {
    if (typeof raw !== "string") {
        return { name: String(raw) };
    }
    // Already valid
    if (ValidAttributeNames.has(raw)) {
        return { name: raw };
    }
    // Check aliases (case-insensitive)
    const lower = raw.toLowerCase().replace(/[\s_-]/g, "");
    const mapped = AttributeNameAliases[lower];
    if (mapped) {
        return {
            name: mapped,
            warning: `⚠ attributeName "${raw}" is not a valid vertex attribute. ` + `Auto-corrected to "${mapped}". ` + `Valid names: ${[...ValidAttributeNames].join(", ")}.`,
        };
    }
    // Unknown — return as-is but warn
    return {
        name: raw,
        warning:
            `⚠ attributeName "${raw}" is not a recognised vertex attribute. ` +
            `Valid names: ${[...ValidAttributeNames].join(", ")}. ` +
            `Using it anyway — this may cause shader errors.`,
    };
}

// ─── Type Compatibility ───────────────────────────────────────────────────

/**
 * GLSL vec-size group for each NME connection point type.
 * Types in the same group are compatible (e.g. Color3 ↔ Vector3 are both vec3).
 * "any" means the type adapts to whatever it's connected to (AutoDetect, BasedOnInput).
 */
const _typeGroup: Record<string, string> = {
    Float: "scalar",
    Int: "scalar",
    Vector2: "vec2",
    Vector3: "vec3",
    Color3: "vec3",
    Vector4: "vec4",
    Color4: "vec4",
    Matrix: "matrix",
    Object: "any",
    AutoDetect: "any",
    BasedOnInput: "any",
};

/**
 * Reverse lookup: Numeric ConnectionPointTypes value → type name string.
 */
const _numericTypeToName: Record<number, string> = {};
for (const [name, num] of Object.entries(ConnectionPointTypes)) {
    _numericTypeToName[num] = name;
}

/**
 * Resolve the effective type name of an output connection on a block.
 * For InputBlocks, the type is stored as a numeric property on the block itself.
 * For all other blocks, the type comes from the registry.
 * @param block - The block containing the output connection.
 * @param outputName - The name of the output connection to resolve the type for.
 * @returns The resolved type name (e.g. "Float", "Vector3", "AutoDetect").
 */
function _resolveOutputType(block: ISerializedBlock, outputName: string): string {
    // InputBlock: actual type is in block["type"] (numeric)
    const blockClass = block.customType?.replace("BABYLON.", "");
    if (blockClass === "InputBlock") {
        const numType = block["type"] as number | undefined;
        if (numType !== undefined && _numericTypeToName[numType]) {
            return _numericTypeToName[numType];
        }
        return "AutoDetect";
    }

    // For other blocks, look up registry by className
    const info = BlockRegistryByClassName[blockClass];
    if (!info) {
        return "AutoDetect";
    }
    const outDef = info.outputs.find((o) => o.name === outputName);
    return outDef?.type ?? "AutoDetect";
}

/**
 * Resolve the expected type of an input connection on a block from the registry.
 * @param block - The block containing the input connection.
 * @param inputName - The name of the input connection to resolve the type for.
 * @returns The resolved type name (e.g. "Float", "Vector3", "AutoDetect").
 */
function _resolveInputType(block: ISerializedBlock, inputName: string): string {
    const blockClass = block.customType?.replace("BABYLON.", "");
    if (!blockClass) {
        return "AutoDetect";
    }
    const info = BlockRegistryByClassName[blockClass];
    if (!info) {
        return "AutoDetect";
    }
    const inDef = info.inputs.find((i) => i.name === inputName);
    return inDef?.type ?? "AutoDetect";
}

/**
 * Check if two NME types are compatible for connection.
 * Returns { compatible, warning?, suggestion? }
 * @param outputType - The type of the output connection (e.g. "Float", "Vector3").
 * @param inputType - The type of the input connection (e.g. "Float", "Vector3").
 * @param targetBlock - The block the input connection belongs to (used for suggestions).
 * @param targetInputName - The name of the input connection (used for suggestions).
 * @returns An object indicating compatibility, with optional warning and suggestion messages.
 */
function _checkTypeCompatibility(
    outputType: string,
    inputType: string,
    targetBlock: ISerializedBlock,
    targetInputName: string
): { compatible: boolean; warning?: string; suggestion?: string } {
    const outGroup = _typeGroup[outputType] ?? "any";
    const inGroup = _typeGroup[inputType] ?? "any";

    // "any" group is always compatible (AutoDetect, BasedOnInput, Object)
    if (outGroup === "any" || inGroup === "any") {
        return { compatible: true };
    }

    // Same group is always compatible (e.g. Color3 ↔ Vector3, Float ↔ Int)
    if (outGroup === inGroup) {
        return { compatible: true };
    }

    // Scalar → vector promotion (Float → vec2/3/4): Babylon supports this
    if (outGroup === "scalar") {
        return { compatible: true, warning: `Type promotion: ${outputType} → ${inputType} (scalar will be broadcast to fill the vector).` };
    }

    // Different vec sizes: incompatible (e.g. Color3→Color4, vec3→vec4)
    // Find a better input on the target block that matches the output group
    const blockClass = targetBlock.customType?.replace("BABYLON.", "");
    const info = blockClass ? BlockRegistryByClassName[blockClass] : undefined;
    let suggestion: string | undefined;

    if (info) {
        const betterInputs = info.inputs.filter((inp) => {
            const g = _typeGroup[inp.type] ?? "any";
            return g === outGroup || g === "any";
        });
        if (betterInputs.length > 0) {
            const names = betterInputs.map((i) => `"${i.name}" (${i.type})`).join(", ");
            suggestion = `Consider connecting to ${names} instead of "${targetInputName}" (${inputType}).`;
        }
    }

    return {
        compatible: false,
        warning:
            `Type mismatch: output type ${outputType} (${outGroup}) is not compatible with input type ${inputType} (${inGroup}). ` +
            `This will likely cause a shader compilation error.`,
        suggestion,
    };
}

// ─── Manager ──────────────────────────────────────────────────────────────

/**
 * Holds in-memory representations of Node Material graphs that MCP tools build up incrementally.
 */
export class MaterialGraphManager {
    /** All managed material graphs, keyed by material name. */
    private _materials = new Map<string, ISerializedMaterial>();
    /** Auto-increment block id counter per material */
    private _nextId = new Map<string, number>();
    /** Layout tracking for aesthetic NME positioning */
    private _nextX = new Map<string, number>();

    // ── Lifecycle ──────────────────────────────────────────────────────

    /**
     * Create a new empty material graph.
     * @param name - Unique name for the material.
     * @param mode - Material mode (e.g. "Material", "PostProcess").
     * @param comment - Optional comment/description.
     * @returns The newly created serialized material.
     */
    createMaterial(name: string, mode: string = "Material", comment?: string): ISerializedMaterial {
        const mat: ISerializedMaterial = {
            ignoreAlpha: false,
            maxSimultaneousLights: 4,
            mode: NodeMaterialModes[mode] ?? 0,
            forceAlphaBlending: false,
            blocks: [],
            outputNodes: [],
            comment,
        };
        this._materials.set(name, mat);
        this._nextId.set(name, 1);
        this._nextX.set(name, 0);
        return mat;
    }

    /**
     * Retrieve a material graph by name.
     * @param name - The material name.
     * @returns The serialized material, or undefined if not found.
     */
    getMaterial(name: string): ISerializedMaterial | undefined {
        return this._materials.get(name);
    }

    /**
     * List the names of all managed materials.
     * @returns An array of material names.
     */
    listMaterials(): string[] {
        return Array.from(this._materials.keys());
    }

    /**
     * Delete a material graph by name.
     * @param name - The material name to delete.
     * @returns True if the material was found and deleted.
     */
    deleteMaterial(name: string): boolean {
        this._nextId.delete(name);
        this._nextX.delete(name);
        return this._materials.delete(name);
    }

    /**
     * Remove all material graphs from memory, resetting the manager to its initial state.
     */
    clearAll(): void {
        this._materials.clear();
        this._nextId.clear();
        this._nextX.clear();
    }

    // ── Block CRUD ─────────────────────────────────────────────────────

    /**
     * Add a block to the material graph.
     *
     * @param materialName  Name of the material graph to add to.
     * @param blockType     Registry key (e.g. "MultiplyBlock", "InputBlock").
     * @param blockName     Human-friendly name for this instance (e.g. "myColor").
     * @param properties    Extra key-value properties to set on the block JSON.
     * @returns The serialised block, or an error string.
     */
    addBlock(materialName: string, blockType: string, blockName?: string, properties?: Record<string, unknown>): { block: ISerializedBlock; warnings?: string[] } | string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found. Create it first.`;
        }

        const info: IBlockTypeInfo | undefined = BlockRegistry[blockType];
        if (!info) {
            return `Unknown block type "${blockType}". Use list_block_types to see available blocks.`;
        }

        const warnings: string[] = [];

        const id = this._nextId.get(materialName)!;
        this._nextId.set(materialName, id + 1);

        const target = BlockTargets[info.target] ?? BlockTargets.Neutral;
        const name = blockName ?? `${blockType}_${id}`;

        const block: ISerializedBlock = {
            customType: `BABYLON.${info.className}`,
            id,
            name,
            target,
            inputs: info.inputs.map((inp) => ({
                name: inp.name,
                displayName: inp.name,
            })),
            outputs: info.outputs.map((out) => ({
                name: out.name,
                displayName: out.name,
            })),
        };

        // Set default InputBlock fields so the NME parser never sees missing values
        if (blockType === "InputBlock") {
            block["mode"] = 3; // Undefined — will be overridden below as needed
            block["min"] = 0;
            block["max"] = 0;
            block["isBoolean"] = false;
            block["matrixMode"] = 0;
            block["isConstant"] = false;
            block["groupInInspector"] = "";
            block["convertToGammaSpace"] = false;
            block["convertToLinearSpace"] = false;
            block["animationType"] = 0;
        }

        // Apply registry-defined default properties (e.g. ClampBlock minimum/maximum)
        if (info.defaultSerializedProperties) {
            for (const [key, value] of Object.entries(info.defaultSerializedProperties)) {
                block[key] = value;
            }
        }

        // Apply user-supplied properties
        if (properties) {
            for (const [key, value] of Object.entries(properties)) {
                // Special handling for InputBlock type — resolve string to enum
                if (blockType === "InputBlock" && key === "type" && typeof value === "string") {
                    block["type"] = ConnectionPointTypes[value] ?? value;
                } else if (blockType === "InputBlock" && key === "systemValue" && typeof value === "string") {
                    block["systemValue"] = SystemValues[value] ?? value;
                    block["mode"] = 0; // Uniform mode for system values (Uniform = 0)
                } else if (blockType === "InputBlock" && key === "animationType" && typeof value === "string") {
                    block["animationType"] = AnimationTypes[value] ?? value;
                } else if (blockType === "InputBlock" && key === "mode" && typeof value === "string") {
                    const modeMap: Record<string, number> = { Uniform: 0, Attribute: 1, Varying: 2, Undefined: 3 };
                    block["mode"] = modeMap[value] ?? value;
                } else {
                    block[key] = value;
                }
            }
        }

        // For InputBlock: auto-derive mode and normalise the value
        if (blockType === "InputBlock") {
            // Normalise attributeName to a valid Babylon.js vertex attribute
            if (block["attributeName"] !== undefined) {
                const attrResult = normaliseAttributeName(block["attributeName"]);
                block["attributeName"] = attrResult.name;
                if (attrResult.warning) {
                    warnings.push(attrResult.warning);
                }
            }
            // Auto-derive mode from context when not explicitly set (still Undefined=3)
            if (block["mode"] === 3) {
                if (block["attributeName"] !== undefined) {
                    block["mode"] = 1; // Attribute — reads from vertex buffer
                } else if (block["systemValue"] !== undefined) {
                    block["mode"] = 0; // Uniform — built-in system value
                } else {
                    block["mode"] = 0; // Uniform — user-defined constant
                }
            }
            // Normalise value to flat array and set valueType
            this._normaliseInputBlockValue(block);
            // Ensure uniform InputBlocks always have a default value
            // (the NME editor crashes reading .x on undefined for vector/color types)
            this._ensureDefaultValue(block);
        }

        // Auto-mark as output node if this is an output block
        if (blockType === "VertexOutputBlock" || blockType === "FragmentOutputBlock") {
            mat.outputNodes.push(id);
        }

        // Track editor location for nice layout
        const x = this._nextX.get(materialName)!;
        this._nextX.set(materialName, x + 280);
        if (!mat.editorData) {
            mat.editorData = { locations: [] };
        }
        mat.editorData.locations.push({ blockId: id, x, y: 0 });

        // ── InputBlock-specific warnings ────────────────────────────────
        if (blockType === "InputBlock") {
            if (block["type"] === undefined) {
                warnings.push(
                    `⚠ InputBlock "${block.name}" has no 'type' property. ` +
                        `Set type to one of: Float, Int, Vector2, Vector3, Vector4, Color3, Color4, Matrix. ` +
                        `Without a type, connections will fail.`
                );
            }
            const hasValue = block["value"] !== undefined;
            const hasSysVal = block["systemValue"] !== undefined;
            const hasAttr = block["attributeName"] !== undefined;
            if (!hasValue && !hasSysVal && !hasAttr) {
                warnings.push(
                    `⚠ InputBlock "${block.name}" has no value, systemValue, or attributeName. ` +
                        `It won't provide any data. Set one of: ` +
                        `value (constant), systemValue (e.g. 'WorldViewProjection'), ` +
                        `or attributeName (e.g. 'position', 'normal', 'uv').`
                );
            }
        }

        mat.blocks.push(block);
        return { block, warnings: warnings.length > 0 ? warnings : undefined };
    }

    /**
     * Normalise an InputBlock's `value` to the flat-array format the NME parser expects,
     * and set the corresponding `valueType` string.
     *
     * Babylon's InputBlock._deserialize reads:
     *   valueType === "number" → value is a scalar
     *   otherwise             → GetClass(valueType).FromArray(value)
     *
     * So we must emit flat arrays, NOT `{x,y,z}` objects.
     * @param block - The InputBlock to normalise.
     */
    private _normaliseInputBlockValue(block: ISerializedBlock): void {
        const val = block["value"];
        if (val === undefined || val === null) {
            return;
        }

        const type = block["type"] as number | undefined;

        // Scalar values
        if (typeof val === "number") {
            // Matrix type with a scalar value — replace with identity matrix
            if (type === ConnectionPointTypes.Matrix) {
                block["value"] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                block["valueType"] = "BABYLON.Matrix";
                return;
            }
            block["valueType"] = "number";
            return;
        }

        // Already a flat array — just ensure valueType is set
        if (Array.isArray(val)) {
            if (!block["valueType"]) {
                block["valueType"] = this._inferValueType(type, val.length);
            }
            return;
        }

        // Object with named components → convert to flat array
        if (typeof val === "object") {
            const obj = val as Record<string, number>;
            if ("r" in obj) {
                // Color3 or Color4
                if ("a" in obj) {
                    block["value"] = [obj.r, obj.g, obj.b, obj.a];
                    block["valueType"] = "BABYLON.Color4";
                } else {
                    block["value"] = [obj.r, obj.g, obj.b];
                    block["valueType"] = "BABYLON.Color3";
                }
            } else if ("x" in obj) {
                // Vector2, Vector3, or Vector4
                if ("w" in obj) {
                    block["value"] = [obj.x, obj.y, obj.z, obj.w];
                    block["valueType"] = "BABYLON.Vector4";
                } else if ("z" in obj) {
                    block["value"] = [obj.x, obj.y, obj.z];
                    block["valueType"] = "BABYLON.Vector3";
                } else {
                    block["value"] = [obj.x, obj.y];
                    block["valueType"] = "BABYLON.Vector2";
                }
            }
        }
    }

    /**
     * Infer `valueType` from ConnectionPointTypes enum value and array length.
     * @param type - The ConnectionPointTypes enum value.
     * @param length - Length of the value array.
     * @returns The inferred Babylon.js value type string.
     */
    private _inferValueType(type: number | undefined, length: number): string {
        // Try the explicit type first
        const typeMap: Record<number, string> = {
            [ConnectionPointTypes.Vector2]: "BABYLON.Vector2",
            [ConnectionPointTypes.Vector3]: "BABYLON.Vector3",
            [ConnectionPointTypes.Vector4]: "BABYLON.Vector4",
            [ConnectionPointTypes.Color3]: "BABYLON.Color3",
            [ConnectionPointTypes.Color4]: "BABYLON.Color4",
            [ConnectionPointTypes.Matrix]: "BABYLON.Matrix",
        };
        if (type !== undefined && typeMap[type]) {
            return typeMap[type];
        }

        // Fall back to array length
        const lengthMap: Record<number, string> = {
            2: "BABYLON.Vector2",
            3: "BABYLON.Vector3",
            4: "BABYLON.Vector4",
            16: "BABYLON.Matrix",
        };
        return lengthMap[length] ?? "BABYLON.Vector3";
    }

    /**
     * Ensure that InputBlocks of vector/color/matrix types always have
     * a default value.  The NME editor reads `.x` / `.r` etc. on the value when
     * displaying them and will crash if `value` is undefined.
     *
     * We set defaults for ALL InputBlocks (uniform, attribute, and system value)
     * as a safety net — the engine ignores `_storedValue` for non-uniform blocks
     * during shader generation, but the NME editor's display code may still read it.
     * @param block - The InputBlock to ensure has a default value.
     */
    private _ensureDefaultValue(block: ISerializedBlock): void {
        // If value is already set, nothing to do
        if (block["value"] !== undefined && block["value"] !== null) {
            return;
        }

        const type = block["type"] as number | undefined;
        if (type === undefined) {
            return;
        }

        // Default values by type
        const defaults: Record<
            number,
            {
                /** The default value for the type. */
                value: number | number[];
                /** The Babylon.js value type string. */
                valueType: string;
            }
        > = {
            [ConnectionPointTypes.Float]: { value: 0, valueType: "number" },
            [ConnectionPointTypes.Int]: { value: 0, valueType: "number" },
            [ConnectionPointTypes.Vector2]: { value: [0, 0], valueType: "BABYLON.Vector2" },
            [ConnectionPointTypes.Vector3]: { value: [0, 0, 0], valueType: "BABYLON.Vector3" },
            [ConnectionPointTypes.Vector4]: { value: [0, 0, 0, 0], valueType: "BABYLON.Vector4" },
            [ConnectionPointTypes.Color3]: { value: [1, 1, 1], valueType: "BABYLON.Color3" },
            [ConnectionPointTypes.Color4]: { value: [1, 1, 1, 1], valueType: "BABYLON.Color4" },
            [ConnectionPointTypes.Matrix]: {
                value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                valueType: "BABYLON.Matrix",
            },
        };

        const def = defaults[type];
        if (def) {
            block["value"] = def.value;
            block["valueType"] = def.valueType;
        }
    }

    /**
     * Remove a block from a material by its id.
     * @param materialName - Name of the target material.
     * @param blockId - The block id to remove.
     * @returns "OK" or an error string.
     */
    removeBlock(materialName: string, blockId: number): string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found.`;
        }

        const idx = mat.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) {
            return `Block ${blockId} not found.`;
        }

        // Remove any connections pointing to this block
        for (const block of mat.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId === blockId) {
                    delete inp.targetBlockId;
                    delete inp.targetConnectionName;
                }
            }
        }

        mat.blocks.splice(idx, 1);
        mat.outputNodes = mat.outputNodes.filter((n) => n !== blockId);

        if (mat.editorData) {
            mat.editorData.locations = mat.editorData.locations.filter((l) => l.blockId !== blockId);
        }

        return "OK";
    }

    // ── Connections ────────────────────────────────────────────────────

    /**
     * Connect an output of one block to an input of another block.
     *
     * @param materialName
     * @param sourceBlockId   The block whose output we connect FROM.
     * @param outputName      Name of the output connection point on the source.
     * @param targetBlockId   The block whose input we connect TO.
     * @param inputName       Name of the input connection point on the target.
     * @returns "OK" or an error string.
     */
    connectBlocks(materialName: string, sourceBlockId: number, outputName: string, targetBlockId: number, inputName: string): string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found.`;
        }

        const sourceBlock = mat.blocks.find((b) => b.id === sourceBlockId);
        if (!sourceBlock) {
            return `Source block ${sourceBlockId} not found.`;
        }

        const targetBlock = mat.blocks.find((b) => b.id === targetBlockId);
        if (!targetBlock) {
            return `Target block ${targetBlockId} not found.`;
        }

        const output = sourceBlock.outputs.find((o) => o.name === outputName);
        if (!output) {
            const available = sourceBlock.outputs.map((o) => o.name).join(", ");
            return `Output "${outputName}" not found on block ${sourceBlockId} ("${sourceBlock.name}"). Available: ${available}`;
        }

        const input = targetBlock.inputs.find((i) => i.name === inputName);
        if (!input) {
            const available = targetBlock.inputs.map((i) => i.name).join(", ");
            return `Input "${inputName}" not found on block ${targetBlockId} ("${targetBlock.name}"). Available: ${available}`;
        }

        // ── Type-compatibility check ──────────────────────────────────
        const outputType = _resolveOutputType(sourceBlock, outputName);
        const inputType = _resolveInputType(targetBlock, inputName);
        const compat = _checkTypeCompatibility(outputType, inputType, targetBlock, inputName);

        if (!compat.compatible) {
            const parts = [`TYPE MISMATCH WARNING: ${compat.warning}`];
            if (compat.suggestion) {
                parts.push(compat.suggestion);
            }
            parts.push("The connection was NOT made. Fix the types or choose a compatible input.");
            return parts.join(" ");
        }

        // An input can only have one connection — overwrite any existing one
        input.inputName = input.name; // Required by _restoreConnections()
        input.targetBlockId = sourceBlockId;
        input.targetConnectionName = outputName;

        // Return OK, but include any promotion warnings
        if (compat.warning) {
            return `OK (note: ${compat.warning})`;
        }

        return "OK";
    }

    /**
     * Disconnect an input on a block.
     * @param materialName - Name of the target material.
     * @param blockId - The block whose input to disconnect.
     * @param inputName - Name of the input connection point.
     * @returns "OK" or an error string.
     */
    disconnectInput(materialName: string, blockId: number, inputName: string): string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found.`;
        }

        const block = mat.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const input = block.inputs.find((i) => i.name === inputName);
        if (!input) {
            return `Input "${inputName}" not found.`;
        }
        delete input.inputName;
        delete input.targetBlockId;
        delete input.targetConnectionName;
        return "OK";
    }

    // ── Queries ────────────────────────────────────────────────────────

    /**
     * Get the current state of a material as a formatted description.
     * @param materialName - Name of the material to describe.
     * @returns A human-readable string describing the material graph.
     */
    describeMaterial(materialName: string): string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`Material: ${materialName}`);
        lines.push(`Mode: ${Object.entries(NodeMaterialModes).find(([, v]) => v === mat.mode)?.[0] ?? mat.mode}`);
        lines.push(`Blocks (${mat.blocks.length}):`);

        for (const block of mat.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            lines.push(`  [${block.id}] ${block.name} (${typeName})`);

            if (block.inputs.length > 0) {
                for (const inp of block.inputs) {
                    if (inp.targetBlockId !== undefined) {
                        const srcBlock = mat.blocks.find((b) => b.id === inp.targetBlockId);
                        lines.push(`    ← ${inp.name} ← [${inp.targetBlockId}] ${srcBlock?.name ?? "?"}.${inp.targetConnectionName}`);
                    }
                }
            }
        }

        lines.push(`Output nodes: [${mat.outputNodes.join(", ")}]`);
        if (mat.comment) {
            lines.push(`Comment: ${mat.comment}`);
        }
        return lines.join("\n");
    }

    /**
     * Describe a single block in detail.
     * @param materialName - Name of the material containing the block.
     * @param blockId - The block id to describe.
     * @returns A human-readable string describing the block.
     */
    describeBlock(materialName: string, blockId: number): string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found.`;
        }

        const block = mat.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const typeName = block.customType.replace("BABYLON.", "");
        const lines: string[] = [];
        lines.push(`Block [${block.id}]: "${block.name}" — type ${typeName}`);

        lines.push("\nInputs:");
        for (const inp of block.inputs) {
            const conn = inp.targetBlockId !== undefined ? ` ← connected to [${inp.targetBlockId}].${inp.targetConnectionName}` : " (unconnected)";
            lines.push(`  • ${inp.name}${conn}`);
        }

        lines.push("\nOutputs:");
        for (const out of block.outputs) {
            // Find all blocks connected to this output
            const consumers: string[] = [];
            for (const b of mat.blocks) {
                for (const i of b.inputs) {
                    if (i.targetBlockId === blockId && i.targetConnectionName === out.name) {
                        consumers.push(`[${b.id}] ${b.name}.${i.name}`);
                    }
                }
            }
            const conn = consumers.length > 0 ? ` → ${consumers.join(", ")}` : " (unconnected)";
            lines.push(`  • ${out.name}${conn}`);
        }

        // Show any extra properties
        const ignoredKeys = new Set(["customType", "id", "name", "target", "inputs", "outputs"]);
        const extraProps = Object.entries(block).filter(([k]) => !ignoredKeys.has(k));
        if (extraProps.length > 0) {
            lines.push("\nProperties:");
            for (const [k, v] of extraProps) {
                lines.push(`  ${k}: ${JSON.stringify(v)}`);
            }
        }

        return lines.join("\n");
    }

    // ── Serialisation ─────────────────────────────────────────────────

    /**
     * Export to the NME JSON format that Babylon.js can load.
     * @param materialName - Name of the material to export.
     * @returns The JSON string, or undefined if the material is not found.
     */
    exportJSON(materialName: string): string | undefined {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return undefined;
        }

        // Final pass: ensure every block has required properties for safe deserialization
        for (const block of mat.blocks) {
            if (block.customType === "BABYLON.InputBlock") {
                this._normaliseInputBlockValue(block);
                this._ensureDefaultValue(block);
            }

            // Apply mandatory defaults from the registry for any block type
            const typeName = block.customType.replace("BABYLON.", "");
            const info = BlockRegistryByClassName[typeName];
            if (info?.defaultSerializedProperties) {
                for (const [key, value] of Object.entries(info.defaultSerializedProperties)) {
                    if (block[key] === undefined) {
                        block[key] = value;
                    }
                }
            }

            // Convert any remaining string enum values to numbers
            const enumProps = BlockEnumProperties[typeName];
            if (enumProps) {
                for (const [key, enumMap] of Object.entries(enumProps)) {
                    if (typeof block[key] === "string") {
                        block[key] = enumMap[block[key] as string] ?? block[key];
                    }
                }
            }
        }

        // Normalise RemapBlock: ensure sourceRange / targetRange are Vector2 arrays.
        // The AI may have set sourceMin / sourceMax / targetMin / targetMax as scalars;
        // Babylon's RemapBlock._deserialize expects sourceRange and targetRange as [min, max].
        for (const block of mat.blocks) {
            if (block.customType === "BABYLON.RemapBlock") {
                if (!Array.isArray(block["sourceRange"])) {
                    const sMin = block["sourceMin"] ?? -1;
                    const sMax = block["sourceMax"] ?? 1;
                    block["sourceRange"] = [sMin, sMax];
                }
                if (!Array.isArray(block["targetRange"])) {
                    const tMin = block["targetMin"] ?? 0;
                    const tMax = block["targetMax"] ?? 1;
                    block["targetRange"] = [tMin, tMax];
                }
                // Clean up scalar keys that are not part of the serialization format
                delete block["sourceMin"];
                delete block["sourceMax"];
                delete block["targetMin"];
                delete block["targetMax"];
            }
        }

        // Convert bare-URL texture strings into proper serialized Texture objects
        // so that NodeMaterial.Parse() → TextureBlock._deserialize() works correctly.
        // _deserialize expects { name, url, ... } — a string URL is silently ignored.
        for (const block of mat.blocks) {
            for (const prop of ["texture", "reflectionTexture"] as const) {
                if (typeof block[prop] === "string") {
                    const url = block[prop] as string;
                    block[prop] = {
                        name: url,
                        url: url,
                        uOffset: 0,
                        vOffset: 0,
                        uScale: 1,
                        vScale: 1,
                        uAng: 0,
                        vAng: 0,
                        wAng: 0,
                        invertY: true,
                        samplingMode: 3,
                        noMipmap: false,
                        coordinatesMode: 0,
                        coordinatesIndex: 0,
                        hasAlpha: false,
                        level: 1,
                    };
                }
            }
        }

        // Compute a proper layered graph layout for the editor
        this._layoutGraph(mat);

        return JSON.stringify(mat, null, 2);
    }

    // ── Graph Layout ───────────────────────────────────────────────────

    /** Horizontal spacing between columns in the editor (px). */
    private static readonly COL_WIDTH = 340;
    /** Vertical spacing between blocks within a column (px). */
    private static readonly ROW_HEIGHT = 180;

    /**
     * Compute a layered graph layout for the material and write it into
     * `editorData.locations`.  The algorithm:
     *
     * 1. Build predecessor/successor maps from block connections.
     * 2. Assign each block a **depth** via longest-path BFS backwards from
     *    the output nodes (VertexOutputBlock / FragmentOutputBlock).
     * 3. Reverse depth so that input blocks are on the left (column 0) and
     *    output blocks are on the right (max column).
     * 4. Within each column, sort blocks so that they appear near the blocks
     *    they connect to in the next column (barycenter heuristic).
     * 5. Write `{ blockId, x, y }` locations.
     *
     * @param mat - The material to lay out.
     */
    private _layoutGraph(mat: ISerializedMaterial): void {
        const blocks = mat.blocks;
        if (blocks.length === 0) {
            return;
        }

        const blockById = new Map<number, ISerializedBlock>();
        for (const b of blocks) {
            blockById.set(b.id, b);
        }

        // ── Step 1: Build adjacency ────────────────────────────────────
        // predecessors[id] = set of block IDs whose outputs feed INTO this block
        // successors[id]   = set of block IDs this block FEEDS into
        const predecessors = new Map<number, Set<number>>();
        const successors = new Map<number, Set<number>>();
        for (const b of blocks) {
            predecessors.set(b.id, new Set());
            successors.set(b.id, new Set());
        }
        for (const b of blocks) {
            for (const inp of b.inputs) {
                if (inp.targetBlockId !== undefined) {
                    predecessors.get(b.id)!.add(inp.targetBlockId);
                    successors.get(inp.targetBlockId)?.add(b.id);
                }
            }
        }

        // ── Step 2: Longest-path depth from output nodes ───────────────
        // BFS backwards: output nodes start at depth 0, their predecessors
        // at depth 1, etc.  We keep the *maximum* depth for each block.
        const depth = new Map<number, number>();
        const queue: number[] = [];
        for (const b of blocks) {
            const typeName = b.customType.replace("BABYLON.", "");
            if (typeName === "VertexOutputBlock" || typeName === "FragmentOutputBlock") {
                depth.set(b.id, 0);
                queue.push(b.id);
            }
        }
        // If no output nodes found, just use the last block
        if (queue.length === 0 && blocks.length > 0) {
            depth.set(blocks[blocks.length - 1].id, 0);
            queue.push(blocks[blocks.length - 1].id);
        }

        let head = 0;
        while (head < queue.length) {
            const id = queue[head++];
            const d = depth.get(id)!;
            for (const predId of predecessors.get(id) ?? []) {
                const existing = depth.get(predId);
                if (existing === undefined || d + 1 > existing) {
                    depth.set(predId, d + 1);
                    queue.push(predId);
                }
            }
        }

        // Any blocks not reached (disconnected) get max depth + 1
        const maxDepth = Math.max(0, ...depth.values());
        for (const b of blocks) {
            if (!depth.has(b.id)) {
                depth.set(b.id, maxDepth + 1);
            }
        }

        // ── Step 3: Reverse so inputs are on the left ──────────────────
        const totalMaxDepth = Math.max(0, ...depth.values());
        const column = new Map<number, number>();
        for (const [id, d] of depth) {
            column.set(id, totalMaxDepth - d);
        }

        // ── Step 4: Group blocks by column and sort within each column ─
        const columns = new Map<number, number[]>();
        for (const b of blocks) {
            const col = column.get(b.id)!;
            if (!columns.has(col)) {
                columns.set(col, []);
            }
            columns.get(col)!.push(b.id);
        }

        // Barycenter heuristic: sort blocks within each column by the
        // average Y-position of their successors in the next column.
        // We process columns from right-to-left so the rightmost column
        // (outputs) keeps a stable order.
        const sortedCols = [...columns.keys()].sort((a, b) => b - a);
        const yPosition = new Map<number, number>();

        for (const col of sortedCols) {
            const colBlocks = columns.get(col)!;

            if (col === sortedCols[0]) {
                // Rightmost column — just stack vertically
                colBlocks.forEach((id, i) => yPosition.set(id, i));
            } else {
                // Sort by barycenter of successors' Y positions
                const barycenters = new Map<number, number>();
                for (const id of colBlocks) {
                    const succs = successors.get(id)!;
                    const succYs: number[] = [];
                    for (const sid of succs) {
                        const sy = yPosition.get(sid);
                        if (sy !== undefined) {
                            succYs.push(sy);
                        }
                    }
                    if (succYs.length > 0) {
                        barycenters.set(id, succYs.reduce((a, b) => a + b, 0) / succYs.length);
                    } else {
                        // No successors placed yet — use a large value to push to bottom
                        barycenters.set(id, 9999);
                    }
                }
                colBlocks.sort((a, b) => barycenters.get(a)! - barycenters.get(b)!);
                colBlocks.forEach((id, i) => yPosition.set(id, i));
            }
        }

        // ── Step 5: Write locations ────────────────────────────────────
        const locations: Array<{ blockId: number; x: number; y: number }> = [];
        for (const b of blocks) {
            const col = column.get(b.id)!;
            const row = yPosition.get(b.id)!;
            locations.push({
                blockId: b.id,
                x: col * MaterialGraphManager.COL_WIDTH,
                y: row * MaterialGraphManager.ROW_HEIGHT,
            });
        }

        if (!mat.editorData) {
            mat.editorData = { locations };
        } else {
            mat.editorData.locations = locations;
        }
    }

    /**
     * Import an NME JSON string.
     * @param materialName - Name to assign to the imported material.
     * @param json - The NME JSON string to parse.
     * @returns "OK" or an error string.
     */
    importJSON(materialName: string, json: string): string {
        try {
            const parsed = ValidateNodeMaterialAttachmentPayload(json) as unknown as ISerializedMaterial;
            this._materials.set(materialName, parsed);

            // Set nextId to be one higher than the max block id
            const maxId = parsed.blocks.reduce((max, b) => Math.max(max, b.id), 0);
            this._nextId.set(materialName, maxId + 1);
            this._nextX.set(materialName, parsed.blocks.length * 280);

            return "OK";
        } catch (e) {
            return (e as Error).message;
        }
    }

    // ── Block Property Mutation ────────────────────────────────────────

    /**
     * Set one or more properties on a block.
     * @param materialName - Name of the target material.
     * @param blockId - The block id to update.
     * @param properties - Key-value pairs to set on the block.
     * @returns "OK" or an error string.
     */
    setBlockProperties(materialName: string, blockId: number, properties: Record<string, unknown>): string {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return `Material "${materialName}" not found.`;
        }

        const block = mat.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const typeName = block.customType.replace("BABYLON.", "");

        for (const [key, value] of Object.entries(properties)) {
            if (typeName === "InputBlock" && key === "type" && typeof value === "string") {
                block["type"] = ConnectionPointTypes[value] ?? value;
            } else if (typeName === "InputBlock" && key === "systemValue" && typeof value === "string") {
                block["systemValue"] = SystemValues[value] ?? value;
                block["mode"] = 0; // Undefined mode for system values
            } else if (typeName === "InputBlock" && key === "animationType" && typeof value === "string") {
                block["animationType"] = AnimationTypes[value] ?? value;
            } else if (typeName === "InputBlock" && key === "mode" && typeof value === "string") {
                const modeMap: Record<string, number> = { Uniform: 0, Attribute: 1, Varying: 2, Undefined: 3 };
                block["mode"] = modeMap[value] ?? value;
            } else if (typeof value === "string" && BlockEnumProperties[typeName]?.[key]) {
                // Convert human-readable enum string to numeric value for non-InputBlock blocks
                const enumMap = BlockEnumProperties[typeName][key];
                block[key] = enumMap[value] ?? value;
            } else {
                block[key] = value;
            }
        }

        // Re-normalise InputBlock value after property changes
        if (typeName === "InputBlock") {
            // Normalise attributeName to a valid Babylon.js vertex attribute
            if (block["attributeName"] !== undefined) {
                const attrResult = normaliseAttributeName(block["attributeName"]);
                block["attributeName"] = attrResult.name;
                if (attrResult.warning) {
                    return attrResult.warning;
                }
            }
            // Auto-set Attribute mode when attributeName is provided
            if (block["attributeName"] !== undefined && (block["mode"] === 3 || block["mode"] === 0)) {
                block["mode"] = 1; // Attribute — reads from vertex buffer
            }
            this._normaliseInputBlockValue(block);
            this._ensureDefaultValue(block);
        }

        return "OK";
    }

    // ── Validation ────────────────────────────────────────────────────

    /**
     * Run basic validation on the graph and return any warnings/errors.
     * @param materialName - Name of the material to validate.
     * @returns An array of issue strings (or a success message).
     */
    validateMaterial(materialName: string): string[] {
        const mat = this._materials.get(materialName);
        if (!mat) {
            return [`Material "${materialName}" not found.`];
        }

        const issues: string[] = [];

        // Check for output nodes
        const hasVertexOutput = mat.blocks.some((b) => b.customType === "BABYLON.VertexOutputBlock");
        const hasFragmentOutput = mat.blocks.some((b) => b.customType === "BABYLON.FragmentOutputBlock");

        if (mat.mode === NodeMaterialModes.Material) {
            if (!hasVertexOutput) {
                issues.push("ERROR: Missing VertexOutputBlock — every material needs one.");
            }
            if (!hasFragmentOutput) {
                issues.push("ERROR: Missing FragmentOutputBlock — every material needs one.");
            }
        }

        // Check for unconnected required inputs
        for (const block of mat.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            const info = Object.values(BlockRegistry).find((r) => r.className === typeName);
            if (!info) {
                continue;
            }

            for (const inp of block.inputs) {
                const inputInfo = info.inputs.find((i) => i.name === inp.name);
                if (inp.targetBlockId === undefined && inputInfo && !inputInfo.isOptional) {
                    // Skip warning if the block has defaultSerializedProperties that provide
                    // a fallback for this input (e.g. RemapBlock sourceRange covers sourceMin/sourceMax)
                    if (info.defaultSerializedProperties && Object.keys(info.defaultSerializedProperties).length > 0) {
                        continue;
                    }
                    issues.push(`WARNING: Block [${block.id}] "${block.name}" has required input "${inp.name}" that is not connected.`);
                }
            }
        }

        // Check that output nodes actually exist
        for (const outputId of mat.outputNodes) {
            if (!mat.blocks.find((b) => b.id === outputId)) {
                issues.push(`ERROR: Output node references block ${outputId} which does not exist.`);
            }
        }

        // Check for dangling connection references
        for (const block of mat.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId !== undefined) {
                    const src = mat.blocks.find((b) => b.id === inp.targetBlockId);
                    if (!src) {
                        issues.push(`ERROR: Block [${block.id}] "${block.name}" input "${inp.name}" references non-existent block ${inp.targetBlockId}.`);
                    } else if (!src.outputs.find((o) => o.name === inp.targetConnectionName)) {
                        issues.push(
                            `WARNING: Block [${block.id}] "${block.name}" input "${inp.name}" references output "${inp.targetConnectionName}" which doesn't exist on block [${src.id}].`
                        );
                    }
                }
            }
        }

        // Check InputBlock-specific issues
        for (const block of mat.blocks) {
            if (block.customType !== "BABYLON.InputBlock") {
                continue;
            }
            if (block["type"] === undefined) {
                issues.push(
                    `ERROR: InputBlock [${block.id}] "${block.name}" has no 'type' property. ` + `Set type to: Float, Int, Vector2, Vector3, Vector4, Color3, Color4, or Matrix.`
                );
            }
            const hasValue = block["value"] !== undefined;
            const hasSysVal = block["systemValue"] !== undefined;
            const hasAttr = block["attributeName"] !== undefined;
            if (!hasValue && !hasSysVal && !hasAttr) {
                issues.push(`WARNING: InputBlock [${block.id}] "${block.name}" has no value, systemValue, or attributeName — it provides no data.`);
            }
        }

        // Check for orphan blocks (no connections in or out, not an output block)
        for (const block of mat.blocks) {
            if (block.customType === "BABYLON.VertexOutputBlock" || block.customType === "BABYLON.FragmentOutputBlock") {
                continue; // Output blocks are sinks — they only have inputs
            }
            if (block.customType === "BABYLON.InputBlock") {
                continue; // InputBlocks are sources — they only have outputs, checked separately above
            }
            const hasIncomingConnection = block.inputs.some((inp) => inp.targetBlockId !== undefined);
            const hasOutgoingConnection = mat.blocks.some((other) => other.inputs.some((inp) => inp.targetBlockId === block.id));
            if (!hasIncomingConnection && !hasOutgoingConnection) {
                issues.push(`WARNING: Block [${block.id}] "${block.name}" (${block.customType.replace("BABYLON.", "")}) has no connections — it is an orphan and does nothing.`);
            }
        }

        if (issues.length === 0) {
            issues.push("No issues found — graph looks valid.");
        }

        return issues;
    }
}
