import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { AdvancedTimer } from "../../../Misc/timer";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { Scene } from "../../../scene";
import { FlowGraphAsyncExecutionBlock } from "../../flowGraphAsyncExecutionBlock";

/**
 * @experimental
 * Block that can execute an action immediately and another after a delay.
 * The delay is counted on the scene's tick.
 */
export class FlowGraphTimerBlock extends FlowGraphAsyncExecutionBlock {
    public readonly timeout: FlowGraphDataConnection<number>;
    public readonly onTimerDone: FlowGraphSignalConnection;

    constructor() {
        super();

        this.timeout = this._registerDataInput("timeout", 0);
        this.onTimerDone = this._registerSignalOutput("onTimerDone");
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const currentTimeout = this.timeout.getValue(context);

        if (currentTimeout !== undefined && currentTimeout >= 0) {
            const timers = context._getExecutionVariable(this, "runningTimers") || [];
            const scene = context._getGraphVariable("scene") as Scene;
            const timer: AdvancedTimer = new AdvancedTimer({
                timeout: currentTimeout,
                contextObservable: scene.onBeforeRenderObservable,
                onEnded: () => this._onEnded(timer, context),
            });
            timer.start();

            timers.push(timer);
            context._setExecutionVariable(this, "runningTimers", timers);
        }
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext) {
        this._startPendingTasks(context);
        this.onDone._activateSignal(context);
    }

    private _onEnded(timer: AdvancedTimer, context: FlowGraphContext) {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        const index = timers.indexOf(timer);
        if (index !== -1) {
            timers.splice(index, 1);
        }
        context._removePendingBlock(this);
        this.onTimerDone._activateSignal(context);
    }

    public _cancelPendingTasks(context: FlowGraphContext): void {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        for (const timer of timers) {
            timer.dispose();
        }
        context._deleteExecutionVariable(this, "runningTimers");
    }
}
