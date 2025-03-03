import { FlowGraphAsyncExecutionBlock } from "../../../flowGraphAsyncExecutionBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { AdvancedTimer } from "../../../../Misc/timer";
import { Logger } from "../../../../Misc/logger";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Block that sets a delay in seconds before activating the output signal.
 */
export class FlowGraphSetDelayBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * The maximum number of parallel delays that can be set per node.
     */
    public static MaxParallelDelayCount = 100;
    /**
     * Input signal: If activated the delayed activations set by this block will be canceled.
     */
    public readonly cancel: FlowGraphSignalConnection;

    /**
     * Input connection: The duration of the delay in seconds.
     */
    public readonly duration: FlowGraphDataConnection<number>;

    /**
     * Output connection: The last delay index that was set.
     */
    public readonly lastDelayIndex: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.cancel = this._registerSignalInput("cancel");
        this.duration = this.registerDataInput("duration", RichTypeNumber);
        this.lastDelayIndex = this.registerDataOutput("lastDelayIndex", RichTypeNumber, -1);
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const duration = this.duration.getValue(context);
        if (duration < 0 || isNaN(duration) || !isFinite(duration)) {
            this.error.payload = { message: "Invalid duration" };
            return this.error._activateSignal(context);
        }

        // active delays are global to the context
        const activeDelays: number = context._getGlobalContextVariable("activeDelays", 0);
        if (activeDelays >= FlowGraphSetDelayBlock.MaxParallelDelayCount) {
            this.error.payload = { message: "Max parallel delays reached" };
            return this.error._activateSignal(context);
        }
        // get the last global delay index
        const lastDelayIndex: number = context._getGlobalContextVariable("lastDelayIndex", -1);

        // these are block-specific and not global
        const timers = context._getExecutionVariable(this, "pendingDelays", [] as AdvancedTimer[]);
        const scene = context.configuration.scene;
        const timer: AdvancedTimer = new AdvancedTimer({
            timeout: duration * 1000, // duration is in seconds
            contextObservable: scene.onBeforeRenderObservable,
            onEnded: () => this._onEnded(timer, context),
        });
        timer.start();
        const newIndex = lastDelayIndex + 1;
        this.lastDelayIndex.setValue(newIndex, context);
        context._setGlobalContextVariable("lastDelayIndex", newIndex);

        timers[newIndex] = timer;
        context._setExecutionVariable(this, "pendingDelays", timers);
    }

    public _cancelPendingTasks(context: FlowGraphContext): void {
        const timers = context._getExecutionVariable(this, "pendingDelays", [] as AdvancedTimer[]);
        for (const timer of timers) {
            timer?.dispose();
        }
        context._deleteExecutionVariable(this, "pendingDelays");
        this.lastDelayIndex.setValue(-1, context);
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.cancel) {
            this._cancelPendingTasks(context);
            return;
        } else {
            this._preparePendingTasks(context);
            this.out._activateSignal(context);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.SetDelay;
    }

    private _onEnded(timer: AdvancedTimer, context: FlowGraphContext) {
        const timers = context._getExecutionVariable(this, "pendingDelays", [] as AdvancedTimer[]);
        const index = timers.indexOf(timer);
        if (index !== -1) {
            timers.splice(index, 1);
        } else {
            Logger.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list");
        }
        context._removePendingBlock(this);
        this.done._activateSignal(context);
    }
}

RegisterClass(FlowGraphBlockNames.SetDelay, FlowGraphSetDelayBlock);
