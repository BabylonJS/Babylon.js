import type { Observable } from "../../../Misc/observable";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { MeshPickEventGenerator } from "./meshPickEventGenerator";

export class MeshPickEventBlock extends FlowGraphEventBlock {
    private _meshToPick: AbstractMesh;
    private _eventGenerator: MeshPickEventGenerator;

    constructor(graph: FlowGraph, meshToPick: AbstractMesh, eventGenerator: MeshPickEventGenerator) {
        super(graph);
        this._meshToPick = meshToPick;
        this._eventGenerator = eventGenerator;
    }

    createEventObservable(): Observable<any> {
        return this._eventGenerator.getMeshObservable(this._meshToPick.uniqueId);
    }
}
