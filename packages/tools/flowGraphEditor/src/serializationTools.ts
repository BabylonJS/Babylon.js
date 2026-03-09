import type { GlobalState } from "./globalState";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { FlowGraph } from "core/FlowGraph/flowGraph";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";

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
     */
    public static async DeserializeAsync(serializationObject: any, globalState: GlobalState): Promise<void> {
        globalState.onIsLoadingChanged.notifyObservers(true);
        try {
            const coordinator = new FlowGraphCoordinator({ scene: globalState.scene });
            const parsedGraph = await ParseFlowGraphAsync(serializationObject, { coordinator });

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
                globalState.flowGraphSnippetId = serializationObject.flowGraphSnippetId;
            }
        } finally {
            globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }
}
