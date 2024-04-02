import { RegisterClass } from "../Misc/typeStore";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { RichType } from "./flowGraphRichTypes";
/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection<T> extends FlowGraphConnection<FlowGraphBlock, FlowGraphDataConnection<T>> {
    /**
     * Create a new data connection point.
     * @param name
     * @param connectionType
     * @param ownerBlock
     * @param richType
     */
    public constructor(
        name: string,
        connectionType: FlowGraphConnectionType,
        ownerBlock: FlowGraphBlock,
        /**
         * the type of the data in this block
         */
        public richType: RichType<T>
    ) {
        super(name, connectionType, ownerBlock);
    }

    /**
     * An output data block can connect to multiple input data blocks,
     * but an input data block can only connect to one output data block.
     * @returns true if the connection is singular
     */
    public _isSingularConnection(): boolean {
        return this.connectionType === FlowGraphConnectionType.Input;
    }

    /**
     * Set the value of the connection in a specific context.
     * @param value the value to set
     * @param context the context to which the value is set
     */
    public setValue(value: T, context: FlowGraphContext): void {
        context._setConnectionValue(this, value);
    }

    /**
     * Connect this point to another point.
     * @param point the point to connect to.
     */
    public connectTo(point: FlowGraphDataConnection<T>): void {
        super.connectTo(point);
    }

    private _getValueOrDefault(context: FlowGraphContext): T {
        if (context._hasConnectionValue(this)) {
            return context._getConnectionValue(this);
        } else {
            return this.richType.defaultValue;
        }
    }

    /**
     * Gets the value of the connection in a specific context.
     * @param context the context from which the value is retrieved
     * @returns the value of the connection
     */
    public getValue(context: FlowGraphContext): T {
        if (this.connectionType === FlowGraphConnectionType.Output) {
            context._notifyExecuteNode(this._ownerBlock);
            this._ownerBlock._updateOutputs(context);
            return this._getValueOrDefault(context);
        }

        if (!this.isConnected()) {
            return this._getValueOrDefault(context);
        } else {
            return this._connectedPoint[0].getValue(context);
        }
    }

    /**
     * @returns class name of the object.
     */
    public getClassName(): string {
        return "FGDataConnection";
    }

    /**
     * Serializes this object.
     * @param serializationObject the object to serialize to
     */
    public serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.richType = {};
        this.richType.serialize(serializationObject.richType);
    }

    /**
     * Parses a data connection from a serialized object.
     * @param serializationObject the object to parse from
     * @param ownerBlock the block that owns the connection
     * @returns the parsed connection
     */
    public static Parse(serializationObject: any, ownerBlock: FlowGraphBlock): FlowGraphDataConnection<any> {
        const obj = FlowGraphConnection.Parse(serializationObject, ownerBlock);
        obj.richType = RichType.Parse(serializationObject.richType);
        return obj;
    }
}

RegisterClass("FGDataConnection", FlowGraphDataConnection);
