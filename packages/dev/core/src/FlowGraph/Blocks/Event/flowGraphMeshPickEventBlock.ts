import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { PointerEventTypes } from "../../../Events/pointerEvents";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * @experimental
 */
export interface IFlowGraphMeshPickEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    meshVariableName: string;
}
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    private _meshVariableName: string;

    public constructor(public config: IFlowGraphMeshPickEventBlockConfiguration) {
        super(config);
    }

    public configure() {
        super.configure();
        this._meshVariableName = this.config.meshVariableName;
    }

    /**
     * @internal
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        let pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        if (!pickObserver) {
            const mesh = context.getVariable(this._meshVariableName) as AbstractMesh;
            pickObserver = mesh.getScene().onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.pickedMesh === mesh) {
                    this._execute(context);
                }
            });
            const disposeObserver = mesh.onDisposeObservable.add(() => this._onDispose);
            context._setExecutionVariable(this, "meshPickObserver", pickObserver);
            context._setExecutionVariable(this, "meshDisposeObserver", disposeObserver);
        }
    }

    public _onDispose(context: FlowGraphContext) {
        this._cancelPendingTasks(context);
        context._removePendingBlock(this);
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(context: FlowGraphContext): void {
        const mesh = context.getVariable(this._meshVariableName) as AbstractMesh;
        const pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        const disposeObserver = context._getExecutionVariable(this, "meshDisposeObserver");

        mesh.getScene().onPointerObservable.remove(pickObserver);
        mesh.onDisposeObservable.remove(disposeObserver);

        context._deleteExecutionVariable(this, "meshPickObserver");
        context._deleteExecutionVariable(this, "meshDisposeObserver");
    }

    public getClassName(): string {
        return "FGMeshPickEventBlock";
    }
}
RegisterClass("FGMeshPickEventBlock", FlowGraphMeshPickEventBlock);
