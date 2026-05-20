/**
 * RenderGraphManager – holds an in-memory representation of Node Render Graphs
 * that the MCP tools build up incrementally.  When the agent is satisfied,
 * the graph can be serialised to NRGE-compatible JSON that Babylon.js can
 * load via NodeRenderGraph.Parse().
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server is a lightweight,
 *    standalone process.  We work purely with the JSON data model that mirrors
 *    the output of NodeRenderGraph.serialize() / NodeRenderGraphBlock.serialize().
 * 2. **Idempotent & stateful** – the manager stores graphs in memory so an
 *    AI agent can add blocks, wire connections, set properties, and finally
 *    export.  Multiple graphs can coexist (keyed by name).
 *
 * Serialisation format quick reference
 * ─────────────────────────────────────
 * A complete render graph JSON looks like:
 * ```json
 * {
 *   "customType": "BABYLON.NodeRenderGraph",
 *   "name": "MyGraph",
 *   "comment": "...",
 *   "outputNodeId": 3,          // uniqueId of the NodeRenderGraphOutputBlock
 *   "blocks": [
 *     {
 *       "customType": "BABYLON.NodeRenderGraphInputBlock",
 *       "id": 1,
 *       "name": "Color Texture",
 *       "additionalConstructionParameters": [1],  // type = Texture
 *       "inputs": [],
 *       "outputs": [{ "name": "output" }]
 *     },
 *     {
 *       "customType": "BABYLON.NodeRenderGraphClearBlock",
 *       "id": 2,
 *       "name": "Clear",
 *       "inputs": [
 *         {
 *           "name": "target",
 *           "inputName": "target",
 *           "targetBlockId": 1,
 *           "targetConnectionName": "output"
 *         }
 *       ],
 *       "outputs": [{ "name": "output" }, { "name": "outputDepth" }]
 *     },
 *     ...
 *   ],
 *   "editorData": { "locations": [] }
 * }
 * ```
 *
 * Connection encoding:
 *   Each CONNECTED input stores:
 *     `inputName`             – this input's port name (same as `name`)
 *     `targetBlockId`         – uniqueId of the source block
 *     `targetConnectionName`  – output port name on the source block
 */

import { ValidateNodeRenderGraphAttachmentPayload } from "@tools/mcp-server-core";

import { BlockRegistry } from "./blockRegistry.js";

// ─── Types ─────────────────────────────────────────────────────────────────

/** A single serialised connection point on a block */
export interface ISerializedConnectionPoint {
    /** Connection-point port name */
    name: string;
    /** Optional UI display label (overrides name in the editor) */
    displayName?: string;
    /** Present only on connected inputs */
    inputName?: string;
    /** Id of the block that provides the value (source / upstream block) */
    targetBlockId?: number;
    /** Output port name on the source block */
    targetConnectionName?: string;
    /** Whether this port is exposed on the frame graph */
    isExposedOnFrame?: boolean;
    /** Position index when exposed on frame */
    exposedPortPosition?: number;
}

/** A single serialised block */
export interface ISerializedBlock {
    /** "BABYLON.<ClassName>" */
    customType: string;
    /** Auto-assigned sequential integer, unique within this graph */
    id: number;
    /** Human-readable block name */
    name: string;
    /** Free-text comment (shown in editor) */
    comments?: string;
    /** Whether the block is visible in the frame graph view */
    visibleOnFrame?: boolean;
    /** When true the block is skipped during execution */
    disabled?: boolean;
    /** Constructor arguments beyond (name, frameGraph, scene) */
    additionalConstructionParameters?: unknown[];
    /** All input connection points */
    inputs: ISerializedConnectionPoint[];
    /** All output connection points */
    outputs: ISerializedConnectionPoint[];
    /** Block-specific property overrides (e.g., color, clearDepth, …) */
    [key: string]: unknown;
}

