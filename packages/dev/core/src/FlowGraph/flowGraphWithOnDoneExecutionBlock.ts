import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * @experimental
 * An execution block that has an onDone signal. This signal is triggered when the execution of this block is done.
 * Most execution blocks will inherit from this, except for the ones that have multiple signals to be triggered.
 * (such as if blocks)
 */
export abstract class FlowGraphWithOnDoneExecutionBlock extends FlowGraphExecutionBlock {
    /**
     * Output connection: The signal that is triggered when the execution of this block is done.
     */
    public readonly onDone: FlowGraphSignalConnection;

    protected constructor() {
        super();
        this.onDone = this._registerSignalOutput("onDone");
    }
}
