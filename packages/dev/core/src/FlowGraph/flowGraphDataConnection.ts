import type { Nullable } from "../types";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";

/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection<T> extends FlowGraphConnection {
    protected _connectedPoint: Nullable<FlowGraphDataConnection<T>>;
    public constructor(name: string, type: FlowGraphConnectionType, protected _ownerBlock: FlowGraphBlock, private _value: T) {
        super(name, type);
    }

    public connectTo(point: FlowGraphDataConnection<T>): void {
        super.connectTo(point);
    }

    public set value(value: T) {
        this._value = value;
    }

    public get value(): T {
        if (this.type === FlowGraphConnectionType.Output) {
            this._ownerBlock._updateOutputs();
            return this._value;
        }

        if (!this._connectedPoint) {
            return this._value;
        } else {
            return this._connectedPoint.value;
        }
    }
}
