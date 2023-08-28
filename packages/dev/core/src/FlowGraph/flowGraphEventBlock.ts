import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphWithOnDoneExecutionBlock } from "./flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * A type of block that listens to an event observable and activates
 * its output signal ("onTriggered"), when the event is triggered.
 */
export abstract class FlowGraphEventBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * @internal
     */
    public abstract _startListening(context: FlowGraphContext): void;
    /**
     * @internal
     */
    public abstract _stopListening(context: FlowGraphContext): void;

    public _cancelPendingTasks(context: FlowGraphContext): void {
        this._stopListening(context);
    }

    /**
     * @internal
     */
    public _execute(context: FlowGraphContext): void {
        this.onDone._activateSignal(context);
    }
}
