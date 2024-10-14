import type { Observer } from "../../../Misc/observable";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc/tools";
import type { RichType } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
/**
 * @experimental
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
    eventData: { [key: string]: { type: RichType<any>; value?: any } };
}

/**
 * @experimental
 * A block that receives a custom event. It saves the data sent in the eventData output.
 */
export class FlowGraphReceiveCustomEventBlock extends FlowGraphEventBlock {
    private _eventObserver: Nullable<Observer<any>>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphReceiveCustomEventBlockConfiguration
    ) {
        super(config);
        // for (let i = 0; i < this.config.eventData.length; i++) {
        //     const dataName = this.config.eventData[i];
        //     this.registerDataOutput(dataName, RichTypeAny);
        // }
        // use event data to register data outputs
        for (const key in this.config.eventData) {
            this.registerDataOutput(key, this.config.eventData[key].type, this.config.eventData[key].value);
        }
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        this._eventObserver = observable.add((eventData: any[]) => {
            for (let i = 0; i < eventData.length; i++) {
                this.dataOutputs[i].setValue(eventData[i], context);
            }
            this._execute(context);
        });
    }
    public _cancelPendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        if (observable) {
            observable.remove(this._eventObserver);
        } else {
            Tools.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.SendCustomEvent;
    }
}
RegisterClass(FlowGraphBlockNames.SendCustomEvent, FlowGraphReceiveCustomEventBlock);
