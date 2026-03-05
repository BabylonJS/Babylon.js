import type { GlobalState } from "./globalState";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { FlowGraph } from "core/FlowGraph/flowGraph";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";

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

        // Gather all blocks by visiting the graph
        const blocks: FlowGraphBlock[] = [];
        if (frame) {
            frame.nodes.forEach((n) => blocks.push(n.content.data));
        } else {
            flowGraph.visitAllBlocks((block) => {
                blocks.push(block);
            });
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

        return JSON.stringify(serializationObject, undefined, 2);
    }

    /**
     * Deserialize a flow graph from a serialization object.
     * @param serializationObject - the serialized data to load
     * @param globalState - the editor's global state
     */
    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        // FlowGraph deserialization would be handled through the parser
        globalState.onIsLoadingChanged.notifyObservers(false);
    }
}
