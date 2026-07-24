/** This file must only contain pure code and pure imports */

import { type FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import { type FlowGraphContext } from "./flowGraphContext";
import { FlowGraphAction } from "./flowGraphLogger";
import { RegisterClass } from "../Misc/typeStore";

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
            // Start a new execution frame BEFORE executing the node. Per the KHR_interactivity
            // specification, output value sockets (e.g. math/random) retain their values until an
            // interactivity node with one or more flow sockets is executed, after which they MUST be
            // recomputed on the next access. Because flow execution is synchronous and nested, the id
            // must be increased before the block runs so each flow socket activation (including loop
            // self-activations) observes a fresh frame, while staying constant within a single block
            // execution so per-frame value caching still works.
            context._increaseExecutionId();
            context._notifyExecuteNode(this._ownerBlock);
            const startTime = performance.now();
            this._ownerBlock._execute(context, this);
            this._ownerBlock._lastExecutionTime = performance.now() - startTime;
        } else {
            for (const connectedPoint of this._connectedPoint) {
                connectedPoint._activateSignal(context);
            }
        }
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphSignalConnection.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphSignalConnection(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
}
