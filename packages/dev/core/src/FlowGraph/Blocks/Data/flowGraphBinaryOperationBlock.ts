import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock";
/**
 * @experimental
 * The base block for all binary operation blocks. Receives an input of type
 * LeftT, one of type RightT, and outputs a value of type ResultT.
 */
export class FlowGraphBinaryOperationBlock<LeftT, RightT, ResultT> extends FlowGraphCachedOperationBlock<ResultT> {
    leftInput: FlowGraphDataConnection<LeftT>;
    rightInput: FlowGraphDataConnection<RightT>;

    constructor(
        leftRichType: RichType<LeftT>,
        rightRichType: RichType<RightT>,
        resultRichType: RichType<ResultT>,
        private _operation: (left: LeftT, right: RightT) => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(resultRichType, config);
        this.leftInput = this._registerDataInput("leftInput", leftRichType);
        this.rightInput = this._registerDataInput("rightInput", rightRichType);
    }

    public override _doOperation(context: FlowGraphContext): ResultT {
        return this._operation(this.leftInput.getValue(context), this.rightInput.getValue(context));
    }

    public getClassName(): string {
        return this._className;
    }
}
