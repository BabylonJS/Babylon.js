import { AssertWebMcpMutationAllowed, IsWebMcpSupported, RegisterWebMcpToolsAsync, type IWebMcpTool, type WebMcpInput } from "@tools/mcp-server-core/webMcp";
import {
    BlockRegistry,
    GeometryGraphManager,
    GetBlockCatalogSummary,
    GetBlockTypeDetails,
    GetNgeEnumsReference,
    NgeConceptsMarkdown,
    NgeEnumCatalog,
    type ISerializedGeometry,
} from "@tools/nge-mcp-common";
import { LoadSnippet, SaveSnippet, type IDataSnippetResult } from "@tools/snippet-loader";

import { type GlobalState } from "./globalState";
import { SerializationTools } from "./serializationTools";

export { IsWebMcpSupported as IsNodeGeometryWebMcpSupported };
export type { IWebMcpTool };

const CurrentGeometryName = "__current_node_geometry__";
const SupportedSerializedBlockTypes = new Set(Object.values(BlockRegistry).map((info) => `BABYLON.${info.className}`));

interface ICurrentGeometryCache {
    editorSerialization: string;
    geometry: ISerializedGeometry;
}

const CurrentGeometryCache = new WeakMap<GlobalState, ICurrentGeometryCache>();

const EmptyInputSchema = {
    type: "object",
    properties: {},
    additionalProperties: false,
};

const NodeGeometrySchema = {
    type: "object",
    description: "A complete serialized BABYLON.NodeGeometry document.",
    properties: {
        customType: {
            const: "BABYLON.NodeGeometry",
        },
        outputNodeId: {
            type: "number",
        },
        blocks: {
            type: "array",
        },
    },
    required: ["customType", "blocks"],
};

const ReplaceGeometryInputSchema = {
    type: "object",
    properties: {
        nodeGeometry: NodeGeometrySchema,
    },
    required: ["nodeGeometry"],
    additionalProperties: false,
};

const CreateGeometryInputSchema = {
    type: "object",
    properties: {
        comment: {
            type: "string",
            description: "Optional description of the new Node Geometry.",
        },
    },
    additionalProperties: false,
};

const BlockPropertiesSchema = {
    type: "object",
    description: "Block-specific property values.",
    additionalProperties: true,
};

const AddBlockInputSchema = {
    type: "object",
    properties: {
        blockType: {
            type: "string",
            description: "Block type from the NGE block catalog, such as BoxBlock or GeometryOutputBlock.",
        },
        name: {
            type: "string",
            description: "Optional human-readable name for the block.",
        },
        properties: BlockPropertiesSchema,
    },
    required: ["blockType"],
    additionalProperties: false,
};

const AddBlocksBatchInputSchema = {
    type: "object",
    properties: {
        blocks: {
            type: "array",
            minItems: 1,
            items: AddBlockInputSchema,
        },
    },
    required: ["blocks"],
    additionalProperties: false,
};

const BlockIdInputSchema = {
    type: "object",
    properties: {
        blockId: {
            type: "number",
            description: "Unique id of the block in the current Node Geometry.",
        },
    },
    required: ["blockId"],
    additionalProperties: false,
};

const SetBlockPropertiesInputSchema = {
    type: "object",
    properties: {
        blockId: {
            type: "number",
        },
        properties: BlockPropertiesSchema,
    },
    required: ["blockId", "properties"],
    additionalProperties: false,
};

const ConnectionSchema = {
    type: "object",
    properties: {
        sourceBlockId: {
            type: "number",
        },
        outputName: {
            type: "string",
        },
        targetBlockId: {
            type: "number",
        },
        inputName: {
            type: "string",
        },
    },
    required: ["sourceBlockId", "outputName", "targetBlockId", "inputName"],
    additionalProperties: false,
};

const ConnectBlocksBatchInputSchema = {
    type: "object",
    properties: {
        connections: {
            type: "array",
            minItems: 1,
            items: ConnectionSchema,
        },
    },
    required: ["connections"],
    additionalProperties: false,
};

const DisconnectInputSchema = {
    type: "object",
    properties: {
        blockId: {
            type: "number",
        },
        inputName: {
            type: "string",
        },
    },
    required: ["blockId", "inputName"],
    additionalProperties: false,
};

