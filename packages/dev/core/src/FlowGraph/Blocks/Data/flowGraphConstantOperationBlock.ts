import type { FlowGraphContext } from "../../flowGraphContext";
import type { RichType } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock";
/**
 * @experimental
 * Block that outputs a value of type ResultT, resulting of an operation with no inputs.
 */
export class FlowGraphConstantOperationBlock<ResultT> extends FlowGraphCachedOperationBlock<ResultT> {
    constructor(
        richType: RichType<ResultT>,
        private _operation: () => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(richType, config);
    }

    /**
     * the operation performed by this block
     * @param _context the graph context
     * @returns the result of the operation
     */
    public override _doOperation(_context: FlowGraphContext): ResultT {
        return this._operation();
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public getClassName(): string {
        return this._className;
    }
}
