import { RichTypeBoolean } from "../../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";

/**
 * @experimental
 * A block that evaluates a condition and executes one of two branches.
 */
export class FlowGraphBranchBlock extends FlowGraphExecutionBlock {
    /**
     * Input connection: The condition to evaluate.
     */
    public readonly condition: FlowGraphDataConnection<boolean>;
    /**
     * Output connection: The branch to execute if the condition is true.
     */
    public readonly onTrue: FlowGraphSignalConnection;
    /**
     * Output connection: The branch to execute if the condition is false.
     */
    public readonly onFalse: FlowGraphSignalConnection;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.condition = this.registerDataInput("condition", RichTypeBoolean);

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

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGBranchBlock";
    }
}
RegisterClass("FGBranchBlock", FlowGraphBranchBlock);
