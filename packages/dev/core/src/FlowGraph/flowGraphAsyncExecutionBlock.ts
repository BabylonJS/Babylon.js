import type { IFlowGraphBlockConfiguration } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * An async execution block can start tasks that will be executed asynchronously.
 * It should also be responsible for clearing it in _cancelPendingTasks.
 * @experimental
 */
export abstract class FlowGraphAsyncExecutionBlock extends FlowGraphExecutionBlock {
    /**
     * Output connection: The signal that is triggered when the execution of this block is done.
     */
    public onDone: FlowGraphSignalConnection;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.onDone = this._registerSignalOutput("onDone");
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
     * @param context
     */
    public _startPendingTasks(context: FlowGraphContext) {
        this._preparePendingTasks(context);
        context._addPendingBlock(this);
    }

    public abstract _cancelPendingTasks(context: FlowGraphContext): void;
}
