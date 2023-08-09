import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { AdvancedTimer } from "../../../Misc";

/**
 * @experimental
 * Block that can execute an action immediately and another after a delay.
 * The delay is counted on the scene's tick.
 */
export class FlowGraphTimerBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly timeout: FlowGraphDataConnection<number>;
    public readonly onTimerDone: FlowGraphSignalConnection;

    /**
     * List of running timers.
     */
    private _runningTimers: Array<AdvancedTimer> = [];

    constructor(graph: FlowGraph, defaultTimeout: number) {
        super(graph);

        this.timeout = this._registerDataInput("timeout", defaultTimeout);
        this.onTimerDone = this._registerSignalOutput("onTimerDone");
    }

    /**
     * @internal
     */
    public _execute() {
        const currentTimeout = this.timeout.value;

        if (currentTimeout >= 0) {
            const timer: AdvancedTimer = new AdvancedTimer({
                timeout: currentTimeout,
                contextObservable: this._graph.scene.onBeforeRenderObservable,
                onEnded: () => this._onEnded(timer),
            });
            timer.start();

            this._runningTimers.push(timer);
        }

        this.onDone._activateSignal();
    }

    private _onEnded(timer: AdvancedTimer) {
        const index = this._runningTimers.indexOf(timer);
        if (index !== -1) {
            this._runningTimers.splice(index, 1);
        }

        this.onTimerDone._activateSignal();
    }

    public _cancelPendingTasks(): void {
        for (const timer of this._runningTimers) {
            timer.dispose();
        }
        this._runningTimers.length = 0;
    }
}
