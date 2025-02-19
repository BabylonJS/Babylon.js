import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

export type CodeExecutionFunction = (value: any, context: FlowGraphContext) => any;

/**
 * This block takes in a function that is defined OUTSIDE of the flow graph and executes it.
 * The function can be a normal function or an async function.
 * The function's arguments will be the value of the input connection as the first variable, and the flow graph context as the second variable.
 */
export class FlowGraphCodeExecutionBlock extends FlowGraphBlock {
    /**
     * Input connection: The function to execute.
     */
    public readonly executionFunction: FlowGraphDataConnection<CodeExecutionFunction>;

    /**
     * Input connection: The value to pass to the function.
     */
    public readonly value: FlowGraphDataConnection<any>;

    /**
     * Output connection: The result of the function.
     */
    public readonly result: FlowGraphDataConnection<any>;

    /**
     * Construct a FlowGraphCodeExecutionBlock.
     * @param config construction parameters
     */
    constructor(public override config: IFlowGraphBlockConfiguration) {
        super(config);

        this.executionFunction = this.registerDataInput("function", RichTypeAny);
        this.value = this.registerDataInput("value", RichTypeAny);
        this.result = this.registerDataOutput("result", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        const func = this.executionFunction.getValue(context);
        const value = this.value.getValue(context);
        if (func) {
            this.result.setValue(func(value, context), context);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CodeExecution;
    }
}
