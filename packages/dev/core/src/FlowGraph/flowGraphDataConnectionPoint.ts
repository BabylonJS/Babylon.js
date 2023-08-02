import type { Nullable } from "../types";
import { isDataUpdater } from "./dataUpdater";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnectionPointRole } from "./flowGraphConnectionPointRole";
import type { ValueContainer } from "./valueContainer";

/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnectionPoint<T> {
    private _connectedPoint: Nullable<FlowGraphDataConnectionPoint<T>>;

    constructor(public name: string, public role: FlowGraphConnectionPointRole, private _ownerBlock: FlowGraphBlock, private _valueContainer: ValueContainer<T>) {}

    connectTo(point: FlowGraphDataConnectionPoint<T>): void {
        if (this.role === point.role) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }

    get value(): T {
        if (this.role === FlowGraphConnectionPointRole.Output || !this._connectedPoint) {
            if (this.role === FlowGraphConnectionPointRole.Output && isDataUpdater(this._ownerBlock)) {
                this._ownerBlock._updateOutputs();
            }
            return this._valueContainer.value;
        } else {
            return this._connectedPoint.value;
        }
    }
}
