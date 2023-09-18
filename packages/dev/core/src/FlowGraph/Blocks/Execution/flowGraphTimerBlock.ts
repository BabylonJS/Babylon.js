import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { AdvancedTimer } from "../../../Misc/timer";
import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphAsyncExecutionBlock } from "../../flowGraphAsyncExecutionBlock";
import { RichTypeNumber } from "../../flowGraphRichTypes";
import { Tools } from "../../../Misc/tools";

export interface IFlowGraphTimerBlockParameters {
    timeout?: number;
}

/**
 * @experimental
 * question: is this doc understandable enough? accepting suggestions
 * Block that provides two different output flows. One is started immediately once the block is executed,
 * and the other is executed after a set time. The timer for this block runs based on the scene's render loop.
 */
export class FlowGraphTimerBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * Input connection: The timeout of the timer.
     */
    public readonly timeout: FlowGraphDataConnection<number>;
    /**
     * Output connection: The signal that is activated when the timer is done.
     * This signal is activated asynchronically.
     */
    public readonly onTimerDone: FlowGraphSignalConnection;

    constructor(parameters?: IFlowGraphTimerBlockParameters) {
        super();

        this.timeout = this._registerDataInput("timeout", RichTypeNumber);
        if (parameters?.timeout !== undefined) {
            this.timeout.value = parameters.timeout;
        }
        this.onTimerDone = this._registerSignalOutput("onTimerDone");
    }

    public _preparePendingTasks(context: FlowGraphContext): void {
        const currentTimeout = this.timeout.getValue(context);

        if (currentTimeout !== undefined && currentTimeout >= 0) {
            const timers = context._getExecutionVariable(this, "runningTimers") || [];
            const scene = context.graphVariables.scene;
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
        } else {
            Tools.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list");
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
