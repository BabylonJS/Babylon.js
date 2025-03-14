import type { Nullable } from "core/types";
import { RegisterClass } from "../Misc/typeStore";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import type { RichType } from "./flowGraphRichTypes";
import { Observable } from "core/Misc/observable";
import { defaultValueSerializationFunction } from "./serialization";
/**
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection<T> extends FlowGraphConnection<FlowGraphBlock, FlowGraphDataConnection<T>> {
    private _isDisabled: boolean = false;
    /**
     * This is used for debugging purposes! It is the last value that was set to this connection with ANY context.
     * Do not use this value for anything else, as it might be wrong if used in a different context.
     */
    private _lastValue: Nullable<T> = null;

    /**
     * a data transformer function, if needed.
     * This can be used, for example, to force seconds into milliseconds output, if it makes sense in your case.
     */
    public dataTransformer: Nullable<(value: T) => T> = null;

    /**
     * An observable that is triggered when the value of the connection changes.
     */
    public onValueChangedObservable = new Observable<T>();
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
        return this._isDisabled;
    }

    public set isDisabled(value: boolean) {
        if (this._isDisabled === value) {
            return;
        }
        this._isDisabled = value;
        if (this._isDisabled) {
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
        // check if the value is different
        if (context._getConnectionValue(this) === value) {
            return;
        }
        context._setConnectionValue(this, value);
        this.onValueChangedObservable.notifyObservers(value);
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
        if (this._isDisabled) {
            return;
        }
        super.connectTo(point);
    }

    private _getValueOrDefault(context: FlowGraphContext): T {
        const val = context._getConnectionValue(this) ?? this._defaultValue;
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
            const value = this._getValueOrDefault(context);
            this._lastValue = value;
            return this.richType.typeTransformer ? this.richType.typeTransformer(value) : value;
        }
        const value = !this.isConnected() ? this._getValueOrDefault(context) : this._connectedPoint[0].getValue(context);
        this._lastValue = value;
        return this.richType.typeTransformer ? this.richType.typeTransformer(value) : value;
    }

    /**
     * @internal
     */
    public _getLastValue(): Nullable<T> {
        return this._lastValue;
    }

    /**
     * @returns class name of the object.
     */
    public override getClassName(): string {
        return "FlowGraphDataConnection";
    }

    /**
     * Serializes this object.
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.richType = {};
        this.richType.serialize(serializationObject.richType);
        serializationObject.optional = this._optional;
        defaultValueSerializationFunction("defaultValue", this._defaultValue, serializationObject);
    }
}

RegisterClass("FlowGraphDataConnection", FlowGraphDataConnection);
