/* eslint-disable @typescript-eslint/naming-convention */
/**
 * FlowGraphManager – holds an in-memory representation of a Flow Graph
 * that the MCP tools build up incrementally. When the user is satisfied,
 * the graph can be exported to the Flow Graph JSON format that Babylon.js understands.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server must remain a light,
 *    standalone process. We work purely with a JSON data model that mirrors
 *    FlowGraphCoordinator.serialize() output.
 * 2. **Idempotent & stateful** – the manager stores the current graph in memory
 *    so an AI agent can add blocks, connect them, tweak configs, and finally export.
 *    Multiple graphs can coexist (keyed by graph name).
 */

import { ValidateFlowGraphAttachmentPayload } from "@tools/mcp-server-core";

import { FlowGraphBlockRegistry, type IFlowGraphBlockTypeInfo } from "./blockRegistry.js";

// ─── Types matching Babylon.js serialization format ───────────────────────

/**
 * Serialized form of a single connection point.
 */
export interface ISerializedConnection {
    /** Globally unique identifier for this connection point. */
    uniqueId: string;
    /** The name of this connection point (e.g. "value", "in", "out"). */
    name: string;
    /** Connection direction: 0 = Input, 1 = Output. */
    _connectionType: number;
    /** Unique ids of connected points on other blocks. */
    connectedPointIds: string[];
    /** Connection class name, present only for data connections (e.g. "FlowGraphDataConnection"). */
    className?: string;
    /** Rich type metadata including the type name and default value. */
    richType?: { typeName: string; defaultValue: unknown };
    /** Whether this connection is optional. */
    optional?: boolean;
    /** Instance-level default value (overrides richType.defaultValue during deserialization). */
    defaultValue?: unknown;
}

/**
 * Serialized form of a single Flow Graph block.
 */
export interface ISerializedBlock {
    /** The block's runtime class name (e.g. "FlowGraphAddBlock"). */
    className: string;
    /** Configuration values that parameterize the block. */
    config: Record<string, unknown>;
    /** Globally unique identifier for this block. */
    uniqueId: string;
    /** Data input connection points. */
    dataInputs: ISerializedConnection[];
    /** Data output connection points. */
    dataOutputs: ISerializedConnection[];
    /** Signal input connection points. */
    signalInputs: ISerializedConnection[];
    /** Signal output connection points. */
    signalOutputs: ISerializedConnection[];
    /** Optional metadata such as display name and editor position. */
    metadata?: Record<string, unknown>;
}

/**
 * Serialized form of a single execution context.
 */
export interface ISerializedContext {
    /** Globally unique identifier for this execution context. */
    uniqueId: string;
    /** User-defined variables stored in this context. */
    _userVariables: Record<string, unknown>;
    /** Cached connection values for data connections. */
    _connectionValues: Record<string, unknown>;
}

/**
 * Serialized form of a single Flow Graph.
 */
export interface ISerializedFlowGraph {
    /** All blocks contained in this flow graph. */
    allBlocks: ISerializedBlock[];
    /** Execution contexts associated with this flow graph. */
    executionContexts: ISerializedContext[];
}

/**
 * Top-level serialized form (coordinator level).
 */
export interface ISerializedCoordinator {
    /** Array of serialized flow graphs managed by this coordinator. */
    _flowGraphs: ISerializedFlowGraph[];
    /** Whether events are dispatched synchronously. */
    dispatchEventsSynchronously: boolean;
}

// ─── Default values for rich types ────────────────────────────────────────

const DEFAULT_VALUES: Record<string, unknown> = {
    any: undefined,
    string: "",
    number: 0,
    boolean: false,
    FlowGraphInteger: { value: 0, className: "FlowGraphInteger" },
    Vector2: { value: [0, 0], className: "Vector2" },
    Vector3: { value: [0, 0, 0], className: "Vector3" },
    Vector4: { value: [0, 0, 0, 0], className: "Vector4" },
    Quaternion: { value: [0, 0, 0, 1], className: "Quaternion" },
    Matrix: { value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], className: "Matrix" },
    Color3: { value: [0, 0, 0], className: "Color3" },
    Color4: { value: [0, 0, 0, 0], className: "Color4" },
    Matrix2D: { value: [1, 0, 0, 1], className: "FlowGraphMatrix2D" },
    Matrix3D: { value: [1, 0, 0, 0, 1, 0, 0, 0, 1], className: "FlowGraphMatrix3D" },
};

function getDefaultValue(typeName: string): unknown {
    return DEFAULT_VALUES[typeName] ?? undefined;
}

/**
 * Maps config key names to the data input name they feed, for blocks whose engine
 * constructor wires a config value onto a differently-named data input.
 * Mirrors the `registerDataInput(<inputName>, ..., config.<configKey>)` calls in the
 * engine block constructors so config values reach the correct input default.
 * Example: MeshPickEvent does `registerDataInput("asset", ..., config.targetMesh)`,
 * and SetProperty does `registerDataInput("object", ..., config.target)`.
 */
