import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";
import type { PointerInfo } from "core/Events/pointerEvents";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { RegisterClass } from "core/Misc/typeStore";
import { _IsDescendantOf } from "core/FlowGraph/utils";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { Vector3 } from "core/Maths/math.vector";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import type { Nullable } from "core/types";

/**
 * Configuration for the pointer down event block.
 */
export interface IFlowGraphPointerDownEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * Should this block stop propagation of the event to other listeners.
     */
    stopPropagation?: boolean;

    /**
     * Optional mesh to filter events to. If set, the block only fires when the pointer
     * is pressed on this mesh or a descendant of it. If not set, fires on any pointer down.
     */
    targetMesh?: AbstractMesh;
}

/**
 * A pointer down event block.
 * This block fires when a pointer is pressed (mouse button down / touch start).
 * Optionally filters to a specific mesh via the `targetMesh` input.
 */
export class FlowGraphPointerDownEventBlock extends FlowGraphEventBlock {
    /**
     * Optional input connection: restrict firing to this mesh (and its descendants).
     * Leave disconnected to fire on any pointer down.
     */
    public readonly targetMesh: FlowGraphDataConnection<AbstractMesh>;

    /**
     * Output connection: The id of the pointer that triggered the event.
     */
    public readonly pointerId: FlowGraphDataConnection<number>;

    /**
     * Output connection: The mesh that was picked (if any).
     */
    public readonly pickedMesh: FlowGraphDataConnection<Nullable<AbstractMesh>>;

    /**
     * Output connection: The world-space point that was picked (if any).
     */
    public readonly pickedPoint: FlowGraphDataConnection<Nullable<Vector3>>;

    /** @internal */
    public override readonly type: FlowGraphEventType = FlowGraphEventType.PointerDown;

    /**
     * Creates a new FlowGraphPointerDownEventBlock.
     * @param config optional configuration
     */
    public constructor(config?: IFlowGraphPointerDownEventBlockConfiguration) {
        super(config);
        this.targetMesh = this.registerDataInput("targetMesh", RichTypeAny, config?.targetMesh);
        this.pointerId = this.registerDataOutput("pointerId", RichTypeNumber);
        this.pickedMesh = this.registerDataOutput("pickedMesh", RichTypeAny);
        this.pickedPoint = this.registerDataOutput("pickedPoint", RichTypeAny);
    }

    /** @internal */
    public override _executeEvent(context: FlowGraphContext, pointerInfo: PointerInfo): boolean {
        const mesh = this.targetMesh.getValue(context);
        const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

        // If a target mesh is set, only fire when that mesh (or a descendant) is picked.
        if (mesh && !(pickedMesh === mesh || (pickedMesh && _IsDescendantOf(pickedMesh, mesh)))) {
            return true;
        }

        this.pointerId.setValue((pointerInfo.event as PointerEvent).pointerId, context);
        this.pickedMesh.setValue(pickedMesh ?? null, context);
        this.pickedPoint.setValue(pointerInfo.pickInfo?.pickedPoint ?? null, context);
        this._execute(context);
        return !this.config?.stopPropagation;
    }

    /** @internal */
    public override _preparePendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /** @internal */
    public override _cancelPendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /**
     * @returns the class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PointerDownEvent;
    }
}

RegisterClass(FlowGraphBlockNames.PointerDownEvent, FlowGraphPointerDownEventBlock);
