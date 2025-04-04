import type { Nullable } from "../../../types";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { RichType } from "../../flowGraphRichTypes";
import { RichTypeBoolean } from "../../flowGraphRichTypes";

const CacheName = "cachedOperationValue";
const CacheExecIdName = "cachedExecutionId";

/**
 * A block that will cache the result of an operation and deliver it as an output.
 */
export abstract class FlowGraphCachedOperationBlock<OutputT> extends FlowGraphBlock {
    /**
     * The output of the operation
     */
    public readonly value: FlowGraphDataConnection<OutputT>;

    /**
     * Output connection: Whether the value is valid.
     */
    public readonly isValid: FlowGraphDataConnection<boolean>;

    constructor(outputRichType: RichType<OutputT>, config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.value = this.registerDataOutput("value", outputRichType);
        this.isValid = this.registerDataOutput("isValid", RichTypeBoolean);
    }

    /**
     * @internal
     * Operation to realize
     * @param context the graph context
     */
    public abstract _doOperation(context: FlowGraphContext): OutputT | undefined;

    public override _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, CacheExecIdName, -1);
        const cachedValue = context._getExecutionVariable<Nullable<OutputT>>(this, CacheName, null);
        if (cachedValue !== undefined && cachedValue !== null && cachedExecutionId === context.executionId) {
            this.isValid.setValue(true, context);
            this.value.setValue(cachedValue, context);
        } else {
            try {
                const calculatedValue = this._doOperation(context);
                if (calculatedValue === undefined || calculatedValue === null) {
                    this.isValid.setValue(false, context);
                    return;
                }
                context._setExecutionVariable(this, CacheName, calculatedValue);
                context._setExecutionVariable(this, CacheExecIdName, context.executionId);
                this.value.setValue(calculatedValue, context);
                this.isValid.setValue(true, context);
            } catch (e) {
                this.isValid.setValue(false, context);
            }
        }
    }
}