/** Complete serialised render graph */
export interface ISerializedRenderGraph {
    /** Must be "BABYLON.NodeRenderGraph" */
    customType: string;
    /** Graph name */
    name: string;
    /** Optional free-text comment */
    comment?: string;
    /** uniqueId of the NodeRenderGraphOutputBlock */
    outputNodeId?: number;
    /** All blocks */
    blocks: ISerializedBlock[];
    /** Editor layout data (positions, etc.) */
    editorData?: {
        locations: Array<{ blockId: number; x: number; y: number; isCollapsed?: boolean }>;
        [key: string]: unknown;
    };
}

// ─── Manager ───────────────────────────────────────────────────────────────

/** Manages multiple Node Render Graph definitions in memory, allowing incremental construction and export. */
export class RenderGraphManager {
    /** All active render graphs, keyed by name */
    private readonly _graphs = new Map<string, ISerializedRenderGraph>();
    /** Auto-incrementing block ID counter */
    private _nextId = 1;

    // ── Graph lifecycle ─────────────────────────────────────────────────

    /**
     * Create a new empty render graph.
     * @param name - Unique name for the render graph
     * @param comment - Optional description of the pipeline
     * @returns The newly created serialised render graph
     */
    public create(name: string, comment?: string): ISerializedRenderGraph {
        if (this._graphs.has(name)) {
            throw new Error(`A render graph named "${name}" already exists. Choose a different name or delete the existing one first.`);
        }
        const graph: ISerializedRenderGraph = {
            customType: "BABYLON.NodeRenderGraph",
            name,
            comment,
            blocks: [],
            editorData: { locations: [] },
        };
        this._graphs.set(name, graph);
        return graph;
    }

    /**
     * Delete a render graph. Throws if it does not exist.
     * @param name - Name of the render graph to delete
     */
    public delete(name: string): void {
        if (!this._graphs.has(name)) {
            throw new Error(`Render graph "${name}" not found.`);
        }
        this._graphs.delete(name);
    }

    /**
     * Remove all render graphs from memory, resetting the manager to its initial state.
     */
    public clearAll(): void {
        this._graphs.clear();
        this._nextId = 1;
    }

    /**
     * List names of all current render graphs.
     * @returns Array of graph names
     */
    public list(): string[] {
        return [...this._graphs.keys()];
    }

    // ── Retrieval ───────────────────────────────────────────────────────

    /**
     * Get a graph by name or throw.
     * @param name - Graph name
     * @returns The serialised render graph
     */
    public get(name: string): ISerializedRenderGraph {
        const g = this._graphs.get(name);
        if (!g) {
            throw new Error(`Render graph "${name}" not found. Use create_render_graph first.`);
        }
        return g;
    }

    // ── Block operations ─────────────────────────────────────────────────

    /**
     * Add a new block to a graph.
     *
     * @param graphName  Name of the target graph
     * @param blockType  Babylon class name WITHOUT the "BABYLON." prefix (e.g. "NodeRenderGraphClearBlock")
     * @param blockName  Human-friendly name for the block (defaults to blockType)
     * @param additionalConstructionParameters  Constructor args beyond (name, frameGraph, scene).
     *   If omitted, the catalog's `defaultAdditionalConstructionParameters` is used.
     * @returns The newly created serialised block
     */
    public addBlock(graphName: string, blockType: string, blockName?: string, additionalConstructionParameters?: unknown[]): ISerializedBlock {
        const graph = this.get(graphName);
        const info = BlockRegistry[blockType];
        if (!info) {
            throw new Error(`Unknown block type "${blockType}". Call list_block_types to see all available block types.`);
        }

        const id = this._nextId++;
        const name = blockName ?? blockType;

        // Resolve construction parameters
        const acp =
            additionalConstructionParameters !== undefined
                ? additionalConstructionParameters
                : info.defaultAdditionalConstructionParameters !== undefined
                  ? info.defaultAdditionalConstructionParameters
                  : undefined;

        // Build the initial port arrays from the catalog
        const inputs: ISerializedConnectionPoint[] = info.inputs.map((p) => ({ name: p.name }));
        const outputs: ISerializedConnectionPoint[] = info.outputs.map((p) => ({ name: p.name }));

        const block: ISerializedBlock = {
            customType: `BABYLON.${blockType}`,
            id,
            name,
            inputs,
            outputs,
        };

        if (acp !== undefined) {
            block.additionalConstructionParameters = acp;
        }

        // Mark the OutputBlock in the graph metadata
        if (blockType === "NodeRenderGraphOutputBlock") {
            graph.outputNodeId = id;
        }

        graph.blocks.push(block);

        // Simple staggered layout
        graph.editorData!.locations.push({ blockId: id, x: (graph.blocks.length - 1) * 220, y: 100 });

        return block;
    }

