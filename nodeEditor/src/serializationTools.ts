import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { GlobalState } from './globalState';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';

export class SerializationTools {

    public static UpdateLocations(material: NodeMaterial, globalState: GlobalState) {
        material.editorData = {
            locations: []
        };

        // Store node locations
        for (var block of material.attachedBlocks) {
            let node = globalState.onGetNodeFromBlock(block);

            material.editorData.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0
            });
        }

        globalState.storeEditorData(material.editorData);
    }

    public static Serialize(material: NodeMaterial, globalState: GlobalState, selectedBlocks?: NodeMaterialBlock[]) {
        let bufferSerializationState = Texture.SerializeBuffers;
        Texture.SerializeBuffers = DataStorage.ReadBoolean("EmbedTextures", true);

        this.UpdateLocations(material, globalState);

        let serializationObject = material.serialize(selectedBlocks);

        Texture.SerializeBuffers = bufferSerializationState;

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.onIsLoadingChanged.notifyObservers(true);
        globalState.nodeMaterial!.loadFromSerialization(serializationObject, "");
        globalState.mode = globalState.nodeMaterial!.mode;

        globalState.onResetRequiredObservable.notifyObservers();
    }
}