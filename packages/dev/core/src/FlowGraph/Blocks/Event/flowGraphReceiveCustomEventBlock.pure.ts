/** This file must only contain pure code and pure imports */

import { type Observer } from "../../../Misc/observable.pure";
import { type FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type Nullable } from "../../../types";
import { Logger } from "../../../Misc/logger";
import { type RichType, getRichTypeByFlowGraphType, RichTypeString } from "../../flowGraphRichTypes.pure";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection.pure";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { GetEventReference } from "core/FlowGraph/flowGraphEventReference";
import { RegisterClass } from "../../../Misc/typeStore";
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

    /**
     * Output: the KHR_interactivity event reference for the received custom event.
     * Per spec (event/receive) receivers of the same event index return the same,
     * non-null event reference. We key the reference by the configured event id.
     */
    public readonly eventRef: FlowGraphDataConnection<string>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphReceiveCustomEventBlockConfiguration
    ) {
        super(config);
        // use event data to register data outputs
        for (const key in this.config.eventData) {
            const entry = this.config.eventData[key];
            // Handle deserialized config where type may be a string typeName, a plain object
            // with a typeName property (from old JSON serialization), or a proper RichType instance.
            const typeKey = typeof entry.type === "string" ? entry.type : entry.type?.typeName;
            const richType = typeof entry.type?.serialize === "function" ? entry.type : getRichTypeByFlowGraphType(typeKey);
            entry.type = richType;
            // Pass default value from event data schema so outputs have the correct initial value
            this.registerDataOutput(key, richType, (entry as any).value);
        }
        // Reserved `event` output exposing the event reference. Guard against a
        // (pathological) custom event value socket literally named "event".
        this.eventRef =
            this.config.eventData && Object.prototype.hasOwnProperty.call(this.config.eventData, "event")
                ? this.getDataOutput("event")!
                : this.registerDataOutput("event", RichTypeString, GetEventReference(this.config.eventId));
    }

    public override _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        // check if we are not exceeding the max number of events
        if (observable && observable.hasObservers() && observable.observers.length > FlowGraphCoordinator.MaxEventsPerType) {
            this._reportError(context, `FlowGraphReceiveCustomEventBlock: Too many observers for event ${this.config.eventId}. Max is ${FlowGraphCoordinator.MaxEventsPerType}.`);
            return;
        }

        const eventObserver = observable.add((eventData: { [key: string]: any }, eventState) => {
            // Make this dispatch's EventState reachable by event/stopPropagation
            // for the duration of the synchronous receiver flow.
            context.configuration.coordinator._beginEventDispatch(this.config.eventId, eventState);
            try {
                const keys = Object.keys(eventData);
                for (const key of keys) {
                    this.getDataOutput(key)?.setValue(eventData[key], context);
                }
                // Expose the event reference before activating downstream flow.
                this.eventRef.setValue(GetEventReference(this.config.eventId), context);
                this._execute(context);
            } finally {
                context.configuration.coordinator._endEventDispatch();
            }
        });
        context._setExecutionVariable(this, "_eventObserver", eventObserver);
    }
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        if (observable) {
            const eventObserver = context._getExecutionVariable<Nullable<Observer<any[]>>>(this, "_eventObserver", null);
            observable.remove(eventObserver);
        } else {
            Logger.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
        }
    }

    public override _executeEvent(_context: FlowGraphContext, _payload: any): boolean {
        return true;
    }

    public override serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        // Override the eventData in config to store typeName strings instead of RichType instances
        const serializedEventData: any = {};
        for (const key in this.config.eventData) {
            serializedEventData[key] = { type: this.config.eventData[key].type.typeName };
        }
        serializationObject.config.eventData = serializedEventData;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.ReceiveCustomEvent;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphReceiveCustomEventBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphReceiveCustomEventBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.ReceiveCustomEvent, FlowGraphReceiveCustomEventBlock);
}
