import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";

const CACHE_NAME = "cachedOperationValue";
const EXEC_ID_NAME = "executionId";

/**
 * @experimental
 */
export abstract class FlowGraphCachedOperationBlock<OutputT> extends FlowGraphBlock {
    public readonly output: FlowGraphDataConnection<OutputT>;

    constructor(outputRichType: RichType<OutputT>, config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.output = this._registerDataOutput("output", outputRichType);
    }
    public abstract _doOperation(context: FlowGraphContext): OutputT;

    public _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, EXEC_ID_NAME);
        const cachedValue = context._getExecutionVariable(this, CACHE_NAME);
        if (cachedValue !== undefined && cachedExecutionId === context.executionId) {
            this.output.setValue(cachedValue, context);
        } else {
            const calculatedValue = this._doOperation(context);
            context._setExecutionVariable(this, CACHE_NAME, calculatedValue);
            context._setExecutionVariable(this, EXEC_ID_NAME, context.executionId);
            this.output.setValue(calculatedValue, context);
        }
    }
}
