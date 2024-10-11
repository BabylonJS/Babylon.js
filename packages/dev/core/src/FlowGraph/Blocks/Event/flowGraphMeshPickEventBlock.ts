import { AbstractMesh } from "../../../Meshes/abstractMesh";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { PointerInfo } from "../../../Events/pointerEvents";
import { PointerEventTypes } from "../../../Events/pointerEvents";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { _isADescendantOf } from "../../utils";
import type { IPathToObjectConverter } from "../../../ObjectModel/objectModelInterfaces";
import type { IObjectAccessor } from "../../typeDefinitions";
import type { Nullable } from "../../../types";
import type { Mesh } from "../../../Meshes";
import type { Observer } from "../../../Misc/observable";
import type { Node } from "../../../node";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
/**
 * @experimental
 */
export interface IFlowGraphMeshPickEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The path of the mesh to pick.
     */
    path: string;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
}
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    public constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphMeshPickEventBlockConfiguration
    ) {
        super(config);
    }

    public _getReferencedMesh(): AbstractMesh {
        const iAccessor = this.config.pathConverter.convert(this.config.path);

        const mesh = iAccessor.info.getObject(iAccessor.object) as AbstractMesh;
        if (!mesh || !(mesh instanceof AbstractMesh)) {
            throw new Error("Mesh pick event block requires a valid mesh");
        }
        return mesh;
    }

    /**
     * @internal
     */
    public _preparePendingTasks(context: FlowGraphContext): void {
        let pickObserver = context._getExecutionVariable<Nullable<Observer<PointerInfo>>>(this, "meshPickObserver", null);
        if (!pickObserver) {
            const mesh = this._getReferencedMesh();
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
        const mesh = context._getExecutionVariable<Nullable<Mesh>>(this, "mesh", null);
        if (!mesh) {
            return;
        }
        const pickObserver = context._getExecutionVariable<Nullable<Observer<PointerInfo>>>(this, "meshPickObserver", null);
        const disposeObserver = context._getExecutionVariable<Nullable<Observer<Node>>>(this, "meshDisposeObserver", null);

        mesh.getScene().onPointerObservable.remove(pickObserver);
        mesh.onDisposeObservable.remove(disposeObserver);

        context._deleteExecutionVariable(this, "mesh");
        context._deleteExecutionVariable(this, "meshPickObserver");
        context._deleteExecutionVariable(this, "meshDisposeObserver");
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.MeshPickEvent;
    }
}
RegisterClass(FlowGraphBlockNames.MeshPickEvent, FlowGraphMeshPickEventBlock);
