import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphLogBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The message to log.
     */
    public readonly message: FlowGraphDataConnection<any>;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.message = this._registerDataInput("message", RichTypeAny);
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        const messageValue = this.message.getValue(context);
        console.log(messageValue);
        // activate the output flow block
        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGLogBlock";
    }
}
RegisterClass("FGLogBlock", FlowGraphLogBlock);
