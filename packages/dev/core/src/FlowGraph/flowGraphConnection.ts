import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphConnectionType } from "./flowGraphConnectionType";

/**
 * @experimental
 * The base connection class.
 */
export abstract class FlowGraphConnection {
    protected abstract _connectedPoint: FlowGraphConnection | null;
    protected abstract _ownerBlock: FlowGraphBlock;
    protected constructor(public name: string, public type: FlowGraphConnectionType) {}
    public connectTo(point: FlowGraphConnection): void {
        if (this.type === point.type) {
            throw new Error(`Cannot connect two points of type ${this.type}`);
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }
}