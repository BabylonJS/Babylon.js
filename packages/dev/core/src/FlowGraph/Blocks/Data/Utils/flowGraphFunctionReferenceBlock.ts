import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeString } from "core/FlowGraph/flowGraphRichTypes";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

/**
 * A flow graph block that takes a function name, an object and an optional context as inputs and calls the function on the object.
 */
export class FlowGraphFunctionReferenceBlock extends FlowGraphBlock {
    /**
     * Input: The function name.
     */
    public readonly functionName: FlowGraphDataConnection<string>;
    /**
     * Input: The object to get the function from.
     * This can be a constructed class or a collection of stand-alone functions.
     */
    public readonly object: FlowGraphDataConnection<any>;
    /**
     * Input: The context to call the function with.
     * This is optional. If not provided, the function will be bound to null.
     */
    public readonly context: FlowGraphDataConnection<any>;
    /**
     * Output: The function referenced by functionName from the object, bound to the context.
     */
    public readonly output: FlowGraphDataConnection<Function>;

    constructor(
        /**
         * the configuration of the block
         */
        config?: IFlowGraphBlockConfiguration
    ) {
        super(config);
        this.functionName = this.registerDataInput("functionName", RichTypeString);
        this.object = this.registerDataInput("object", RichTypeAny);
        this.context = this.registerDataInput("context", RichTypeAny, null);
        this.output = this.registerDataOutput("output", RichTypeAny);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        const functionName = this.functionName.getValue(context);
        const object = this.object.getValue(context);
        const contextValue = this.context.getValue(context);
        if (object && functionName) {
            const func = object[functionName];
            if (func && typeof func === "function") {
                this.output.setValue(func.bind(contextValue), context);
            }
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.FunctionReference;
    }
}

RegisterClass(FlowGraphBlockNames.FunctionReference, FlowGraphFunctionReferenceBlock);
