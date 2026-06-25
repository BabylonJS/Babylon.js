/* eslint-disable @typescript-eslint/naming-convention */
/**
 * GeometryGraphManager – holds an in-memory representation of a Node Geometry
 * graph that the MCP tools build up incrementally.  When the user is satisfied,
 * the graph can be serialised to the NGE JSON format that Babylon.js understands.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server must remain a light,
 *    standalone process.  We therefore work purely with a JSON data model that
 *    mirrors the serialisation format NodeGeometry.serialize() produces.
 * 2. **Idempotent & stateful** – the manager stores the current graph in memory
 *    so an AI agent can add blocks, connect them, tweak properties, and finally
 *    export.  Multiple geometry graphs can coexist (keyed by name).
 */

import { ValidateNodeGeometryAttachmentPayload } from "@tools/mcp-server-core";

import { BlockRegistry, type IBlockTypeInfo } from "./blockRegistry.js";

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Serialized form of a single connection point (input or output) on a block.
 */
export interface ISerializedConnectionPoint {
    /** Name of the connection point */
    name: string;
    /** Display name shown in the NGE editor */
    displayName?: string;
    /** The input-side name this feeds into on the target block */
    inputName?: string;
    /** ID of the block this connection links to */
    targetBlockId?: number;
    /** Name of the output on the linked block */
    targetConnectionName?: string;
    /** Whether exposed on the NGE editor frame */
    isExposedOnFrame?: boolean;
    /** Position when exposed on frame */
    exposedPortPosition?: number;
}

/**
 * Serialized form of a single Node Geometry block.
 */
export interface ISerializedBlock {
    /** The Babylon.js class identifier (e.g. "BABYLON.BoxBlock") */
    customType: string;
    /** Unique block identifier within the geometry */
    id: number;
    /** Human-friendly block name */
    name: string;
    /** Input connection points */
    inputs: ISerializedConnectionPoint[];
    /** Output connection points */
    outputs: ISerializedConnectionPoint[];
    /** Block-specific values (e.g. evaluateContext, operation, type, value …) */
    [key: string]: unknown;
}

/**
 * Serialized form of a complete Node Geometry.
 */
export interface ISerializedGeometry {
    /** Mark the format */
    customType: string;
    /** Block ID of the single output node (GeometryOutputBlock) */
    outputNodeId: number;
    /** All blocks in the geometry graph */
    blocks: ISerializedBlock[];
    /** NGE editor layout data */
    editorData?: {
        /** Block positions in the editor */
        locations: Array<{ /** Block ID */ blockId: number; /** X coordinate */ x: number; /** Y coordinate */ y: number }>;
    };
    /** Optional comment / description */
    comment?: string;
}

// ─── Enum mappings ────────────────────────────────────────────────────────

/** Mapping from human-readable type names to NodeGeometryBlockConnectionPointTypes enum values */
export const ConnectionPointTypes: Record<string, number> = {
    Int: 0x0001,
    Float: 0x0002,
    Vector2: 0x0004,
    Vector3: 0x0008,
    Vector4: 0x0010,
    Matrix: 0x0020,
    Geometry: 0x0040,
    Texture: 0x0080,
    AutoDetect: 0x0400,
    BasedOnInput: 0x0800,
    Undefined: 0x1000,
};

/** Mapping from human-readable contextual source names to NodeGeometryContextualSources enum values */
export const ContextualSources: Record<string, number> = {
    None: 0,
    Positions: 1,
    Normals: 2,
    Tangents: 3,
    UV: 4,
    UV2: 5,
    UV3: 6,
    UV4: 7,
    UV5: 8,
    UV6: 9,
    Colors: 10,
    VertexID: 11,
    FaceID: 12,
    GeometryID: 13,
    CollectionID: 14,
    LoopID: 15,
    InstanceID: 16,
    LatticeID: 17,
    LatticeControl: 18,
};

/**
 * Auto-derive the connection point type from a contextual source.
 * When `contextualValue` is set, the input block's output type is determined by the source.
 */
