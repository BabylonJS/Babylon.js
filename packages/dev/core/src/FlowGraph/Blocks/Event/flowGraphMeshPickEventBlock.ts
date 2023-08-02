import type { Observer } from "../../../Misc/observable";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { PointerInfo } from "../../../Events/pointerEvents";
import { PointerEventTypes } from "../../../Events/pointerEvents";
import type { Nullable } from "../../../types";
import type { Node } from "../../../node";

/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    private _meshToPick: AbstractMesh;
    private _meshPickObserver: Nullable<Observer<PointerInfo>>;
    private _meshDisposeObserver: Nullable<Observer<Node>>;

    constructor(graph: FlowGraph, meshToPick: AbstractMesh) {
        super(graph);
        this._meshToPick = meshToPick;
    }

    protected _startListening(resolveCallback: () => void): void {
        this._meshPickObserver = this._meshToPick.getScene().onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh === this._meshToPick) {
                resolveCallback();
            }
        });
        this._meshDisposeObserver = this._meshToPick.onDisposeObservable.add(this._stopListening.bind(this));
    }

    protected _stopListening(): void {
        if (this._meshPickObserver) {
            this._meshToPick.getScene().onPointerObservable.remove(this._meshPickObserver);
        }
        if (this._meshDisposeObserver) {
            this._meshToPick.onDisposeObservable.remove(this._meshDisposeObserver);
        }
    }
}
