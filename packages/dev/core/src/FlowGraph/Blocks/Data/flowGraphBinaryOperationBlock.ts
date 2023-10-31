import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { RichType } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
/**
 * @experimental
 * The base block for all binary operation blocks. Receives an input of type
 * LeftT, one of type RightT, and outputs a value of type ResultT.
 */
export class FlowGraphBinaryOperationBlock<LeftT, RightT, ResultT> extends FlowGraphBlock {
    a: FlowGraphDataConnection<LeftT>;
    b: FlowGraphDataConnection<RightT>;
    val: FlowGraphDataConnection<ResultT>;

    constructor(
        leftRichType: RichType<LeftT>,
        rightRichType: RichType<RightT>,
        resultRichType: RichType<ResultT>,
        private _operation: (left: LeftT, right: RightT) => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(config);
        this.a = this._registerDataInput("a", leftRichType);
        this.b = this._registerDataInput("b", rightRichType);
        this.val = this._registerDataOutput("val", resultRichType);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.val.setValue(this._operation(this.a.getValue(_context), this.b.getValue(_context)), _context);
    }

    public getClassName(): string {
        return this._className;
    }
}
