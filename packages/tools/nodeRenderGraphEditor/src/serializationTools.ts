import type { GlobalState } from "./globalState";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";

export class SerializationTools {
    public static UpdateLocations(renderGraph: NodeRenderGraph, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        renderGraph.editorData = {
            locations: [],
        };

        // Store node locations
        const blocks: NodeRenderGraphBlock[] = frame ? frame.nodes.map((n) => n.content.data) : renderGraph.attachedBlocks;

        for (const block of blocks) {
            const node = globalState.onGetNodeFromBlock(block);

            renderGraph.editorData.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0,
            });
        }

        globalState.storeEditorData(renderGraph.editorData, frame);
    }

    public static Serialize(renderGraph: NodeRenderGraph, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        this.UpdateLocations(renderGraph, globalState, frame);

        const selectedBlocks = frame ? frame.nodes.map((n) => n.content.data) : undefined;

        const serializationObject = renderGraph.serialize(selectedBlocks);

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.nodeRenderGraph!.parseSerializedObject(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }

    public static AddFrameToRenderGraph(serializationObject: any, globalState: GlobalState, currentRenderGraph: NodeRenderGraph) {
        this.UpdateLocations(currentRenderGraph, globalState);
        globalState.nodeRenderGraph!.parseSerializedObject(serializationObject, true);
        globalState.onImportFrameObservable.notifyObservers(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }
}
