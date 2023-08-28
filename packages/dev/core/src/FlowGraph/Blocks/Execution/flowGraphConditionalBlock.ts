import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";

/**
 * @experimental
 * A block that evaluates a condition and executes one of two branches.
 */
export class FlowGraphConditionalBlock extends FlowGraphExecutionBlock {
    public readonly condition: FlowGraphDataConnection<boolean>;
    public readonly onTrue: FlowGraphSignalConnection;
    public readonly onFalse: FlowGraphSignalConnection;

    constructor() {
        super();

        this.condition = this._registerDataInput("condition", false);

        this.onTrue = this._registerSignalOutput("onTrue");
        this.onFalse = this._registerSignalOutput("onFalse");
    }

    public _execute(context: FlowGraphContext): void {
        if (this.condition.getValue(context)) {
            this.onTrue._activateSignal(context);
        } else {
            this.onFalse._activateSignal(context);
        }
    }
}
