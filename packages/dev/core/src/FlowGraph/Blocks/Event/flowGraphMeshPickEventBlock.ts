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
 */
export interface IFlowGraphMeshPickParams {
    graph: FlowGraph;
    mesh: AbstractMesh;
}
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    private _mesh: AbstractMesh;
    private _meshPickObserver: Nullable<Observer<PointerInfo>>;
    private _meshDisposeObserver: Nullable<Observer<Node>>;

    public constructor(params: IFlowGraphMeshPickParams) {
        super(params.graph);
        this._mesh = params.mesh;
    }

    public set meshToPick(mesh: AbstractMesh) {
        if (this._mesh !== mesh) {
            const wasListening = !!this._meshPickObserver;
            if (wasListening) {
                this._stopListening();
            }
            this._mesh = mesh;
            if (wasListening) {
                this._startListening();
            }
        }
    }

    public get meshToPick(): AbstractMesh {
        return this._mesh;
    }

    /**
     * @internal
     */
    public _startListening(): void {
        if (!this._meshPickObserver) {
            this._meshPickObserver = this._mesh.getScene().onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.pickedMesh === this._mesh) {
                    this._execute();
                }
            });
            this._meshDisposeObserver = this._mesh.onDisposeObservable.add(() => this._stopListening());
        }
    }

    /**
     * @internal
     */
    public _stopListening(): void {
        this._mesh.getScene().onPointerObservable.remove(this._meshPickObserver);
        this._meshPickObserver = null;
        this._mesh.onDisposeObservable.remove(this._meshDisposeObserver);
        this._meshDisposeObserver = null;
    }
}
