/** This file must only contain pure code and pure imports */

import { type AdvancedTimer } from "../../../../Misc/timer";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeFlowGraphInteger } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { getNumericValue } from "core/FlowGraph/utils";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * This block cancels a delay that was previously scheduled.
 */
export class FlowGraphCancelDelayBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The index value of the scheduled activation to be cancelled.
     */
    public readonly delayIndex: FlowGraphDataConnection<FlowGraphInteger>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.delayIndex = this.registerDataInput("delayIndex", RichTypeFlowGraphInteger);
    }

    public _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const delayIndex = getNumericValue(this.delayIndex.getValue(context));
        if (delayIndex <= 0 || isNaN(delayIndex) || !isFinite(delayIndex)) {
            return this._reportError(context, "Invalid delay index");
        }
        const timers = context._getGlobalContextVariable("pendingDelays", [] as AdvancedTimer[]);
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

let _Registered = false;
/**
 * Register side effects for flowGraphCancelDelayBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphCancelDelayBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.CancelDelay, FlowGraphCancelDelayBlock);
}