const ListBlockTypesInputSchema = {
    type: "object",
    properties: {
        category: {
            type: "string",
            description: "Optional category name used to filter the block catalog.",
        },
    },
    additionalProperties: false,
};

const BlockTypeInputSchema = {
    type: "object",
    properties: {
        blockType: {
            type: "string",
        },
    },
    required: ["blockType"],
    additionalProperties: false,
};

const SnippetIdInputSchema = {
    type: "object",
    properties: {
        snippetId: {
            type: "string",
            description: 'Babylon.js snippet id such as "ABC123" or "ABC123#2".',
        },
    },
    required: ["snippetId"],
    additionalProperties: false,
};

const SaveSnippetInputSchema = {
    type: "object",
    properties: {
        snippetId: {
            type: "string",
            description: "Optional existing snippet id used to create a new revision.",
        },
        name: {
            type: "string",
        },
        description: {
            type: "string",
        },
        tags: {
            type: "string",
        },
    },
    additionalProperties: false,
};

/**
 * Applies a serialized Node Geometry document and refreshes every affected editor surface.
 * @param serializationObject - Serialized Node Geometry document.
 * @param globalState - NGE state to update.
 */
export function ApplySerializedNodeGeometryToEditor(serializationObject: unknown, globalState: GlobalState): void {
    CurrentGeometryCache.delete(globalState);
    SerializationTools.Deserialize(serializationObject, globalState);
    globalState.onResetRequiredObservable.notifyObservers(false);
    globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
    globalState.onFrame.notifyObservers();
    globalState.onClearUndoStack.notifyObservers();
    globalState.onZoomToFitRequiredObservable.notifyObservers();
}

/**
 * Creates all WebMCP tools supported by the live Node Geometry Editor.
 * @param globalState - Live NGE state used by the tools.
 * @returns Tool definitions for the current editor document.
 */
