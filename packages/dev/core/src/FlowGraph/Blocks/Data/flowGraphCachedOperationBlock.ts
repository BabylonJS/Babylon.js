import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";

const CACHE_NAME = "cachedOperationValue";
const CACHE_EXEC_ID_NAME = "cachedExecutionId";

/**
 * @experimental
 */
export abstract class FlowGraphCachedOperationBlock<OutputT> extends FlowGraphBlock {
    /**
     * The output of the operation
     */
    public readonly value: FlowGraphDataConnection<OutputT>;

    constructor(outputRichType: RichType<OutputT>, config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.value = this.registerDataOutput("value", outputRichType);
    }

    /**
     * @internal
     * Operation to realize
     * @param context the graph context
     */
    public abstract _doOperation(context: FlowGraphContext): OutputT;

    public _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, CACHE_EXEC_ID_NAME);
        const cachedValue = context._getExecutionVariable(this, CACHE_NAME);
        if (cachedValue !== undefined && cachedExecutionId === context.executionId) {
            this.value.setValue(cachedValue, context);
        } else {
            const calculatedValue = this._doOperation(context);
            context._setExecutionVariable(this, CACHE_NAME, calculatedValue);
            context._setExecutionVariable(this, CACHE_EXEC_ID_NAME, context.executionId);
            this.value.setValue(calculatedValue, context);
        }
    }
}
