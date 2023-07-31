import { Observable } from "../../../Misc/observable";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { PointerEventTypes } from "../../../Events/pointerEvents";

/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    private _meshToPick: AbstractMesh;
    private _meshPickObservable: Observable<void>;

    constructor(graph: FlowGraph, meshToPick: AbstractMesh) {
        super(graph);
        this._meshToPick = meshToPick;
    }

    createEventObservable(): Observable<any> {
        this._meshPickObservable = new Observable<void>();
        this._meshToPick.getScene().onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this._meshToPick) {
                this._meshPickObservable.notifyObservers();
            }
        });
        return this._meshPickObservable;
    }
}
