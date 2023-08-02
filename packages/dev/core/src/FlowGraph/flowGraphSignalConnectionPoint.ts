import type { Nullable } from "../types";
import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnectionPointRole } from "./flowGraphConnectionPointRole";

/**
 * @experimental
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnectionPoint {
    private _connectedPoint: Nullable<FlowGraphSignalConnectionPoint>;

    constructor(public name: string, public role: FlowGraphConnectionPointRole, private _ownerBlock: FlowGraphExecutionBlock) {}

    /**
     * Connects this point to another point.
     * @param point the point to connect to.
     */
    public connectTo(point: FlowGraphSignalConnectionPoint): void {
        if (this.role === point.role) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }

    /**
     * @internal
     */
    public _activateSignal(): void {
        if (this.role === FlowGraphConnectionPointRole.Input) {
            this._ownerBlock._execute();
        } else {
            this._connectedPoint?._activateSignal();
        }
    }
}
