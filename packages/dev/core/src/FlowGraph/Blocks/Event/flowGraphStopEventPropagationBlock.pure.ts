/** This file must only contain pure code and pure imports */

import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { type FlowGraphContext } from "../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection.pure";
import { RichTypeBoolean, RichTypeString } from "../../flowGraphRichTypes.pure";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";

/**
 * Stops the propagation of an in-flight custom event, backing the
 * KHR_interactivity `event/stopPropagation` operation.
 *
 * When activated it asks the coordinator to skip the remaining handler nodes of
 * the currently-dispatching event referenced by the `event` input, then activates
 * its `out` flow. If the `event` input is not a valid, currently-dispatching event
 * reference, activating this block only fires `out` with no other effect (per spec).
 */
export class FlowGraphStopEventPropagationBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input: the event reference (produced by an event operation's `event` output)
     * whose propagation should be stopped.
     */
    public readonly event: FlowGraphDataConnection<string>;

    /**
     * Input: whether to also stop remaining immediate handlers. See
     * `FlowGraphCoordinator.stopEventPropagation` for how this maps onto the
     * Babylon single-Observable dispatch model.
     */
    public readonly stopImmediate: FlowGraphDataConnection<boolean>;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.event = this.registerDataInput("event", RichTypeString);
        this.stopImmediate = this.registerDataInput("stopImmediate", RichTypeBoolean, false);
    }

    public _execute(context: FlowGraphContext): void {
        const event = this.event.getValue(context);
        const stopImmediate = this.stopImmediate.getValue(context);
        context.configuration.coordinator.stopEventPropagation(event, stopImmediate);
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.StopEventPropagation;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphStopEventPropagationBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphStopEventPropagationBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.StopEventPropagation, FlowGraphStopEventPropagationBlock);
}
