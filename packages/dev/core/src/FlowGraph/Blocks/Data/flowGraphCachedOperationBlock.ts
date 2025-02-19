import type { Nullable } from "../../../types";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";

const cacheName = "cachedOperationValue";
const cacheExecIdName = "cachedExecutionId";

/**
 * A block that will cache the result of an operation and deliver it as an output.
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

    public override _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, cacheExecIdName, -1);
        const cachedValue = context._getExecutionVariable<Nullable<OutputT>>(this, cacheName, null);
        if (cachedValue !== undefined && cachedValue !== null && cachedExecutionId === context.executionId) {
            this.value.setValue(cachedValue, context);
        } else {
            const calculatedValue = this._doOperation(context);
            context._setExecutionVariable(this, cacheName, calculatedValue);
            context._setExecutionVariable(this, cacheExecIdName, context.executionId);
            this.value.setValue(calculatedValue, context);
        }
    }
}
