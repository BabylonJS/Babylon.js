import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

export abstract class FlowGraphWithOnDoneExecutionBlock extends FlowGraphExecutionBlock {
    public readonly onDone: FlowGraphSignalConnection;

    protected constructor() {
        super();
        this.onDone = this._registerSignalOutput("onDone");
    }
}
