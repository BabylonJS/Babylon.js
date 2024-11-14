import { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphContext } from "./flowGraphContext";

/**
 * @experimental
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
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        context._notifyExecuteNode(this);
        this.done._activateSignal(context);
    }
}
