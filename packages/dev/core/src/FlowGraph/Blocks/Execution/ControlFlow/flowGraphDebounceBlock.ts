import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "core/FlowGraph/flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";

/**
 * @experimental
 * This block debounces the execution of a input, i.e. ensures that the input is only executed once every X times
 */
export class FlowGraphDebounceBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input: The number of times the input must be executed before the onDone signal is activated
     */
    public readonly count: FlowGraphDataConnection<number>;
    /**
     * Input: Resets the debounce counter
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Output: The current count of the debounce counter
     */
    public readonly currentCount: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.count = this.registerDataInput("count", RichTypeNumber);
        this.reset = this._registerSignalInput("reset");
        this.currentCount = this.registerDataOutput("currentCount", RichTypeNumber);
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            context._setExecutionVariable(this, "debounceCount", 0);
            return;
        }
        const count = this.count.getValue(context);
        const currentCount = context._getExecutionVariable(this, "debounceCount", 0);
        const newCount = currentCount + 1;

        this.currentCount.setValue(newCount, context);
        context._setExecutionVariable(this, "debounceCount", newCount);
        if (newCount >= count) {
            this.out._activateSignal(context);
            context._setExecutionVariable(this, "debounceCount", 0);
        }
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGDebounceBlock";
    }
}
RegisterClass("FGDebounceBlock", FlowGraphDebounceBlock);
