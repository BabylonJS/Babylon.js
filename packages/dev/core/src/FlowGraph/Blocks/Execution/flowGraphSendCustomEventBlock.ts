import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

/**
 * @experimental
 * Parameters used to create a FlowGraphSendCustomEventBlock.
 */
export interface IFlowGraphSendCustomEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    eventId: string;
    eventData: string[];
}
/**
 * @experimental
 */
export class FlowGraphSendCustomEventBlock extends FlowGraphWithOnDoneExecutionBlock {
    public constructor(public config: IFlowGraphSendCustomEventBlockConfiguration) {
        super(config);
    }

    public configure(): void {
        super.configure();
        for (let i = 0; i < this.config.eventData.length; i++) {
            const dataName = this.config.eventData[i];
            this._registerDataInput(dataName, RichTypeAny);
        }
    }

    public _execute(context: FlowGraphContext): void {
        const eventId = this.config.eventId;
        const eventDatas = this.dataInputs.map((port) => port.getValue(context));

        context.configuration.eventCoordinator.notifyCustomEvent(eventId, eventDatas);

        this.out._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphSendCustomEventBlock.ClassName;
    }

    public static ClassName = "FGSendCustomEventBlock";
}
RegisterClass("FGSendCustomEventBlock", FlowGraphSendCustomEventBlock);
