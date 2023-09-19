import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

export class FlowGraphThrottleBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly duration: FlowGraphDataConnection<number>;
    public readonly timeRemaining: FlowGraphDataConnection<number>;
    public readonly reset: FlowGraphSignalConnection;

    constructor() {
        super();
        this.reset = this._registerSignalInput("reset");
        this.duration = this._registerDataInput("duration", RichTypeNumber);
        this.timeRemaining = this._registerDataOutput("timeRemaining", RichTypeNumber);
    }
    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        const lastActivatedTime = context._getExecutionVariable(this, "lastActivatedTime");
        const durationValue = this.duration.getValue(context);
        const currentTime = Date.now();
        if (callingSignal === this.reset || lastActivatedTime === undefined || currentTime - lastActivatedTime > durationValue) {
            //activate the output flow
            this.timeRemaining.value = 0;
            this.onDone._activateSignal(context);
        } else {
            //activate the output flow after the remaining time
            this.timeRemaining.value = durationValue - (currentTime - lastActivatedTime);
        }
        context._setExecutionVariable(this, "lastActivatedTime", currentTime);
    }
}