export function CreateNodeGeometryWebMcpTools(globalState: GlobalState): readonly IWebMcpTool[] {
    const readOnlyAnnotations = {
        readOnlyHint: true,
        untrustedContentHint: true,
    };

    return [
        {
            name: "get_current_node_geometry",
            title: "Get current node geometry",
            description: "Return the complete serialized Node Geometry document currently open in Babylon.js Node Geometry Editor.",
            inputSchema: EmptyInputSchema,
            annotations: readOnlyAnnotations,
            execute: (_input, signal) => {
                signal.throwIfAborted();
                return ReadCurrentNodeGeometry(globalState);
            },
        },
        {
            name: "create_current_node_geometry",
            title: "Create current node geometry",
            description: "Replace the current editor document with a new empty Node Geometry.",
            inputSchema: CreateGeometryInputSchema,
            execute: (input, signal) => {
                AssertMutationAllowed(globalState, signal);
                const manager = new GeometryGraphManager();
                manager.createGeometry(CurrentGeometryName, ReadOptionalString(input, "comment"));
                ApplyManagerDocument(manager, globalState);
                return CreateDocumentSummary(manager);
            },
        },
        {
            name: "replace_current_node_geometry",
            title: "Replace current node geometry",
            description: "Replace the current Node Geometry document and refresh the graph and preview.",
            inputSchema: ReplaceGeometryInputSchema,
            execute: (input, signal) => {
                AssertMutationAllowed(globalState, signal);
                const manager = CreateManagerFromSerializedGeometry(ReadSerializedNodeGeometry(input.nodeGeometry));
                ApplyManagerDocument(manager, globalState);
                return CreateDocumentSummary(manager);
            },
        },
        {
            name: "rebuild_current_node_geometry",
            title: "Rebuild current node geometry",
            description: "Rebuild the current Node Geometry graph and refresh its preview.",
            inputSchema: EmptyInputSchema,
            execute: (_input, signal) => {
                AssertMutationAllowed(globalState, signal);
                globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                return {
                    success: true,
                    blockCount: globalState.nodeGeometry.attachedBlocks.length,
                };
            },
        },
        {
            name: "add_block",
            title: "Add node geometry block",
            description: "Add one block to the current Node Geometry. Use list_block_types or get_block_type_info to discover supported blocks and ports.",
            inputSchema: AddBlockInputSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    const result = manager.addBlock(
                        CurrentGeometryName,
                        ReadString(input, "blockType"),
                        ReadOptionalString(input, "name"),
                        ReadOptionalRecord(input, "properties")
                    );
                    if (typeof result === "string") {
                        throw new Error(result);
                    }
                    return {
                        success: true,
                        block: result.block,
                        warnings: result.warnings ?? [],
                    };
                }),
        },
        {
            name: "add_blocks_batch",
            title: "Add node geometry blocks",
            description: "Add multiple blocks to the current Node Geometry as one editor update.",
            inputSchema: AddBlocksBatchInputSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    const blocks = ReadRecordArray(input, "blocks");
                    const created = blocks.map((block) => {
                        const result = manager.addBlock(
                            CurrentGeometryName,
                            ReadString(block, "blockType"),
                            ReadOptionalString(block, "name"),
                            ReadOptionalRecord(block, "properties")
                        );
                        if (typeof result === "string") {
                            throw new Error(result);
                        }
                        return {
                            block: result.block,
                            warnings: result.warnings ?? [],
                        };
                    });
                    return {
                        success: true,
                        blocks: created,
                    };
                }),
        },
        {
            name: "remove_block",
            title: "Remove node geometry block",
            description: "Remove a block and its connections from the current Node Geometry.",
            inputSchema: BlockIdInputSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    ThrowOnManagerError(manager.removeBlock(CurrentGeometryName, ReadNumber(input, "blockId")));
                    return { success: true };
                }),
        },
        {
            name: "set_block_properties",
            title: "Set node geometry block properties",
            description: "Set one or more properties on a block in the current Node Geometry.",
            inputSchema: SetBlockPropertiesInputSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    ThrowOnManagerError(manager.setBlockProperties(CurrentGeometryName, ReadNumber(input, "blockId"), ReadRecord(input, "properties")));
                    return { success: true };
                }),
        },
        {
            name: "connect_blocks",
            title: "Connect node geometry blocks",
            description: "Connect an output on one block to an input on another block in the current Node Geometry.",
            inputSchema: ConnectionSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    ThrowOnManagerError(
                        manager.connectBlocks(
                            CurrentGeometryName,
                            ReadNumber(input, "sourceBlockId"),
                            ReadString(input, "outputName"),
                            ReadNumber(input, "targetBlockId"),
                            ReadString(input, "inputName")
                        )
                    );
                    return { success: true };
                }),
        },
        {
            name: "connect_blocks_batch",
            title: "Connect node geometry blocks in batch",
            description: "Connect multiple block pairs in the current Node Geometry as one editor update.",
            inputSchema: ConnectBlocksBatchInputSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    const connections = ReadRecordArray(input, "connections");
                    for (const connection of connections) {
                        ThrowOnManagerError(
                            manager.connectBlocks(
                                CurrentGeometryName,
                                ReadNumber(connection, "sourceBlockId"),
                                ReadString(connection, "outputName"),
                                ReadNumber(connection, "targetBlockId"),
                                ReadString(connection, "inputName")
                            )
                        );
                    }
                    return {
                        success: true,
                        connectionCount: connections.length,
                    };
                }),
        },
        {
            name: "disconnect_input",
            title: "Disconnect node geometry input",
            description: "Remove the connection feeding an input on a block in the current Node Geometry.",
            inputSchema: DisconnectInputSchema,
            execute: (input, signal) =>
                MutateCurrentGeometry(globalState, signal, (manager) => {
                    ThrowOnManagerError(manager.disconnectInput(CurrentGeometryName, ReadNumber(input, "blockId"), ReadString(input, "inputName")));
                    return { success: true };
                }),
        },
        {
            name: "describe_current_node_geometry",
            title: "Describe current node geometry",
            description: "Return a human-readable description of all blocks and connections in the current Node Geometry.",
            inputSchema: EmptyInputSchema,
            annotations: readOnlyAnnotations,
            execute: (_input, signal) => {
                signal.throwIfAborted();
                return {
                    description: CreateManagerFromEditor(globalState).describeGeometry(CurrentGeometryName),
                };
            },
        },
        {
            name: "describe_block",
            title: "Describe node geometry block",
            description: "Return detailed properties, ports, and connections for one block in the current Node Geometry.",
            inputSchema: BlockIdInputSchema,
            annotations: readOnlyAnnotations,
            execute: (input, signal) => {
                signal.throwIfAborted();
                const manager = CreateManagerFromEditor(globalState);
                const blockId = ReadNumber(input, "blockId");
                const geometry = manager.getGeometry(CurrentGeometryName)!;
                if (!geometry.blocks.some((block) => block.id === blockId)) {
                    throw new Error(`Block ${blockId} not found.`);
                }
                return {
                    description: manager.describeBlock(CurrentGeometryName, blockId),
                };
            },
        },
        {
            name: "list_block_types",
            title: "List node geometry block types",
            description: "List NGE block types, optionally filtered by category.",
            inputSchema: ListBlockTypesInputSchema,
            annotations: {
                readOnlyHint: true,
            },
            execute: (input, signal) => {
                signal.throwIfAborted();
                const category = ReadOptionalString(input, "category");
                const blocks = Object.entries(BlockRegistry)
                    .filter(([, info]) => !category || info.category.toLowerCase() === category.toLowerCase())
                    .map(([blockType, info]) => ({
                        blockType,
                        category: info.category,
                        description: info.description,
                    }));
                return {
                    summary: category ? undefined : GetBlockCatalogSummary(),
                    blocks,
                };
            },
        },
        {
            name: "get_block_type_info",
            title: "Get node geometry block type information",
            description: "Return the inputs, outputs, properties, defaults, and description for one NGE block type.",
            inputSchema: BlockTypeInputSchema,
            annotations: {
                readOnlyHint: true,
            },
            execute: (input, signal) => {
                signal.throwIfAborted();
                const blockType = ReadString(input, "blockType");
                const info = GetBlockTypeDetails(blockType);
                if (!info) {
                    throw new Error(`Block type "${blockType}" not found.`);
                }
                return {
                    blockType,
                    ...info,
                };
            },
        },
        {
            name: "get_node_geometry_enums",
            title: "Get node geometry enumerations",
            description: "Return the named numeric values used by NGE block properties and serialized Node Geometry documents.",
            inputSchema: EmptyInputSchema,
            annotations: {
                readOnlyHint: true,
            },
            execute: (_input, signal) => {
                signal.throwIfAborted();
                return {
                    catalog: NgeEnumCatalog,
                    markdown: GetNgeEnumsReference(),
                };
            },
        },
        {
            name: "get_node_geometry_concepts",
            title: "Get node geometry concepts",
            description: "Return guidance about Node Geometry graph structure, block behavior, connections, and common mistakes.",
            inputSchema: EmptyInputSchema,
            annotations: {
                readOnlyHint: true,
            },
            execute: (_input, signal) => {
                signal.throwIfAborted();
                return {
                    markdown: NgeConceptsMarkdown,
                };
            },
        },
        {
            name: "validate_current_node_geometry",
            title: "Validate current node geometry",
            description: "Validate the current Node Geometry for missing output, required inputs, broken references, and orphan blocks.",
            inputSchema: EmptyInputSchema,
            annotations: readOnlyAnnotations,
            execute: (_input, signal) => {
                signal.throwIfAborted();
                const issues = CreateManagerFromEditor(globalState).validateGeometry(CurrentGeometryName);
                return {
                    valid: !issues.some((issue) => issue.startsWith("ERROR")),
                    issues,
                };
            },
        },
        {
            name: "import_current_node_geometry_from_snippet",
            title: "Import current node geometry from snippet",
            description: "Load a Node Geometry snippet from the Babylon.js snippet server into the current editor.",
            inputSchema: SnippetIdInputSchema,
            // WebMCP defines this callback name.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            execute: async (input, signal) => {
                AssertMutationAllowed(globalState, signal);
                const snippetId = ReadString(input, "snippetId");
                const result = await LoadSnippet(snippetId);
                if (result.type !== "nodeGeometry") {
                    throw new Error(`Snippet "${snippetId}" contains ${result.type} data instead of nodeGeometry data.`);
                }
                const manager = CreateManagerFromSerializedGeometry((result as IDataSnippetResult).data);
                AssertMutationAllowed(globalState, signal);
                ApplyManagerDocument(manager, globalState);
                return {
                    snippetId,
                    ...CreateDocumentSummary(manager),
                };
            },
        },
        {
            name: "save_current_node_geometry_snippet",
            title: "Save current node geometry snippet",
            description: "Save the current Node Geometry to the Babylon.js snippet server.",
            inputSchema: SaveSnippetInputSchema,
            annotations: {
                consequentialHint: true,
            },
            // WebMCP defines this callback name.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            execute: async (input, signal) => {
                signal.throwIfAborted();
                const result = await SaveSnippet(
                    {
                        type: "nodeGeometry",
                        data: ReadCurrentNodeGeometry(globalState),
                    },
                    {
                        snippetId: ReadOptionalString(input, "snippetId"),
                        metadata: {
                            name: ReadOptionalString(input, "name"),
                            description: ReadOptionalString(input, "description"),
                            tags: ReadOptionalString(input, "tags"),
                        },
                    }
                );
                signal.throwIfAborted();
                return {
                    success: true,
                    ...result,
                    url: `https://nge.babylonjs.com/#${result.snippetId}`,
                };
            },
        },
        {
            name: "get_current_node_geometry_url",
            title: "Get current node geometry URL",
            description: "Create a URL that opens the current serialized Node Geometry in the hosted Babylon.js Node Geometry Editor.",
            inputSchema: EmptyInputSchema,
            annotations: readOnlyAnnotations,
            execute: (_input, signal) => {
                signal.throwIfAborted();
                const serialized = JSON.stringify(ReadCurrentNodeGeometry(globalState));
                return {
                    url: `https://nge.babylonjs.com/#${EncodeBase64(serialized, globalState.hostWindow)}`,
                    warning: "Very large Node Geometries should be saved as snippets instead of embedded in a URL.",
                };
            },
        },
    ];
}