    /**
     * Add multiple blocks in one call.
     * @param graphName - Name of the target graph
     * @param blocks - Array of block descriptors to add
     * @returns Array of created block descriptors in the same order as input.
     */
    public addBlocksBatch(
        graphName: string,
        blocks: Array<{
            /** Block class name WITHOUT the "BABYLON." prefix */
            blockType: string;
            /** Optional human-friendly label */
            blockName?: string;
            /** Constructor args beyond (name, frameGraph, scene) */
            additionalConstructionParameters?: unknown[];
        }>
    ): ISerializedBlock[] {
        return blocks.map((b) => this.addBlock(graphName, b.blockType, b.blockName, b.additionalConstructionParameters));
    }

    /**
     * Remove a block from a graph, also removing all connections that reference it.
     *
     * @param graphName  Graph name
     * @param blockId    Block id (from addBlock result or describe_block)
     */
    public removeBlock(graphName: string, blockId: number): void {
        const graph = this.get(graphName);
        const idx = graph.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) {
            throw new Error(`Block id ${blockId} not found in graph "${graphName}".`);
        }
        graph.blocks.splice(idx, 1);

        // Remove all connections that referenced this block
        for (const block of graph.blocks) {
            for (const input of block.inputs) {
                if (input.targetBlockId === blockId) {
                    delete input.inputName;
                    delete input.targetBlockId;
                    delete input.targetConnectionName;
                }
            }
        }

        // Clear outputNodeId if this was the output block
        if (graph.outputNodeId === blockId) {
            delete graph.outputNodeId;
        }

