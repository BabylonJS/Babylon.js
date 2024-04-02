import type { Observer } from "../../../Misc/observable";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc/tools";
import { RichTypeAny } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * @experimental
 * Parameters used to create a FlowGraphReceiveCustomEventBlock.
 */
export interface IFlowGraphReceiveCustomEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The id of the event to receive.
     */
    eventId: string;
    /**
     * The names of the data outputs for that event. Should be in the same order as the event data in
     * SendCustomEvent
     */
    eventData: string[];
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
        public config: IFlowGraphReceiveCustomEventBlockConfiguration
    ) {
        super(config);
        for (let i = 0; i < this.config.eventData.length; i++) {
            const dataName = this.config.eventData[i];
            this.registerDataOutput(dataName, RichTypeAny);
        }
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        this._eventObserver = observable.add((eventDatas: any[]) => {
            for (let i = 0; i < eventDatas.length; i++) {
                this.dataOutputs[i].setValue(eventDatas[i], context);
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
    public getClassName(): string {
        return FlowGraphReceiveCustomEventBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGReceiveCustomEventBlock";

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    public serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.eventId = this.config.eventId;
        serializationObject.eventData = this.config.eventData;
    }
}
RegisterClass(FlowGraphReceiveCustomEventBlock.ClassName, FlowGraphReceiveCustomEventBlock);