/**
 * Registers the complete current-document NGE WebMCP tool set.
 * @param globalState - Live NGE state used by the tools.
 * @param signal - Signal controlling every tool registration.
 * @returns False when WebMCP is unavailable, otherwise true.
 */
export async function RegisterNodeGeometryWebMcpToolsAsync(globalState: GlobalState, signal: AbortSignal): Promise<boolean> {
    return await RegisterWebMcpToolsAsync(globalState.hostDocument, CreateNodeGeometryWebMcpTools(globalState), signal);
}

function AssertMutationAllowed(globalState: GlobalState, signal: AbortSignal): void {
    signal.throwIfAborted();
    AssertWebMcpMutationAllowed(globalState.mcpSessionConnected);
}

function MutateCurrentGeometry<T extends object>(globalState: GlobalState, signal: AbortSignal, mutation: (manager: GeometryGraphManager) => T): T & { blockCount: number } {
    AssertMutationAllowed(globalState, signal);
    const manager = CreateManagerFromEditor(globalState);
    const result = mutation(manager);
    signal.throwIfAborted();
    ApplyManagerDocument(manager, globalState);
    return {
        ...result,
        blockCount: manager.getGeometry(CurrentGeometryName)!.blocks.length,
    };
}

function CreateManagerFromEditor(globalState: GlobalState): GeometryGraphManager {
    return CreateManagerFromSerializedGeometry(ReadCurrentNodeGeometry(globalState));
}