        // Remove editor location entry
        if (graph.editorData) {
            graph.editorData.locations = graph.editorData.locations.filter((l) => l.blockId !== blockId);
        }
    }

    // ── Connection operations ────────────────────────────────────────────

    /**
     * Connect one block's output to another block's input.
     *
     * @param graphName            Graph name
     * @param sourceBlockId        Id of the block providing the output value
     * @param sourcePortName       Output port name on the source block
     * @param targetBlockId        Id of the block receiving the input
     * @param targetPortName       Input port name on the target block
     */
    public connect(graphName: string, sourceBlockId: number, sourcePortName: string, targetBlockId: number, targetPortName: string): void {
        const graph = this.get(graphName);
        const sourceBlock = graph.blocks.find((b) => b.id === sourceBlockId);
        const targetBlock = graph.blocks.find((b) => b.id === targetBlockId);

        if (!sourceBlock) {
            throw new Error(`Source block id ${sourceBlockId} not found in graph "${graphName}".`);
        }
        if (!targetBlock) {
            throw new Error(`Target block id ${targetBlockId} not found in graph "${graphName}".`);
        }

        // Validate source port exists
        const sourcePort = sourceBlock.outputs.find((o) => o.name === sourcePortName);
        if (!sourcePort) {
            throw new Error(
                `Output port "${sourcePortName}" not found on block "${sourceBlock.name}" (id ${sourceBlockId}). ` +
                    `Available outputs: ${sourceBlock.outputs.map((o) => o.name).join(", ") || "(none)"}`
            );
        }

        // Validate target port exists
        const targetPort = targetBlock.inputs.find((i) => i.name === targetPortName);
        if (!targetPort) {
            throw new Error(
                `Input port "${targetPortName}" not found on block "${targetBlock.name}" (id ${targetBlockId}). ` +
                    `Available inputs: ${targetBlock.inputs.map((i) => i.name).join(", ") || "(none)"}`
            );
        }

        // Set connection data on the target input
        targetPort.inputName = targetPortName;
        targetPort.targetBlockId = sourceBlockId;
        targetPort.targetConnectionName = sourcePortName;
    }

    /**
     * Connect multiple block pairs in one call.
     * @param graphName - Name of the target graph
     * @param connections - Array of source→target port pairs to wire
     */
    public connectBatch(
        graphName: string,
        connections: Array<{
            /** Id of the block providing the output value */
            sourceBlockId: number;
            /** Output port name on the source block */
            sourcePortName: string;
            /** Id of the block receiving the input */
            targetBlockId: number;
            /** Input port name on the target block */
            targetPortName: string;
        }>
    ): void {
        for (const c of connections) {
            this.connect(graphName, c.sourceBlockId, c.sourcePortName, c.targetBlockId, c.targetPortName);
        }
    }

    /**
     * Disconnect an input port (remove an existing connection).
     * @param graphName - Graph name
     * @param blockId - Id of the block whose input should be disconnected
     * @param inputPortName - Name of the input port to disconnect
     */
    public disconnectInput(graphName: string, blockId: number, inputPortName: string): void {
        const graph = this.get(graphName);
        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            throw new Error(`Block id ${blockId} not found in graph "${graphName}".`);
        }
        const port = block.inputs.find((i) => i.name === inputPortName);
        if (!port) {
            throw new Error(`Input port "${inputPortName}" not found on block id ${blockId}.`);
        }
        if (port.targetBlockId === undefined) {
            throw new Error(`Input port "${inputPortName}" on block id ${blockId} is already disconnected.`);
        }
        delete port.inputName;
        delete port.targetBlockId;
        delete port.targetConnectionName;
    }

    // ── Properties ───────────────────────────────────────────────────────

    /**
     * Set one or more properties on a block.
     * Properties become top-level keys in the block's serialisation object,
     * which is how Babylon.js block deserialisation picks them up.
     *
     * Special keys:
     *   `additionalConstructionParameters` – must be an array; replaces the stored value.
     *   `outputNodeId`                     – if the block type is NodeRenderGraphOutputBlock,
     *                                        this is managed automatically; do not set manually.
     * @param graphName - Graph name
     * @param blockId - Id of the block to update
     * @param properties - Key-value pairs to merge into the block's serialisation
     */
    public setBlockProperties(graphName: string, blockId: number, properties: Record<string, unknown>): void {
        const graph = this.get(graphName);
        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            throw new Error(`Block id ${blockId} not found in graph "${graphName}".`);
        }

        for (const [key, value] of Object.entries(properties)) {
            if (key === "id" || key === "customType" || key === "inputs" || key === "outputs") {
                throw new Error(`Property "${key}" is reserved and cannot be set via set_block_properties.`);
            }
            if (key === "additionalConstructionParameters" && !Array.isArray(value)) {
                throw new Error(`"additionalConstructionParameters" must be an array.`);
            }
            (block as Record<string, unknown>)[key] = value;
        }
    }

    // ── Describe / inspect ───────────────────────────────────────────────

    /**
     * Return a human-readable description of a single block.
     * @param graphName - Graph name
     * @param blockId - Id of the block to describe
     * @returns Markdown-formatted string with ports, connections, and properties
     */
    public describeBlock(graphName: string, blockId: number): string {
        const graph = this.get(graphName);
        const block = graph.blocks.find((b) => b.id === blockId);
        if (!block) {
            throw new Error(`Block id ${blockId} not found in graph "${graphName}".`);
        }
        return this._formatBlock(block, graph);
    }

    /**
     * Return a human-readable description of the entire graph.
     * @param graphName - Graph name
     * @returns Markdown-formatted string listing all blocks and their connections
     */
    public describeGraph(graphName: string): string {
        const graph = this.get(graphName);
        const lines: string[] = [
            `# Render Graph: "${graph.name}"`,
            graph.comment ? `Comment: ${graph.comment}` : "",
            `Output block id: ${graph.outputNodeId ?? "(not set)"}`,
            `Blocks (${graph.blocks.length}):`,
            "",
        ].filter(Boolean);

        for (const block of graph.blocks) {
            lines.push(this._formatBlock(block, graph));
            lines.push("");
        }
        return lines.join("\n");
    }

    private _formatBlock(block: ISerializedBlock, graph: ISerializedRenderGraph): string {
        const lines = [`**[${block.id}] ${block.name}** (${block.customType.replace("BABYLON.", "")})`];

        // Inputs
        if (block.inputs.length > 0) {
            lines.push("  Inputs:");
            for (const inp of block.inputs) {
                if (inp.targetBlockId !== undefined) {
                    const srcBlock = graph.blocks.find((b) => b.id === inp.targetBlockId);
                    lines.push(`    • ${inp.name} ← [${inp.targetBlockId}] ${srcBlock?.name ?? "?"}.${inp.targetConnectionName}`);
                } else {
                    lines.push(`    • ${inp.name} (not connected)`);
                }
            }
        }

        // Outputs
        if (block.outputs.length > 0) {
            lines.push("  Outputs:");
            for (const out of block.outputs) {
                // Find all downstream connections
                const consumers: string[] = [];
                for (const b of graph.blocks) {
                    for (const inp of b.inputs) {
                        if (inp.targetBlockId === block.id && inp.targetConnectionName === out.name) {
                            consumers.push(`[${b.id}] ${b.name}.${inp.name}`);
                        }
                    }
                }
                if (consumers.length > 0) {
                    lines.push(`    • ${out.name} → ${consumers.join(", ")}`);
                } else {
                    lines.push(`    • ${out.name} (unconnected)`);
                }
            }
        }

        // Extra properties (not id, customType, inputs, outputs, name, comments, etc.)
        const reservedKeys = new Set(["customType", "id", "name", "comments", "visibleOnFrame", "disabled", "inputs", "outputs"]);
        const extraKeys = Object.keys(block).filter((k) => !reservedKeys.has(k));
        if (extraKeys.length > 0) {
            lines.push("  Properties:");
            for (const k of extraKeys) {
                lines.push(`    ${k}: ${JSON.stringify((block as Record<string, unknown>)[k])}`);
            }
        }

        return lines.join("\n");
    }

    // ── Validation ───────────────────────────────────────────────────────

    /**
     * Validate the graph, checking for common issues.
     * @param graphName - Name of the render graph to validate
     * @returns Object with `valid` (boolean) and `messages` (string[]) listing all issues found
     */
    public validate(graphName: string): { valid: boolean; messages: string[] } {
        const graph = this.get(graphName);
        const messages: string[] = [];

        // Must have an OutputBlock
        if (graph.outputNodeId === undefined) {
            messages.push("ERROR: No NodeRenderGraphOutputBlock found. " + "Add one and connect a final texture to its 'texture' input.");
        } else {
            const outputBlock = graph.blocks.find((b) => b.id === graph.outputNodeId);
            if (!outputBlock) {
                messages.push(`ERROR: outputNodeId=${graph.outputNodeId} does not match any block. ` + "The OutputBlock may have been removed.");
            } else {
                // Check that the texture input is connected
                const textureInput = outputBlock.inputs.find((i) => i.name === "texture");
                if (!textureInput || textureInput.targetBlockId === undefined) {
                    messages.push("ERROR: NodeRenderGraphOutputBlock is missing a connection on its 'texture' input. " + "Connect a rendered colour texture to it.");
                }
            }
        }

        // Check all blocks exist and required inputs are connected
        for (const block of graph.blocks) {
            const typeName = block.customType.replace("BABYLON.", "");
            const info = BlockRegistry[typeName];
            if (!info) {
                messages.push(
                    `WARNING: Block "${block.name}" (id ${block.id}) has unknown type "${block.customType}". ` +
                        "It may have been added with import_graph_json from an external source."
                );
                continue;
            }

            for (const portInfo of info.inputs) {
                if (portInfo.isOptional) {
                    continue;
                }
                const serialPort = block.inputs.find((i) => i.name === portInfo.name);
                if (!serialPort || serialPort.targetBlockId === undefined) {
                    messages.push(`WARNING: Block "${block.name}" (id ${block.id}) has a required input ` + `"${portInfo.name}" that is not connected.`);
                }
            }
        }

        // Check for dangling targetBlockId references
        const blockIds = new Set(graph.blocks.map((b) => b.id));
        for (const block of graph.blocks) {
            for (const inp of block.inputs) {
                if (inp.targetBlockId !== undefined && !blockIds.has(inp.targetBlockId)) {
                    messages.push(
                        `ERROR: Block "${block.name}" (id ${block.id}) input "${inp.name}" references ` + `missing block id ${inp.targetBlockId}. Connection must be removed.`
                    );
                }
            }
        }

        // Check for NodeRenderGraphInputBlocks without additionalConstructionParameters
        for (const block of graph.blocks) {
            if (block.customType === "BABYLON.NodeRenderGraphInputBlock") {
                const acp = block.additionalConstructionParameters;
                if (!acp || !Array.isArray(acp) || acp.length === 0) {
                    messages.push(
                        `WARNING: InputBlock "${block.name}" (id ${block.id}) is missing ` +
                            "additionalConstructionParameters[0] (the connection-point type). " +
                            `Set it via set_block_properties with key "additionalConstructionParameters". ` +
                            "Common values: Texture=1, TextureDepthStencilAttachment=8, Camera=16777216, ObjectList=33554432."
                    );
                }
            }
        }

        return { valid: messages.filter((m) => m.startsWith("ERROR")).length === 0, messages };
    }

    // ── Export / Import ──────────────────────────────────────────────────

    /**
     * Serialise the graph to NRGE-compatible JSON (string).
     * This JSON can be passed to NodeRenderGraph.Parse() in Babylon.js or
     * to the Scene MCP server's attach_node_render_graph tool.
     * @param graphName - Name of the render graph to export
     * @returns JSON string compatible with NodeRenderGraph.ParseAsync()
     */
    public exportJson(graphName: string): string {
        const graph = this.get(graphName);
        return JSON.stringify(graph, null, 2);
    }

    /**
     * Import a render graph from an existing NRGE JSON string.
     * If `graphName` already exists and `overwrite` is false, throws.
     * The imported graph is stored under `graphName` (which overrides the JSON's `name`).
     * @param graphName - Name to assign to the imported graph in memory
     * @param json - NRGE-compatible JSON string
     * @param overwrite - If true, replace any existing graph with the same name
     * @returns The imported serialised render graph
     */
    public importJson(graphName: string, json: string, overwrite = false): ISerializedRenderGraph {
        const parsed = ValidateNodeRenderGraphAttachmentPayload(json) as unknown as ISerializedRenderGraph;

        if (this._graphs.has(graphName) && !overwrite) {
            throw new Error(`A render graph named "${graphName}" already exists. ` + "Pass overwrite=true to replace it.");
        }

        // Re-key the graph under the requested name
        parsed.name = graphName;
        parsed.customType = "BABYLON.NodeRenderGraph";

        // Advance _nextId past all existing block ids so new blocks don't collide
        for (const block of parsed.blocks) {
            if (typeof block.id === "number" && block.id >= this._nextId) {
                this._nextId = block.id + 1;
            }
        }

        this._graphs.set(graphName, parsed);
        return parsed;
    }
}
