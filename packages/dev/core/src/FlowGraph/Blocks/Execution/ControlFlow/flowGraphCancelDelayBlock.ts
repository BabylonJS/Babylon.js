import { RegisterClass } from "core/Misc/typeStore";
import type { AdvancedTimer } from "../../../../Misc/timer";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

/**
 * This block cancels a delay that was previously scheduled.
 */
export class FlowGraphCancelDelayBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The index value of the scheduled activation to be cancelled.
     */
    public readonly delayIndex: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.delayIndex = this.registerDataInput("delayIndex", RichTypeNumber);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const delayIndex = this.delayIndex.getValue(context);
        if (delayIndex <= 0 || isNaN(delayIndex) || !isFinite(delayIndex)) {
            return this.error._activateSignal(context);
        }
        const timers = context._getExecutionVariable(this, "pendingDelays", [] as AdvancedTimer[]);
        const timer = timers[delayIndex];
        if (timer) {
            timer.dispose();
            // not removing it from the array. Disposing it will clear all of its resources
        }
        // activate the out output flow
        this.out._activateSignal(context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.CancelDelay;
    }
}

RegisterClass(FlowGraphBlockNames.CancelDelay, FlowGraphCancelDelayBlock);
