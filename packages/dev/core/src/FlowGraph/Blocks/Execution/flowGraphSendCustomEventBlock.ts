import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

export interface IFlowGraphSendCustomEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    eventId: string;
    eventData: string[];
}
/**
 * @experimental
 */
export class FlowGraphSendCustomEventBlock extends FlowGraphWithOnDoneExecutionBlock {
    public eventDatas: FlowGraphDataConnection<any>[] = [];
    private _eventId: string;
    private _eventDatas: string[];
    public constructor(config: IFlowGraphSendCustomEventBlockConfiguration) {
        super(config);
        this._eventId = config.eventId;
        this._eventDatas = config.eventData;
    }

    public configure(): void {
        this.eventDatas = [];
        for (let i = 0; i < this._eventDatas.length; i++) {
            const dataName = this._eventDatas[i];
            const port = this._registerDataInput(dataName, RichTypeAny);
            this.eventDatas.push(port);
        }
    }

    public _execute(context: FlowGraphContext): void {
        const eventId = this._eventId;
        const eventDatas = this.eventDatas.map((port) => port.getValue(context));

        context.configuration.eventCoordinator.notifyCustomEvent(eventId, eventDatas);

        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphSendCustomEventBlock.ClassName;
    }

    public static ClassName = "FGSendCustomEventBlock";
}
RegisterClass("FGSendCustomEventBlock", FlowGraphSendCustomEventBlock);
