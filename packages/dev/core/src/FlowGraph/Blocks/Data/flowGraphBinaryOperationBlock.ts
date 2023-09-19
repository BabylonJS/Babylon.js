import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { RichType } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";

/**
 * @experimental
 * The base block for all binary operation blocks. Receives an input of type
 * LeftT, one of type RightT, and outputs a value of type ResultT.
 */
export class FlowGraphBinaryOperationBlock<LeftT, RightT, ResultT> extends FlowGraphBlock {
    leftInput: FlowGraphDataConnection<LeftT>;
    rightInput: FlowGraphDataConnection<RightT>;
    output: FlowGraphDataConnection<ResultT>;

    constructor(leftRichType: RichType<LeftT>, rightRichType: RichType<RightT>, resultRichType: RichType<ResultT>, private _operation: (left: LeftT, right: RightT) => ResultT) {
        super();
        this.leftInput = this._registerDataInput("leftInput", leftRichType);
        this.rightInput = this._registerDataInput("rightInput", rightRichType);
        this.output = this._registerDataOutput("Output", resultRichType);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.output.value = this._operation(this.leftInput.getValue(_context), this.rightInput.getValue(_context));
    }
}
