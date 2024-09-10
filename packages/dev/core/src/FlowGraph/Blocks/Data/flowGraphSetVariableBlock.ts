import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";

/**
 * @experimental
 * The configuration of the FlowGraphGetVariableBlock.
 */
export interface IFlowGraphSetVariableBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The name of the variable to get.
     */
    variable: string;
}

export class FlowGraphSetVariableBlock<T> extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The class name of this block.
     */
    public static readonly ClassName = "FGSetVariableBlock";
    /**
     * Input connection: The value to set.
     */
    public readonly value: FlowGraphDataConnection<T>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphSetVariableBlockConfiguration
    ) {
        super(config);

        this.value = this.registerDataInput("value", config.type);
    }

    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        context.setVariable(this.config.variable, this.value.getValue(context));
        this.out._activateSignal(context);
    }

    public override getClassName(): string {
        return FlowGraphSetVariableBlock.ClassName;
    }

    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.variable = this.config.variable;
        serializationObject.config.type = this.config.type;
    }
}
