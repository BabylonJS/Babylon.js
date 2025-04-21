import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

/**
 * The configuration of the FlowGraphGetVariableBlock.
 */
export interface IFlowGraphGetVariableBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The name of the variable to get.
     */
    variable: string;

    /**
     * The initial value of the variable.
     */
    initialValue?: T;
}

/**
 * A block that gets the value of a variable.
 * Variables are an stored in the context of the flow graph.
 */
export class FlowGraphGetVariableBlock<T> extends FlowGraphBlock {
    /**
     * Output connection: The value of the variable.
     */
    public readonly value: FlowGraphDataConnection<T>;

    /**
     * Construct a FlowGraphGetVariableBlock.
     * @param config construction parameters
     */
    constructor(public override config: IFlowGraphGetVariableBlockConfiguration<T>) {
        super(config);

        // The output connection has to have the name of the variable.
        this.value = this.registerDataOutput("value", RichTypeAny, config.initialValue);
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        const variableNameValue = this.config.variable;
        if (context.hasVariable(variableNameValue)) {
            this.value.setValue(context.getVariable(variableNameValue), context);
        }
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.variable = this.config.variable;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.GetVariable;
    }
}

RegisterClass(FlowGraphBlockNames.GetVariable, FlowGraphGetVariableBlock);
