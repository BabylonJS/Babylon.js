import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

/**
 * A block that executes a branch a set number of times.
 * @experimental
 */
export class FlowGraphDoNBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly reset: FlowGraphSignalConnection;
    public readonly maxNumberOfExecutions: FlowGraphDataConnection<number>;
    public readonly currentCount: FlowGraphDataConnection<number>;

    constructor() {
        super();
        this.reset = this._registerSignalInput("reset");
        this.maxNumberOfExecutions = this._registerDataInput("numberOfExecutions", RichTypeNumber);
        this.currentCount = this._registerDataOutput("currentCount", RichTypeNumber);
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            this.currentCount.value = 0;
        } else {
            const currentCountValue = this.currentCount.getValue(context);
            if (currentCountValue < this.maxNumberOfExecutions.getValue(context)) {
                this.currentCount.value = currentCountValue + 1;
                this.onDone._activateSignal(context);
            }
        }
    }
}
