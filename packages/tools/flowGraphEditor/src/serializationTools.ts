import { type GlobalState } from "./globalState";
import { type Nullable } from "core/types";
import { type GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { type Scene } from "core/scene";
import { Logger } from "core/Misc/logger";

/**
 * Provides serialization and deserialization utilities for the flow graph editor.
 */
export class SerializationTools {
    /**
     * Update the editor-data locations for every block in the graph.
     * @param flowGraph - the flow graph whose blocks to update
     * @param globalState - the editor's global state
     * @param frame - optional graph frame to restrict to
     */
    public static UpdateLocations(flowGraph: FlowGraph, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        const editorData: any = {
            locations: [],
        };

        // Gather all blocks from the graph
        const blocks: FlowGraphBlock[] = [];
        if (frame) {
            frame.nodes.forEach((n) => blocks.push(n.content.data));
        } else {
            blocks.push(...flowGraph.getAllBlocks());
        }

        for (const block of blocks) {
            const node = globalState.onGetNodeFromBlock(block);

            editorData.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0,
                isCollapsed: node ? node.isCollapsed : false,
            });
        }

        globalState.storeEditorData(editorData, frame);

        // Persist editor data on the flow graph so it survives serialization round-trips
        (flowGraph as any)._editorData = editorData;
    }

    /**
     * Serialize the flow graph to a JSON string.
     * @param flowGraph - the flow graph to serialize
     * @param globalState - the editor's global state
     * @param frame - optional graph frame to restrict to
     * @returns a JSON string representing the serialized graph
     */
    public static Serialize(flowGraph: FlowGraph, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        this.UpdateLocations(flowGraph, globalState, frame);

        const serializationObject: any = {};
        flowGraph.serialize(serializationObject);

        // Include editor layout data (block positions, frames, zoom) so the
        // graph looks the same when loaded back
        serializationObject.editorData = (flowGraph as any)._editorData;

        // Persist the scene snippet ID so loading the graph can also restore the scene context
        if (globalState.snippetId) {
            serializationObject.sceneSnippetId = globalState.snippetId;
        }

        // Persist the flow graph snippet ID so it survives round-trips
        if (globalState.flowGraphSnippetId) {
            serializationObject.flowGraphSnippetId = globalState.flowGraphSnippetId;
        }

        return JSON.stringify(serializationObject, undefined, 2);
    }

    /**
     * Deserialize a flow graph from a serialization object.
     * Creates a new FlowGraph from the serialized data and sets it on the global state.
     * @param serializationObject - the serialized data to load
     * @param globalState - the editor's global state
     * @param scene - optional scene to use instead of globalState.scene
     * @param pathConverter - optional path converter for JSON pointer blocks
     */
    public static async DeserializeAsync(serializationObject: any, globalState: GlobalState, scene?: Scene, pathConverter?: any): Promise<void> {
        globalState.onIsLoadingChanged.notifyObservers(true);
        try {
            const targetScene = scene ?? globalState.scene;
            const coordinator = new FlowGraphCoordinator({ scene: targetScene });
            const parsedGraph = await ParseFlowGraphAsync(serializationObject, { coordinator, pathConverter });

            // The graph was parsed against the editor's host scene which may not
            // contain scene objects (meshes, animation groups, animations) that
            // only exist in the preview scene loaded from a snippet.  Stash the
            // serialized names so _rebind*Reference can find them later.
            SerializationTools.PreserveUnresolvedNames(parsedGraph, serializationObject);

            // Sync context connection values into _defaultValue for unconnected
            // inputs so the editor UI shows the correct value (e.g. "2" instead
            // of "0" for a divide block's unconnected divisor).
            SerializationTools.SyncConnectionValuesToDefaults(parsedGraph);

            // Restore editor layout data (block positions, frames, zoom)
            if (serializationObject.editorData) {
                (parsedGraph as any)._editorData = serializationObject.editorData;
            }

            // eslint-disable-next-line require-atomic-updates
            globalState.flowGraph = parsedGraph;

            // Restore the scene snippet ID so the preview component can auto-load the scene
            const snippetId = serializationObject.sceneSnippetId ?? "";
            if (snippetId && snippetId !== globalState.snippetId) {
                globalState.snippetId = snippetId;
                globalState.onSnippetIdChanged.notifyObservers(snippetId);
            }

            // Restore the flow graph snippet ID
            if (serializationObject.flowGraphSnippetId) {
                // eslint-disable-next-line require-atomic-updates
                globalState.flowGraphSnippetId = serializationObject.flowGraphSnippetId;
            }
        } finally {
            globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    /**
     * After parsing a flow graph from serialized data, unconnected data inputs
     * have their actual values stored in the execution context's
     * `_connectionValues` map (keyed by socket uniqueId), while the connection
     * object's `_defaultValue` stays at the type default (0 for numbers).
     * The editor UI reads `_defaultValue` for display, so this method copies
     * the context values into `_defaultValue` for all unconnected inputs.
     * @param parsedGraph - the parsed flow graph whose inputs need syncing
     */
    public static SyncConnectionValuesToDefaults(parsedGraph: FlowGraph): void {
        const ctx = parsedGraph.getContext(0);
        if (!ctx) {
            return;
        }
        const connectionValues: Record<string, any> = (ctx as any)._connectionValues;
        if (!connectionValues) {
            return;
        }
        for (const block of parsedGraph.getAllBlocks()) {
            for (const input of block.dataInputs) {
                if (!input.isConnected()) {
                    const ctxValue = connectionValues[input.uniqueId];
                    if (ctxValue !== undefined && ctxValue !== null) {
                        (input as any)._defaultValue = ctxValue;
                    }
                }
            }
        }
    }

    /**
     * After parsing a flow graph, some config values (AnimationGroup, Animation,
     * Mesh references) may be undefined because parsing ran against a scene that
     * doesn't contain the referenced objects.  This method walks the serialized
     * block configs and stashes the *name* from the serialization object on
     * the parsed block's config so that the editor's rebind logic can resolve
     * them later when the correct scene is loaded.
     * @param parsedGraph - the parsed flow graph
     * @param serializationObject - the original serialization data
     */
    public static PreserveUnresolvedNames(parsedGraph: FlowGraph, serializationObject: any): void {
        const serializedBlocks: any[] = serializationObject.allBlocks;
        if (!serializedBlocks) {
            return;
        }

        const allBlocks = parsedGraph.getAllBlocks();

        // Map of config keys → the private name key stashed on block.config
        const nameKeys: Record<string, string> = {
            animationGroup: "_animationGroupName",
            animation: "_animationName",
            targetMesh: "_meshName",
        };

        for (let i = 0; i < serializedBlocks.length && i < allBlocks.length; i++) {
            const serialized = serializedBlocks[i];
            const block = allBlocks[i];
            if (!serialized.config || !block.config) {
                continue;
            }
            for (const key of Object.keys(nameKeys)) {
                const nameKey = nameKeys[key];
                const serializedValue = serialized.config[key];
                const parsedValue = (block.config as any)[key];
                // The serialized value had a {name, className} descriptor but
                // parsing failed to resolve it (parsedValue is undefined/null).
                if (serializedValue && typeof serializedValue === "object" && serializedValue.name && !parsedValue) {
                    (block.config as any)[nameKey] = serializedValue.name;
                }
            }
        }
    }

    /**
     * The custom extension name used to embed flow graph data in a glTF file.
     */
    public static readonly GLTF_EXTENSION_NAME = "BABYLON_flow_graph";

    // GLB format constants
    private static readonly _GLB_MAGIC = 0x46546c67; // "glTF" in little-endian
    private static readonly _GLB_MAGIC_BYTES = [0x67, 0x6c, 0x54, 0x46]; // "glTF" byte sequence
    private static readonly _GLB_VERSION = 2;
    private static readonly _GLB_HEADER_SIZE = 12;
    private static readonly _GLB_CHUNK_HEADER_SIZE = 8;
    private static readonly _GLB_JSON_CHUNK_TYPE = 0x4e4f534a; // "JSON" in little-endian
    private static readonly _GLB_SPACE_PAD = 0x20;

    /**
     * Export the flow graph (and optionally the preview scene) as a .glb file.
     * The flow graph JSON is embedded inside a custom glTF extension called
     * `BABYLON_flow_graph` so it can be re-imported by this editor.
     * @param flowGraph - the flow graph to export
     * @param globalState - the editor's global state
     * @param scene - optional preview scene to include in the export
     */
    public static async ExportGlbAsync(flowGraph: FlowGraph, globalState: GlobalState, scene: Nullable<Scene>): Promise<void> {
        this.UpdateLocations(flowGraph, globalState);

        // Serialize the flow graph to JSON
        const fgSerialized: any = {};
        flowGraph.serialize(fgSerialized);
        fgSerialized.editorData = (flowGraph as any)._editorData;
        if (globalState.snippetId) {
            fgSerialized.sceneSnippetId = globalState.snippetId;
        }
        if (globalState.flowGraphSnippetId) {
            fgSerialized.flowGraphSnippetId = globalState.flowGraphSnippetId;
        }

        // Build the glTF JSON with the flow graph embedded as an extension
        const gltfJson: any = {
            asset: { version: "2.0", generator: "Babylon.js Flow Graph Editor" },
            scene: 0,
            scenes: [{ name: "Scene" }],
            extensionsUsed: [SerializationTools.GLTF_EXTENSION_NAME],
            extensions: {
                [SerializationTools.GLTF_EXTENSION_NAME]: {
                    flowGraph: fgSerialized,
                },
            },
        };

        // If we have a preview scene, try to use GLTF2Export for a full scene export
        if (scene) {
            try {
                // The serializers bundle is loaded by the CDN serve and attaches
                // GLTF2Export to the global BABYLON namespace. The webpack config
                // externalizes `core/` → BABYLON but doesn't handle `serializers/`,
                // so we access it from the global directly.
                // eslint-disable-next-line @typescript-eslint/naming-convention
                const GLTF2Export = (globalThis as any).BABYLON?.GLTF2Export;
                if (!GLTF2Export) {
                    throw new Error("GLTF2Export not available on BABYLON global");
                }
                const glbData = await GLTF2Export.GLBAsync(scene, "flowGraph", {});

                // Extract the GLB and inject our custom extension into its JSON chunk
                const glbFile = glbData.glTFFiles["flowGraph.glb"];
                if (glbFile instanceof Blob) {
                    const buffer = await glbFile.arrayBuffer();
                    const augmented = SerializationTools._InjectExtensionIntoGlb(new Uint8Array(buffer), fgSerialized);
                    if (augmented) {
                        SerializationTools._DownloadBlob(new Blob([augmented.buffer as ArrayBuffer], { type: "model/gltf-binary" }), "flowGraph.glb", globalState);
                        return;
                    } else {
                        Logger.Warn("Failed to inject flow graph extension into scene GLB; falling back to minimal export without scene geometry.");
                    }
                }
            } catch (e) {
                // GLTF2Export not available — fall back to building a minimal glb
                Logger.Warn("Full scene GLB export failed, falling back to minimal export: " + (e instanceof Error ? e.message : String(e)));
            }
        }

        // Build a minimal GLB (no scene geometry, just the extension)
        const jsonStr = JSON.stringify(gltfJson);
        const glb = SerializationTools._BuildMinimalGlb(jsonStr);
        SerializationTools._DownloadBlob(new Blob([glb.buffer as ArrayBuffer], { type: "model/gltf-binary" }), "flowGraph.glb", globalState);
    }

    /**
     * Try to import a flow graph from a .glb/.gltf file's BABYLON_flow_graph extension.
     * @param file - the file dropped by the user
     * @param globalState - the editor's global state
     * @returns true if a flow graph was found and imported, false otherwise
     */
    public static async ImportFromGlbAsync(file: File, globalState: GlobalState): Promise<boolean> {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        let gltfJson: any;

        // Check if it's a GLB (binary glTF)
        if (
            bytes.length >= SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE &&
            bytes[0] === SerializationTools._GLB_MAGIC_BYTES[0] &&
            bytes[1] === SerializationTools._GLB_MAGIC_BYTES[1] &&
            bytes[2] === SerializationTools._GLB_MAGIC_BYTES[2] &&
            bytes[3] === SerializationTools._GLB_MAGIC_BYTES[3]
        ) {
            // GLB format: header (12 bytes) + JSON chunk (8-byte header + data)
            const chunkHeaderView = new DataView(buffer, SerializationTools._GLB_HEADER_SIZE, SerializationTools._GLB_CHUNK_HEADER_SIZE);
            const jsonChunkLength = chunkHeaderView.getUint32(0, true);
            const jsonChunkType = chunkHeaderView.getUint32(4, true);
            const jsonDataOffset = SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE;

            // Validate: first chunk must be JSON and data must fit within buffer
            if (jsonChunkType !== SerializationTools._GLB_JSON_CHUNK_TYPE || jsonDataOffset + jsonChunkLength > buffer.byteLength) {
                return false;
            }
            const jsonChunkData = new Uint8Array(buffer, jsonDataOffset, jsonChunkLength);
            const decoder = new TextDecoder("utf-8");
            try {
                gltfJson = JSON.parse(decoder.decode(jsonChunkData));
            } catch {
                return false;
            }
        } else {
            // Plain .gltf JSON
            const decoder = new TextDecoder("utf-8");
            try {
                gltfJson = JSON.parse(decoder.decode(bytes));
            } catch {
                return false;
            }
        }

        // Check for our custom extension
        const ext = gltfJson?.extensions?.[SerializationTools.GLTF_EXTENSION_NAME];
        if (!ext || !ext.flowGraph) {
            return false;
        }

        // Deserialize the flow graph
        await SerializationTools.DeserializeAsync(ext.flowGraph, globalState);
        globalState.onResetRequiredObservable.notifyObservers(false);
        globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
        globalState.onClearUndoStack.notifyObservers();
        return true;
    }

    /**
     * Inject the BABYLON_flow_graph extension into an existing GLB's JSON chunk.
     * @param glbBytes - original GLB bytes
     * @param fgSerialized - the serialized flow graph data
     * @returns the augmented GLB bytes, or null if parsing fails
     */
    private static _InjectExtensionIntoGlb(glbBytes: Uint8Array, fgSerialized: any): Nullable<Uint8Array> {
        const minSize = SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE;
        if (glbBytes.length < minSize) {
            return null;
        }

        const view = new DataView(glbBytes.buffer, glbBytes.byteOffset, glbBytes.byteLength);

        // Read JSON chunk length from GLB
        const jsonChunkLength = view.getUint32(SerializationTools._GLB_HEADER_SIZE, true);
        const jsonDataOffset = SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE;
        const jsonChunkData = glbBytes.slice(jsonDataOffset, jsonDataOffset + jsonChunkLength);
        const decoder = new TextDecoder("utf-8");

        let gltfJson: any;
        try {
            gltfJson = JSON.parse(decoder.decode(jsonChunkData));
        } catch {
            return null;
        }

        // Inject extension
        gltfJson.extensionsUsed = gltfJson.extensionsUsed || [];
        if (!gltfJson.extensionsUsed.includes(SerializationTools.GLTF_EXTENSION_NAME)) {
            gltfJson.extensionsUsed.push(SerializationTools.GLTF_EXTENSION_NAME);
        }
        gltfJson.extensions = gltfJson.extensions || {};
        gltfJson.extensions[SerializationTools.GLTF_EXTENSION_NAME] = { flowGraph: fgSerialized };

        // Rebuild GLB
        const encoder = new TextEncoder();
        let newJsonBytes = encoder.encode(JSON.stringify(gltfJson));
        // Pad to 4-byte boundary with spaces
        while (newJsonBytes.length % 4 !== 0) {
            const padded = new Uint8Array(newJsonBytes.length + 1);
            padded.set(newJsonBytes);
            padded[padded.length - 1] = SerializationTools._GLB_SPACE_PAD;
            newJsonBytes = padded;
        }

        // Binary chunk (everything after the original JSON chunk)
        const binaryStart = jsonDataOffset + jsonChunkLength;
        const binaryChunk = glbBytes.slice(binaryStart);

        // Build new GLB
        const totalLength = SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE + newJsonBytes.length + binaryChunk.length;
        const result = new Uint8Array(totalLength);
        const resultView = new DataView(result.buffer);

        // GLB header
        resultView.setUint32(0, SerializationTools._GLB_MAGIC, true);
        resultView.setUint32(4, SerializationTools._GLB_VERSION, true);
        resultView.setUint32(8, totalLength, true);

        // JSON chunk header
        resultView.setUint32(SerializationTools._GLB_HEADER_SIZE, newJsonBytes.length, true);
        resultView.setUint32(SerializationTools._GLB_HEADER_SIZE + 4, SerializationTools._GLB_JSON_CHUNK_TYPE, true);
        result.set(newJsonBytes, jsonDataOffset);

        // Binary chunk (if any)
        if (binaryChunk.length > 0) {
            result.set(binaryChunk, jsonDataOffset + newJsonBytes.length);
        }

        return result;
    }

    /**
     * Build a minimal GLB from a JSON string (no binary chunk).
     * @param jsonStr - the stringified glTF JSON
     * @returns a Uint8Array containing the complete GLB
     */
    private static _BuildMinimalGlb(jsonStr: string): Uint8Array {
        const encoder = new TextEncoder();
        let jsonBytes = encoder.encode(jsonStr);
        // Pad to 4-byte boundary with spaces
        while (jsonBytes.length % 4 !== 0) {
            const padded = new Uint8Array(jsonBytes.length + 1);
            padded.set(jsonBytes);
            padded[padded.length - 1] = SerializationTools._GLB_SPACE_PAD;
            jsonBytes = padded;
        }

        const totalLength = SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE + jsonBytes.length;
        const glb = new Uint8Array(totalLength);
        const view = new DataView(glb.buffer);

        // Header
        view.setUint32(0, SerializationTools._GLB_MAGIC, true);
        view.setUint32(4, SerializationTools._GLB_VERSION, true);
        view.setUint32(8, totalLength, true);

        // JSON chunk
        const jsonDataOffset = SerializationTools._GLB_HEADER_SIZE + SerializationTools._GLB_CHUNK_HEADER_SIZE;
        view.setUint32(SerializationTools._GLB_HEADER_SIZE, jsonBytes.length, true);
        view.setUint32(SerializationTools._GLB_HEADER_SIZE + 4, SerializationTools._GLB_JSON_CHUNK_TYPE, true);
        glb.set(jsonBytes, jsonDataOffset);

        return glb;
    }

    /**
     * Download a blob as a file.
     * @param blob - the blob to download
     * @param fileName - the file name
     * @param globalState - the editor's global state
     */
    private static _DownloadBlob(blob: Blob, fileName: string, globalState: GlobalState): void {
        const url = URL.createObjectURL(blob);
        const a = globalState.hostDocument.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        // Cleanup after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
}
