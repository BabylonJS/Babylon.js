import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";

const CACHE_NAME = "cachedValue";

export abstract class FlowGraphCachedOperationBlock<OutputT> extends FlowGraphBlock {
    public readonly output: FlowGraphDataConnection<OutputT>;

    constructor(outputRichType: RichType<OutputT>, config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.output = this._registerDataOutput("output", outputRichType);
    }
    public abstract _doOperation(context: FlowGraphContext): OutputT;

    public _updateOutputs(context: FlowGraphContext) {
        const cachedValue = context._getExecutionVariable(this, CACHE_NAME + context.executionId);
        if (cachedValue !== undefined) {
            this.output.setValue(cachedValue, context);
            return;
        }
        const calculatedValue = this._doOperation(context);
        context._setExecutionVariable(this, CACHE_NAME + context.executionId, calculatedValue);
        this.output.setValue(calculatedValue, context);
    }
}
