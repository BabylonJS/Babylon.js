/* eslint-disable @typescript-eslint/naming-convention */
/**
 * ParticleGraphManager – holds an in-memory representation of a Node Particle
 * System Set that the MCP tools build up incrementally.  When the user is
 * satisfied, the graph can be serialised to the NPE JSON format that Babylon.js
 * understands.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server must remain a light,
 *    standalone process.  We therefore work purely with a JSON data model that
 *    mirrors the serialisation format NodeParticleSystemSet.serialize() produces.
 * 2. **Idempotent & stateful** – the manager stores the current graph in memory
 *    so an AI agent can add blocks, connect them, tweak properties, and finally
 *    export.  Multiple particle system sets can coexist (keyed by name).
 */

import { BlockRegistry, type IBlockTypeInfo } from "./blockRegistry.js";

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Serialized form of a single connection point (input or output) on a block.
 */
export interface ISerializedConnectionPoint {
    /** Name of the connection point */
    name: string;
    /** Display name shown in the NPE editor */
    displayName?: string;
    /** The input-side name this feeds into on the target block */
    inputName?: string;
    /** ID of the block this connection links to */
    targetBlockId?: number;
    /** Name of the output on the linked block */
    targetConnectionName?: string;
    /** Whether exposed on the NPE editor frame */
    isExposedOnFrame?: boolean;
    /** Position when exposed on frame */
    exposedPortPosition?: number;
}

/**
 * Serialized form of a single Node Particle block.
 */
export interface ISerializedBlock {
    /** The Babylon.js class identifier (e.g. "BABYLON.SystemBlock") */
    customType: string;
    /** Unique block identifier within the particle system */
    id: number;
    /** Human-friendly block name */
    name: string;
    /** Input connection points */
    inputs: ISerializedConnectionPoint[];
    /** Output connection points */
    outputs: ISerializedConnectionPoint[];
    /** Block-specific values (e.g. operation, type, value …) */
    [key: string]: unknown;
}

/**
 * Serialized form of a complete Node Particle System Set.
 */
export interface ISerializedParticleSystemSet {
    /** Mark the format */
    customType: string;
    /** All blocks in the particle graph */
    blocks: ISerializedBlock[];
    /** NPE editor layout data */
    editorData?: {
        /** Block positions in the editor */
        locations: Array<{ /** Block ID */ blockId: number; /** X coordinate */ x: number; /** Y coordinate */ y: number }>;
    };
    /** Optional comment / description */
    comment?: string;
    /** Name of the set */
    name?: string;
}

// ─── Enum mappings ────────────────────────────────────────────────────────

/** Mapping from human-readable type names to NodeParticleBlockConnectionPointTypes enum values */
export const ConnectionPointTypes: Record<string, number> = {
    Int: 0x0001,
    Float: 0x0002,
    Vector2: 0x0004,
    Vector3: 0x0008,
    Matrix: 0x0010,
    Particle: 0x0020,
    Texture: 0x0040,
    Color4: 0x0080,
    FloatGradient: 0x0100,
    Vector2Gradient: 0x0200,
    Vector3Gradient: 0x0400,
    Color4Gradient: 0x0800,
    System: 0x1000,
    AutoDetect: 0x2000,
    BasedOnInput: 0x4000,
    Undefined: 0x8000,
};

/** Mapping from human-readable contextual source names to NodeParticleContextualSources enum values */
export const ContextualSources: Record<string, number> = {
    None: 0x0000,
    Position: 0x0001,
    Direction: 0x0002,
    Age: 0x0003,
    Lifetime: 0x0004,
    Color: 0x0005,
    ScaledDirection: 0x0006,
    Scale: 0x0007,
    AgeGradient: 0x0008,
    Angle: 0x0009,
    SpriteCellIndex: 0x0010,
    SpriteCellStart: 0x0011,
    SpriteCellEnd: 0x0012,
    InitialColor: 0x0013,
    ColorDead: 0x0014,
    InitialDirection: 0x0015,
    ColorStep: 0x0016,
    ScaledColorStep: 0x0017,
    LocalPositionUpdated: 0x0018,
    Size: 0x0019,
    DirectionScale: 0x0020,
};

