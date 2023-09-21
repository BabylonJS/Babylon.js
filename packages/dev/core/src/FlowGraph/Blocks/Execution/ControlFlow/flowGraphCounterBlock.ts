import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * A block that counts the number of times it has been called.
 */
export class FlowGraphCounterBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly count: FlowGraphDataConnection<number>;
    public readonly reset: FlowGraphSignalConnection;

    constructor() {
        super();

        this.count = this._registerDataOutput("count", RichTypeNumber);
        this.reset = this._registerSignalInput("reset");
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        let countValue = context._getExecutionVariable(this, "count") ?? 0;
        if (callingSignal === this.reset) {
            countValue = 0;
        } else {
            countValue++;
        }
        context._setExecutionVariable(this, "count", countValue);
        this.count.setValue(countValue, context);
        this.onDone._activateSignal(context);
    }
}
