import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

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
