import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * @experimental
 */
export abstract class FlowGraphAsyncExecutionBlock extends FlowGraphExecutionBlock {
    // question: for some reason adding readonly here doesn't let the children classes see the onDone??
    // is readonly even useful, considering it's a ts only thing?
    public onDone: FlowGraphSignalConnection;

    constructor() {
        super();
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
