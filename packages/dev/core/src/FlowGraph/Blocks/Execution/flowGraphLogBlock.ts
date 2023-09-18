import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RichTypeAny } from "../../flowGraphRichTypes";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphLogBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The message to log.
     */
    public readonly message: FlowGraphDataConnection<any>;

    public constructor() {
        super();
        this.message = this._registerDataInput("message", RichTypeAny);
        this.message.value = "Hello World!";
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
}
