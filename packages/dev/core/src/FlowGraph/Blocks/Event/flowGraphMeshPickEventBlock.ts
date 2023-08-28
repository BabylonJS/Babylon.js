import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { FlowGraph } from "../../flowGraph";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { PointerEventTypes } from "../../../Events/pointerEvents";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

/**
 * @experimental
 */
export interface IFlowGraphMeshPickParams {
    meshVariableName: string;
}
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    private _meshVariableName: string;

    public constructor(graph: FlowGraph, params: IFlowGraphMeshPickParams) {
        super(graph);
        this._meshVariableName = params.meshVariableName;
    }

    /**
     * @internal
     */
    public _startListening(context: FlowGraphContext): void {
        let pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        if (!pickObserver) {
            const mesh = context.getVariable(this._meshVariableName) as AbstractMesh;
            pickObserver = mesh.getScene().onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.pickedMesh === mesh) {
                    this._execute(context);
                }
            });
            const disposeObserver = mesh.onDisposeObservable.add(() => this._stopListening(context));
            context._setExecutionVariable(this, "meshPickObserver", pickObserver);
            context._setExecutionVariable(this, "meshDisposeObserver", disposeObserver);
        }
    }

    /**
     * @internal
     */
    public _stopListening(context: FlowGraphContext): void {
        const mesh = context.getVariable(this._meshVariableName) as AbstractMesh;
        const pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        const disposeObserver = mesh.onDisposeObservable.add(() => this._stopListening(context));

        mesh.getScene().onPointerObservable.remove(pickObserver);
        mesh.onDisposeObservable.remove(disposeObserver);

        context._deleteExecutionVariable(this, "meshPickObserver");
        context._deleteExecutionVariable(this, "meshDisposeObserver");
    }
}
