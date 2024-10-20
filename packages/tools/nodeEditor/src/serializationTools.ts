import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import type { GlobalState } from "./globalState";
import { Texture } from "core/Materials/Textures/texture";
import { DataStorage } from "core/Misc/dataStorage";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";

export class SerializationTools {
    public static UpdateLocations(material: NodeMaterial, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        material.editorData = {
            locations: [],
        };

        // Store node locations
        const blocks: NodeMaterialBlock[] = frame ? frame.nodes.map((n) => n.content.data) : material.attachedBlocks;

        for (const block of blocks) {
            const node = globalState.onGetNodeFromBlock(block);

            material.editorData.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0,
            });
        }

        globalState.storeEditorData(material.editorData, frame);
    }

    public static Serialize(material: NodeMaterial, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        const bufferSerializationState = Texture.SerializeBuffers;
        Texture.SerializeBuffers = DataStorage.ReadBoolean("EmbedTextures", true);

        this.UpdateLocations(material, globalState, frame);

        const selectedBlocks = frame ? frame.nodes.map((n) => n.content.data) : undefined;

        const serializationObject = material.serialize(selectedBlocks);

        Texture.SerializeBuffers = bufferSerializationState;

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.nodeMaterial!.parseSerializedObject(serializationObject, "");
        globalState.onIsLoadingChanged.notifyObservers(false);
    }

    public static AddFrameToMaterial(serializationObject: any, globalState: GlobalState, currentMaterial: NodeMaterial) {
        this.UpdateLocations(currentMaterial, globalState);
        globalState.nodeMaterial!.parseSerializedObject(serializationObject, "", true);
        globalState.onImportFrameObservable.notifyObservers(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }
}
