import type { Nullable } from "../types";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { isDataUpdater } from "./iDataUpdater";

export enum FlowGraphConnectionPointDirection {
    Input,
    Output,
}

/**
 * @experimental
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnectionPoint {
    name: string;
    direction: FlowGraphConnectionPointDirection;
    ownerBlock: FlowGraphExecutionBlock;
    connectedPoint: Nullable<FlowGraphSignalConnectionPoint>;

    connectTo(point: FlowGraphSignalConnectionPoint): void {
        if (this.direction === point.direction) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this.connectedPoint = point;
        point.connectedPoint = this;
    }

    activateSignal(): void {
        if (this.direction === FlowGraphConnectionPointDirection.Input) {
            this.ownerBlock.execute();
        } else {
            this.connectedPoint?.activateSignal();
        }
    }
}

/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnectionPoint<T> {
    name: string;
    direction: FlowGraphConnectionPointDirection;
    ownerBlock: FlowGraphBlock;
    connectedPoint: Nullable<FlowGraphDataConnectionPoint<T>>;
    private _value: T;

    connectTo(point: FlowGraphDataConnectionPoint<T>): void {
        if (this.direction === point.direction) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this.connectedPoint = point;
        point.connectedPoint = this;
    }

    set value(valueToSet: T) {
        this._value = valueToSet;
    }

    get value(): T {
        if (this.direction === FlowGraphConnectionPointDirection.Output || !this.connectedPoint) {
            if (this.direction === FlowGraphConnectionPointDirection.Output && isDataUpdater(this.ownerBlock)) {
                this.ownerBlock.updateOutputs();
            }
            return this._value;
        } else {
            return this.connectedPoint.value;
        }
    }
}
