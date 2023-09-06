import type { Observer } from "../../../Misc/observable";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphCustomEvent } from "../../flowGraphCustomEvent";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc/tools";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";

/**
 * @experimental
 * Parameters used to create a FlowGraphReceiveCustomEventBlock.
 */
export interface IFlowGraphReceiveCustomEventBlockParameters {
    eventId: string;
}

/**
 * @experimental
 * A block that receives a custom event. It saves the data sent in the eventData output.
 */
export class FlowGraphReceiveCustomEventBlock extends FlowGraphEventBlock {
    private _eventObserver: Nullable<Observer<FlowGraphCustomEvent>>;

    /**
     * Output connection: The data sent with the event.
     */
    public eventData: FlowGraphDataConnection<any>;

    constructor(private _params: IFlowGraphReceiveCustomEventBlockParameters) {
        super();
        this.eventData = this._registerDataOutput("eventData", RichTypeAny);
    }
    public _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.graphVariables.eventCoordinator.getCustomEventObservable(this._params.eventId);
        this._eventObserver = observable.add((event) => {
            this.eventData.value = event;
            this._execute(context);
        });
    }
    public _cancelPendingTasks(context: FlowGraphContext): void {
        const observable = context.graphVariables.eventCoordinator.getCustomEventObservable(this._params.eventId);
        if (observable) {
            observable.remove(this._eventObserver);
        } else {
            Tools.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this._params.eventId}`);
        }
    }
}
