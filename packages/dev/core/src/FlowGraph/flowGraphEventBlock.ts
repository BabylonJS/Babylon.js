import { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphContext } from "./flowGraphContext";
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
        this.done._activateSignal(context);
    }

    /**
     * Execute the event. This function should be called by the flow graph when the event is triggered.
     * @param context the context in which the event is executed
     * @param payload the payload of the event
     * @returns a boolean indicating if the event should stop propagation. if false, the event will stop propagating.
     */
    public abstract _executeEvent(context: FlowGraphContext, payload: any): boolean;
}
