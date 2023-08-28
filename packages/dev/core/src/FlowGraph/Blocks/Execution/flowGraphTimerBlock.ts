import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { AdvancedTimer } from "../../../Misc/timer";
import type { FlowGraphContext } from "../../flowGraphContext";

/**
 * @experimental
 * Block that can execute an action immediately and another after a delay.
 * The delay is counted on the scene's tick.
 */
export class FlowGraphTimerBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly timeout: FlowGraphDataConnection<number>;
    public readonly onTimerDone: FlowGraphSignalConnection;

    constructor(graph: FlowGraph) {
        super(graph);

        this.timeout = this._registerDataInput("timeout", 0);
        this.onTimerDone = this._registerSignalOutput("onTimerDone");
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext) {
        const currentTimeout = this.timeout.getValue(context);

        if (currentTimeout !== undefined && currentTimeout >= 0) {
            const timers = context._getExecutionVariable(this, "runningTimers") || [];
            const timer: AdvancedTimer = new AdvancedTimer({
                timeout: currentTimeout,
                contextObservable: this._graph.scene.onBeforeRenderObservable,
                onEnded: () => this._onEnded(timer, context),
            });
            timer.start();

            timers.push(timer);
            context._setExecutionVariable(this, "runningTimers", timers);
        }

        this.onDone._activateSignal(context);
    }

    private _onEnded(timer: AdvancedTimer, context: FlowGraphContext) {
        const timers = context._getExecutionVariable(this, "runningTimers") || [];
        const index = timers.indexOf(timer);
        if (index !== -1) {
            timers.splice(index, 1);
        }

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
