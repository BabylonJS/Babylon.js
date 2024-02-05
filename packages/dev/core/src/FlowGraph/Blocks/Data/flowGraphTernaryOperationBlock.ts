import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock";
/**
 * @experimental
 * The base block for all ternary operation blocks.
 */
export class FlowGraphTernaryOperationBlock<T1, T2, T3, ResultT> extends FlowGraphCachedOperationBlock<ResultT> {
    /**
     * First input of this block
     */
    a: FlowGraphDataConnection<T1>;
    /**
     * Second input of this block
     */
    b: FlowGraphDataConnection<T2>;
    /**
     * Third input of this block
     */
    c: FlowGraphDataConnection<T3>;

    constructor(
        t1Type: RichType<T1>,
        t2Type: RichType<T2>,
        t3Type: RichType<T3>,
        resultRichType: RichType<ResultT>,
        private _operation: (a: T1, b: T2, c: T3) => ResultT,
        private _className: string,
        config?: IFlowGraphBlockConfiguration
    ) {
        super(resultRichType, config);
        this.a = this.registerDataInput("a", t1Type);
        this.b = this.registerDataInput("b", t2Type);
        this.c = this.registerDataInput("c", t3Type);
    }

    /**
     * the operation performed by this block
     * @param context the graph context
     * @returns the result of the operation
     */
    public override _doOperation(context: FlowGraphContext): ResultT {
        return this._operation(this.a.getValue(context), this.b.getValue(context), this.c.getValue(context));
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public getClassName(): string {
        return this._className;
    }
}
