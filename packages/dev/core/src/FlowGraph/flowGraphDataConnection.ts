import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnection } from "./flowGraphConnection";
import { FlowGraphConnectionType } from "./flowGraphConnectionType";
import type { ValueContainer } from "./valueContainer";

/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection<T> extends FlowGraphConnection {
    public constructor(name: string, type: FlowGraphConnectionType, protected _ownerBlock: FlowGraphBlock, private _valueContainer: ValueContainer<T>) {
        super(name, type);
    }

    public connectTo(point: FlowGraphDataConnection<T>): void {
        super.connectTo(point);
    }

    public get value(): T {
        if (this.type === FlowGraphConnectionType.Output) {
            this._ownerBlock._updateOutputs();
            return this._valueContainer.value;
        }

        if (!this._connectedPoint) {
            return this._valueContainer.value;
        } else {
            return (this._connectedPoint as FlowGraphDataConnection<T>).value;
        }
    }
}
