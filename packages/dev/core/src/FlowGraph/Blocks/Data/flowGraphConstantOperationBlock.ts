import type { FlowGraphContext } from "../../flowGraphContext";
import type { RichType } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock";
/**
 * Block that outputs a value of type ResultT, resulting of an operation with no inputs.
 * This block is being extended by some math operations and should not be used directly.
 * @internal
 */
export class FlowGraphConstantOperationBlock<ResultT> extends FlowGraphCachedOperationBlock<ResultT> {
    constructor(
        richType: RichType<ResultT>,
        private _operation: (context: FlowGraphContext) => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(richType, config);
    }

    /**
     * the operation performed by this block
     * @param context the graph context
     * @returns the result of the operation
     */
    public override _doOperation(context: FlowGraphContext): ResultT {
        return this._operation(context);
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return this._className;
    }
}
