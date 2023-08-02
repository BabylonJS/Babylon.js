import type { Nullable } from "../types";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { isDataUpdater } from "./dataUpdater";

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
    /**
     * The name of the connection point.
     */
    public name: string;
    /**
     * The direction of the connection point.
     */
    public direction: FlowGraphConnectionPointDirection;
    private _ownerBlock: FlowGraphExecutionBlock;
    private _connectedPoint: Nullable<FlowGraphSignalConnectionPoint>;

    constructor(name: string, direction: FlowGraphConnectionPointDirection, ownerBlock: FlowGraphExecutionBlock) {
        this.name = name;
        this.direction = direction;
        this._ownerBlock = ownerBlock;
    }

    /**
     * Connects this point to another point.
     * @param point the point to connect to.
     */
    public connectTo(point: FlowGraphSignalConnectionPoint): void {
        if (this.direction === point.direction) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }

    /**
     * @internal
     */
    public _activateSignal(): void {
        if (this.direction === FlowGraphConnectionPointDirection.Input) {
            this._ownerBlock._execute();
        } else {
            this._connectedPoint?._activateSignal();
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
    /**
     * The name of the connection point.
     */
    public name: string;
    /**
     * The direction of the connection point.
     */
    public direction: FlowGraphConnectionPointDirection;
    private _ownerBlock: FlowGraphBlock;
    private _connectedPoint: Nullable<FlowGraphDataConnectionPoint<T>>;
    private _value: T;

    constructor(name: string, direction: FlowGraphConnectionPointDirection, ownerBlock: FlowGraphBlock, value: T) {
        this.name = name;
        this.direction = direction;
        this._ownerBlock = ownerBlock;
        this._value = value;
    }

    connectTo(point: FlowGraphDataConnectionPoint<T>): void {
        if (this.direction === point.direction) {
            throw new Error("Cannot connect two points of the same direction");
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }

    set value(valueToSet: T) {
        this._value = valueToSet;
    }

    get value(): T {
        if (this.direction === FlowGraphConnectionPointDirection.Output || !this._connectedPoint) {
            if (this.direction === FlowGraphConnectionPointDirection.Output && isDataUpdater(this._ownerBlock)) {
                this._ownerBlock._updateOutputs();
            }
            return this._value;
        } else {
            return this._connectedPoint.value;
        }
    }
}
