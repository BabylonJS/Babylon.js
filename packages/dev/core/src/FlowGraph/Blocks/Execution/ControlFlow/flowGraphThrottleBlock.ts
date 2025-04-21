import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
/**
 * A block that throttles the execution of its output flow.
 */
export class FlowGraphThrottleBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The duration of the throttle, in seconds.
     */
    public readonly duration: FlowGraphDataConnection<number>;
    /**
     * Input connection: Resets the throttle.
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Output connection: The time remaining before the throttle is triggering again, in seconds.
     */
    public readonly lastRemainingTime: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.duration = this.registerDataInput("duration", RichTypeNumber);
        this.lastRemainingTime = this.registerDataOutput("lastRemainingTime", RichTypeNumber, NaN);
    }
    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            this.lastRemainingTime.setValue(NaN, context);
            context._setExecutionVariable(this, "lastRemainingTime", NaN);
            context._setExecutionVariable(this, "timestamp", 0);
            return;
        }
        // in seconds
        const durationValue = this.duration.getValue(context);
        if (durationValue <= 0 || isNaN(durationValue) || !isFinite(durationValue)) {
            return this._reportError(context, "Invalid duration in Throttle block");
        }
        const lastRemainingTime = context._getExecutionVariable(this, "lastRemainingTime", NaN);
        // Using Date.now() to get ms since epoch. not using performance.now() because its precision is not needed here
        const currentTime = Date.now();
        if (isNaN(lastRemainingTime)) {
            this.lastRemainingTime.setValue(0, context);
            context._setExecutionVariable(this, "lastRemainingTime", 0);
            context._setExecutionVariable(this, "timestamp", currentTime);
            // according to glTF interactivity specs
            return this.out._activateSignal(context);
        } else {
            const elapsedTime = currentTime - context._getExecutionVariable(this, "timestamp", 0);
            // duration is in seconds, so we need to multiply by 1000
            const durationInMs = durationValue * 1000;
            if (durationInMs <= elapsedTime) {
                this.lastRemainingTime.setValue(0, context);
                context._setExecutionVariable(this, "lastRemainingTime", 0);
                context._setExecutionVariable(this, "timestamp", currentTime);
                return this.out._activateSignal(context);
            } else {
                const remainingTime = durationInMs - elapsedTime;
                // output is in seconds
                this.lastRemainingTime.setValue(remainingTime / 1000, context);
                context._setExecutionVariable(this, "lastRemainingTime", remainingTime);
            }
        }
    }
    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.Throttle;
    }
}
RegisterClass(FlowGraphBlockNames.Throttle, FlowGraphThrottleBlock);
