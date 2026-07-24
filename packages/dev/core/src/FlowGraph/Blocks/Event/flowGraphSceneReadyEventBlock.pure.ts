/** This file must only contain pure code and pure imports */

import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeString } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import { GetEventReference } from "core/FlowGraph/flowGraphEventReference";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Block that triggers when a scene is ready.
 */
export class FlowGraphSceneReadyEventBlock extends FlowGraphEventBlock {
    public override initPriority: number = -1;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.SceneReady;

    /**
     * Output: the KHR_interactivity event reference for this lifecycle event.
     * Per spec (event/onStart) all instances of this operation return the same,
     * non-null event reference. We use a stable string ref so `ref/eq` of two
     * onStart `event` outputs compares equal.
     */
    public readonly eventRef: FlowGraphDataConnection<string>;

    constructor() {
        super();
        this.eventRef = this.registerDataOutput("event", RichTypeString, GetEventReference("onStart"));
    }

    public override _executeEvent(context: FlowGraphContext, _payload: any): boolean {
        this.eventRef.setValue(GetEventReference("onStart"), context);
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
