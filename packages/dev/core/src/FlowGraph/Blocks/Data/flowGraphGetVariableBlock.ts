import type { FlowGraphContext } from "../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny } from "../../flowGraphRichTypes";
import { RegisterClass } from "../../../Misc/typeStore";

/**
 * @experimental
 * The configuration of the FlowGraphGetVariableBlock.
 */
export interface IFlowGraphGetVariableBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The name of the variable to get.
     */
    variable: string;
}

/**
 * A block that gets the value of a variable.
 * @experimental
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
    constructor(public override config: IFlowGraphGetVariableBlockConfiguration) {
        super(config);

        // The output connection has to have the name of the variable.
        this.value = this.registerDataOutput(config.variable, RichTypeAny);
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
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphGetVariableBlock.ClassName;
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.variable = this.config.variable;
    }

    /**
     * Class name of the block.
     */
    public static ClassName = "FGGetVariableBlock";
}
RegisterClass(FlowGraphGetVariableBlock.ClassName, FlowGraphGetVariableBlock);
