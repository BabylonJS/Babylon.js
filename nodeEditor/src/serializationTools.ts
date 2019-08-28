import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { GlobalState } from './globalState';
import { INodeLocationInfo } from './nodeLocationInfo';

export class SerializationTools {
    public static Serialize(material: NodeMaterial, globalState: GlobalState) {
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

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject:any, globalState: GlobalState) {        
        globalState.nodeMaterial!.loadFromSerialization(serializationObject, "");

        // Check for id mapping
        if (serializationObject.locations && serializationObject.map) {
            let map: {[key: number]: number} = serializationObject.map;
            let locations: INodeLocationInfo[] = serializationObject.locations;

            for (var location of locations) {
                location.blockId = map[location.blockId];
            }
        }
        
        globalState.onResetRequiredObservable.notifyObservers(serializationObject.locations);
    }
}