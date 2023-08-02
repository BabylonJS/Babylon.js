import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphDataConnectionPoint";
import type { AnyType } from "../../types";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class FlowGraphLogBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The message to log.
     */
    public readonly message: FlowGraphDataConnectionPoint<AnyType>;

    constructor(graph: FlowGraph) {
        super(graph);
        this.message = this._registerDataInput("message", "Hello world").connectionPoint;
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
