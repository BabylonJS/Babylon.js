import { type FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import { type FlowGraphContext } from "./flowGraphContext";
import { RegisterClass } from "../Misc/typeStore";
import { FlowGraphAction } from "./flowGraphLogger";

/**
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnection extends FlowGraphConnection<FlowGraphExecutionBlock, FlowGraphSignalConnection> {
    /**
     * Optional payload. Can be used, for example, when an error is thrown to pass additional information.
     */
    public payload: any;

    /**
     * The priority of the signal. Signals with higher priority will be executed first.
     * Set priority before adding the connection as sorting happens only when the connection is added.
     */
    public priority: number = 0;

    public override _isSingularConnection(): boolean {
        return false;
    }

    public override connectTo(point: FlowGraphSignalConnection): void {
        super.connectTo(point);
        // sort according to priority to handle execution order
        this._connectedPoint.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Timestamp of the last activation (set on output signals when they fire).
     * @internal
     */
    public _lastActivationTime: number = -1;

    /**
     * @internal
     */
    public _activateSignal(context: FlowGraphContext): void {
        this._lastActivationTime = performance.now();
        context.logger?.addLogItem({
            action: FlowGraphAction.ActivateSignal,
            className: this._ownerBlock.getClassName(),
            uniqueId: this._ownerBlock.uniqueId,
            payload: {
                connectionType: this.connectionType,
                name: this.name,
            },
        });
        if (this.connectionType === FlowGraphConnectionType.Input) {
            // Check breakpoint before executing
            if (context._shouldBreak(this._ownerBlock, this)) {
                return; // Execution paused — stored as pending activation
            }
            context._notifyExecuteNode(this._ownerBlock);
            const startTime = performance.now();
            this._ownerBlock._execute(context, this);
            this._ownerBlock._lastExecutionTime = performance.now() - startTime;
            context._increaseExecutionId();
        } else {
            for (const connectedPoint of this._connectedPoint) {
                connectedPoint._activateSignal(context);
            }
        }
    }
}

RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
