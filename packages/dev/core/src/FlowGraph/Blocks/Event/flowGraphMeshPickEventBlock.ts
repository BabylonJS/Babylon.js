import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { PointerInfo } from "../../../Events/pointerEvents";
import { PointerEventTypes } from "../../../Events/pointerEvents";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { _isADescendantOf } from "../../utils";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes";
import type { Vector3 } from "core/Maths/math.vector";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
/**
 * Configuration for the mesh pick event block.
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

    /**
     * Input connection: The type of the pointer event.
     */
    public readonly pointerType: FlowGraphDataConnection<PointerEventTypes>;

    /**
     * the type of the event this block reacts to
     */
    public override readonly type: FlowGraphEventType = FlowGraphEventType.MeshPick;

    public constructor(
        /**
         * the configuration of the block
         */
        public override config?: IFlowGraphMeshPickEventBlockConfiguration
    ) {
        super(config);
        this.asset = this.registerDataInput("asset", RichTypeAny, config?.targetMesh);
        this.pickedPoint = this.registerDataOutput("pickedPoint", RichTypeVector3);
        this.pickOrigin = this.registerDataOutput("pickOrigin", RichTypeVector3);
        this.pointerId = this.registerDataOutput("pointerId", RichTypeNumber);
        this.pickedMesh = this.registerDataOutput("pickedMesh", RichTypeAny);
        this.pointerType = this.registerDataInput("pointerType", RichTypeAny, PointerEventTypes.POINTERPICK);
    }

    public _getReferencedMesh(context: FlowGraphContext): AbstractMesh {
        return this.asset.getValue(context) as AbstractMesh;
    }

    public override _executeEvent(context: FlowGraphContext, pickedInfo: PointerInfo): boolean {
        // get the pointer type
        const pointerType = this.pointerType.getValue(context);
        if (pointerType !== pickedInfo.type) {
            // returning true here to continue the propagation of the pointer event to the rest of the blocks
            return true;
        }
        // check if the mesh is the picked mesh or a descendant
        const mesh = this._getReferencedMesh(context);
        if (mesh && pickedInfo.pickInfo?.pickedMesh && (pickedInfo.pickInfo?.pickedMesh === mesh || _isADescendantOf(pickedInfo.pickInfo?.pickedMesh, mesh))) {
            this.pointerId.setValue((pickedInfo.event as PointerEvent).pointerId, context);
            this.pickOrigin.setValue(pickedInfo.pickInfo.ray?.origin!, context);
            this.pickedPoint.setValue(pickedInfo.pickInfo.pickedPoint!, context);
            this.pickedMesh.setValue(pickedInfo.pickInfo.pickedMesh, context);
            this._execute(context);
            // stop the propagation if the configuration says so
            return !this.config?.stopPropagation;
        } else {
            // reset the outputs
            this.pointerId.resetToDefaultValue(context);
            this.pickOrigin.resetToDefaultValue(context);
            this.pickedPoint.resetToDefaultValue(context);
            this.pickedMesh.resetToDefaultValue(context);
        }
        return true;
    }

    /**
     * @internal
     */
    public _preparePendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /**
     * @internal
     */
    public _cancelPendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.MeshPickEvent;
    }
}
RegisterClass(FlowGraphBlockNames.MeshPickEvent, FlowGraphMeshPickEventBlock);
