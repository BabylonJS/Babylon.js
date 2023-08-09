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
    public abstract _startListening(): void;
    /**
     * @internal
     */
    public abstract _stopListening(): void;

    public _cancelPendingTasks(): void {
        this._stopListening();
    }

    /**
     * @internal
     */
    public _execute(): void {
        this.onDone._activateSignal();
    }
}
