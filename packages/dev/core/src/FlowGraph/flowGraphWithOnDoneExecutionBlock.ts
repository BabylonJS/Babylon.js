import type { FlowGraph } from "./flowGraph";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnectionPoint } from "./flowGraphSignalConnectionPoint";

export abstract class FlowGraphWithOnDoneExecutionBlock extends FlowGraphExecutionBlock {
    public readonly onDone: FlowGraphSignalConnectionPoint;

    constructor(graph: FlowGraph) {
        super(graph);
        this.onDone = this._registerSignalOutput("onDone");
    }
}
