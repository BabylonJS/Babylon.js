import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { RichTypeBoolean } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";

/**
 * @experimental
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
    public readonly isOn: FlowGraphDataConnection<boolean>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.onOn = this._registerSignalOutput("onOn");
        this.onOff = this._registerSignalOutput("onOff");
        this.isOn = this.registerDataOutput("isOn", RichTypeBoolean);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        let value = context._getExecutionVariable(this, "value", false);

        value = !value;
        context._setExecutionVariable(this, "value", value);
        this.isOn.setValue(value, context);
        if (value) {
            this.onOn._activateSignal(context);
        } else {
            this.onOff._activateSignal(context);
        }
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGFlipFlopBlock";
    }
}
RegisterClass("FGFlipFlopBlock", FlowGraphFlipFlopBlock);
