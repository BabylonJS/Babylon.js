import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";

export interface IFlowGraphConditionalBlockParams {
    graph: FlowGraph;
}
/**
 * @experimental
 * A block that evaluates a condition and executes one of two branches.
 */
export class FlowGraphConditionalBlock extends FlowGraphExecutionBlock {
    public readonly condition: FlowGraphDataConnection<boolean>;
    public readonly onTrue: FlowGraphSignalConnection;
    public readonly onFalse: FlowGraphSignalConnection;

    constructor(params: IFlowGraphConditionalBlockParams) {
        super(params.graph);

        this.condition = this._registerDataInput("condition", false);

        this.onTrue = this._registerSignalOutput("onTrue");
        this.onFalse = this._registerSignalOutput("onFalse");
    }

    public _execute(): void {
        if (this.condition.value) {
            this.onTrue._activateSignal();
        } else {
            this.onFalse._activateSignal();
        }
    }
}