/** Mapping from human-readable system source names to NodeParticleSystemSources enum values */
export const SystemSources: Record<string, number> = {
    None: 0,
    Time: 1,
    Delta: 2,
    Emitter: 3,
    CameraPosition: 4,
};

/**
 * Auto-derive the connection point type from a contextual source.
 */
const ContextualSourceToType: Record<number, number> = {
    [ContextualSources.None]: ConnectionPointTypes.AutoDetect,
    [ContextualSources.Position]: ConnectionPointTypes.Vector3,
    [ContextualSources.Direction]: ConnectionPointTypes.Vector3,
    [ContextualSources.ScaledDirection]: ConnectionPointTypes.Vector3,
    [ContextualSources.InitialDirection]: ConnectionPointTypes.Vector3,
    [ContextualSources.LocalPositionUpdated]: ConnectionPointTypes.Vector3,
    [ContextualSources.Color]: ConnectionPointTypes.Color4,
    [ContextualSources.InitialColor]: ConnectionPointTypes.Color4,
    [ContextualSources.ColorDead]: ConnectionPointTypes.Color4,
    [ContextualSources.ColorStep]: ConnectionPointTypes.Color4,
    [ContextualSources.ScaledColorStep]: ConnectionPointTypes.Color4,
    [ContextualSources.Scale]: ConnectionPointTypes.Vector2,
    [ContextualSources.Age]: ConnectionPointTypes.Float,
    [ContextualSources.Lifetime]: ConnectionPointTypes.Float,
    [ContextualSources.Angle]: ConnectionPointTypes.Float,
    [ContextualSources.AgeGradient]: ConnectionPointTypes.Float,
    [ContextualSources.Size]: ConnectionPointTypes.Float,
    [ContextualSources.DirectionScale]: ConnectionPointTypes.Float,
    [ContextualSources.SpriteCellIndex]: ConnectionPointTypes.Int,
    [ContextualSources.SpriteCellStart]: ConnectionPointTypes.Int,
    [ContextualSources.SpriteCellEnd]: ConnectionPointTypes.Int,
};

/**
 * Auto-derive the connection point type from a system source.
 */
const SystemSourceToType: Record<number, number> = {
    [SystemSources.None]: ConnectionPointTypes.AutoDetect,
    [SystemSources.Time]: ConnectionPointTypes.Float,
    [SystemSources.Delta]: ConnectionPointTypes.Float,
    [SystemSources.Emitter]: ConnectionPointTypes.Vector3,
    [SystemSources.CameraPosition]: ConnectionPointTypes.Vector3,
};

// ─── Block Enum Properties ────────────────────────────────────────────────

/** ParticleMathBlockOperations */
const MathBlockOperations: Record<string, number> = {
    Add: 0,
    Subtract: 1,
    Multiply: 2,
    Divide: 3,
    Max: 4,
    Min: 5,
};

/** ParticleTrigonometryBlockOperations */
const TrigonometryOperations: Record<string, number> = {
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
    Sign: 14,
    Negate: 15,
    OneMinus: 16,
    Reciprocal: 17,
    ToDegrees: 18,
    ToRadians: 19,
    Fract: 20,
};

/** ParticleConditionBlockTests */
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

/** ParticleNumberMathBlockOperations */
const NumberMathOperations: Record<string, number> = {
    Modulo: 0,
    Pow: 1,
};

/** ParticleVectorMathBlockOperations */
const VectorMathOperations: Record<string, number> = {
    Dot: 0,
    Distance: 1,
};

/** ParticleFloatToIntBlockOperations */
const FloatToIntOperations: Record<string, number> = {
    Round: 0,
    Ceil: 1,
    Floor: 2,
    Truncate: 3,
};