const CONFIG_TO_INPUT_DEFAULT_ALIASES: Record<string, string> = {
    targetMesh: "asset",
    target: "object",
};

/**
 * Propagates config values onto matching data input defaults so the engine (and the
 * editor) use them instead of the type-level default. A config key matches a data input
 * either by exact name or via {@link CONFIG_TO_INPUT_DEFAULT_ALIASES}. An exact-name match
 * always wins over an alias so a block that legitimately shares the name is unaffected.
 * @param config - The block configuration, or undefined.
 * @param dataInputs - The serialized data input connections to update in place.
 */
function propagateConfigToInputDefaults(config: Record<string, unknown> | undefined, dataInputs: ISerializedConnection[]): void {
    if (!config) {
        return;
    }
    for (const di of dataInputs) {
        if (Object.prototype.hasOwnProperty.call(config, di.name) && config[di.name] !== undefined) {
            di.defaultValue = config[di.name];
            continue;
        }
        for (const configKey of Object.keys(CONFIG_TO_INPUT_DEFAULT_ALIASES)) {
            if (CONFIG_TO_INPUT_DEFAULT_ALIASES[configKey] === di.name && Object.prototype.hasOwnProperty.call(config, configKey) && config[configKey] !== undefined) {
                di.defaultValue = config[configKey];
                break;
            }
        }
    }
}

// ─── UUID helper ──────────────────────────────────────────────────────────

let _idCounter = 0;
function generateUniqueId(): string {
    _idCounter++;
    const hex = _idCounter.toString(16).padStart(8, "0");
    return `fg-${hex}`;
}

/** Reset the internal unique-ID counter (useful for deterministic tests). */
export function resetUniqueIdCounter(): void {
    _idCounter = 0;
}

// ─── In-memory block representation ──────────────────────────────────────

interface InMemoryBlock {
    /** Numeric id for user-facing references */
    id: number;
    /** The serialized block data */
    serialized: ISerializedBlock;
    /** Block type info from registry */
    typeInfo: IFlowGraphBlockTypeInfo;
    /** User-given name for this block instance */
    displayName: string;
}

interface InMemoryGraph {
    name: string;
    blocks: InMemoryBlock[];
    contexts: ISerializedContext[];
    nextBlockId: number;
}

// ─── Manager ──────────────────────────────────────────────────────────────

/**
 * Manages in-memory Flow Graph representations that can be incrementally
 * built up via MCP tools and exported to Babylon.js-compatible JSON.
 */
export class FlowGraphManager {
    private _graphs = new Map<string, InMemoryGraph>();

    // ── Lifecycle ──────────────────────────────────────────────────────

    /**
     * Creates a new in-memory graph with the given name.
     * @param name - The graph name.
     * @returns The newly created graph.
     */
    public createGraph(name: string): InMemoryGraph {
        const graph: InMemoryGraph = {
            name,
            blocks: [],
            contexts: [
                {
                    uniqueId: generateUniqueId(),
                    _userVariables: {},
                    _connectionValues: {},
                },
            ],
            nextBlockId: 1,
        };
        this._graphs.set(name, graph);
        return graph;
    }

    /**
     * Retrieves an in-memory graph by name.
     * @param name - The graph name.
     * @returns The graph, or undefined if not found.
     */
    public getGraph(name: string): InMemoryGraph | undefined {
        return this._graphs.get(name);
    }

    /**
     * Lists the names of all graphs currently held in memory.
     * @returns An array of graph names.
     */
    public listGraphs(): string[] {
        return Array.from(this._graphs.keys());
    }

    /**
     * Deletes a graph by name.
     * @param name - The graph name.
     * @returns True if the graph was deleted, false if it did not exist.
     */
    public deleteGraph(name: string): boolean {
        return this._graphs.delete(name);
    }

    /**
     * Remove all flow graphs from memory, resetting the manager to its initial state.
     */
    public clearAll(): void {
        this._graphs.clear();
    }

    // ── Block operations ───────────────────────────────────────────────

