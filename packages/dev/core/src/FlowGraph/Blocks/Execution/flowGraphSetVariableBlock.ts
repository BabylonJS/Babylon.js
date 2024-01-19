import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "core/Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

/**
 * @experimental
 * The variable block configuration.
 */
export interface IFlowGraphSetVariableBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The name of the variable to set.
     */
    variableName: string;
}

/**
 * Block to set a variable.
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The value to set on the variable.
     */
    public readonly input: FlowGraphDataConnection<T>;

    constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphSetVariableBlockConfiguration
    ) {
        super(config);

        this.input = this.registerDataInput(config.variableName, RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const variableNameValue = this.config.variableName;
        const inputValue = this.input.getValue(context);
        context.setVariable(variableNameValue, inputValue);
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphSetVariableBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSetVariableBlock";
}
RegisterClass(FlowGraphSetVariableBlock.ClassName, FlowGraphSetVariableBlock);
