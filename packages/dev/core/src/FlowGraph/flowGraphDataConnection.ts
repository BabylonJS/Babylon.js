import type { Nullable } from "core/types";
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
 * TODO - if the default value is set to an object (vector type) unneeded objects might be generated when the default value is not set.
 */
export class FlowGraphDataConnection<T> extends FlowGraphConnection<FlowGraphBlock, FlowGraphDataConnection<T>> {
    private _isDiabled: boolean = false;

    /**
     * a data transformer function, if needed.
     * This can be used, for example, to force seconds into milliseconds output, if it makes sense in your case.
     */
    public dataTransformer: Nullable<(value: T) => T> = null;
    /**
     * Create a new data connection point.
     * @param name the name of the connection
     * @param connectionType the type of the connection
     * @param ownerBlock the block that owns this connection
     * @param richType the type of the data in this block
     * @param _defaultValue the default value of the connection
     * @param _optional if the connection is optional
     */
    public constructor(
        name: string,
        connectionType: FlowGraphConnectionType,
        ownerBlock: FlowGraphBlock,
        /**
         * the type of the data in this block
         */
        public richType: RichType<T>,
        /**
         * [any] the default value of the connection
         */
        private _defaultValue: T = richType.defaultValue,
        /**
         * [false] if the connection is optional
         */
        private _optional: boolean = false
    ) {
        super(name, connectionType, ownerBlock);
    }

    /**
     * Whether or not the connection is optional.
     * Currently only used for UI control.
     */
    public get optional(): boolean {
        return this._optional;
    }

    /**
     * is this connection disabled
     * If the connection is disabled you will not be able to connect anything to it.
     */
    public get isDisabled(): boolean {
        return this._isDiabled;
    }

    public set isDisabled(value: boolean) {
        if (this._isDiabled === value) {
            return;
        }
        this._isDiabled = value;
        if (this._isDiabled) {
            this.disconnectFromAll();
        }
    }

    /**
     * An output data block can connect to multiple input data blocks,
     * but an input data block can only connect to one output data block.
     * @returns true if the connection is singular
     */
    public override _isSingularConnection(): boolean {
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
     * Reset the value of the connection to the default value.
     * @param context the context in which the value is reset
     */
    public resetToDefaultValue(context: FlowGraphContext): void {
        context._setConnectionValue(this, this._defaultValue);
    }

    /**
     * Connect this point to another point.
     * @param point the point to connect to.
     */
    public override connectTo(point: FlowGraphDataConnection<T>): void {
        if (this._isDiabled) {
            return;
        }
        super.connectTo(point);
    }

    private _getValueOrDefault(context: FlowGraphContext): T {
        const val = context._getConnectionValue(this) ? context._getConnectionValue(this) : this._defaultValue;
        return this.dataTransformer ? this.dataTransformer(val) : val;
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
    public override getClassName(): string {
        return "FGDataConnection";
    }

    /**
     * Serializes this object.
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject: any = {}) {
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
    public static override Parse(serializationObject: any, ownerBlock: FlowGraphBlock): FlowGraphDataConnection<any> {
        const obj = FlowGraphConnection.Parse(serializationObject, ownerBlock);
        obj.richType = RichType.Parse(serializationObject.richType);
        return obj;
    }
}

RegisterClass("FGDataConnection", FlowGraphDataConnection);