    /**
     * Adds a new block to the graph.
     * @param graphName - The name of the graph.
     * @param blockType - The block type key or className.
     * @param blockName - An optional display name for the block.
     * @param config - Optional configuration for the block.
     * @returns An object with the block id and name, or a string error message.
     */
    public addBlock(
        graphName: string,
        blockType: string,
        blockName?: string,
        config?: Record<string, unknown>
    ): { id: number; name: string; uniqueId: string; warnings?: string[] } | string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found. Create it first with create_graph.`;
        }

        const typeInfo = this._resolveBlockType(blockType);
        if (!typeInfo) {
            return `Unknown block type "${blockType}". Use list_block_types to see available blocks.`;
        }

        const id = graph.nextBlockId++;
        const name = blockName ?? `${blockType}_${id}`;
        const blockUniqueId = generateUniqueId();

        // Build signal connections
        const signalInputs: ISerializedConnection[] = typeInfo.signalInputs.map((si) => ({
            uniqueId: generateUniqueId(),
            name: si.name,
            _connectionType: 0,
            connectedPointIds: [],
        }));

        const signalOutputs: ISerializedConnection[] = typeInfo.signalOutputs.map((so) => ({
            uniqueId: generateUniqueId(),
            name: so.name,
            _connectionType: 1,
            connectedPointIds: [],
        }));

        // Add config-driven dynamic signal outputs for blocks like Sequence, MultiGate, Switch, WaitAll
        if (config) {
            const outputCount = config.outputSignalCount ?? config.outputCount;
            if (typeof outputCount === "number" && outputCount > 0) {
                for (let i = 0; i < outputCount; i++) {
                    const outName = `out_${i}`;
                    if (!signalOutputs.find((so) => so.name === outName)) {
                        signalOutputs.push({
                            uniqueId: generateUniqueId(),
                            name: outName,
                            _connectionType: 1,
                            connectedPointIds: [],
                        });
                    }
                }
            }
            // Switch block: generate case_N outputs based on cases array
            if (Array.isArray(config.cases)) {
                for (let i = 0; i < config.cases.length; i++) {
                    const caseName = `case_${i}`;
                    if (!signalOutputs.find((so) => so.name === caseName)) {
                        signalOutputs.push({
                            uniqueId: generateUniqueId(),
                            name: caseName,
                            _connectionType: 1,
                            connectedPointIds: [],
                        });
                    }
                }
            }
            // WaitAll block: generate in_N signal inputs based on inputCount
            if (typeof config.inputSignalCount === "number" && config.inputSignalCount > 0) {
                for (let i = 0; i < config.inputSignalCount; i++) {
                    const inName = `in_${i}`;
                    if (!signalInputs.find((si) => si.name === inName)) {
                        signalInputs.push({
                            uniqueId: generateUniqueId(),
                            name: inName,
                            _connectionType: 0,
                            connectedPointIds: [],
                        });
                    }
                }
            }
        }

        // Build data connections
        const dataInputs: ISerializedConnection[] = typeInfo.dataInputs.map((di) => ({
            uniqueId: generateUniqueId(),
            name: di.name,
            _connectionType: 0,
            connectedPointIds: [],
            className: "FlowGraphDataConnection",
            richType: { typeName: di.type, defaultValue: getDefaultValue(di.type) },
            optional: di.isOptional ?? false,
        }));

        const dataOutputs: ISerializedConnection[] = typeInfo.dataOutputs.map((dout) => ({
            uniqueId: generateUniqueId(),
            name: dout.name,
            _connectionType: 1,
            connectedPointIds: [],
            className: "FlowGraphDataConnection",
            richType: { typeName: dout.type, defaultValue: getDefaultValue(dout.type) },
        }));

        // Gap 34 fix: Propagate config values to matching data input defaults.
        // When a config key maps to a data input (by exact name, e.g. config.duration for
        // SetDelay, or via an engine alias like config.targetMesh -> "asset" for
        // MeshPickEvent), set the instance-level defaultValue on the data input so the engine
        // uses it instead of the type-level default (e.g. 0 for number).
        propagateConfigToInputDefaults(config, dataInputs);

        // Normalize common config key aliases to canonical names
        this._normalizeConfigAliases(config, typeInfo);

        // Validate config keys against the block type's known config schema
        const configWarnings: string[] = [];
        if (config && typeInfo.config) {
            const knownKeys = new Set(Object.keys(typeInfo.config));
            for (const key of Object.keys(config)) {
                if (!knownKeys.has(key)) {
                    const hint = ` Known keys: ${[...knownKeys].join(", ")}`;
                    configWarnings.push(`Unknown config key "${key}" for ${typeInfo.className}.${hint}`);
                }
            }
        }

        const serialized: ISerializedBlock = {
            className: typeInfo.className,
            config: config ?? {},
            uniqueId: blockUniqueId,
            dataInputs,
            dataOutputs,
            signalInputs,
            signalOutputs,
            metadata: { displayName: name },
        };

        const memBlock: InMemoryBlock = {
            id,
            serialized,
            typeInfo,
            displayName: name,
        };

        graph.blocks.push(memBlock);
        const result: { id: number; name: string; uniqueId: string; warnings?: string[] } = { id, name, uniqueId: blockUniqueId };
        if (configWarnings.length > 0) {
            result.warnings = configWarnings;
        }
        return result;
    }

    /**
     * Removes a block and all of its connections from the graph.
     * @param graphName - The name of the graph.
     * @param blockId - The numeric id of the block to remove.
     * @returns "OK" on success, or an error message.
     */
    public removeBlock(graphName: string, blockId: number): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const idx = graph.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) {
            return `Block ${blockId} not found.`;
        }

        const block = graph.blocks[idx];

        // Remove all connections referencing this block's connection points
        const allPointIds = new Set<string>();
        for (const conn of [...block.serialized.dataInputs, ...block.serialized.dataOutputs, ...block.serialized.signalInputs, ...block.serialized.signalOutputs]) {
            allPointIds.add(conn.uniqueId);
        }

        // Clean up references in other blocks
        for (const otherBlock of graph.blocks) {
            if (otherBlock.id === blockId) {
                continue;
            }
            for (const conn of [
                ...otherBlock.serialized.dataInputs,
                ...otherBlock.serialized.dataOutputs,
                ...otherBlock.serialized.signalInputs,
                ...otherBlock.serialized.signalOutputs,
            ]) {
                conn.connectedPointIds = conn.connectedPointIds.filter((id) => !allPointIds.has(id));
            }
        }

        graph.blocks.splice(idx, 1);
        return "OK";
    }

    /**
     * Merges additional configuration into an existing block.
     * @param graphName - The name of the graph.
     * @param blockId - The numeric id of the block.
     * @param config - Key/value pairs to merge into the block config.
     * @returns "OK" on success, or an error message.
     */
    public setBlockConfig(graphName: string, blockId: number, config: Record<string, unknown>): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        // Normalize aliases before merging (Gap 35 fix)
        this._normalizeConfigAliases(config, block.typeInfo);
        // Merge explicitly and skip reserved names so a malicious/malformed config (e.g. an MCP
        // client sending "__proto__") cannot pollute the target object's prototype via Object.assign.
        for (const key of Object.keys(config)) {
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
                continue;
            }
            block.serialized.config[key] = config[key];
        }
        // Propagate the merged config onto matching data input defaults so later config
        // edits reach the input the engine/editor reads (e.g. targetMesh -> "asset").
        propagateConfigToInputDefaults(block.serialized.config, block.serialized.dataInputs);
        return "OK";
    }

    // ── Connections ────────────────────────────────────────────────────

    /**
     * Connects a data output of one block to a data input of another.
     * @param graphName - The name of the graph.
     * @param sourceBlockId - The numeric id of the source block.
     * @param outputName - The name of the data output.
     * @param targetBlockId - The numeric id of the target block.
     * @param inputName - The name of the data input.
     * @returns "OK" on success, or an error message.
     */
    public connectData(graphName: string, sourceBlockId: number, outputName: string, targetBlockId: number, inputName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const sourceBlock = graph.blocks.find((b) => b.id === sourceBlockId);
        if (!sourceBlock) {
            return `Source block ${sourceBlockId} not found.`;
        }

        const targetBlock = graph.blocks.find((b) => b.id === targetBlockId);
        if (!targetBlock) {
            return `Target block ${targetBlockId} not found.`;
        }

        const output = sourceBlock.serialized.dataOutputs.find((o) => o.name === outputName);
        if (!output) {
            // Gap 28: Try common port name aliases before failing
            const PORT_OUTPUT_ALIASES: Record<string, string[]> = {
                value: ["output"], // Constant block uses "output" but LLMs try "value"
                output: ["value"], // Reverse mapping
            };
            const aliases = PORT_OUTPUT_ALIASES[outputName];
            const aliasMatch = aliases ? sourceBlock.serialized.dataOutputs.find((o) => aliases.includes(o.name)) : undefined;
            if (aliasMatch) {
                // Found via alias — use the actual port
                const input = targetBlock.serialized.dataInputs.find((i) => i.name === inputName);
                if (!input) {
                    const available = targetBlock.serialized.dataInputs.map((i) => i.name).join(", ");
                    return `Input "${inputName}" not found on block ${targetBlockId} (${targetBlock.displayName}). Available inputs: ${available}`;
                }
                if (!input.connectedPointIds.includes(aliasMatch.uniqueId)) {
                    input.connectedPointIds.push(aliasMatch.uniqueId);
                }
                return "OK";
            }
            const available = sourceBlock.serialized.dataOutputs.map((o) => o.name).join(", ");
            return `Output "${outputName}" not found on block ${sourceBlockId} (${sourceBlock.displayName}). Available outputs: ${available}`;
        }

        const input = targetBlock.serialized.dataInputs.find((i) => i.name === inputName);
        if (!input) {
            // Gap 28: Try common port name aliases for inputs too
            const PORT_INPUT_ALIASES: Record<string, string[]> = {
                value: ["input"],
                input: ["value"],
            };
            const aliases = PORT_INPUT_ALIASES[inputName];
            const aliasMatch = aliases ? targetBlock.serialized.dataInputs.find((i) => aliases.includes(i.name)) : undefined;
            if (aliasMatch) {
                if (!aliasMatch.connectedPointIds.includes(output.uniqueId)) {
                    aliasMatch.connectedPointIds.push(output.uniqueId);
                }
                return "OK";
            }
            const available = targetBlock.serialized.dataInputs.map((i) => i.name).join(", ");
            return `Input "${inputName}" not found on block ${targetBlockId} (${targetBlock.displayName}). Available inputs: ${available}`;
        }

        // Data connections: the input stores the output's uniqueId
        if (!input.connectedPointIds.includes(output.uniqueId)) {
            input.connectedPointIds.push(output.uniqueId);
        }

        return "OK";
    }

    /**
     * Connects a signal output of one block to a signal input of another.
     * @param graphName - The name of the graph.
     * @param sourceBlockId - The numeric id of the source block.
     * @param signalOutputName - The name of the signal output.
     * @param targetBlockId - The numeric id of the target block.
     * @param signalInputName - The name of the signal input.
     * @returns "OK" on success, or an error message.
     */
    public connectSignal(graphName: string, sourceBlockId: number, signalOutputName: string, targetBlockId: number, signalInputName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const sourceBlock = graph.blocks.find((b) => b.id === sourceBlockId);
        if (!sourceBlock) {
            return `Source block ${sourceBlockId} not found.`;
        }

        const targetBlock = graph.blocks.find((b) => b.id === targetBlockId);
        if (!targetBlock) {
            return `Target block ${targetBlockId} not found.`;
        }

        // Gap 32: Auto-remap "out" → "done" for event blocks that have a "done" output.
        // Event blocks (ReceiveCustomEvent, SceneReady, MeshPicked, etc.) fire "out" on startup
        // and "done" when the event actually triggers. LLMs almost always mean "done".
        let resolvedOutputName = signalOutputName;
        if (signalOutputName === "out" && sourceBlock.typeInfo.category === "Event") {
            const hasDone = sourceBlock.serialized.signalOutputs.some((o) => o.name === "done");
            if (hasDone) {
                resolvedOutputName = "done";
            }
        }

        const output = sourceBlock.serialized.signalOutputs.find((o) => o.name === resolvedOutputName);
        if (!output) {
            const available = sourceBlock.serialized.signalOutputs.map((o) => o.name).join(", ");
            return `Signal output "${signalOutputName}" not found on block ${sourceBlockId} (${sourceBlock.displayName}). Available: ${available}`;
        }

        const input = targetBlock.serialized.signalInputs.find((i) => i.name === signalInputName);
        if (!input) {
            const available = targetBlock.serialized.signalInputs.map((i) => i.name).join(", ");
            return `Signal input "${signalInputName}" not found on block ${targetBlockId} (${targetBlock.displayName}). Available: ${available}`;
        }

        // Signal connections: the output stores the input's uniqueId
        if (!output.connectedPointIds.includes(input.uniqueId)) {
            output.connectedPointIds.push(input.uniqueId);
        }

        return "OK";
    }

    /**
     * Disconnects all data sources from a block's data input.
     * @param graphName - The name of the graph.
     * @param blockId - The numeric id of the block.
     * @param inputName - The name of the data input to disconnect.
     * @returns "OK" on success, or an error message.
     */
    public disconnectData(graphName: string, blockId: number, inputName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const input = block.serialized.dataInputs.find((i) => i.name === inputName);
        if (!input) {
            return `Data input "${inputName}" not found on block ${blockId}.`;
        }

        input.connectedPointIds = [];
        return "OK";
    }

    /**
     * Disconnects all targets from a block's signal output.
     * @param graphName - The name of the graph.
     * @param blockId - The numeric id of the block.
     * @param signalOutputName - The name of the signal output to disconnect.
     * @returns "OK" on success, or an error message.
     */
    public disconnectSignal(graphName: string, blockId: number, signalOutputName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const output = block.serialized.signalOutputs.find((o) => o.name === signalOutputName);
        if (!output) {
            return `Signal output "${signalOutputName}" not found on block ${blockId}.`;
        }

        output.connectedPointIds = [];
        return "OK";
    }

    // ── Context variables ──────────────────────────────────────────────

    /**
     * Sets or updates a user-defined context variable on the graph.
     * @param graphName - The name of the graph.
     * @param variableName - The variable name.
     * @param value - The value to set.
     * @returns "OK" on success, or an error message.
     */
    public setVariable(graphName: string, variableName: string, value: unknown): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        if (graph.contexts.length === 0) {
            graph.contexts.push({
                uniqueId: generateUniqueId(),
                _userVariables: {},
                _connectionValues: {},
            });
        }

        graph.contexts[0]._userVariables[variableName] = value;
        return "OK";
    }

    // ── Query ──────────────────────────────────────────────────────────

    /**
     * Returns a Markdown description of the entire graph, including blocks and connections.
     * @param graphName - The name of the graph.
     * @returns A Markdown-formatted string describing the graph.
     */
    public describeGraph(graphName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        if (graph.blocks.length === 0) {
            return `Graph "${graphName}" is empty. Add blocks with add_block.`;
        }

        const lines: string[] = [`# Flow Graph: ${graphName}`, `Blocks: ${graph.blocks.length}`, ""];

