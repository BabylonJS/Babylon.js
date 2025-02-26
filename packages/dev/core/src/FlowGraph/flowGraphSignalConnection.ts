import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
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
     * @internal
     */
    public _activateSignal(context: FlowGraphContext): void {
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
            context._notifyExecuteNode(this._ownerBlock);
            this._ownerBlock._execute(context, this);
            context._increaseExecutionId();
        } else {
            for (const connectedPoint of this._connectedPoint) {
                connectedPoint._activateSignal(context);
            }
        }
    }
}

RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
