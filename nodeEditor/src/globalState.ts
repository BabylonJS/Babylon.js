import {NodeMaterial} from "babylonjs/Materials/Node/nodeMaterial"
import {Nullable} from "babylonjs/types"
export class GlobalState {
    nodeMaterial?:NodeMaterial;
    hostDocument?:Nullable<Document>;
}