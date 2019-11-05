import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { GlobalState } from './globalState';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { DataStorage } from './dataStorage';

export class SerializationTools {
    public static Serialize(material: NodeMaterial, globalState: GlobalState) {
        let bufferSerializationState = Texture.SerializeBuffers;
        Texture.SerializeBuffers = DataStorage.ReadBoolean("EmbedTextures", true);

        let serializationObject = material.serialize();

        // Store node locations
        for (var block of material.attachedBlocks) {
            let node = globalState.onGetNodeFromBlock(block);

            if (!serializationObject.locations) {
                serializationObject.locations = [];
            }

            serializationObject.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0
            });
        }

        Texture.SerializeBuffers = bufferSerializationState;

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject:any, globalState: GlobalState) {       
        globalState.onIsLoadingChanged.notifyObservers(true); 
        globalState.nodeMaterial!.loadFromSerialization(serializationObject, "");
        
        globalState.onResetRequiredObservable.notifyObservers();
    }
}