function CreateManagerFromSerializedGeometry(value: unknown): GeometryGraphManager {
    const geometry = ReadSerializedNodeGeometry(value);
    const manager = new GeometryGraphManager();
    const result = manager.importJSON(CurrentGeometryName, JSON.stringify(geometry));
    ThrowOnManagerError(result);
    return manager;
}

function ApplyManagerDocument(manager: GeometryGraphManager, globalState: GlobalState): void {
    const json = manager.exportJSON(CurrentGeometryName);
    if (!json) {
        throw new Error("The current Node Geometry could not be exported.");
    }
    const geometry = ReadSerializedNodeGeometry(JSON.parse(json));
    ApplySerializedNodeGeometryToEditor(CloneSerializedNodeGeometry(geometry), globalState);
    CurrentGeometryCache.set(globalState, {
        editorSerialization: SerializationTools.Serialize(globalState.nodeGeometry, globalState),
        geometry,
    });
}

function CreateDocumentSummary(manager: GeometryGraphManager): { success: true; blockCount: number } {
    return {
        success: true,
        blockCount: manager.getGeometry(CurrentGeometryName)!.blocks.length,
    };
}

function ReadCurrentNodeGeometry(globalState: GlobalState): ISerializedGeometry {
    const editorSerialization = SerializationTools.Serialize(globalState.nodeGeometry, globalState);
    const cached = CurrentGeometryCache.get(globalState);
    if (cached?.editorSerialization === editorSerialization) {
        return CloneSerializedNodeGeometry(cached.geometry);
    }

    const geometry = ReadSerializedNodeGeometry(JSON.parse(editorSerialization));
    CurrentGeometryCache.set(globalState, {
        editorSerialization,
        geometry,
    });
    return CloneSerializedNodeGeometry(geometry);
}

