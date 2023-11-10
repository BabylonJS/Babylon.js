import type { Observer } from "../../../Misc/observable";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc/tools";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * @experimental
 * Parameters used to create a FlowGraphReceiveCustomEventBlock.
 */
export interface IFlowGraphReceiveCustomEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    eventId: string;
}

/**
 * @experimental
 * A block that receives a custom event. It saves the data sent in the eventData output.
 */
export class FlowGraphReceiveCustomEventBlock extends FlowGraphEventBlock {
    private _eventObserver: Nullable<Observer<any>>;

    /**
     * Output connection: The data sent with the event.
     */
    public eventData: FlowGraphDataConnection<any>;

    constructor(public config: IFlowGraphReceiveCustomEventBlockConfiguration) {
        super(config);
        this.eventData = this._registerDataOutput("eventData", RichTypeAny);
    }
    public _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        this._eventObserver = observable.add((eventData) => {
            this.eventData.setValue(eventData, context);
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

    public getClassName(): string {
        return "FGReceiveCustomEventBlock";
    }
}
RegisterClass("FGReceiveCustomEventBlock", FlowGraphReceiveCustomEventBlock);
