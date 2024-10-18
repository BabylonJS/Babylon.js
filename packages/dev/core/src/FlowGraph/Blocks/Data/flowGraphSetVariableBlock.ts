import { RegisterClass } from "core/Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";

/**
 * @experimental
 * The configuration of the FlowGraphGetVariableBlock.
 */
export interface IFlowGraphSetVariableBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The name of the variable to set.
     */
    variable: string;
}

export class FlowGraphSetVariableBlock<T> extends FlowGraphExecutionBlockWithOutSignal {
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

        this.value = this.registerDataInput("value", RichTypeAny);
    }

    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        context.setVariable(this.config.variable, this.value.getValue(context));
        this.out._activateSignal(context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.SetVariable;
    }

    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.variable = this.config.variable;
        serializationObject.config.type = this.config.type;
    }
}

RegisterClass(FlowGraphBlockNames.SetVariable, FlowGraphSetVariableBlock);
