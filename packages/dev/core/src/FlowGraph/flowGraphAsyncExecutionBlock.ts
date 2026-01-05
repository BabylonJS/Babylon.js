import type { IFlowGraphBlockConfiguration } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphExecutionBlockWithOutSignal } from "./flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * An async execution block can start tasks that will be executed asynchronously.
 * It should also be responsible for clearing it in _cancelPendingTasks.
 */
export abstract class FlowGraphAsyncExecutionBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Output connection: The signal that is triggered when the asynchronous execution of this block is done.
     */
    public done: FlowGraphSignalConnection;

    protected _eventsSignalOutputs: { [eventName: string]: FlowGraphSignalConnection } = {};

    constructor(config?: IFlowGraphBlockConfiguration, events?: string[]) {
        super(config);
        this.done = this._registerSignalOutput("done");
        if (events) {
            for (const eventName of events) {
                this._eventsSignalOutputs[eventName] = this._registerSignalOutput(eventName + "Event");
            }
        }
    }
    /**
     * @internal
     * This function can be overridden to start any
     * pending tasks this node might have, such as
     * timeouts and playing animations.
     * @param context
     */
    public abstract _preparePendingTasks(context: FlowGraphContext): void;

    /**
     * @internal
     * This function can be overridden to execute any
     * logic that should be executed on every frame
     * while the async task is pending.
     * @param context the context in which it is running
     */
    public _executeOnTick(_context: FlowGraphContext): void {}

    /**
     * @internal
     * @param context
     */
    public _startPendingTasks(context: FlowGraphContext) {
        if (context._getExecutionVariable(this, "_initialized", false)) {
            this._cancelPendingTasks(context);
            this._resetAfterCanceled(context);
        }

        this._preparePendingTasks(context);
        context._addPendingBlock(this);
        this.out._activateSignal(context);
        context._setExecutionVariable(this, "_initialized", true);
    }

    public _resetAfterCanceled(context: FlowGraphContext) {
        context._deleteExecutionVariable(this, "_initialized");
        context._removePendingBlock(this);
    }

    public abstract _cancelPendingTasks(context: FlowGraphContext): void;
}