        // Group by category
        const byCategory = new Map<string, InMemoryBlock[]>();
        for (const block of graph.blocks) {
            const cat = block.typeInfo.category;
            if (!byCategory.has(cat)) {
                byCategory.set(cat, []);
            }
            byCategory.get(cat)!.push(block);
        }

        for (const [cat, blocks] of byCategory) {
            lines.push(`## ${cat}`);
            for (const block of blocks) {
                lines.push(`  [${block.id}] ${block.displayName} (${block.serialized.className})`);

                // Show data connections
                for (const di of block.serialized.dataInputs) {
                    if (di.connectedPointIds.length > 0) {
                        const source = this._findConnectionSource(graph, di.connectedPointIds[0]);
                        lines.push(`    ← ${di.name}: connected from ${source}`);
                    }
                }

                // Show signal connections
                for (const so of block.serialized.signalOutputs) {
                    if (so.connectedPointIds.length > 0) {
                        const target = this._findSignalTarget(graph, so.connectedPointIds[0]);
                        lines.push(`    → ${so.name}: connected to ${target}`);
                    }
                }
            }
            lines.push("");
        }

        // Show context variables
        if (graph.contexts.length > 0 && Object.keys(graph.contexts[0]._userVariables).length > 0) {
            lines.push("## Context Variables");
            for (const [k, v] of Object.entries(graph.contexts[0]._userVariables)) {
                lines.push(`  ${k} = ${JSON.stringify(v)}`);
            }
        }

