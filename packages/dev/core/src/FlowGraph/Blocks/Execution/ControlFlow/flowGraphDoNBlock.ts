import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";

/**
 * A block that executes a branch a set number of times.
 * @experimental
 */
export class FlowGraphDoNBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: Resets the counter
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Input connection: The maximum number of times the block can be executed.
     */
    public readonly maxNumberOfExecutions: FlowGraphDataConnection<number>;
    /**
     * Output connection: The number of times the block has been executed.
     */
    public readonly currentCount: FlowGraphDataConnection<number>;

    constructor() {
        super();
        this.reset = this._registerSignalInput("reset");
        this.maxNumberOfExecutions = this._registerDataInput("numberOfExecutions", RichTypeNumber);
        this.currentCount = this._registerDataOutput("currentCount", RichTypeNumber);
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            this.currentCount.setValue(0, context);
        } else {
            const currentCountValue = this.currentCount.getValue(context);
            if (currentCountValue < this.maxNumberOfExecutions.getValue(context)) {
                this.currentCount.setValue(currentCountValue + 1, context);
                this.onDone._activateSignal(context);
            }
        }
    }
}
