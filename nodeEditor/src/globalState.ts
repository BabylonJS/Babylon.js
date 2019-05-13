import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial"
import { Nullable } from "babylonjs/types"
import { Observable } from 'babylonjs/Misc/observable';
import { GenericNodeModel } from './components/diagram/generic/genericNodeModel';

export class GlobalState {
    nodeMaterial?: NodeMaterial;
    hostDocument?: Nullable<Document>;
    onSelectionChangedObservable = new Observable<Nullable<GenericNodeModel>>();
}