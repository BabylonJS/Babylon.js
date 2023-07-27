import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint, FlowGraphSignalConnectionPoint } from "../../flowGraphConnectionPoint";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";

/**
 * @experimental
 * Block that logs a message to the console.
 */
export class LogBlock extends FlowGraphExecutionBlock {
    public message: FlowGraphDataConnectionPoint<any>;
    public flowOut: FlowGraphSignalConnectionPoint;

    constructor(graph: FlowGraph) {
        super(graph);
        this.message = this._registerDataInput("message", "Hello world");

        this.flowOut = this._registerSignalOutput("flowOut");
    }
    public execute(): void {
        const messageValue = this.message.value;
        console.log(messageValue);
        // activate the output flow block
        this.flowOut.activateSignal();
    }
}
