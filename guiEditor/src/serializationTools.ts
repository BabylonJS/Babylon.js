import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { GlobalState } from './globalState';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { DataStorage } from 'babylonjs/Misc/dataStorage';


export class SerializationTools {

    public static UpdateLocations(material: NodeMaterial, globalState: GlobalState) {
        material.editorData = {
            locations: []
        };
        

        globalState.storeEditorData(material.editorData);
    }

    public static Serialize(material: NodeMaterial, globalState: GlobalState) {
        let bufferSerializationState = Texture.SerializeBuffers;
        Texture.SerializeBuffers = DataStorage.ReadBoolean("EmbedTextures", true);


        const selectedBlocks = undefined;

        let serializationObject = material.serialize(selectedBlocks);

        Texture.SerializeBuffers = bufferSerializationState;

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.onIsLoadingChanged.notifyObservers(true);
        globalState.workbench.loadFromGuiTexture(serializationObject);
    }

    public static AddFrameToMaterial(serializationObject: any, globalState: GlobalState, currentMaterial: NodeMaterial) {
        globalState.onIsLoadingChanged.notifyObservers(true);
        this.UpdateLocations(currentMaterial, globalState);
        globalState.onImportFrameObservable.notifyObservers(serializationObject);
    }
}