const ContextualSourceToType: Record<number, number> = {
    [ContextualSources.None]: ConnectionPointTypes.AutoDetect,
    [ContextualSources.Positions]: ConnectionPointTypes.Vector3,
    [ContextualSources.Normals]: ConnectionPointTypes.Vector3,
    [ContextualSources.Tangents]: ConnectionPointTypes.Vector3,
    [ContextualSources.UV]: ConnectionPointTypes.Vector2,
    [ContextualSources.UV2]: ConnectionPointTypes.Vector2,
    [ContextualSources.UV3]: ConnectionPointTypes.Vector2,
    [ContextualSources.UV4]: ConnectionPointTypes.Vector2,
    [ContextualSources.UV5]: ConnectionPointTypes.Vector2,
    [ContextualSources.UV6]: ConnectionPointTypes.Vector2,
    [ContextualSources.Colors]: ConnectionPointTypes.Vector4,
    [ContextualSources.VertexID]: ConnectionPointTypes.Int,
    [ContextualSources.FaceID]: ConnectionPointTypes.Int,
    [ContextualSources.GeometryID]: ConnectionPointTypes.Int,
    [ContextualSources.CollectionID]: ConnectionPointTypes.Int,
    [ContextualSources.LoopID]: ConnectionPointTypes.Int,
    [ContextualSources.InstanceID]: ConnectionPointTypes.Int,
    [ContextualSources.LatticeID]: ConnectionPointTypes.Int,
    [ContextualSources.LatticeControl]: ConnectionPointTypes.Vector3,
};

// ─── Block Enum Properties ────────────────────────────────────────────────

/** MathBlockOperations */
const MathBlockOperations: Record<string, number> = {
    Add: 0,
    Subtract: 1,
    Multiply: 2,
    Divide: 3,
    Max: 4,
    Min: 5,
};

/** GeometryTrigonometryBlockOperations */
const TrigonometryOperations: Record<string, number> = {
    Cos: 0,
    Sin: 1,
    Abs: 2,
    Exp: 3,
    Round: 4,
    Floor: 5,
    Ceiling: 6,
    Sqrt: 7,
    Log: 8,
    Tan: 9,
    ArcTan: 10,
    ArcCos: 11,
    ArcSin: 12,
    Sign: 13,
    Negate: 14,
    OneMinus: 15,
    Reciprocal: 16,
    ToDegrees: 17,
    ToRadians: 18,
    Fract: 19,
    Exp2: 20,
};