function ReadSerializedNodeGeometry(value: unknown): ISerializedGeometry {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError("nodeGeometry must be a serialized Node Geometry object.");
    }

    const geometry = value as Record<string, unknown>;
    if (geometry.customType !== "BABYLON.NodeGeometry") {
        throw new TypeError('nodeGeometry.customType must be "BABYLON.NodeGeometry".');
    }
    const outputNodeId = geometry.outputNodeId ?? -1;
    if (typeof outputNodeId !== "number") {
        throw new TypeError("nodeGeometry.outputNodeId must be a number.");
    }
    if (!Array.isArray(geometry.blocks)) {
        throw new TypeError("nodeGeometry.blocks must be an array.");
    }
    geometry.blocks.forEach((value, index) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new TypeError(`nodeGeometry.blocks[${index}] must be an object.`);
        }

        const block = value as Record<string, unknown>;
        if (typeof block.customType !== "string" || !SupportedSerializedBlockTypes.has(block.customType)) {
            throw new TypeError(`nodeGeometry.blocks[${index}].customType must identify a supported Node Geometry block.`);
        }
        if (typeof block.id !== "number" || !Number.isFinite(block.id)) {
            throw new TypeError(`nodeGeometry.blocks[${index}].id must be a finite number.`);
        }
        if (typeof block.name !== "string") {
            throw new TypeError(`nodeGeometry.blocks[${index}].name must be a string.`);
        }
        ValidateSerializedConnectionPoints(block.inputs, `nodeGeometry.blocks[${index}].inputs`);
        ValidateSerializedConnectionPoints(block.outputs, `nodeGeometry.blocks[${index}].outputs`);
    });

    return {
        ...geometry,
        outputNodeId,
    } as unknown as ISerializedGeometry;
}

function ValidateSerializedConnectionPoints(value: unknown, path: string): void {
    if (!Array.isArray(value)) {
        throw new TypeError(`${path} must be an array.`);
    }
    value.forEach((connectionPoint, index) => {
        if (!connectionPoint || typeof connectionPoint !== "object" || Array.isArray(connectionPoint) || typeof (connectionPoint as Record<string, unknown>).name !== "string") {
            throw new TypeError(`${path}[${index}] must be an object with a string name.`);
        }
    });
}

function CloneSerializedNodeGeometry(geometry: ISerializedGeometry): ISerializedGeometry {
    return JSON.parse(JSON.stringify(geometry)) as ISerializedGeometry;
}

function ReadString(input: WebMcpInput, key: string): string {
    const value = input[key];
    if (typeof value !== "string" || value.length === 0) {
        throw new TypeError(`${key} must be a non-empty string.`);
    }
    return value;
}

function ReadOptionalString(input: WebMcpInput, key: string): string | undefined {
    const value = input[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new TypeError(`${key} must be a string.`);
    }
    return value;
}

function ReadNumber(input: WebMcpInput, key: string): number {
    const value = input[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${key} must be a finite number.`);
    }
    return value;
}

function ReadRecord(input: WebMcpInput, key: string): Record<string, unknown> {
    const value = input[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError(`${key} must be an object.`);
    }
    return value as Record<string, unknown>;
}

function ReadOptionalRecord(input: WebMcpInput, key: string): Record<string, unknown> | undefined {
    if (input[key] === undefined) {
        return undefined;
    }
    return ReadRecord(input, key);
}

function ReadRecordArray(input: WebMcpInput, key: string): Record<string, unknown>[] {
    const value = input[key];
    if (!Array.isArray(value) || value.length === 0 || value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
        throw new TypeError(`${key} must be a non-empty array of objects.`);
    }
    return value as Record<string, unknown>[];
}

function ThrowOnManagerError(result: string): void {
    if (result !== "OK") {
        throw new Error(result);
    }
}

function EncodeBase64(value: string, hostWindow: Window): string {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return hostWindow.btoa(binary);
}
