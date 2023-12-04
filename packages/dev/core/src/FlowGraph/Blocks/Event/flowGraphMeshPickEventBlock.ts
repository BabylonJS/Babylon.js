import { AbstractMesh } from "../../../Meshes/abstractMesh";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { PointerEventTypes } from "../../../Events/pointerEvents";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import type { FlowGraphPath } from "../../flowGraphPath";
import { Tools } from "../../../Misc/tools";
import { _isADescendantOf } from "../../utils";
/**
 * @experimental
 */
export interface IFlowGraphMeshPickEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    path: FlowGraphPath;
}
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    public constructor(public config: IFlowGraphMeshPickEventBlockConfiguration) {
        if (config.path.hasTemplateStrings) {
            Tools.Warn("Template strings are not supported in the path of mesh pick event blocks.");
        }
        super(config);
    }

    public _getReferencedMesh(context: FlowGraphContext): AbstractMesh | undefined {
        return this.config.path.getProperty(context);
    }

    /**
     * @internal
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        let pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        if (!pickObserver) {
            const mesh = this.config.path.getProperty(context);
            if (!mesh || !(mesh instanceof AbstractMesh)) {
                throw new Error("Mesh pick event block requires a valid mesh");
            }
            context._setExecutionVariable(this, "mesh", mesh);
            pickObserver = mesh.getScene().onPointerObservable.add((pointerInfo) => {
                if (
                    pointerInfo.type === PointerEventTypes.POINTERPICK &&
                    pointerInfo.pickInfo?.pickedMesh &&
                    (pointerInfo.pickInfo?.pickedMesh === mesh || _isADescendantOf(pointerInfo.pickInfo?.pickedMesh, mesh))
                ) {
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
        const mesh = context._getExecutionVariable(this, "mesh");
        const pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        const disposeObserver = context._getExecutionVariable(this, "meshDisposeObserver");

        mesh.getScene().onPointerObservable.remove(pickObserver);
        mesh.onDisposeObservable.remove(disposeObserver);

        context._deleteExecutionVariable(this, "mesh");
        context._deleteExecutionVariable(this, "meshPickObserver");
        context._deleteExecutionVariable(this, "meshDisposeObserver");
    }

    public getClassName(): string {
        return FlowGraphMeshPickEventBlock.ClassName;
    }

    public serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path.serialize();
    }

    static ClassName = "FGMeshPickEventBlock";
}
RegisterClass(FlowGraphMeshPickEventBlock.ClassName, FlowGraphMeshPickEventBlock);
