import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial"
import { Nullable } from "babylonjs/types"
import { Observable } from 'babylonjs/Misc/observable';
import { DefaultNodeModel } from './components/diagram/defaultNodeModel';

export class GlobalState {
    nodeMaterial?: NodeMaterial;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    onSelectionChangedObservable = new Observable<Nullable<DefaultNodeModel>>();
}