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

    public constructor(graph: FlowGraph, meshToPick: AbstractMesh) {
        super(graph);
        this._meshToPick = meshToPick;
    }

    public set meshToPick(mesh: AbstractMesh) {
        if (this._meshToPick !== mesh) {
            const wasListening = !!this._meshPickObserver;
            if (wasListening) {
                this._stopListening();
            }
            this._meshToPick = mesh;
            if (wasListening) {
                this._startListening();
            }
        }
    }

    public get meshToPick(): AbstractMesh {
        return this._meshToPick;
    }

    /**
     * @internal
     */
    public _startListening(): void {
        if (!this._meshPickObserver) {
            this._meshPickObserver = this._meshToPick.getScene().onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.pickedMesh === this._meshToPick) {
                    this._execute();
                }
            });
            this._meshDisposeObserver = this._meshToPick.onDisposeObservable.add(() => this._stopListening());
        }
    }

    /**
     * @internal
     */
    public _stopListening(): void {
        this._meshToPick.getScene().onPointerObservable.remove(this._meshPickObserver);
        this._meshPickObserver = null;
        this._meshToPick.onDisposeObservable.remove(this._meshDisposeObserver);
        this._meshDisposeObserver = null;
    }
}