/** ParticleRandomBlockLocks */
const RandomBlockLocks: Record<string, number> = {
    None: 0,
    PerParticle: 1,
    PerSystem: 2,
    OncePerParticle: 3,
};

/** ParticleLocalVariableBlockScope */
const LocalVariableScope: Record<string, number> = {
    Particle: 0,
    Loop: 1,
};

/**
 * Maps block type names to their property→enum-map pairs.
 * When a property value is a string, we look up the numeric equivalent here.
 */
const BlockEnumProperties: Record<string, Record<string, Record<string, number>>> = {
    ParticleMathBlock: { operation: MathBlockOperations },
    ParticleTrigonometryBlock: { operation: TrigonometryOperations },
    ParticleConditionBlock: { test: ConditionBlockTests },
    ParticleNumberMathBlock: { operation: NumberMathOperations },
    ParticleVectorMathBlock: { operation: VectorMathOperations },
    ParticleFloatToIntBlock: { operation: FloatToIntOperations },
    ParticleRandomBlock: { lockMode: RandomBlockLocks },
    ParticleLocalVariableBlock: { scope: LocalVariableScope },
};

// ─── Manager ──────────────────────────────────────────────────────────────

/**
 * Holds in-memory representations of Node Particle System Sets that MCP tools build up incrementally.
 */
export class ParticleGraphManager {
    /** All managed particle system sets, keyed by name. */
    private _particleSets = new Map<string, ISerializedParticleSystemSet>();
    /** Auto-increment block id counter per set */
    private _nextId = new Map<string, number>();
    /** Layout tracking for aesthetic NPE positioning */
    private _nextX = new Map<string, number>();

    // ── Lifecycle ──────────────────────────────────────────────────────

    /**
     * Create a new empty particle system set.
     * @param name - Unique name for the particle set.
     * @param comment - Optional comment/description.
     * @returns The newly created serialized particle set.
     */
    createParticleSet(name: string, comment?: string): ISerializedParticleSystemSet {
        const pset: ISerializedParticleSystemSet = {
            customType: "BABYLON.NodeParticleSystemSet",
            blocks: [],
            comment,
            name,
        };
        this._particleSets.set(name, pset);
        this._nextId.set(name, 1);
        this._nextX.set(name, 0);
        return pset;
    }

    /**
     * Retrieve a particle set by name.
     * @param name - The name of the particle set.
     * @returns The particle set, or undefined if not found.
     */
    getParticleSet(name: string): ISerializedParticleSystemSet | undefined {
        return this._particleSets.get(name);
    }

    /**
     * List the names of all managed particle sets.
     * @returns Array of particle set names.
     */
    listParticleSets(): string[] {
        return Array.from(this._particleSets.keys());
    }

    /**
     * Delete a particle set by name.
     * @param name - The name of the particle set to delete.
     * @returns True if the set was deleted, false if it was not found.
     */
    deleteParticleSet(name: string): boolean {
        this._nextId.delete(name);
        this._nextX.delete(name);
        return this._particleSets.delete(name);
    }

    /**
     * Remove all particle sets from memory.
     */
    clearAll(): void {
        this._particleSets.clear();
        this._nextId.clear();
        this._nextX.clear();
    }

    // ── Block CRUD ─────────────────────────────────────────────────────

