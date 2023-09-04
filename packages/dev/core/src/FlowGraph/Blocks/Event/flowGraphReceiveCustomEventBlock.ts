import type { Observer } from "../../../Misc/observable";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import type { FlowGraphCustomEvent } from "../../flowGraphCustomEvent";
import type { Nullable } from "../../../types";
import { Tools } from "../../../Misc";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";

export interface IFlowGraphReceiveCustomEventBlockParameters {
    eventId: string;
}

export class FlowGraphReceiveCustomEventBlock extends FlowGraphEventBlock {
    private _params: IFlowGraphReceiveCustomEventBlockParameters;
    private _eventObserver: Nullable<Observer<FlowGraphCustomEvent>>;

    /**
     * Output connection: The data sent with the event.
     */
    public eventData: FlowGraphDataConnection<any>;

    constructor(params: IFlowGraphReceiveCustomEventBlockParameters) {
        super();
        this._params = params;
        this.eventData = this._registerDataOutput("eventData", RichTypeAny);
    }
    public _preparePendingTasks(context: FlowGraphContext): void {
        const observable = context.graphVariables.eventCoordinator.getCustomEventObservable(this._params.eventId);
        this._eventObserver = observable.add((event) => {
            this.eventData.value = event.data;
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