/** ConditionBlockTests */
const ConditionBlockTests: Record<string, number> = {
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

/** BooleanGeometryOperations */
const BooleanGeometryOperations: Record<string, number> = {
    Intersect: 0,
    Subtract: 1,
    Union: 2,
};

/** RandomBlockLocks */
const RandomBlockLocks: Record<string, number> = {
    None: 0,
    LoopID: 1,
    InstanceID: 2,
    Once: 3,
};

/** Aggregations */
const Aggregations: Record<string, number> = {
    Max: 0,
    Min: 1,
    Sum: 2,
};

/** MappingTypes */
const MappingTypes: Record<string, number> = {
    Spherical: 0,
    Cylindrical: 1,
    Cubic: 2,
};

/** GeometryEaseBlockTypes / GeometryCurveBlockTypes */
const EaseTypes: Record<string, number> = {
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
 * Maps block type names to their property→enum-map pairs.
 * When a property value is a string, we look up the numeric equivalent here.
 */
const BlockEnumProperties: Record<string, Record<string, Record<string, number>>> = {
    MathBlock: { operation: MathBlockOperations },
    GeometryTrigonometryBlock: { operation: TrigonometryOperations },
    ConditionBlock: { test: ConditionBlockTests },
    BooleanGeometryBlock: { operation: BooleanGeometryOperations },
    RandomBlock: { lockMode: RandomBlockLocks },
    AggregatorBlock: { aggregation: Aggregations },
    MappingBlock: { mapping: MappingTypes },
    GeometryEaseBlock: { type: EaseTypes },
    GeometryCurveBlock: { curveType: EaseTypes },
};

// ─── Manager ──────────────────────────────────────────────────────────────

/**
 * Holds in-memory representations of Node Geometry graphs that MCP tools build up incrementally.
 */
export class GeometryGraphManager {
    /** All managed geometry graphs, keyed by geometry name. */
    private _geometries = new Map<string, ISerializedGeometry>();
    /** Auto-increment block id counter per geometry */
    private _nextId = new Map<string, number>();
    /** Layout tracking for aesthetic NGE positioning */
    private _nextX = new Map<string, number>();

    // ── Lifecycle ──────────────────────────────────────────────────────

    /**
     * Create a new empty geometry graph.
     * @param name - Unique name for the geometry.
     * @param comment - Optional comment/description.
     * @returns The newly created serialized geometry.
     */
    createGeometry(name: string, comment?: string): ISerializedGeometry {
        const geo: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
            comment,
        };
        this._geometries.set(name, geo);
        this._nextId.set(name, 1);
        this._nextX.set(name, 0);
        return geo;
    }

    /**
     * Retrieve a geometry graph by name.
     * @param name - The geometry name.
     * @returns The serialized geometry, or undefined if not found.
     */
    getGeometry(name: string): ISerializedGeometry | undefined {
        return this._geometries.get(name);
    }

    /**
     * List the names of all managed geometries.
     * @returns An array of geometry names.
     */
    listGeometries(): string[] {
        return Array.from(this._geometries.keys());
    }

    /**
     * Delete a geometry graph by name.
     * @param name - The geometry name to delete.
     * @returns True if the geometry was found and deleted.
     */
    deleteGeometry(name: string): boolean {
        this._nextId.delete(name);
        this._nextX.delete(name);
        return this._geometries.delete(name);
    }

    /**
     * Remove all geometry graphs from memory, resetting the manager to its initial state.
     */
    clearAll(): void {
        this._geometries.clear();
        this._nextId.clear();
        this._nextX.clear();
    }

    // ── Block CRUD ─────────────────────────────────────────────────────

    /**
     * Add a block to the geometry graph.
     *
     * @param geometryName  Name of the geometry graph to add to.
     * @param blockType     Registry key (e.g. "BoxBlock", "GeometryInputBlock").
     * @param blockName     Human-friendly name for this instance.
     * @param properties    Extra key-value properties to set on the block JSON.
     * @returns The serialised block, or an error string.
     */
    addBlock(geometryName: string, blockType: string, blockName?: string, properties?: Record<string, unknown>): { block: ISerializedBlock; warnings?: string[] } | string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found. Create it first.`;
        }

        const info: IBlockTypeInfo | undefined = BlockRegistry[blockType];
        if (!info) {
            return `Unknown block type "${blockType}". Use list_block_types to see available blocks.`;
        }

        const warnings: string[] = [];

        const id = this._nextId.get(geometryName)!;
        this._nextId.set(geometryName, id + 1);

        const name = blockName ?? `${blockType}_${id}`;

        const block: ISerializedBlock = {
            customType: `BABYLON.${info.className}`,
            id,
            name,
            inputs: info.inputs.map((inp) => ({
                name: inp.name,
                displayName: inp.name,
            })),
            outputs: info.outputs.map((out) => ({
                name: out.name,
                displayName: out.name,
            })),
        };

        // Set default GeometryInputBlock fields so the NGE parser never sees missing values
        if (blockType === "GeometryInputBlock") {
            block["type"] = ConnectionPointTypes.Float; // Default; overridden below
            block["contextualValue"] = ContextualSources.None;
            block["min"] = 0;
            block["max"] = 0;
            block["groupInInspector"] = "";
            block["displayInInspector"] = true;
        }

        // Apply registry-defined default properties
        if (info.defaultSerializedProperties) {
            for (const [key, value] of Object.entries(info.defaultSerializedProperties)) {
                block[key] = value;
            }
        }

        // Apply user-supplied properties
        if (properties) {
            for (const [key, value] of Object.entries(properties)) {
                if (blockType === "GeometryInputBlock" && key === "type" && typeof value === "string") {
                    block["type"] = ConnectionPointTypes[value] ?? value;
                } else if (blockType === "GeometryInputBlock" && key === "contextualValue" && typeof value === "string") {
                    const cv = ContextualSources[value] ?? value;
                    block["contextualValue"] = cv;
                    // Auto-derive type from contextual source
                    if (typeof cv === "number" && cv !== ContextualSources.None && ContextualSourceToType[cv] !== undefined) {
                        block["type"] = ContextualSourceToType[cv];
                    }
                } else if (typeof value === "string" && BlockEnumProperties[blockType]?.[key]) {
                    block[key] = BlockEnumProperties[blockType][key][value] ?? value;
                } else {
                    block[key] = value;
                }
            }
        }

        // For GeometryInputBlock: normalise the value
        if (blockType === "GeometryInputBlock") {
            this._normaliseInputBlockValue(block);
            this._ensureDefaultValue(block);
        }

        // Auto-mark as output node if this is the output block
        if (blockType === "GeometryOutputBlock") {
            geo.outputNodeId = id;
        }

        // Track editor location for nice layout
        const x = this._nextX.get(geometryName)!;
        this._nextX.set(geometryName, x + 280);
        if (!geo.editorData) {
            geo.editorData = { locations: [] };
        }
        geo.editorData.locations.push({ blockId: id, x, y: 0 });

        // ── GeometryInputBlock-specific warnings ────────────────────────
        if (blockType === "GeometryInputBlock") {
            const cv = block["contextualValue"] as number;
            const hasValue = block["value"] !== undefined;
            if (cv === ContextualSources.None && !hasValue) {
                warnings.push(
                    `⚠ GeometryInputBlock "${block.name}" has contextualValue=None and no value. ` +
                        `Set either a contextualValue (e.g. 'Positions', 'Normals', 'UV', 'VertexID') ` +
                        `or provide a constant value.`
                );
            }
        }

        geo.blocks.push(block);
        return { block, warnings: warnings.length > 0 ? warnings : undefined };
    }

    /**
     * Normalise a GeometryInputBlock's `value` to the format the NGE parser expects,
     * and set the corresponding `valueType` string.
     *
     * Babylon's GeometryInputBlock._deserialize reads:
     *   valueType === "number" → value is a scalar
     *   otherwise             → GetClass(valueType).FromArray(value)
     * @param block - The GeometryInputBlock to normalise.
     */
    private _normaliseInputBlockValue(block: ISerializedBlock): void {
        const val = block["value"];
        if (val === undefined || val === null) {
            return;
        }

        const type = block["type"] as number | undefined;

        // Scalar values
        if (typeof val === "number") {
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
            if ("x" in obj) {
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
        const typeMap: Record<number, string> = {
            [ConnectionPointTypes.Vector2]: "BABYLON.Vector2",
            [ConnectionPointTypes.Vector3]: "BABYLON.Vector3",
            [ConnectionPointTypes.Vector4]: "BABYLON.Vector4",
            [ConnectionPointTypes.Matrix]: "BABYLON.Matrix",
        };
        if (type !== undefined && typeMap[type]) {
            return typeMap[type];
        }

        const lengthMap: Record<number, string> = {
            2: "BABYLON.Vector2",
            3: "BABYLON.Vector3",
            4: "BABYLON.Vector4",
            16: "BABYLON.Matrix",
        };
        return lengthMap[length] ?? "BABYLON.Vector3";
    }

    /**
     * Ensure that GeometryInputBlocks of vector/matrix types always have a default value
     * so the editor doesn't crash reading .x on undefined.
     * @param block - The GeometryInputBlock to ensure has a default value.
     */
    private _ensureDefaultValue(block: ISerializedBlock): void {
        if (block["value"] !== undefined && block["value"] !== null) {
            return;
        }

        // Contextual values don't need a stored value
        const cv = block["contextualValue"] as number | undefined;
        if (cv !== undefined && cv !== ContextualSources.None) {
            return;
        }

        const type = block["type"] as number | undefined;
        if (type === undefined) {
            return;
        }

        const defaults: Record<number, { value: number | number[]; valueType: string }> = {
            [ConnectionPointTypes.Float]: { value: 0, valueType: "number" },
            [ConnectionPointTypes.Int]: { value: 0, valueType: "number" },
            [ConnectionPointTypes.Vector2]: { value: [0, 0], valueType: "BABYLON.Vector2" },
            [ConnectionPointTypes.Vector3]: { value: [0, 0, 0], valueType: "BABYLON.Vector3" },
            [ConnectionPointTypes.Vector4]: { value: [0, 0, 0, 0], valueType: "BABYLON.Vector4" },
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
     * Remove a block from a geometry by its id.
     * @param geometryName - Name of the target geometry.
     * @param blockId - The block id to remove.
     * @returns "OK" or an error string.
     */
    removeBlock(geometryName: string, blockId: number): string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found.`;
        }

        const idx = geo.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) {
            return `Block ${blockId} not found.`;
        }

        // Remove any connections pointing to this block
        for (const block of geo.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId === blockId) {
                    delete inp.targetBlockId;
                    delete inp.targetConnectionName;
                }
            }
        }

        geo.blocks.splice(idx, 1);

        // Clear output reference if this was the output block
        if (geo.outputNodeId === blockId) {
            geo.outputNodeId = -1;
        }

        if (geo.editorData) {
            geo.editorData.locations = geo.editorData.locations.filter((l) => l.blockId !== blockId);
        }

        return "OK";
    }

    // ── Connections ────────────────────────────────────────────────────

    /**
     * Connect an output of one block to an input of another block.
     *
     * @param geometryName
     * @param sourceBlockId   The block whose output we connect FROM.
     * @param outputName      Name of the output connection point on the source.
     * @param targetBlockId   The block whose input we connect TO.
     * @param inputName       Name of the input connection point on the target.
     * @returns "OK" or an error string.
     */
    connectBlocks(geometryName: string, sourceBlockId: number, outputName: string, targetBlockId: number, inputName: string): string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found.`;
        }

        const sourceBlock = geo.blocks.find((b) => b.id === sourceBlockId);
        if (!sourceBlock) {
            return `Source block ${sourceBlockId} not found.`;
        }

        const targetBlock = geo.blocks.find((b) => b.id === targetBlockId);
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

        // An input can only have one connection — overwrite any existing one
        input.inputName = input.name;
        input.targetBlockId = sourceBlockId;
        input.targetConnectionName = outputName;

        return "OK";
    }

    /**
     * Disconnect an input on a block.
     * @param geometryName - Name of the target geometry.
     * @param blockId - The block whose input to disconnect.
     * @param inputName - Name of the input connection point.
     * @returns "OK" or an error string.
     */
    disconnectInput(geometryName: string, blockId: number, inputName: string): string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found.`;
        }

        const block = geo.blocks.find((b) => b.id === blockId);
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
     * Get the current state of a geometry as a formatted description.
     * @param geometryName - Name of the geometry to describe.
     * @returns A human-readable string describing the geometry graph.
     */
    describeGeometry(geometryName: string): string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`Geometry: ${geometryName}`);
        lines.push(`Blocks (${geo.blocks.length}):`);

        for (const block of geo.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            lines.push(`  [${block.id}] ${block.name} (${typeName})`);

            if (block.inputs.length > 0) {
                for (const inp of block.inputs) {
                    if (inp.targetBlockId !== undefined) {
                        const srcBlock = geo.blocks.find((b) => b.id === inp.targetBlockId);
                        lines.push(`    ← ${inp.name} ← [${inp.targetBlockId}] ${srcBlock?.name ?? "?"}.${inp.targetConnectionName}`);
                    }
                }
            }
        }

        lines.push(`Output node: ${geo.outputNodeId >= 0 ? `[${geo.outputNodeId}]` : "(not set)"}`);
        if (geo.comment) {
            lines.push(`Comment: ${geo.comment}`);
        }
        return lines.join("\n");
    }

    /**
     * Describe a single block in detail.
     * @param geometryName - Name of the geometry containing the block.
     * @param blockId - The block id to describe.
     * @returns A human-readable string describing the block.
     */
    describeBlock(geometryName: string, blockId: number): string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found.`;
        }

        const block = geo.blocks.find((b) => b.id === blockId);
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
            const consumers: string[] = [];
            for (const b of geo.blocks) {
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
        const ignoredKeys = new Set(["customType", "id", "name", "inputs", "outputs"]);
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
     * Export to the NGE JSON format that Babylon.js can load.
     * @param geometryName - Name of the geometry to export.
     * @returns The JSON string, or undefined if the geometry is not found.
     */
    exportJSON(geometryName: string): string | undefined {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return undefined;
        }

        // Final pass: ensure every block has required properties for safe deserialization
        for (const block of geo.blocks) {
            if (block.customType === "BABYLON.GeometryInputBlock") {
                this._normaliseInputBlockValue(block);
                this._ensureDefaultValue(block);
            }

            // Apply mandatory defaults from the registry for any block type
            const typeName = block.customType.replace("BABYLON.", "");
            const info = BlockRegistry[typeName];
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

        // Compute a proper layered graph layout for the editor
        this._layoutGraph(geo);

        return JSON.stringify(geo, null, 2);
    }

    // ── Graph Layout ───────────────────────────────────────────────────

    /** Horizontal spacing between columns in the editor (px). */
    private static readonly COL_WIDTH = 340;
    /** Vertical spacing between blocks within a column (px). */
    private static readonly ROW_HEIGHT = 180;

    /**
     * Compute a layered graph layout and write it into `editorData.locations`.
     *
     * Algorithm:
     * 1. Build predecessor/successor maps from block connections.
     * 2. Assign each block a depth via longest-path BFS from the output node.
     * 3. Reverse depth so inputs are on the left, output on the right.
     * 4. Sort within each column with barycenter heuristic.
     * 5. Write `{ blockId, x, y }` locations.
     *
     * @param geo - The geometry to lay out.
     */
    private _layoutGraph(geo: ISerializedGeometry): void {
        const blocks = geo.blocks;
        if (blocks.length === 0) {
            return;
        }

        const blockById = new Map<number, ISerializedBlock>();
        for (const b of blocks) {
            blockById.set(b.id, b);
        }

        // ── Step 1: Build adjacency ────────────────────────────────────
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

        // ── Step 2: Longest-path depth from output node ────────────────
        const depth = new Map<number, number>();
        const queue: number[] = [];

        // Use the output node as the root
        if (geo.outputNodeId >= 0 && blockById.has(geo.outputNodeId)) {
            depth.set(geo.outputNodeId, 0);
            queue.push(geo.outputNodeId);
        } else {
            // Fallback: use blocks that match GeometryOutputBlock
            for (const b of blocks) {
                if (b.customType === "BABYLON.GeometryOutputBlock") {
                    depth.set(b.id, 0);
                    queue.push(b.id);
                }
            }
        }

        // If still nothing, use the last block
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

        // Disconnected blocks get max depth + 1
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

        // ── Step 4: Group blocks by column and sort ────────────────────
        const columns = new Map<number, number[]>();
        for (const b of blocks) {
            const col = column.get(b.id)!;
            if (!columns.has(col)) {
                columns.set(col, []);
            }
            columns.get(col)!.push(b.id);
        }

        const sortedCols = [...columns.keys()].sort((a, b) => b - a);
        const yPosition = new Map<number, number>();

        for (const col of sortedCols) {
            const colBlocks = columns.get(col)!;

            if (col === sortedCols[0]) {
                colBlocks.forEach((id, i) => yPosition.set(id, i));
            } else {
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
                x: col * GeometryGraphManager.COL_WIDTH,
                y: row * GeometryGraphManager.ROW_HEIGHT,
            });
        }

        if (!geo.editorData) {
            geo.editorData = { locations };
        } else {
            geo.editorData.locations = locations;
        }
    }

    /**
     * Import an NGE JSON string.
     * @param geometryName - Name to assign to the imported geometry.
     * @param json - The NGE JSON string to parse.
     * @returns "OK" or an error string.
     */
    importJSON(geometryName: string, json: string): string {
        try {
            const parsed = ValidateNodeGeometryAttachmentPayload(json) as unknown as ISerializedGeometry;
            this._geometries.set(geometryName, parsed);

            const maxId = parsed.blocks.reduce((max, b) => Math.max(max, b.id), 0);
            this._nextId.set(geometryName, maxId + 1);
            this._nextX.set(geometryName, parsed.blocks.length * 280);

            return "OK";
        } catch (e) {
            return (e as Error).message;
        }
    }

    // ── Block Property Mutation ────────────────────────────────────────

    /**
     * Set one or more properties on a block.
     * @param geometryName - Name of the target geometry.
     * @param blockId - The block id to update.
     * @param properties - Key-value pairs to set on the block.
     * @returns "OK" or an error string.
     */
    setBlockProperties(geometryName: string, blockId: number, properties: Record<string, unknown>): string {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return `Geometry "${geometryName}" not found.`;
        }

        const block = geo.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const typeName = block.customType.replace("BABYLON.", "");

        for (const [key, value] of Object.entries(properties)) {
            if (typeName === "GeometryInputBlock" && key === "type" && typeof value === "string") {
                block["type"] = ConnectionPointTypes[value] ?? value;
            } else if (typeName === "GeometryInputBlock" && key === "contextualValue" && typeof value === "string") {
                const cv = ContextualSources[value] ?? value;
                block["contextualValue"] = cv;
                if (typeof cv === "number" && cv !== ContextualSources.None && ContextualSourceToType[cv] !== undefined) {
                    block["type"] = ContextualSourceToType[cv];
                }
            } else if (typeof value === "string" && BlockEnumProperties[typeName]?.[key]) {
                block[key] = BlockEnumProperties[typeName][key][value] ?? value;
            } else {
                block[key] = value;
            }
        }

        // Re-normalise GeometryInputBlock value after property changes
        if (typeName === "GeometryInputBlock") {
            this._normaliseInputBlockValue(block);
            this._ensureDefaultValue(block);
        }

        return "OK";
    }

    // ── Validation ────────────────────────────────────────────────────

    /**
     * Run basic validation on the graph and return any warnings/errors.
     * @param geometryName - Name of the geometry to validate.
     * @returns An array of issue strings (or a success message).
     */
    validateGeometry(geometryName: string): string[] {
        const geo = this._geometries.get(geometryName);
        if (!geo) {
            return [`Geometry "${geometryName}" not found.`];
        }

        const issues: string[] = [];

        // Check for output node
        const hasOutputBlock = geo.blocks.some((b) => b.customType === "BABYLON.GeometryOutputBlock");
        if (!hasOutputBlock) {
            issues.push("ERROR: Missing GeometryOutputBlock — every geometry graph needs exactly one.");
        }

        if (geo.outputNodeId < 0) {
            issues.push("ERROR: outputNodeId is not set. There should be a GeometryOutputBlock.");
        } else if (!geo.blocks.find((b) => b.id === geo.outputNodeId)) {
            issues.push(`ERROR: outputNodeId references block ${geo.outputNodeId} which does not exist.`);
        }

        // Check for unconnected required inputs
        for (const block of geo.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            const info = Object.values(BlockRegistry).find((r) => r.className === typeName);
            if (!info) {
                continue;
            }

            for (const inp of block.inputs) {
                const inputInfo = info.inputs.find((i) => i.name === inp.name);
                if (inp.targetBlockId === undefined && inputInfo && !inputInfo.isOptional) {
                    issues.push(`WARNING: Block [${block.id}] "${block.name}" has required input "${inp.name}" that is not connected.`);
                }
            }
        }

        // Check for dangling connection references
        for (const block of geo.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId !== undefined) {
                    const src = geo.blocks.find((b) => b.id === inp.targetBlockId);
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

        // Check GeometryInputBlock-specific issues
        for (const block of geo.blocks) {
            if (block.customType !== "BABYLON.GeometryInputBlock") {
                continue;
            }
            const cv = block["contextualValue"] as number | undefined;
            const hasValue = block["value"] !== undefined;
            if ((cv === undefined || cv === ContextualSources.None) && !hasValue) {
                issues.push(`WARNING: GeometryInputBlock [${block.id}] "${block.name}" has no contextual value and no constant value — it provides no data.`);
            }
        }

        // Check for orphan blocks
        for (const block of geo.blocks) {
            if (block.customType === "BABYLON.GeometryOutputBlock" || block.customType === "BABYLON.GeometryInputBlock") {
                continue;
            }
            const hasIncomingConnection = block.inputs.some((inp) => inp.targetBlockId !== undefined);
            const hasOutgoingConnection = geo.blocks.some((other) => other.inputs.some((inp) => inp.targetBlockId === block.id));
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
