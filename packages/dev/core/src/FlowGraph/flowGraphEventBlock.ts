import { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphContext } from "./flowGraphContext";

/**
 * @experimental
 * A type of block that listens to an event observable and activates
 * its output signal when the event is triggered.
 */
export abstract class FlowGraphEventBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        context._notifyExecuteNode(this);
        this.out._activateSignal(context);
    }
}
