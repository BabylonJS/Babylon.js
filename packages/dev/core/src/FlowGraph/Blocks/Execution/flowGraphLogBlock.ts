import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphLogBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The message to log.
     */
    public readonly message: FlowGraphDataConnection<any>;

    public constructor(graph: FlowGraph) {
        super(graph);
        this.message = this._registerDataInput("message", "Hello world");
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
