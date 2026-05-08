/** This file must only contain pure code and pure imports */

import { RichTypeBoolean } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * A block that evaluates a condition and activates one of two branches.
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
    public override getClassName(): string {
        return FlowGraphBlockNames.Branch;
    }
}


let _registered = false;
export function registerFlowGraphBranchBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass(FlowGraphBlockNames.Branch, FlowGraphBranchBlock);
}
