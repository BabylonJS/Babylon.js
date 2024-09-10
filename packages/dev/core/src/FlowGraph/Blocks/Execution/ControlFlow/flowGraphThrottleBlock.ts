import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * A block that throttles the execution of its output flow.
 */
export class FlowGraphThrottleBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The duration of the throttle, in ms.
     */
    public readonly duration: FlowGraphDataConnection<number>;
    /**
     * Input connection: Resets the throttle.
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Output connection: The time remaining before the throttle is done, in ms.
     */
    public readonly lastRemainingTime: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.duration = this.registerDataInput("duration", RichTypeNumber);
        this.lastRemainingTime = this.registerDataOutput("lastRemainingTime", RichTypeNumber);
    }
    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        // TODO - is NEGATIVE_INFINITY a good default value?
        const lastExecutedTime = context._getExecutionVariable(this, "lastExecutedTime", Number.NEGATIVE_INFINITY);
        const durationValue = this.duration.getValue(context);
        // check if the duration is valid
        if (durationValue <= 0 || isNaN(durationValue) || !isFinite(durationValue)) {
            return this.err._activateSignal(context);
        }
        const currentTime = Date.now();
        if (callingSignal === this.reset || lastExecutedTime === undefined || currentTime - lastExecutedTime > durationValue) {
            //activate the output flow
            this.lastRemainingTime.setValue(0, context);
            this.out._activateSignal(context);
            context._setExecutionVariable(this, "lastExecutedTime", currentTime);
        } else {
            //activate the output flow after the remaining time
            const remaining = durationValue - (currentTime - lastExecutedTime);
            this.lastRemainingTime.setValue(remaining, context);
        }
    }
    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return "FGThrottleBlock";
    }
}
RegisterClass("FGThrottleBlock", FlowGraphThrottleBlock);
