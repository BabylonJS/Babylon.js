import type { Nullable } from "../types";
import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphConnectionType } from "./flowGraphConnectionType";

/**
 * @experimental
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnection {
    private _connectedPoint: Nullable<FlowGraphSignalConnection>;

    constructor(public name: string, public role: FlowGraphConnectionType, private _ownerBlock: FlowGraphExecutionBlock) {}

    /**
     * Connects this point to another point.
     * @param point the point to connect to.
     */
    public connectTo(point: FlowGraphSignalConnection): void {
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
        if (this.role === FlowGraphConnectionType.Input) {
            this._ownerBlock._execute();
        } else {
            this._connectedPoint?._activateSignal();
        }
    }
}
