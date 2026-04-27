import { type RichType, getRichTypeByFlowGraphType } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { type FlowGraphContext } from "../../flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

/**
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
 * A block that sends a custom event.
 * To receive this event you need to use the ReceiveCustomEvent block.
 * This block has no output, but does have inputs based on the eventData from the configuration.
 * @see FlowGraphReceiveCustomEventBlock
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
            const entry = this.config.eventData[key];
            // Handle deserialized config where type may be a string typeName, a plain object
            // with a typeName property (from old JSON serialization), or a proper RichType instance.
            const typeKey = typeof entry.type === "string" ? entry.type : entry.type?.typeName;
            const richType = typeof entry.type?.serialize === "function" ? entry.type : getRichTypeByFlowGraphType(typeKey);
            entry.type = richType;
            this.registerDataInput(key, richType, entry.value);
        }
    }

    public _execute(context: FlowGraphContext): void {
        const eventId = this.config.eventId;
        // eventData is a map with the key being the data input's name, and value being the data input's value
        const eventData: any = {};
        for (const port of this.dataInputs) {
            eventData[port.name] = port.getValue(context);
        }

        context.configuration.coordinator.notifyCustomEvent(eventId, eventData);

        this.out._activateSignal(context);
    }

    public override serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        // Override the eventData in config to store typeName strings instead of RichType instances
        const serializedEventData: any = {};
        for (const key in this.config.eventData) {
            const entry = this.config.eventData[key];
            serializedEventData[key] = { type: entry.type.typeName };
            if (entry.value !== undefined) {
                serializedEventData[key].value = entry.value;
            }
        }
        serializationObject.config.eventData = serializedEventData;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.SendCustomEvent;
    }
}
RegisterClass(FlowGraphBlockNames.SendCustomEvent, FlowGraphSendCustomEventBlock);