    /**
     * Add a block to the particle graph.
     * @param setName - The name of the particle set.
     * @param blockType - The type of block to add.
     * @param blockName - Optional custom name for the block.
     * @param properties - Optional initial properties to set on the block.
     * @returns The created block with optional warnings, or an error string.
     */
    addBlock(setName: string, blockType: string, blockName?: string, properties?: Record<string, unknown>): { block: ISerializedBlock; warnings?: string[] } | string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found. Create it first.`;
        }

        const info: IBlockTypeInfo | undefined = BlockRegistry[blockType];
        if (!info) {
            return `Unknown block type "${blockType}". Use list_block_types to see available blocks.`;
        }

        const warnings: string[] = [];

        const id = this._nextId.get(setName)!;
        this._nextId.set(setName, id + 1);

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

        // Set default ParticleInputBlock fields
        if (blockType === "ParticleInputBlock") {
            block["type"] = ConnectionPointTypes.Float; // Default; overridden below
            block["contextualValue"] = ContextualSources.None;
            block["systemSource"] = SystemSources.None;
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
                if (blockType === "ParticleInputBlock" && key === "type" && typeof value === "string") {
                    block["type"] = ConnectionPointTypes[value] ?? value;
                } else if (blockType === "ParticleInputBlock" && key === "contextualValue" && typeof value === "string") {
                    const cv = ContextualSources[value] ?? value;
                    block["contextualValue"] = cv;
                    block["systemSource"] = SystemSources.None;
                    // Auto-derive type from contextual source
                    if (typeof cv === "number" && cv !== ContextualSources.None && ContextualSourceToType[cv] !== undefined) {
                        block["type"] = ContextualSourceToType[cv];
                    }
                } else if (blockType === "ParticleInputBlock" && key === "systemSource" && typeof value === "string") {
                    const ss = SystemSources[value] ?? value;
                    block["systemSource"] = ss;
                    block["contextualValue"] = ContextualSources.None;
                    // Auto-derive type from system source
                    if (typeof ss === "number" && ss !== SystemSources.None && SystemSourceToType[ss] !== undefined) {
                        block["type"] = SystemSourceToType[ss];
                    }
                } else if (typeof value === "string" && BlockEnumProperties[blockType]?.[key]) {
                    block[key] = BlockEnumProperties[blockType][key][value] ?? value;
                } else {
                    block[key] = value;
                }
            }
        }

        // For ParticleInputBlock: check for missing data BEFORE filling defaults
        if (blockType === "ParticleInputBlock") {
            const cv = block["contextualValue"] as number;
            const ss = block["systemSource"] as number;
            const hasUserValue = block["value"] !== undefined && block["value"] !== null;
            if (cv === ContextualSources.None && ss === SystemSources.None && !hasUserValue) {
                warnings.push(
                    `⚠ ParticleInputBlock "${block.name}" has contextualValue=None, systemSource=None, and no value. ` +
                        `Set a contextualValue (e.g. 'Position', 'Age'), a systemSource (e.g. 'Time', 'Delta'), ` +
                        `or provide a constant value.`
                );
            }
            this._normaliseInputBlockValue(block);
            this._ensureDefaultValue(block);
        }

        // Track editor location for nice layout
        const x = this._nextX.get(setName)!;
        this._nextX.set(setName, x + 280);
        if (!pset.editorData) {
            pset.editorData = { locations: [] };
        }
        pset.editorData.locations.push({ blockId: id, x, y: 0 });

        pset.blocks.push(block);
        return { block, warnings: warnings.length > 0 ? warnings : undefined };
    }

    /**
     * Normalise a ParticleInputBlock's `value` to the format the NPE parser expects.
     * @param block - The block to normalise.
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

        // Already a flat array
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
                // Color4 {r, g, b, a}
                block["value"] = [obj.r, obj.g, obj.b, obj.a ?? 1];
                block["valueType"] = "BABYLON.Color4";
            } else if ("x" in obj) {
                if ("w" in obj) {
                    block["value"] = [obj.x, obj.y, obj.z, obj.w];
                    block["valueType"] = "BABYLON.Color4"; // Color4 uses x,y,z,w sometimes
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
     * @param length - The array length of the value.
     * @returns The inferred valueType string.
     */
    private _inferValueType(type: number | undefined, length: number): string {
        const typeMap: Record<number, string> = {
            [ConnectionPointTypes.Vector2]: "BABYLON.Vector2",
            [ConnectionPointTypes.Vector3]: "BABYLON.Vector3",
            [ConnectionPointTypes.Color4]: "BABYLON.Color4",
            [ConnectionPointTypes.Matrix]: "BABYLON.Matrix",
        };
        if (type !== undefined && typeMap[type]) {
            return typeMap[type];
        }

        const lengthMap: Record<number, string> = {
            2: "BABYLON.Vector2",
            3: "BABYLON.Vector3",
            4: "BABYLON.Color4",
            16: "BABYLON.Matrix",
        };
        return lengthMap[length] ?? "BABYLON.Vector3";
    }

    /**
     * Ensure that ParticleInputBlocks always have a default value.
     * @param block - The block to ensure a default value for.
     */
    private _ensureDefaultValue(block: ISerializedBlock): void {
        if (block["value"] !== undefined && block["value"] !== null) {
            return;
        }

        // Contextual/system values don't need a stored value
        const cv = block["contextualValue"] as number | undefined;
        if (cv !== undefined && cv !== ContextualSources.None) {
            return;
        }
        const ss = block["systemSource"] as number | undefined;
        if (ss !== undefined && ss !== SystemSources.None) {
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
     * Remove a block from a particle set by its id.
     * @param setName - The name of the particle set.
     * @param blockId - The id of the block to remove.
     * @returns "OK" on success, or an error string.
     */
    removeBlock(setName: string, blockId: number): string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found.`;
        }

        const idx = pset.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) {
            return `Block ${blockId} not found.`;
        }

        // Remove any connections pointing to this block
        for (const block of pset.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId === blockId) {
                    delete inp.targetBlockId;
                    delete inp.targetConnectionName;
                }
            }
        }

        pset.blocks.splice(idx, 1);

        if (pset.editorData) {
            pset.editorData.locations = pset.editorData.locations.filter((l) => l.blockId !== blockId);
        }

        return "OK";
    }

    // ── Connections ────────────────────────────────────────────────────

    /**
     * Connect an output of one block to an input of another block.
     * @param setName - The name of the particle set.
     * @param sourceBlockId - The id of the source block.
     * @param outputName - The name of the output port on the source block.
     * @param targetBlockId - The id of the target block.
     * @param inputName - The name of the input port on the target block.
     * @returns "OK" on success, or an error string.
     */
    connectBlocks(setName: string, sourceBlockId: number, outputName: string, targetBlockId: number, inputName: string): string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found.`;
        }

        const sourceBlock = pset.blocks.find((b) => b.id === sourceBlockId);
        if (!sourceBlock) {
            return `Source block ${sourceBlockId} not found.`;
        }

        const targetBlock = pset.blocks.find((b) => b.id === targetBlockId);
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
     * @param setName - The name of the particle set.
     * @param blockId - The id of the block.
     * @param inputName - The name of the input port to disconnect.
     * @returns "OK" on success, or an error string.
     */
    disconnectInput(setName: string, blockId: number, inputName: string): string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found.`;
        }

        const block = pset.blocks.find((b) => b.id === blockId);
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
     * Get the current state of a particle set as a formatted description.
     * @param setName - The name of the particle set.
     * @returns A formatted string describing the particle set.
     */
    describeParticleSet(setName: string): string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`Particle Set: ${setName}`);
        lines.push(`Blocks (${pset.blocks.length}):`);

        for (const block of pset.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            lines.push(`  [${block.id}] ${block.name} (${typeName})`);

            if (block.inputs.length > 0) {
                for (const inp of block.inputs) {
                    if (inp.targetBlockId !== undefined) {
                        const srcBlock = pset.blocks.find((b) => b.id === inp.targetBlockId);
                        lines.push(`    ← ${inp.name} ← [${inp.targetBlockId}] ${srcBlock?.name ?? "?"}.${inp.targetConnectionName}`);
                    }
                }
            }
        }

        const systemBlocks = pset.blocks.filter((b) => b.customType === "BABYLON.SystemBlock");
        lines.push(`System blocks: ${systemBlocks.length > 0 ? systemBlocks.map((b) => `[${b.id}]`).join(", ") : "(none)"}`);
        if (pset.comment) {
            lines.push(`Comment: ${pset.comment}`);
        }
        return lines.join("\n");
    }

    /**
     * Describe a single block in detail.
     * @param setName - The name of the particle set.
     * @param blockId - The id of the block to describe.
     * @returns A formatted string describing the block.
     */
    describeBlock(setName: string, blockId: number): string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found.`;
        }

        const block = pset.blocks.find((b) => b.id === blockId);
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
            for (const b of pset.blocks) {
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
     * Export to the NPE JSON format that Babylon.js can load.
     * @param setName - The name of the particle set.
     * @returns The JSON string, or undefined if the set is not found.
     */
    exportJSON(setName: string): string | undefined {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return undefined;
        }

        // Final pass: ensure every block has required properties for safe deserialization
        for (const block of pset.blocks) {
            if (block.customType === "BABYLON.ParticleInputBlock") {
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
        this._layoutGraph(pset);

        return JSON.stringify(pset, null, 2);
    }

    // ── Graph Layout ───────────────────────────────────────────────────

    /** Horizontal spacing between columns in the editor (px). */
    private static readonly COL_WIDTH = 340;
    /** Vertical spacing between blocks within a column (px). */
    private static readonly ROW_HEIGHT = 180;

    /**
     * Compute a layered graph layout and write it into `editorData.locations`.
     * @param pset - The particle set to lay out.
     */
    private _layoutGraph(pset: ISerializedParticleSystemSet): void {
        const blocks = pset.blocks;
        if (blocks.length === 0) {
            return;
        }

        const blockById = new Map<number, ISerializedBlock>();
        for (const b of blocks) {
            blockById.set(b.id, b);
        }

        // Build adjacency
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

        // Longest-path depth from system blocks (output nodes)
        const depth = new Map<number, number>();
        const queue: number[] = [];

        // Use SystemBlocks as roots
        for (const b of blocks) {
            if (b.customType === "BABYLON.SystemBlock") {
                depth.set(b.id, 0);
                queue.push(b.id);
            }
        }

        // If no SystemBlocks, use the last block
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

        // Reverse so inputs are on the left
        const totalMaxDepth = Math.max(0, ...depth.values());
        const column = new Map<number, number>();
        for (const [id, d] of depth) {
            column.set(id, totalMaxDepth - d);
        }

        // Group blocks by column and sort
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

        // Write locations
        const locations: Array<{ blockId: number; x: number; y: number }> = [];
        for (const b of blocks) {
            const col = column.get(b.id)!;
            const row = yPosition.get(b.id)!;
            locations.push({
                blockId: b.id,
                x: col * ParticleGraphManager.COL_WIDTH,
                y: row * ParticleGraphManager.ROW_HEIGHT,
            });
        }

        if (!pset.editorData) {
            pset.editorData = { locations };
        } else {
            pset.editorData.locations = locations;
        }
    }

    /**
     * Import an NPE JSON string.
     * @param setName - The name to assign to the imported particle set.
     * @param json - The JSON string to import.
     * @returns "OK" on success, or an error string.
     */
    importJSON(setName: string, json: string): string {
        try {
            const parsed = JSON.parse(json) as ISerializedParticleSystemSet;
            this._particleSets.set(setName, parsed);

            const maxId = parsed.blocks.reduce((max, b) => Math.max(max, b.id), 0);
            this._nextId.set(setName, maxId + 1);
            this._nextX.set(setName, parsed.blocks.length * 280);

            return "OK";
        } catch (e) {
            return `Failed to parse JSON: ${(e as Error).message}`;
        }
    }

    // ── Block Property Mutation ────────────────────────────────────────

    /**
     * Set one or more properties on a block.
     * @param setName - The name of the particle set.
     * @param blockId - The id of the block to update.
     * @param properties - Key-value pairs of properties to set.
     * @returns "OK" on success, or an error string.
     */
    setBlockProperties(setName: string, blockId: number, properties: Record<string, unknown>): string {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return `Particle set "${setName}" not found.`;
        }

        const block = pset.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const typeName = block.customType.replace("BABYLON.", "");

        for (const [key, value] of Object.entries(properties)) {
            if (typeName === "ParticleInputBlock" && key === "type" && typeof value === "string") {
                block["type"] = ConnectionPointTypes[value] ?? value;
            } else if (typeName === "ParticleInputBlock" && key === "contextualValue" && typeof value === "string") {
                const cv = ContextualSources[value] ?? value;
                block["contextualValue"] = cv;
                block["systemSource"] = SystemSources.None;
                if (typeof cv === "number" && cv !== ContextualSources.None && ContextualSourceToType[cv] !== undefined) {
                    block["type"] = ContextualSourceToType[cv];
                }
            } else if (typeName === "ParticleInputBlock" && key === "systemSource" && typeof value === "string") {
                const ss = SystemSources[value] ?? value;
                block["systemSource"] = ss;
                block["contextualValue"] = ContextualSources.None;
                if (typeof ss === "number" && ss !== SystemSources.None && SystemSourceToType[ss] !== undefined) {
                    block["type"] = SystemSourceToType[ss];
                }
            } else if (typeof value === "string" && BlockEnumProperties[typeName]?.[key]) {
                block[key] = BlockEnumProperties[typeName][key][value] ?? value;
            } else {
                block[key] = value;
            }
        }

        // Re-normalise ParticleInputBlock value after property changes
        if (typeName === "ParticleInputBlock") {
            this._normaliseInputBlockValue(block);
            this._ensureDefaultValue(block);
        }

        return "OK";
    }

    // ── Validation ────────────────────────────────────────────────────

    /**
     * Run basic validation on the graph and return any warnings/errors.
     * @param setName - The name of the particle set to validate.
     * @returns An array of warning/error strings (empty if valid).
     */
    validateParticleSet(setName: string): string[] {
        const pset = this._particleSets.get(setName);
        if (!pset) {
            return [`Particle set "${setName}" not found.`];
        }

        const issues: string[] = [];

        // Check for at least one SystemBlock
        const hasSystemBlock = pset.blocks.some((b) => b.customType === "BABYLON.SystemBlock");
        if (!hasSystemBlock) {
            issues.push("ERROR: Missing SystemBlock — every particle graph needs at least one SystemBlock to produce a particle system.");
        }

        // Check for unconnected required inputs
        for (const block of pset.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            const info = Object.values(BlockRegistry).find((r) => r.className === typeName);
            if (!info) {
                continue;
            }

            for (const inp of block.inputs) {
                const inputInfo = info.inputs.find((i) => i.name === inp.name);
                if (inp.targetBlockId === undefined && inputInfo && !inputInfo.isOptional) {
                    issues.push(`ERROR: Block [${block.id}] "${block.name}" has required input "${inp.name}" that is not connected.`);
                }
            }
        }

        // Check for dangling connection references
        for (const block of pset.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId !== undefined) {
                    const src = pset.blocks.find((b) => b.id === inp.targetBlockId);
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

        // Check ParticleInputBlock-specific issues
        for (const block of pset.blocks) {
            if (block.customType !== "BABYLON.ParticleInputBlock") {
                continue;
            }
            const cv = block["contextualValue"] as number | undefined;
            const ss = block["systemSource"] as number | undefined;
            const hasValue = block["value"] !== undefined;
            if ((cv === undefined || cv === ContextualSources.None) && (ss === undefined || ss === SystemSources.None) && !hasValue) {
                issues.push(`WARNING: ParticleInputBlock [${block.id}] "${block.name}" has no contextual value, no system source, and no constant value — it provides no data.`);
            }
        }

        // Check for orphan blocks
        for (const block of pset.blocks) {
            if (block.customType === "BABYLON.SystemBlock" || block.customType === "BABYLON.ParticleInputBlock") {
                continue;
            }
            const hasIncomingConnection = block.inputs.some((inp) => inp.targetBlockId !== undefined);
            const hasOutgoingConnection = pset.blocks.some((other) => other.inputs.some((inp) => inp.targetBlockId === block.id));
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
