import { RichTypeAny, RichTypeString } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import type { FlowGraphContext } from "../../flowGraphContext";

/**
 * @experimental
 */
export class FlowGraphSendCustomEventBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The id of the event to send.
     */
    public readonly eventId: FlowGraphDataConnection<string>;
    /**
     * Input connection: The data to send with the event.
     */
    public readonly eventData: FlowGraphDataConnection<any>;

    public constructor() {
        super();

        this.eventId = this._registerDataInput("eventId", RichTypeString);
        this.eventData = this._registerDataInput("eventData", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const eventId = this.eventId.getValue(context);
        const eventData = this.eventData.getValue(context);

        context.graphVariables.eventCoordinator.notifyCustomEvent(eventId, eventData);

        this.onDone._activateSignal(context);
    }
}
