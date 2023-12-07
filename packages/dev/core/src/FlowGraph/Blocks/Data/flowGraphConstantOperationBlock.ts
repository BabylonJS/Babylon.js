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

    public override _doOperation(_context: FlowGraphContext): ResultT {
        return this._operation();
    }

    public getClassName(): string {
        return this._className;
    }
}
