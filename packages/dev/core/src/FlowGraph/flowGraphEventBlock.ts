import { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import { type FlowGraphContext } from "./flowGraphContext";
import { FlowGraphEventType } from "./flowGraphEventType";

/**
 * A type of block that listens to an event observable and activates
 * its output signal when the event is triggered.
 */
export abstract class FlowGraphEventBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * the priority of initialization of this block.
     * For example, scene start should have a negative priority because it should be initialized last.
     */
    public initPriority: number = 0;

    /**
     * The type of the event
     */
    public readonly type: FlowGraphEventType = FlowGraphEventType.NoTrigger;
    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        context._notifyExecuteNode(this);
        // Fire both signals: KHR_interactivity graphs connect to `done`,
        // while editor-authored graphs typically connect to `out`.
        // Both must fire so that either wiring style works correctly.
        this.done._activateSignal(context);
        this.out._activateSignal(context);
    }

    /**
     * @internal
     * Override _startPendingTasks so that event blocks do NOT fire the
     * `out` signal at graph-start time.  The base FlowGraphAsyncExecutionBlock
     * fires `out` immediately in _startPendingTasks (useful for async blocks
     * like PlayAnimation that start a task and let sync flow continue).
     * Event blocks should only fire their output signals when the actual
     * event occurs, which is handled by _execute.
     */
    public override _startPendingTasks(context: FlowGraphContext): void {
        if (context._getExecutionVariable(this, "_initialized", false)) {
            this._cancelPendingTasks(context);
            this._resetAfterCanceled(context);
        }
        this._preparePendingTasks(context);
        context._addPendingBlock(this);
        // Do NOT fire out._activateSignal — event blocks fire both out and
        // done in _execute when the actual event triggers.
        context._setExecutionVariable(this, "_initialized", true);
    }

    /**
     * Execute the event. This function should be called by the flow graph when the event is triggered.
     * @param context the context in which the event is executed
     * @param payload the payload of the event
     * @returns a boolean indicating if the event should stop propagation. if false, the event will stop propagating.
     */
    public abstract _executeEvent(context: FlowGraphContext, payload: any): boolean;
}