        return lines.join("\n");
    }

    /**
     * Returns a detailed Markdown description of a single block.
     * @param graphName - The name of the graph.
     * @param blockId - The numeric id of the block.
     * @returns A Markdown string describing the block, or an error message.
     */
    public describeBlock(graphName: string, blockId: number): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const lines: string[] = [
            `## [${block.id}] ${block.displayName}`,
            `Class: ${block.serialized.className}`,
            `Category: ${block.typeInfo.category}`,
            `Description: ${block.typeInfo.description}`,
            `Config: ${JSON.stringify(block.serialized.config)}`,
        ];

        if (block.serialized.signalInputs.length > 0) {
            lines.push("\n### Signal Inputs:");
            for (const si of block.serialized.signalInputs) {
                lines.push(`  • ${si.name} (id: ${si.uniqueId})`);
            }
        }

        if (block.serialized.signalOutputs.length > 0) {
            lines.push("\n### Signal Outputs:");
            for (const so of block.serialized.signalOutputs) {
                const target = so.connectedPointIds.length > 0 ? `→ ${this._findSignalTarget(graph, so.connectedPointIds[0])}` : "(not connected)";
                lines.push(`  • ${so.name} ${target}`);
            }
        }

        if (block.serialized.dataInputs.length > 0) {
            lines.push("\n### Data Inputs:");
            for (const di of block.serialized.dataInputs) {
                const source = di.connectedPointIds.length > 0 ? `← ${this._findConnectionSource(graph, di.connectedPointIds[0])}` : "(not connected)";
                const type = di.richType?.typeName ?? "any";
                const opt = di.optional ? " (optional)" : "";
                lines.push(`  • ${di.name}: ${type}${opt} ${source}`);
            }
        }

        if (block.serialized.dataOutputs.length > 0) {
            lines.push("\n### Data Outputs:");
            for (const dout of block.serialized.dataOutputs) {
                const type = dout.richType?.typeName ?? "any";
                lines.push(`  • ${dout.name}: ${type} (id: ${dout.uniqueId})`);
            }
        }

        return lines.join("\n");
    }

    // ── Validation ─────────────────────────────────────────────────────

    /**
     * Validates the graph and returns a list of issues found.
     * @param graphName - The name of the graph.
     * @returns An array of issue strings (empty if the graph is valid).
     */
    public validateGraph(graphName: string): string[] {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return [`ERROR: Graph "${graphName}" not found.`];
        }

        const issues: string[] = [];

        if (graph.blocks.length === 0) {
            issues.push("WARNING: Graph is empty.");
            return issues;
        }

        // Check for at least one event block (entry point)
        const eventBlocks = graph.blocks.filter((b) => b.typeInfo.category === "Event");
        if (eventBlocks.length === 0) {
            issues.push("WARNING: No event blocks found. The graph needs at least one event block (e.g. SceneReadyEvent) to start execution.");
        }

        // Check for unconnected required data inputs
        for (const block of graph.blocks) {
            for (const di of block.serialized.dataInputs) {
                if (!di.optional && di.connectedPointIds.length === 0) {
                    // Check if there's a default in config that might satisfy this
                    const configKeys = Object.keys(block.serialized.config);
                    const hasConfigDefault =
                        di.defaultValue !== undefined || configKeys.some((k) => k.toLowerCase() === di.name.toLowerCase() || k.toLowerCase().includes(di.name.toLowerCase()));
                    if (!hasConfigDefault) {
                        issues.push(`WARNING: [${block.id}] ${block.displayName} — data input "${di.name}" is not connected and has no config default.`);
                    }
                }
            }

            // Check for unconnected signal inputs on non-event execution blocks
            if (block.typeInfo.category !== "Event" && block.serialized.signalInputs.length > 0) {
                const hasIncomingSignal = block.serialized.signalInputs.some((si) => {
                    // Check if any other block's signal output points to this input
                    for (const otherBlock of graph.blocks) {
                        for (const so of otherBlock.serialized.signalOutputs) {
                            if (so.connectedPointIds.includes(si.uniqueId)) {
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (!hasIncomingSignal && block.typeInfo.signalInputs.length > 0) {
                    // Only warn for execution blocks (not data-only blocks)
                    if (block.typeInfo.signalOutputs.length > 0) {
                        issues.push(`WARNING: [${block.id}] ${block.displayName} — execution block has no incoming signal connection. It may never execute.`);
                    }
                }
            }
        }

        // Check for signal outputs pointing to non-existent targets
        for (const block of graph.blocks) {
            for (const so of block.serialized.signalOutputs) {
                for (const targetId of so.connectedPointIds) {
                    const found = graph.blocks.some((b) => b.serialized.signalInputs.some((si) => si.uniqueId === targetId));
                    if (!found) {
                        issues.push(`ERROR: [${block.id}] ${block.displayName} — signal output "${so.name}" references missing target ${targetId}.`);
                    }
                }
            }
        }

        // Check data connections
        for (const block of graph.blocks) {
            for (const di of block.serialized.dataInputs) {
                for (const sourceId of di.connectedPointIds) {
                    const found = graph.blocks.some((b) => b.serialized.dataOutputs.some((dout) => dout.uniqueId === sourceId));
                    if (!found) {
                        issues.push(`ERROR: [${block.id}] ${block.displayName} — data input "${di.name}" references missing source ${sourceId}.`);
                    }
                }
            }
        }

        // Check event blocks that need a target mesh (MeshPickEvent, PointerOverEvent, PointerOutEvent)
        const meshTargetEventClassNames = new Set(["FlowGraphMeshPickEventBlock", "FlowGraphPointerOverEventBlock", "FlowGraphPointerOutEventBlock"]);
        for (const block of graph.blocks) {
            if (meshTargetEventClassNames.has(block.serialized.className)) {
                const config = block.serialized.config as Record<string, unknown>;
                const hasTargetMesh = config && "targetMesh" in config;
                const assetInput = block.serialized.dataInputs.find((di) => di.name === "asset" || di.name === "targetMesh");
                const assetConnected = assetInput && assetInput.connectedPointIds.length > 0;
                if (!hasTargetMesh && !assetConnected) {
                    issues.push(
                        `WARNING: [${block.id}] ${block.displayName} — no target mesh configured. ` +
                            `Set config.targetMesh (e.g. { type: "Mesh", name: "myMesh" }) or connect the "asset" data input. ` +
                            `Without a target, events will silently never fire.`
                    );
                }
            }
        }

        // Check for likely "out" vs "done" signal misuse on event blocks
        // Event blocks with a "done" signal: if "out" is connected but "done" is not,
        // the agent probably meant to use "done" (per-event) instead of "out" (startup-only).
        for (const block of eventBlocks) {
            const outSignal = block.serialized.signalOutputs.find((so) => so.name === "out");
            const doneSignal = block.serialized.signalOutputs.find((so) => so.name === "done");
            if (outSignal && doneSignal) {
                const outConnected = outSignal.connectedPointIds.length > 0;
                const doneConnected = doneSignal.connectedPointIds.length > 0;
                if (outConnected && !doneConnected) {
                    // SceneReadyEvent is the exception — "out" is correct there
                    if (block.serialized.className !== "FlowGraphSceneReadyEventBlock") {
                        issues.push(
                            `WARNING: [${block.id}] ${block.displayName} — signal "out" is connected but "done" is not. ` +
                                `"out" fires once at startup; "done" fires each time the event occurs (e.g. each click). ` +
                                `Did you mean to connect "done" instead?`
                        );
                    }
                }
            }
        }

        if (issues.length === 0) {
            issues.push("OK: No issues found.");
        }
        return issues;
    }

    // ── Export / Import ────────────────────────────────────────────────

    /**
     * Exports the graph as coordinator-level JSON (wraps the graph in a _flowGraphs array).
     * @param graphName - The name of the graph.
     * @returns The JSON string, or null if the graph was not found.
     */
    public exportJSON(graphName: string): string | null {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return null;
        }

        const serializedGraph: ISerializedFlowGraph = {
            allBlocks: graph.blocks.map((b) => b.serialized),
            executionContexts: graph.contexts,
        };

        const coordinator: ISerializedCoordinator = {
            _flowGraphs: [serializedGraph],
            dispatchEventsSynchronously: false,
        };

        return JSON.stringify(coordinator, null, 2);
    }

    /**
     * Exports a single graph as JSON (graph-level, without coordinator wrapper).
     * @param graphName - The name of the graph.
     * @returns The JSON string, or null if the graph was not found.
     */
    public exportGraphJSON(graphName: string): string | null {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return null;
        }

        const serializedGraph: ISerializedFlowGraph = {
            allBlocks: graph.blocks.map((b) => b.serialized),
            executionContexts: graph.contexts,
        };

        return JSON.stringify(serializedGraph, null, 2);
    }

    /**
     * Imports a flow graph from a JSON string (accepts coordinator or graph-level format).
     * @param graphName - The name to assign to the imported graph.
     * @param json - The JSON string to parse.
     * @returns "OK" on success, or an error message.
     */
    public importJSON(graphName: string, json: string): string {
        try {
            const validated = ValidateFlowGraphAttachmentPayload(json);
            const flowGraphData = validated.graphs[0] as unknown as ISerializedFlowGraph;

            const graph: InMemoryGraph = {
                name: graphName,
                blocks: [],
                contexts: flowGraphData.executionContexts ?? [],
                nextBlockId: 1,
            };

            for (const serializedBlock of flowGraphData.allBlocks) {
                const typeInfo = this._resolveBlockType(serializedBlock.className);
                const id = graph.nextBlockId++;

                // Normalize config key aliases on import (Gap 35 fix)
                const resolvedTypeInfo = typeInfo ?? this._makeUnknownTypeInfo(serializedBlock);
                if (serializedBlock.config) {
                    this._normalizeConfigAliases(serializedBlock.config as Record<string, unknown>, resolvedTypeInfo);
                }

                const memBlock: InMemoryBlock = {
                    id,
                    serialized: serializedBlock,
                    typeInfo: resolvedTypeInfo,
                    displayName: (serializedBlock.metadata?.displayName as string) ?? serializedBlock.className,
                };

                graph.blocks.push(memBlock);
            }

            this._graphs.set(graphName, graph);
            return "OK";
        } catch (e) {
            return `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    // ── Private helpers ────────────────────────────────────────────────

    /**
     * Normalize common config key aliases to their canonical engine names.
     * This handles LLM-generated config keys that don't match the engine's expected names
     * (e.g. "variableName" → "variable", "eventName" → "eventId").
     * Mutates the config object in place.
     * @param config configuration
     * @param typeInfo
     */
    private _normalizeConfigAliases(config: Record<string, unknown> | undefined, typeInfo: IFlowGraphBlockTypeInfo): void {
        // Explicit alias map: maps common LLM-generated config key names to their canonical engine names
        const CONFIG_ALIASES: Record<string, string> = {
            variableName: "variable",
            variableNames: "variables",
            varName: "variable",
            eventName: "eventId",
        };
        if (config && typeInfo.config) {
            const knownKeys = new Set(Object.keys(typeInfo.config));
            const keysToRename: Array<[string, string]> = [];
            for (const key of Object.keys(config)) {
                if (!knownKeys.has(key)) {
                    // 1. Check explicit alias map
                    const aliased = CONFIG_ALIASES[key];
                    if (aliased && knownKeys.has(aliased)) {
                        keysToRename.push([key, aliased]);
                    } else {
                        // 2. Try case-insensitive match
                        const canonical = [...knownKeys].find((k) => k.toLowerCase() === key.toLowerCase());
                        if (canonical) {
                            keysToRename.push([key, canonical]);
                        }
                    }
                }
            }
            for (const [oldKey, newKey] of keysToRename) {
                config[newKey] = config[oldKey];
                delete config[oldKey];
            }
        }
    }

    private _resolveBlockType(blockType: string): IFlowGraphBlockTypeInfo | undefined {
        // Try exact key match
        if (FlowGraphBlockRegistry[blockType]) {
            return FlowGraphBlockRegistry[blockType];
        }
        // Try by className
        for (const info of Object.values(FlowGraphBlockRegistry)) {
            if (info.className === blockType) {
                return info;
            }
        }
        return undefined;
    }

    private _makeUnknownTypeInfo(block: ISerializedBlock): IFlowGraphBlockTypeInfo {
        return {
            className: block.className,
            category: "Utility",
            description: `Unknown block type: ${block.className}`,
            signalInputs: block.signalInputs?.map((si) => ({ name: si.name })) ?? [],
            signalOutputs: block.signalOutputs?.map((so) => ({ name: so.name })) ?? [],
            dataInputs: block.dataInputs?.map((di) => ({ name: di.name, type: di.richType?.typeName ?? "any" })) ?? [],
            dataOutputs: block.dataOutputs?.map((dout) => ({ name: dout.name, type: dout.richType?.typeName ?? "any" })) ?? [],
        };
    }

    private _findConnectionSource(graph: InMemoryGraph, outputUniqueId: string): string {
        for (const block of graph.blocks) {
            for (const dout of block.serialized.dataOutputs) {
                if (dout.uniqueId === outputUniqueId) {
                    return `[${block.id}] ${block.displayName}.${dout.name}`;
                }
            }
        }
        return `(unknown: ${outputUniqueId})`;
    }

    private _findSignalTarget(graph: InMemoryGraph, inputUniqueId: string): string {
        for (const block of graph.blocks) {
            for (const si of block.serialized.signalInputs) {
                if (si.uniqueId === inputUniqueId) {
                    return `[${block.id}] ${block.displayName}.${si.name}`;
                }
            }
        }
        return `(unknown: ${inputUniqueId})`;
    }
}
