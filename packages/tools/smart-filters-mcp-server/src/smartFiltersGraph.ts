/* eslint-disable @typescript-eslint/naming-convention */
/**
 * SmartFiltersGraphManager – holds an in-memory representation of Smart Filter
 * graphs that the MCP tools build up incrementally. When the user is satisfied,
 * the graph can be serialised to the V1 Smart Filter JSON format that the
 * Smart Filters editor and runtime understand.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server must remain a light,
 *    standalone process. We work purely with a JSON data model that mirrors
 *    the serialisation format (SerializedSmartFilterV1).
 * 2. **Idempotent & stateful** – the manager stores the current graph in memory
 *    so an AI agent can add blocks, connect them, tweak properties, and finally
 *    export. Multiple filter graphs can coexist (keyed by name).
 */

import { BlockRegistry, ConnectionPointTypes, type IBlockTypeInfo } from "./blockRegistry.js";

// ─── Types (mirrors the Smart Filter V1 serialization format) ─────────────

/**
 * Serialized form of a single block in a Smart Filter graph.
 */
export interface ISerializedBlockV1 {
    /** Block instance name */
    name: string;
    /** Block namespace */
    namespace: string | null;
    /** Session-unique ID */
    uniqueId: number;
    /** Block type identifier (e.g. "BlurBlock", "Float", "OutputBlock") */
    blockType: string;
    /** Optional user comment */
    comments: string | null;
    /** Shader block output texture options */
    outputTextureOptions?: { ratio: number; format: number; type: number };
    /** Block-specific serialized data */
    data: Record<string, unknown>;
}

/**
 * Serialized form of a connection between two blocks.
 */
export interface ISerializedConnectionV1 {
    /** Source block uniqueId */
    outputBlock: number;
    /** Source port name */
    outputConnectionPoint: string;
    /** Target block uniqueId */
    inputBlock: number;
    /** Target port name */
    inputConnectionPoint: string;
}

/**
 * Serialized form of a complete Smart Filter graph (V1 format).
 */
export interface ISerializedSmartFilterV1 {
    /** Format discriminator */
    format: "smartFilter";
    /** Format version */
    formatVersion: 1;
    /** Filter name */
    name: string;
    /** Optional namespace */
    namespace: string | null;
    /** Optional description */
    comments: string | null;
    /** Optional editor layout data */
    editorData: unknown | null;
    /** All blocks in the graph */
    blocks: ISerializedBlockV1[];
    /** All connections between blocks */
    connections: ISerializedConnectionV1[];
}

// ─── Default values for input blocks ──────────────────────────────────────

const InputBlockDefaults: Record<string, { connectionType: number; defaultValue: unknown }> = {
    Float: { connectionType: ConnectionPointTypes.Float, defaultValue: 0 },
    Color3: { connectionType: ConnectionPointTypes.Color3, defaultValue: { r: 1, g: 1, b: 1 } },
    Color4: { connectionType: ConnectionPointTypes.Color4, defaultValue: { r: 1, g: 1, b: 1, a: 1 } },
    Texture: { connectionType: ConnectionPointTypes.Texture, defaultValue: null },
    Vector2: { connectionType: ConnectionPointTypes.Vector2, defaultValue: { x: 0, y: 0 } },
    Boolean: { connectionType: ConnectionPointTypes.Boolean, defaultValue: false },
};

// ─── Manager ──────────────────────────────────────────────────────────────

/**
 * Holds in-memory representations of Smart Filter graphs that MCP tools build up incrementally.
 */
export class SmartFiltersGraphManager {
    /** All managed filter graphs, keyed by name. */
    private _graphs = new Map<string, ISerializedSmartFilterV1>();
    /** Auto-increment block uniqueId counter per graph */
    private _nextId = new Map<string, number>();

    // ── Lifecycle ──────────────────────────────────────────────────────

