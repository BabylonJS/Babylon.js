import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { RegisterClass } from "core/Misc/typeStore";
import { _isADescendantOf } from "core/FlowGraph/utils";

/**
 * Configuration for the pointer out event block.
 */
export interface IFlowGraphPointerOutEventBlockConfiguration extends IFlowGraphBlockConfiguration {
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
 * Payload for the pointer out event.
 */
export interface IFlowGraphPointerOutEventPayload {
    /**
     * The pointer id.
     */
    pointerId: number;
    /**
     * The mesh that was picked.
     */
    mesh: AbstractMesh;

    /**
     * If populated, the hover event moved to this mesh from the `mesh` variable
     */
    over?: AbstractMesh;
}

/**
 * A pointe out event block.
 * This block can be used as an entry pointer to when a pointer is out of a specific target mesh.
 */
export class FlowGraphPointerOutEventBlock extends FlowGraphEventBlock {
    /**
     * Output connection: The pointer id.
     */
    public readonly pointerId: FlowGraphDataConnection<number>;

    /**
     * Input connection: The mesh to listen to.
     */
    public readonly targetMesh: FlowGraphDataConnection<AbstractMesh>;

    /**
     * Output connection: The mesh that the pointer is out of.
     */
    public readonly meshOutOfPointer: FlowGraphDataConnection<AbstractMesh>;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.PointerOut;

    public constructor(config?: IFlowGraphPointerOutEventBlockConfiguration) {
        super(config);
        this.pointerId = this.registerDataOutput("pointerId", RichTypeNumber);
        this.targetMesh = this.registerDataInput("targetMesh", RichTypeAny, config?.targetMesh);
        this.meshOutOfPointer = this.registerDataOutput("meshOutOfPointer", RichTypeAny);
    }

    public override _executeEvent(context: FlowGraphContext, payload: IFlowGraphPointerOutEventPayload): boolean {
        const mesh = this.targetMesh.getValue(context);
        this.meshOutOfPointer.setValue(payload.mesh, context);
        this.pointerId.setValue(payload.pointerId, context);
        const skipEvent = payload.over && _isADescendantOf(payload.mesh, mesh);
        if (!skipEvent && (payload.mesh === mesh || _isADescendantOf(payload.mesh, mesh))) {
            this._execute(context);
            return !this.config?.stopPropagation;
        }
        return true;
    }
    public override _preparePendingTasks(_context: FlowGraphContext): void {
        // no-op
    }
    public override _cancelPendingTasks(_context: FlowGraphContext): void {
        // no-op
    }
    public override getClassName() {
        return FlowGraphBlockNames.PointerOutEvent;
    }
}

RegisterClass(FlowGraphBlockNames.PointerOutEvent, FlowGraphPointerOutEventBlock);
