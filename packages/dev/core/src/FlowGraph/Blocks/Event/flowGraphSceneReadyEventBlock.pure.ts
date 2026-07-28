/** This file must only contain pure code and pure imports */

import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeString } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { RegisterClass } from "../../../Misc/typeStore";

/** Event source key used to build this block's event reference. */
const EventKey = "sceneReady";

/**
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    public override initPriority: number = -1;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.SceneReady;

    /**
     * Output: the opaque reference identifying this event source.
     * All instances of this block share the same reference, so comparing the `event` output of two
     * of them for equality succeeds. The reference format is owned by the host environment.
     */
    public readonly eventRef: FlowGraphDataConnection<string>;

    constructor() {
        super();
        this.eventRef = this.registerDataOutput("event", RichTypeString);
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        this.eventRef.setValue(context.getEventReference(EventKey), context);
    }

    public override _executeEvent(context: FlowGraphContext, _payload: any): boolean {
        this.eventRef.setValue(context.getEventReference(EventKey), context);
        this._execute(context);
        return true;
    }
    public override _preparePendingTasks(context: FlowGraphContext): void {
        // no-op
    }
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        // no-op
    }
    /**
     * @returns class name of the block.
     */
    public override getClassName() {
        return FlowGraphBlockNames.SceneReadyEvent;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphSceneReadyEventBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphSceneReadyEventBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.SceneReadyEvent, FlowGraphSceneReadyEventBlock);
}
