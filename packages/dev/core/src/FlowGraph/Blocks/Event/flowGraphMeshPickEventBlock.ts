import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { PointerInfo } from "../../../Events/pointerEvents";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { _isADescendantOf } from "../../utils";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import type { Vector3 } from "core/Maths/math.vector";
/**
 * @experimental
 */
export interface IFlowGraphMeshPickEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * Should this mesh block propagation of the event.
     */
    stopPropagation?: boolean;

    /**
     * The mesh to listen to. Can also be set by the asset input.
     */
    targetMesh?: AbstractMesh;
}
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    /**
     * Input connection: The mesh to listen to.
     */
    public readonly asset: FlowGraphDataConnection<AbstractMesh>;

    /**
     * Output connection: The picked point.
     */
    public readonly pickedPoint: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The picked origin.
     */
    public readonly pickOrigin: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The pointer id.
     */
    public readonly pointerId: FlowGraphDataConnection<number>;

    /**
     * Output connection: The picked mesh. Possibly NOT the same as the asset (could be a descendant).
     */
    public readonly pickedMesh: FlowGraphDataConnection<AbstractMesh>;

    public constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphMeshPickEventBlockConfiguration
    ) {
        super(config);
        this.asset = this.registerDataInput("asset", RichTypeAny, config.targetMesh);

        this.pickedPoint = this.registerDataOutput("pickedPoint", RichTypeVector3);
        this.pickOrigin = this.registerDataOutput("pickOrigin", RichTypeVector3);
        this.pointerId = this.registerDataOutput("pointerId", RichTypeNumber);
        this.pickedMesh = this.registerDataOutput("pickedMesh", RichTypeAny);
    }

    public _getReferencedMesh(context: FlowGraphContext): AbstractMesh {
        return this.asset.getValue(context) as AbstractMesh;
    }

    public override _executeOnPicked(context: FlowGraphContext, pickedInfo: PointerInfo): boolean {
        // check if the mesh is the picked mesh or a descendant
        const mesh = this._getReferencedMesh(context);
        if (mesh && pickedInfo.pickInfo?.pickedMesh && (pickedInfo.pickInfo?.pickedMesh === mesh || _isADescendantOf(pickedInfo.pickInfo?.pickedMesh, mesh))) {
            this.pointerId.setValue((pickedInfo.event as PointerEvent).pointerId, context);
            this.pickOrigin.setValue(pickedInfo.pickInfo.ray?.origin!, context);
            this.pickedPoint.setValue(pickedInfo.pickInfo.pickedPoint!, context);
            this.pickedMesh.setValue(pickedInfo.pickInfo.pickedMesh, context);
            this._execute(context);
        } else {
            // TODO - does it make sense to reset the values? The event will not be triggered anyway.
        }
        return !this.config.stopPropagation;
    }

    /**
     * @internal
     */
    public _preparePendingTasks(_context: FlowGraphContext): void {
        // // check if block was initialized
        // if (!context._getExecutionVariable(this, "valueChangedObserver", null)) {
        //     const observer = this.asset.onValueChangedObservable.add(() => {
        //         this._cancelPendingTasks(context);
        //         this._preparePendingTasks(context);
        //     });
        //     context._setExecutionVariable(this, "valueChangedObserver", observer);
        // }
        // // check if the asset is defined
        // const mesh = this.asset.getValue(context);
        // if (!mesh) {
        //     // no asset, ignore!
        //     return;
        // }
        // let pickObserver = context._getExecutionVariable<Nullable<Observer<PointerInfo>>>(this, "meshPickObserver", null);
        // if (!pickObserver) {
        //     pickObserver = mesh.getScene().onPointerObservable.add((pointerInfo) => {
        //         if (pointerInfo.pickInfo?.pickedMesh && (pointerInfo.pickInfo?.pickedMesh === mesh || _isADescendantOf(pointerInfo.pickInfo?.pickedMesh, mesh))) {
        //             const pointerId = (pointerInfo.event as PointerEvent).pointerId;
        //             this.pointerId.setValue(pointerId, context);
        //             this.pickOrigin.setValue(pointerInfo.pickInfo.ray?.origin!, context);
        //             this.pickedPoint.setValue(pointerInfo.pickInfo.pickedPoint!, context);
        //             this._execute(context);
        //         }
        //     }, PointerEventTypes.POINTERPICK);
        //     const disposeObserver = mesh.onDisposeObservable.add(() => this._onDispose);
        //     context._setExecutionVariable(this, "meshPickObserver", pickObserver);
        //     context._setExecutionVariable(this, "meshDisposeObserver", disposeObserver);
        // }
    }

    // public _onDispose(context: FlowGraphContext) {
    //     this._cancelPendingTasks(context);
    //     context._removePendingBlock(this);
    // }

    /**
     * @internal
     */
    public _cancelPendingTasks(_context: FlowGraphContext): void {
        // const mesh = context._getExecutionVariable<Nullable<Mesh>>(this, "mesh", null);
        // if (!mesh) {
        //     return;
        // }
        // const pickObserver = context._getExecutionVariable<Nullable<Observer<PointerInfo>>>(this, "meshPickObserver", null);
        // const disposeObserver = context._getExecutionVariable<Nullable<Observer<Node>>>(this, "meshDisposeObserver", null);
        // mesh.getScene().onPointerObservable.remove(pickObserver);
        // mesh.onDisposeObservable.remove(disposeObserver);
        // context._deleteExecutionVariable(this, "mesh");
        // context._deleteExecutionVariable(this, "meshPickObserver");
        // context._deleteExecutionVariable(this, "meshDisposeObserver");
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.MeshPickEvent;
    }
}
RegisterClass(FlowGraphBlockNames.MeshPickEvent, FlowGraphMeshPickEventBlock);
