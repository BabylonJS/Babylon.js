import type { Nullable } from "../types";
import type { FlowGraphBlock } from "./flowGraphBlock";

export enum FlowGraphConnectionType {
    Input,
    Output,
}

/**
 * @experimental
 * The base connection class.
 */
export abstract class FlowGraphConnection {
    protected abstract _connectedPoint: Nullable<FlowGraphConnection>;
    protected abstract _ownerBlock: FlowGraphBlock;
    protected constructor(public name: string, public type: FlowGraphConnectionType) {}
    protected connectTo(point: FlowGraphConnection): void {
        if (this.type === point.type) {
            throw new Error(`Cannot connect two points of type ${this.type}`);
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }
}
