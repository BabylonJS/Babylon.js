import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint, FlowGraphSignalConnectionPoint } from "../../flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphLogBlock extends FlowGraphExecutionBlock {
    /**
     * The message to log.
     */
    public readonly message: FlowGraphDataConnectionPoint<any>;
    /**
     * Block to execute after the message has been logged.
     */
    public readonly onDone: FlowGraphSignalConnectionPoint;

    constructor(graph: FlowGraph) {
        super(graph);
        this.message = this._registerDataInput("message", "Hello world");

        this.onDone = this._registerSignalOutput("flowOut");
    }
    /**
     * @internal
     */
    public _execute(): void {
        const messageValue = this.message.value;
        console.log(messageValue);
        // activate the output flow block
        this.onDone._activateSignal();
    }
}
