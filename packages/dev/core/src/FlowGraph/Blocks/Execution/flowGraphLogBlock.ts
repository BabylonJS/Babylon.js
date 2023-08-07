import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphLogBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The message to log.
     */
    public readonly message: FlowGraphDataConnection<any>;
    /**
     * Sets the message to log.
     */
    public readonly setMessage: (value: any) => void;

    public constructor(graph: FlowGraph) {
        super(graph);
        const messageRegister = this._registerDataInput("message", "Hello world");
        this.message = messageRegister.connectionPoint;
        this.setMessage = messageRegister.valueSetter;
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
