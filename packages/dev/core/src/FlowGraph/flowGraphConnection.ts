import type { Nullable } from "../types";

/**
 * @experimental
 * The type of a connection point - inpput or output.
 */
export enum FlowGraphConnectionType {
    Input,
    Output,
}

/**
 * @experimental
 */
export interface IConnectable {
    _connectedPoint: Nullable<IConnectable>;
    _type: FlowGraphConnectionType;
    connectTo(point: IConnectable): void;
}

/**
 * @experimental
 * The base connection class.
 */
export class FlowGraphConnection<BlockT, ConnectedToT extends IConnectable> implements IConnectable {
    /** @internal */
    public _connectedPoint: Nullable<ConnectedToT> = null;

    public constructor(public name: string, /** @internal */ public _type: FlowGraphConnectionType, protected _ownerBlock: BlockT) {}

    /**
     * The type of the connection
     */
    public get type() {
        return this._type;
    }

    /**
     * Connects two points together.
     * @param point
     */
    public connectTo(point: ConnectedToT): void {
        if (this._type === point._type) {
            throw new Error(`Cannot connect two points of type ${this.type}`);
        }
        this._connectedPoint = point;
        point._connectedPoint = this;
    }
}
