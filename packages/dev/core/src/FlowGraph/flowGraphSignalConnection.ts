import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";

/**
 * @experimental
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnection extends FlowGraphConnection<FlowGraphExecutionBlock, FlowGraphSignalConnection> {
    /**
     * @internal
     */
    public _activateSignal(): void {
        if (this.type === FlowGraphConnectionType.Input) {
            this._ownerBlock._execute();
        } else {
            this._connectedPoint?._activateSignal();
        }
    }
}