    /**
     * Create a new empty filter graph with an OutputBlock.
     * @param name - Unique name for the filter graph.
     * @param comments - Optional description.
     * @returns The newly created serialized filter graph.
     */
    createGraph(name: string, comments?: string): ISerializedSmartFilterV1 {
        const graph: ISerializedSmartFilterV1 = {
            format: "smartFilter",
            formatVersion: 1,
            name,
            namespace: null,
            comments: comments ?? null,
            editorData: null,
            blocks: [],
            connections: [],
        };

        // Every Smart Filter graph needs an OutputBlock
        const outputBlock: ISerializedBlockV1 = {
            name: "outputBlock",
            namespace: null,
            uniqueId: 1,
            blockType: "OutputBlock",
            comments: null,
            data: {},
        };
        graph.blocks.push(outputBlock);

        this._graphs.set(name, graph);
        this._nextId.set(name, 2); // 1 is taken by OutputBlock
        return graph;
    }

    /**
     * Retrieve a filter graph by name.
     * @param name - The graph name.
     * @returns The graph, or undefined if not found.
     */
    getGraph(name: string): ISerializedSmartFilterV1 | undefined {
        return this._graphs.get(name);
    }

    /**
     * List the names of all managed filter graphs.
     * @returns An array of graph names.
     */
    listGraphs(): string[] {
        return Array.from(this._graphs.keys());
    }

    /**
     * Delete a filter graph by name.
     * @param name - The graph name.
     * @returns True if deleted, false if not found.
     */
    deleteGraph(name: string): boolean {
        this._nextId.delete(name);
        return this._graphs.delete(name);
    }

    /**
     * Clone a filter graph under a new name.
     * @param sourceName - The graph to clone.
     * @param targetName - The new graph name.
     * @returns The cloned graph, or an error string.
     */
    cloneGraph(sourceName: string, targetName: string): ISerializedSmartFilterV1 | string {
        const source = this._graphs.get(sourceName);
        if (!source) {
            return `Filter graph "${sourceName}" not found.`;
        }
        if (this._graphs.has(targetName)) {
            return `Filter graph "${targetName}" already exists.`;
        }

        const clone: ISerializedSmartFilterV1 = JSON.parse(JSON.stringify(source));
        clone.name = targetName;
        this._graphs.set(targetName, clone);
        this._nextId.set(targetName, this._nextId.get(sourceName)!);
        return clone;
    }

    /**
     * Remove all filter graphs from memory.
     */
    clearAll(): void {
        this._graphs.clear();
        this._nextId.clear();
    }

    // ── Block CRUD ─────────────────────────────────────────────────────

