import type { RichType } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

/**
 * @experimental
 * Parameters used to create a FlowGraphSendCustomEventBlock.
 */
export interface IFlowGraphSendCustomEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The id of the event to send.
     * Note - in the glTF specs this is an index to the event array (i.e. - a number)
     */
    eventId: string;
    /**
     * The names of the data inputs for that event.
     */
    eventData: { [key: string]: { type: RichType<any>; value?: any } };
}
/**
 * @experimental
 */
export class FlowGraphSendCustomEventBlock extends FlowGraphExecutionBlockWithOutSignal {
    public constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphSendCustomEventBlockConfiguration
    ) {
        super(config);
        for (const key in this.config.eventData) {
            this.registerDataInput(key, this.config.eventData[key].type, this.config.eventData[key].value);
        }
    }

    public _execute(context: FlowGraphContext): void {
        const eventId = this.config.eventId;
        const eventData = this.dataInputs.map((port) => port.getValue(context));

        context.configuration.coordinator.notifyCustomEvent(eventId, eventData);

        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.ReceiveCustomEvent;
    }
}
RegisterClass(FlowGraphBlockNames.ReceiveCustomEvent, FlowGraphSendCustomEventBlock);
