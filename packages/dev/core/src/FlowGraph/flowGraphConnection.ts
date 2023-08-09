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
    _connectedPoint: Array<IConnectable>;
    _isSingularConnection(): boolean;
    _type: FlowGraphConnectionType;
    connectTo(point: IConnectable): void;
}

/**
 * @experimental
 * The base connection class.
 */
export class FlowGraphConnection<BlockT, ConnectedToT extends IConnectable> implements IConnectable {
    /** @internal */
    public _connectedPoint: Array<ConnectedToT> = [];

    public constructor(public name: string, /** @internal */ public _type: FlowGraphConnectionType, protected _ownerBlock: BlockT) {}

    /**
     * The type of the connection
     */
    public get type() {
        return this._type;
    }

    /**
     * @internal
     * Override this to indicate if a point can connect to more than one point.
     */
    public _isSingularConnection(): boolean {
        return true;
    }

    /**
     * Returns if a point is connected to any other point.
     * @returns boolean indicating if the point is connected.
     */
    public isConnected(): boolean {
        return this._connectedPoint.length > 0;
    }

    /**
     * Connects two points together.
     * @param point
     */
    public connectTo(point: ConnectedToT): void {
        if (this._type === point._type) {
            throw new Error(`Cannot connect two points of type ${this.type}`);
        }
        if ((this._isSingularConnection() && this._connectedPoint.length > 0) || (point._isSingularConnection() && point._connectedPoint.length > 0)) {
            throw new Error("Max number of connections for point reached");
        }
        this._connectedPoint.push(point);
        point._connectedPoint.push(this);
    }
}