    /**
     * Add a block to a filter graph.
     * @param graphName - The graph to add the block to.
     * @param blockType - The block type (e.g. "BlurBlock").
     * @param blockName - Optional display name for the block.
     * @param properties - Optional initial properties.
     * @returns The created block, or an error string.
     */
    addBlock(graphName: string, blockType: string, blockName?: string, properties?: Record<string, unknown>): { block: ISerializedBlockV1; warnings?: string[] } | string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found. Create it first.`;
        }

        // Prevent adding a second OutputBlock
        if (blockType === "OutputBlock") {
            return "OutputBlock is automatically created with the graph. Do not add it manually.";
        }

        const info: IBlockTypeInfo | undefined = BlockRegistry[blockType];
        if (!info) {
            return `Unknown block type "${blockType}". Use list_block_types to see available blocks.`;
        }

        const warnings: string[] = [];

        const id = this._nextId.get(graphName)!;
        this._nextId.set(graphName, id + 1);

        const name = blockName ?? `${blockType}_${id}`;

        const data: Record<string, unknown> = {};

        // For input blocks, set default values
        if (info.isInput) {
            const defaults = InputBlockDefaults[blockType];
            if (defaults) {
                data["value"] = defaults.defaultValue;
            }
        }

        // Apply user-supplied properties into data
        if (properties) {
            for (const [key, value] of Object.entries(properties)) {
                // Special handling for block-level properties vs data properties
                if (blockType === "BlurBlock" && (key === "blurSize" || key === "blurTextureRatioPerPass")) {
                    data[key] = value;
                } else if (blockType === "DirectionalBlurBlock" && (key === "blurTextureRatio" || key === "blurHorizontalWidth" || key === "blurVerticalWidth")) {
                    data[key] = value;
                } else if (blockType === "CompositionBlock" && key === "alphaMode") {
                    data[key] = value;
                } else {
                    data[key] = value;
                }
            }
        }

        // Input block: warn if Texture input has no url
        if (blockType === "Texture" && !data["url"] && !data["value"]) {
            warnings.push(`Texture input "${name}" has no url set. Use set_block_properties to set a url or connect a texture source.`);
        }

        const block: ISerializedBlockV1 = {
            name,
            namespace: info.namespace || null,
            uniqueId: id,
            blockType,
            comments: null,
            data,
        };

        graph.blocks.push(block);
        return { block, warnings: warnings.length > 0 ? warnings : undefined };
    }

    /**
     * Remove a block from a filter graph by its uniqueId.
     * @param graphName - The graph name.
     * @param blockId - The unique ID of the block to remove.
     * @returns "OK" on success, or an error string.
     */
    removeBlock(graphName: string, blockId: number): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const idx = graph.blocks.findIndex((b) => b.uniqueId === blockId);
        if (idx === -1) {
            return `Block ${blockId} not found.`;
        }

        const block = graph.blocks[idx];
        if (block.blockType === "OutputBlock") {
            return "Cannot remove the OutputBlock — it is required by the graph.";
        }

        // Remove any connections involving this block
        graph.connections = graph.connections.filter((c) => c.outputBlock !== blockId && c.inputBlock !== blockId);

        graph.blocks.splice(idx, 1);
        return "OK";
    }

    /**
     * Set properties on a block's data.
     * @param graphName - The graph name.
     * @param blockId - The unique ID of the block.
     * @param properties - Key-value pairs to set.
     * @returns "OK" on success, or an error string.
     */
    setBlockProperties(graphName: string, blockId: number, properties: Record<string, unknown>): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.uniqueId === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        for (const [key, value] of Object.entries(properties)) {
            if (key === "name") {
                block.name = String(value);
            } else if (key === "comments") {
                block.comments = value != null ? String(value) : null;
            } else {
                block.data[key] = value;
            }
        }

        return "OK";
    }

    /**
     * Get properties of a block.
     * @param graphName - The graph name.
     * @param blockId - The unique ID of the block.
     * @returns A record of block properties, or an error string.
     */
    getBlockProperties(graphName: string, blockId: number): Record<string, unknown> | string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.uniqueId === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        return {
            name: block.name,
            blockType: block.blockType,
            namespace: block.namespace,
            comments: block.comments,
            ...block.data,
        };
    }

    // ── Connections ────────────────────────────────────────────────────

    /**
     * Connect an output of one block to an input of another.
     * @param graphName - The graph name.
     * @param sourceBlockId - The block providing the output.
     * @param outputName - The output connection point name.
     * @param targetBlockId - The block receiving the input.
     * @param inputName - The input connection point name.
     * @returns "OK" on success, or an error string.
     */
    connectBlocks(graphName: string, sourceBlockId: number, outputName: string, targetBlockId: number, inputName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const sourceBlock = graph.blocks.find((b) => b.uniqueId === sourceBlockId);
        if (!sourceBlock) {
            return `Source block ${sourceBlockId} not found.`;
        }

        const targetBlock = graph.blocks.find((b) => b.uniqueId === targetBlockId);
        if (!targetBlock) {
            return `Target block ${targetBlockId} not found.`;
        }

        const sourceInfo = BlockRegistry[sourceBlock.blockType];
        const targetInfo = BlockRegistry[targetBlock.blockType];

        if (!sourceInfo) {
            return `Unknown block type "${sourceBlock.blockType}" on source block.`;
        }
        if (!targetInfo) {
            return `Unknown block type "${targetBlock.blockType}" on target block.`;
        }

        const output = sourceInfo.outputs.find((o) => o.name === outputName);
        if (!output) {
            const available = sourceInfo.outputs.map((o) => o.name).join(", ");
            return `Output "${outputName}" not found on block ${sourceBlockId} ("${sourceBlock.name}"). Available: ${available || "(none)"}`;
        }

        const input = targetInfo.inputs.find((i) => i.name === inputName);
        if (!input) {
            const available = targetInfo.inputs.map((i) => i.name).join(", ");
            return `Input "${inputName}" not found on block ${targetBlockId} ("${targetBlock.name}"). Available: ${available || "(none)"}`;
        }

        // Type compatibility check
        if (output.type !== input.type) {
            return `Type mismatch: output "${outputName}" is ${output.type} but input "${inputName}" is ${input.type}.`;
        }

        // Cycle detection: check if target is an ancestor of source
        if (this._wouldCreateCycle(graph, sourceBlockId, targetBlockId)) {
            return `Connection would create a cycle in the graph.`;
        }

        // Remove existing connection to this input (inputs can have only one source)
        graph.connections = graph.connections.filter((c) => !(c.inputBlock === targetBlockId && c.inputConnectionPoint === inputName));

        graph.connections.push({
            outputBlock: sourceBlockId,
            outputConnectionPoint: outputName,
            inputBlock: targetBlockId,
            inputConnectionPoint: inputName,
        });

        return "OK";
    }

    /**
     * Disconnect an input on a block.
     * @param graphName - The graph name.
     * @param blockId - The unique ID of the block.
     * @param inputName - The input connection point to disconnect.
     * @returns "OK" on success, or an error string.
     */
    disconnectInput(graphName: string, blockId: number, inputName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.uniqueId === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const before = graph.connections.length;
        graph.connections = graph.connections.filter((c) => !(c.inputBlock === blockId && c.inputConnectionPoint === inputName));

        if (graph.connections.length === before) {
            return `No connection found on input "${inputName}" of block ${blockId}.`;
        }

        return "OK";
    }

    /**
     * List all connections in a filter graph.
     * @param graphName - The graph name.
     * @returns A formatted string listing all connections.
     */
    listConnections(graphName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        if (graph.connections.length === 0) {
            return "No connections.";
        }

        const lines: string[] = [`Connections (${graph.connections.length}):`];
        for (const c of graph.connections) {
            const src = graph.blocks.find((b) => b.uniqueId === c.outputBlock);
            const tgt = graph.blocks.find((b) => b.uniqueId === c.inputBlock);
            lines.push(`  [${c.outputBlock}] ${src?.name ?? "?"}.${c.outputConnectionPoint} → [${c.inputBlock}] ${tgt?.name ?? "?"}.${c.inputConnectionPoint}`);
        }
        return lines.join("\n");
    }

    // ── Queries ────────────────────────────────────────────────────────

    /**
     * Get a description of a filter graph.
     * @param graphName - The graph name.
     * @returns A formatted string describing the graph.
     */
    describeGraph(graphName: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`Smart Filter: ${graph.name}`);
        if (graph.comments) {
            lines.push(`Description: ${graph.comments}`);
        }
        lines.push(`Blocks (${graph.blocks.length}):`);

        for (const block of graph.blocks) {
            lines.push(`  [${block.uniqueId}] ${block.name} (${block.blockType})`);

            // Show incoming connections
            const incoming = graph.connections.filter((c) => c.inputBlock === block.uniqueId);
            for (const c of incoming) {
                const src = graph.blocks.find((b) => b.uniqueId === c.outputBlock);
                lines.push(`    ← ${c.inputConnectionPoint} ← [${c.outputBlock}] ${src?.name ?? "?"}.${c.outputConnectionPoint}`);
            }
        }

        const outputBlock = graph.blocks.find((b) => b.blockType === "OutputBlock");
        const hasOutputConnection = graph.connections.some((c) => c.inputBlock === outputBlock?.uniqueId);
        lines.push(`Output block: ${outputBlock ? `[${outputBlock.uniqueId}]` : "(missing)"} — ${hasOutputConnection ? "connected" : "NOT connected"}`);
        lines.push(`Connections: ${graph.connections.length}`);

        return lines.join("\n");
    }

    /**
     * Describe a single block in detail.
     * @param graphName - The graph name.
     * @param blockId - The unique ID of the block.
     * @returns A formatted string describing the block.
     */
    describeBlock(graphName: string, blockId: number): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const block = graph.blocks.find((b) => b.uniqueId === blockId);
        if (!block) {
            return `Block ${blockId} not found.`;
        }

        const info = BlockRegistry[block.blockType];
        const lines: string[] = [];
        lines.push(`Block [${block.uniqueId}]: "${block.name}" — type ${block.blockType}`);
        if (block.namespace) {
            lines.push(`Namespace: ${block.namespace}`);
        }
        if (block.comments) {
            lines.push(`Comments: ${block.comments}`);
        }

        lines.push("\nInputs:");
        if (info) {
            for (const inp of info.inputs) {
                const conn = graph.connections.find((c) => c.inputBlock === blockId && c.inputConnectionPoint === inp.name);
                if (conn) {
                    const src = graph.blocks.find((b) => b.uniqueId === conn.outputBlock);
                    lines.push(`  • ${inp.name} (${inp.type}) ← connected to [${conn.outputBlock}] ${src?.name ?? "?"}.${conn.outputConnectionPoint}`);
                } else {
                    lines.push(`  • ${inp.name} (${inp.type}) — unconnected${inp.isOptional ? " (optional)" : ""}`);
                }
            }
        } else {
            lines.push("  (unknown block type — no port info)");
        }

        lines.push("\nOutputs:");
        if (info) {
            for (const out of info.outputs) {
                const consumers = graph.connections
                    .filter((c) => c.outputBlock === blockId && c.outputConnectionPoint === out.name)
                    .map((c) => {
                        const tgt = graph.blocks.find((b) => b.uniqueId === c.inputBlock);
                        return `[${c.inputBlock}] ${tgt?.name ?? "?"}.${c.inputConnectionPoint}`;
                    });
                if (consumers.length > 0) {
                    lines.push(`  • ${out.name} (${out.type}) → ${consumers.join(", ")}`);
                } else {
                    lines.push(`  • ${out.name} (${out.type}) — unconnected`);
                }
            }
        }

        // Show data properties
        if (Object.keys(block.data).length > 0) {
            lines.push("\nProperties:");
            for (const [k, v] of Object.entries(block.data)) {
                lines.push(`  ${k}: ${JSON.stringify(v)}`);
            }
        }

        return lines.join("\n");
    }

    // ── Validation ────────────────────────────────────────────────────

    /**
     * Validate a filter graph and return a list of issues.
     * @param graphName - The graph name.
     * @returns An array of issue strings.
     */
    validateGraph(graphName: string): string[] {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return [`Filter graph "${graphName}" not found.`];
        }

        const issues: string[] = [];

        // Check OutputBlock exists
        const outputBlock = graph.blocks.find((b) => b.blockType === "OutputBlock");
        if (!outputBlock) {
            issues.push("ERROR: Missing OutputBlock — every Smart Filter graph needs an OutputBlock.");
        }

        // Check that OutputBlock has a connected input
        if (outputBlock) {
            const outputConnected = graph.connections.some((c) => c.inputBlock === outputBlock.uniqueId);
            if (!outputConnected) {
                issues.push("ERROR: OutputBlock input is not connected — the filter has no final output. " + "Connect a block's output to the OutputBlock's input.");
            }
        }

        // Check for unconnected required inputs
        for (const block of graph.blocks) {
            const info = BlockRegistry[block.blockType];
            if (!info) {
                continue;
            }

            for (const inp of info.inputs) {
                if (inp.isOptional) {
                    continue;
                }
                const connected = graph.connections.some((c) => c.inputBlock === block.uniqueId && c.inputConnectionPoint === inp.name);
                if (!connected) {
                    issues.push(`ERROR: Block [${block.uniqueId}] "${block.name}" (${block.blockType}) has required input "${inp.name}" (${inp.type}) that is not connected.`);
                }
            }
        }

        // Check for dangling connection references
        const allIds = new Set(graph.blocks.map((b) => b.uniqueId));
        for (const conn of graph.connections) {
            if (!allIds.has(conn.outputBlock)) {
                issues.push(`ERROR: Connection references non-existent source block ${conn.outputBlock}.`);
            }
            if (!allIds.has(conn.inputBlock)) {
                issues.push(`ERROR: Connection references non-existent target block ${conn.inputBlock}.`);
            }
        }

        // Check for type mismatches in connections
        for (const conn of graph.connections) {
            const srcBlock = graph.blocks.find((b) => b.uniqueId === conn.outputBlock);
            const tgtBlock = graph.blocks.find((b) => b.uniqueId === conn.inputBlock);
            if (!srcBlock || !tgtBlock) {
                continue;
            }

            const srcInfo = BlockRegistry[srcBlock.blockType];
            const tgtInfo = BlockRegistry[tgtBlock.blockType];
            if (!srcInfo || !tgtInfo) {
                continue;
            }

            const output = srcInfo.outputs.find((o) => o.name === conn.outputConnectionPoint);
            const input = tgtInfo.inputs.find((i) => i.name === conn.inputConnectionPoint);

            if (!output) {
                issues.push(`WARNING: Connection uses output "${conn.outputConnectionPoint}" which doesn't exist on block [${srcBlock.uniqueId}] "${srcBlock.name}".`);
            }
            if (!input) {
                issues.push(`WARNING: Connection uses input "${conn.inputConnectionPoint}" which doesn't exist on block [${tgtBlock.uniqueId}] "${tgtBlock.name}".`);
            }
            if (output && input && output.type !== input.type) {
                issues.push(
                    `WARNING: Type mismatch in connection [${srcBlock.uniqueId}].${conn.outputConnectionPoint} (${output.type}) → [${tgtBlock.uniqueId}].${conn.inputConnectionPoint} (${input.type}).`
                );
            }
        }

        // Check for orphan blocks (no connections at all)
        for (const block of graph.blocks) {
            if (block.blockType === "OutputBlock") {
                continue;
            }

            const hasIncoming = graph.connections.some((c) => c.inputBlock === block.uniqueId);
            const hasOutgoing = graph.connections.some((c) => c.outputBlock === block.uniqueId);

            if (!hasIncoming && !hasOutgoing) {
                issues.push(`WARNING: Block [${block.uniqueId}] "${block.name}" (${block.blockType}) has no connections — it is an orphan.`);
            }
        }

        // Check for unreachable blocks (not in the path to OutputBlock)
        if (outputBlock) {
            const reachable = new Set<number>();
            const visit = (blockId: number) => {
                if (reachable.has(blockId)) {
                    return;
                }
                reachable.add(blockId);
                for (const conn of graph.connections) {
                    if (conn.inputBlock === blockId) {
                        visit(conn.outputBlock);
                    }
                }
            };
            visit(outputBlock.uniqueId);

            for (const block of graph.blocks) {
                if (block.blockType === "OutputBlock") {
                    continue;
                }
                if (!reachable.has(block.uniqueId)) {
                    const hasAnyConn = graph.connections.some((c) => c.outputBlock === block.uniqueId || c.inputBlock === block.uniqueId);
                    if (hasAnyConn) {
                        issues.push(`WARNING: Block [${block.uniqueId}] "${block.name}" (${block.blockType}) is connected but not reachable from the OutputBlock.`);
                    }
                }
            }
        }

        if (issues.length === 0) {
            issues.push("No issues found — graph looks valid.");
        }

        return issues;
    }

    // ── Search ────────────────────────────────────────────────────────

    /**
     * Find blocks in a graph matching a search string.
     * @param graphName - The graph name.
     * @param query - The search string to match against block names, types, or namespaces.
     * @returns A formatted string listing matching blocks.
     */
    findBlocks(graphName: string, query: string): string {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return `Filter graph "${graphName}" not found.`;
        }

        const q = query.toLowerCase();
        const matches = graph.blocks.filter((b) => b.name.toLowerCase().includes(q) || b.blockType.toLowerCase().includes(q) || (b.namespace ?? "").toLowerCase().includes(q));

        if (matches.length === 0) {
            return `No blocks matching "${query}" found.`;
        }

        const lines: string[] = [`Found ${matches.length} block(s) matching "${query}":`];
        for (const b of matches) {
            lines.push(`  [${b.uniqueId}] ${b.name} (${b.blockType})`);
        }
        return lines.join("\n");
    }

    // ── Serialisation ─────────────────────────────────────────────────

    /**
     * Export to the Smart Filter V1 JSON format.
     * @param graphName - The graph name.
     * @returns The JSON string, or undefined if the graph is not found.
     */
    exportJSON(graphName: string): string | undefined {
        const graph = this._graphs.get(graphName);
        if (!graph) {
            return undefined;
        }

        // Compute a simple layout for editor display
        this._layoutGraph(graph);

        return JSON.stringify(graph, null, 2);
    }

    /**
     * Import a Smart Filter V1 JSON string.
     * @param graphName - The name for the imported graph.
     * @param json - The JSON string to import.
     * @returns "OK" on success, or an error string.
     */
    importJSON(graphName: string, json: string): string {
        try {
            const parsed = JSON.parse(json) as ISerializedSmartFilterV1;

            // Basic format validation
            if (parsed.format !== "smartFilter" || parsed.formatVersion !== 1) {
                return `Invalid format: expected format="smartFilter" formatVersion=1, got format="${parsed.format}" formatVersion=${parsed.formatVersion}.`;
            }

            if (!Array.isArray(parsed.blocks) || !Array.isArray(parsed.connections)) {
                return `Invalid format: blocks and connections must be arrays.`;
            }

            parsed.name = graphName;
            this._graphs.set(graphName, parsed);

            const maxId = parsed.blocks.reduce((max, b) => Math.max(max, b.uniqueId), 0);
            this._nextId.set(graphName, maxId + 1);

            return "OK";
        } catch (e) {
            return `Failed to parse JSON: ${(e as Error).message}`;
        }
    }

    // ── Private helpers ───────────────────────────────────────────────

    /**
     * Check if connecting sourceBlock → targetBlock would create a cycle.
     * @param graph - The graph to check.
     * @param sourceBlockId - The source block ID.
     * @param targetBlockId - The target block ID.
     * @returns True if a cycle would be created.
     */
    private _wouldCreateCycle(graph: ISerializedSmartFilterV1, sourceBlockId: number, targetBlockId: number): boolean {
        // If source == target, it's a self-loop
        if (sourceBlockId === targetBlockId) {
            return true;
        }

        // BFS from target, following outgoing edges — if we reach source, there's a cycle
        const visited = new Set<number>();
        const queue: number[] = [targetBlockId];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current === sourceBlockId) {
                return true;
            }
            if (visited.has(current)) {
                continue;
            }
            visited.add(current);

            // Follow outgoing connections from this block
            for (const conn of graph.connections) {
                if (conn.outputBlock === current) {
                    queue.push(conn.inputBlock);
                }
            }
        }

        return false;
    }

    /** Horizontal spacing between columns in the editor (px). */
    private static readonly COL_WIDTH = 340;
    /** Vertical spacing between blocks within a column (px). */
    private static readonly ROW_HEIGHT = 180;

    /**
     * Compute a layered graph layout and write it into editorData.
     * @param graph - The graph to layout.
     */
    private _layoutGraph(graph: ISerializedSmartFilterV1): void {
        const blocks = graph.blocks;
        if (blocks.length === 0) {
            return;
        }

        // Build adjacency
        const predecessors = new Map<number, Set<number>>();
        const successors = new Map<number, Set<number>>();
        for (const b of blocks) {
            predecessors.set(b.uniqueId, new Set());
            successors.set(b.uniqueId, new Set());
        }
        for (const c of graph.connections) {
            predecessors.get(c.inputBlock)?.add(c.outputBlock);
            successors.get(c.outputBlock)?.add(c.inputBlock);
        }

        // Longest-path depth from OutputBlock
        const depth = new Map<number, number>();
        const queue: number[] = [];

        const outputBlock = blocks.find((b) => b.blockType === "OutputBlock");
        if (outputBlock) {
            depth.set(outputBlock.uniqueId, 0);
            queue.push(outputBlock.uniqueId);
        } else if (blocks.length > 0) {
            depth.set(blocks[blocks.length - 1].uniqueId, 0);
            queue.push(blocks[blocks.length - 1].uniqueId);
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

        // Disconnected blocks
        const maxDepth = Math.max(0, ...depth.values());
        for (const b of blocks) {
            if (!depth.has(b.uniqueId)) {
                depth.set(b.uniqueId, maxDepth + 1);
            }
        }

        // Reverse so inputs are on the left
        const totalMaxDepth = Math.max(0, ...depth.values());
        const column = new Map<number, number>();
        for (const [id, d] of depth) {
            column.set(id, totalMaxDepth - d);
        }

        // Group blocks by column
        const columns = new Map<number, number[]>();
        for (const b of blocks) {
            const col = column.get(b.uniqueId)!;
            if (!columns.has(col)) {
                columns.set(col, []);
            }
            columns.get(col)!.push(b.uniqueId);
        }

        // Assign positions
        const locations: Array<{ blockId: number; x: number; y: number }> = [];
        for (const [col, blockIds] of columns) {
            blockIds.forEach((id, row) => {
                locations.push({
                    blockId: id,
                    x: col * SmartFiltersGraphManager.COL_WIDTH,
                    y: row * SmartFiltersGraphManager.ROW_HEIGHT,
                });
            });
        }

        graph.editorData = { locations };
    }
}
