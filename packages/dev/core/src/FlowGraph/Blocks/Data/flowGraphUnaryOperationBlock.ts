import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { RichType } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock";

/**
 * @experimental
 * The base block for all unary operation blocks. Receives an input of type InputT, and outputs a value of type ResultT.
 */
export class FlowGraphUnaryOperationBlock<InputT, ResultT> extends FlowGraphCachedOperationBlock<ResultT> {
    /**
     * the input of this block
     */
    a: FlowGraphDataConnection<InputT>;

    constructor(
        inputRichType: RichType<InputT>,
        resultRichType: RichType<ResultT>,
        private _operation: (input: InputT) => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(resultRichType, config);
        this.a = this.registerDataInput("a", inputRichType);
    }

    /**
     * the operation performed by this block
     * @param context the graph context
     * @returns the result of the operation
     */
    public override _doOperation(context: FlowGraphContext): ResultT {
        return this._operation(this.a.getValue(context));
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public getClassName(): string {
        return this._className;
    }
}
