import type { Observer } from "../../../Misc/observable";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc/tools";
import type { RichType } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
/**
 * Parameters used to create a FlowGraphReceiveCustomEventBlock.
 */
export interface IFlowGraphReceiveCustomEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The id of the event to receive.
     * This event id is unique to the environment (not the context).
     */
    eventId: string;
    /**
     * The names of the data outputs for that event. Should be in the same order as the event data in
     * SendCustomEvent
     */
    eventData: { [key: string]: { type: RichType<any> } };
}

/**
 * A block that receives a custom event.
 * It saves the event data in the data outputs, based on the provided eventData in the configuration. For example, if the event data is
 * `{ x: { type: RichTypeNumber }, y: { type: RichTypeNumber } }`, the block will have two data outputs: x and y.
 */
export class FlowGraphReceiveCustomEventBlock extends FlowGraphEventBlock {
    public override initPriority: number = 1;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphReceiveCustomEventBlockConfiguration
    ) {
        super(config);
        // use event data to register data outputs
        for (const key in this.config.eventData) {
            this.registerDataOutput(key, this.config.eventData[key].type);
        }
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        // check if we are not exceeding the max number of events
        if (observable && observable.hasObservers() && observable.observers.length > FlowGraphCoordinator.MaxEventsPerType) {
            this._reportError(context, `FlowGraphReceiveCustomEventBlock: Too many observers for event ${this.config.eventId}. Max is ${FlowGraphCoordinator.MaxEventsPerType}.`);
            return;
        }

        const eventObserver = observable.add((eventData: { [key: string]: any }) => {
            const keys = Object.keys(eventData);
            for (const key of keys) {
                this.getDataOutput(key)?.setValue(eventData[key], context);
            }
            this._execute(context);
        });
        context._setExecutionVariable(this, "_eventObserver", eventObserver);
    }
    public _cancelPendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        if (observable) {
            const eventObserver = context._getExecutionVariable<Nullable<Observer<any[]>>>(this, "_eventObserver", null);
            observable.remove(eventObserver);
        } else {
            Tools.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
        }
    }

    public override _executeEvent(_context: FlowGraphContext, _payload: any): boolean {
        return true;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.ReceiveCustomEvent;
    }
}
RegisterClass(FlowGraphBlockNames.ReceiveCustomEvent, FlowGraphReceiveCustomEventBlock);
