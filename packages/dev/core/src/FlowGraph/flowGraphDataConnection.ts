import type { Nullable } from "../types";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnectionType } from "./flowGraphConnectionType";
import type { ValueContainer } from "./valueContainer";

/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection<T> {
    private _connectedPoint: Nullable<FlowGraphDataConnection<T>>;

    public constructor(public name: string, public type: FlowGraphConnectionType, private _ownerBlock: FlowGraphBlock, private _valueContainer: ValueContainer<T>) {}

    connectTo(point: FlowGraphDataConnection<T>): void {
        if (this.type === point.type) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }

    get value(): T {
        if (this.type === FlowGraphConnectionType.Output) {
            this._ownerBlock._updateOutputs();
            return this._valueContainer.value;
        }

        if (!this._connectedPoint) {
            return this._valueContainer.value;
        } else {
            return this._connectedPoint.value;
        }
    }
}
