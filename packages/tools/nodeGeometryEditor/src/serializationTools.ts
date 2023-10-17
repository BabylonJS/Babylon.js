import type { GlobalState } from "./globalState";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";

export class SerializationTools {
    public static UpdateLocations(geometry: NodeGeometry, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        geometry.editorData = {
            locations: [],
        };

        // Store node locations
        const blocks: NodeGeometryBlock[] = frame ? frame.nodes.map((n) => n.content.data) : geometry.attachedBlocks;

        for (const block of blocks) {
            const node = globalState.onGetNodeFromBlock(block);

            geometry.editorData.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0,
            });
        }

        globalState.storeEditorData(geometry.editorData, frame);
    }

    public static Serialize(geometry: NodeGeometry, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        this.UpdateLocations(geometry, globalState, frame);

        const selectedBlocks = frame ? frame.nodes.map((n) => n.content.data) : undefined;

        const serializationObject = geometry.serialize(selectedBlocks);

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.nodeGeometry!.parseSerializedObject(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }

    public static AddFrameToGeometry(serializationObject: any, globalState: GlobalState, currentGeometry: NodeGeometry) {
        this.UpdateLocations(currentGeometry, globalState);
        globalState.nodeGeometry!.parseSerializedObject(serializationObject, true);
        globalState.onImportFrameObservable.notifyObservers(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }
}
