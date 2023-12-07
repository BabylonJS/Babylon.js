import { Tools } from "../Misc/tools";
import { RandomGUID } from "../Misc/guid";
import type { FlowGraphBlock } from "./flowGraphBlock";

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
    uniqueId: string;
    _connectedPoint: Array<IConnectable>;
    _isSingularConnection(): boolean;
    _connectionType: FlowGraphConnectionType;
    connectTo(point: IConnectable): void;
}

/**
 * @experimental
 * The base connection class.
 */
export class FlowGraphConnection<BlockT, ConnectedToT extends IConnectable> implements IConnectable {
    /** @internal */
    public _connectedPoint: Array<ConnectedToT> = [];
    /**
     * A uniquely identifying string for the connection.
     */
    public uniqueId = RandomGUID();

    /**
     * The name of the connection.
     */
    public name: string;

    /**
     * @internal
     */
    public _connectionType: FlowGraphConnectionType;

    /**
     * Used for parsing connections.
     * @internal
     */
    // disable warning as this is used for parsing
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public connectedPointIds: any[] = [];

    public constructor(
        name: string,
        _connectionType: FlowGraphConnectionType,
        /* @internal */ public _ownerBlock: BlockT
    ) {
        this.name = name;
        this._connectionType = _connectionType;
    }

    /**
     * The type of the connection
     */
    public get connectionType() {
        return this._connectionType;
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
        if (this._connectionType === point._connectionType) {
            throw new Error(`Cannot connect two points of type ${this.connectionType}`);
        }
        if ((this._isSingularConnection() && this._connectedPoint.length > 0) || (point._isSingularConnection() && point._connectedPoint.length > 0)) {
            throw new Error("Max number of connections for point reached");
        }
        this._connectedPoint.push(point);
        point._connectedPoint.push(this);
    }

    /**
     * Saves the connection to a JSON object.
     */
    public serialize(serializationObject: any = {}) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject.name = this.name;
        serializationObject._connectionType = this._connectionType;
        serializationObject.connectedPointIds = [];
        serializationObject.className = this.getClassName();
        for (const point of this._connectedPoint) {
            serializationObject.connectedPointIds.push(point.uniqueId);
        }
    }

    public getClassName(): string {
        return "FGConnection";
    }

    /**
     * Deserialize from a object into this
     * @param serializationObject
     */
    deserialize(serializationObject: any) {
        this.uniqueId = serializationObject.uniqueId;
        this.name = serializationObject.name;
        this._connectionType = serializationObject._connectionType;
        this.connectedPointIds = serializationObject.connectedPointIds;
    }

    /**
     * Parses a connection from an object
     * @param serializationObject
     * @param ownerBlock
     * @returns
     */
    public static Parse(serializationObject: any = {}, ownerBlock: FlowGraphBlock) {
        const type = Tools.Instantiate(serializationObject.className);
        const connection = new type(serializationObject.name, serializationObject._connectionType, ownerBlock);
        connection.deserialize(serializationObject);
        return connection;
    }
}
