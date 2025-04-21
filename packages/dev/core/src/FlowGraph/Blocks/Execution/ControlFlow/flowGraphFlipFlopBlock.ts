import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

/**
 * Configuration for the flip flop block.
 */
export interface IFlowGraphFlipFlopBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The starting value of the flip flop switch
     */
    startValue?: boolean;
}

/**
 * This block flip flops between two outputs.
 */
export class FlowGraphFlipFlopBlock extends FlowGraphExecutionBlock {
    /**
     * Output connection: The signal to execute when the variable is on.
     */
    public readonly onOn: FlowGraphSignalConnection;
    /**
     * Output connection: The signal to execute when the variable is off.
     */
    public readonly onOff: FlowGraphSignalConnection;
    /**
     * Output connection: If the variable is on.
     */
    public readonly value: FlowGraphDataConnection<boolean>;

    constructor(config?: IFlowGraphFlipFlopBlockConfiguration) {
        super(config);

        this.onOn = this._registerSignalOutput("onOn");
        this.onOff = this._registerSignalOutput("onOff");
        this.value = this.registerDataOutput("value", RichTypeBoolean);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        let value = context._getExecutionVariable(this, "value", typeof this.config?.startValue === "boolean" ? !this.config.startValue : false);

        value = !value;
        context._setExecutionVariable(this, "value", value);
        this.value.setValue(value, context);
        if (value) {
            this.onOn._activateSignal(context);
        } else {
            this.onOff._activateSignal(context);
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.FlipFlop;
    }
}
RegisterClass(FlowGraphBlockNames.FlipFlop, FlowGraphFlipFlopBlock);
