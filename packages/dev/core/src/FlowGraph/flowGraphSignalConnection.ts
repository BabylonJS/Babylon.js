import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { RegisterClass } from "../Misc/typeStore";

/**
 * @experimental
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnection extends FlowGraphConnection<FlowGraphExecutionBlock, FlowGraphSignalConnection> {
    /**
     * @internal
     * A signal input can be connected to more than one signal output,
     * but a signal output can only connect to one signal input
     * @returns true if the connection is singular
     */
    public _isSingularConnection(): boolean {
        return this.connectionType === FlowGraphConnectionType.Output;
    }

    /**
     * @internal
     */
    public _activateSignal(context: FlowGraphContext): void {
        if (this.connectionType === FlowGraphConnectionType.Input) {
            context._notifyExecuteNode(this._ownerBlock);
            this._ownerBlock._execute(context, this);
            context._increaseExecutionId();
        } else {
            this._connectedPoint[0]?._activateSignal(context);
        }
    }
}

RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
