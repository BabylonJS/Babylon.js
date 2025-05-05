import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";
import type { ISerializedFlowGraphBlock, IObjectAccessor } from "./typeDefinitions";
import { defaultValueSerializationFunction } from "./serialization";
import type { Scene } from "../scene";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { IAssetContainer } from "core/IAssetContainer";
import type { FlowGraphAction } from "./flowGraphLogger";

/**
 * Options for parsing a block.
 */
export interface IFlowGraphBlockParseOptions {
    /**
     * A function that parses a value from a serialization object.
     * @param key the key of the property
     * @param serializationObject the serialization object where the property is located
     * @param scene the scene that the block is being parsed in
     * @returns the parsed value
     */
    valueParseFunction?: (key: string, serializationObject: any, assetsContainer: IAssetContainer, scene: Scene) => any;
    /**
     * The assets container to use when loading assets.
     */
    assetsContainer?: IAssetContainer;
    /**
     * The scene that the block is being parsed in.
     */
    scene: Scene;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter?: IPathToObjectConverter<IObjectAccessor>;
}

/**
 * Configuration for a block.
 */
export interface IFlowGraphBlockConfiguration {
    /**
     * The name of the block.
     */
    name?: string;
    [extraPropertyKey: string]: any;
}

/**
 * A block in a flow graph. The most basic form
 * of a block has inputs and outputs that contain
 * data.
 */
export class FlowGraphBlock {
    /**
     * A randomly generated GUID for each block.
     */
    public uniqueId = RandomGUID();
    /**
     * The name of the block.
     */
    public name: string;
    /**
     * The data inputs of the block.
     */
    public dataInputs: FlowGraphDataConnection<any>[];
    /**
     * The data outputs of the block.
     */
    public dataOutputs: FlowGraphDataConnection<any>[];

    /**
     * Metadata that can be used by the block.
     */
    public metadata: any;

    /** Constructor is protected so only subclasses can be instantiated
     * @param config optional configuration for this block
     * @internal - do not use directly. Extend this class instead.
     */
    constructor(
        /**
         * the configuration of the block
         */
        public config?: IFlowGraphBlockConfiguration
    ) {
        this.name = this.config?.name ?? this.getClassName();
        this.dataInputs = [];
        this.dataOutputs = [];
    }

    /**
     * @internal
     * This function is called when the block needs to update its output flows.
     * @param _context the context in which it is running
     */
    public _updateOutputs(_context: FlowGraphContext): void {
        // empty by default, overridden in data blocks
    }

    /**
     * Registers a data input on the block.
     * @param name the name of the input
     * @param richType the type of the input
     * @param defaultValue optional default value of the input. If not set, the rich type's default value will be used.
     * @returns the created connection
     */
    public registerDataInput<T>(name: string, richType: RichType<T>, defaultValue?: T): FlowGraphDataConnection<T> {
        const input = new FlowGraphDataConnection(name, FlowGraphConnectionType.Input, this, richType, defaultValue);
        this.dataInputs.push(input);
        return input;
    }

    /**
     * Registers a data output on the block.
     * @param name the name of the input
     * @param richType the type of the input
     * @param defaultValue optional default value of the input. If not set, the rich type's default value will be used.
     * @returns the created connection
     */
    public registerDataOutput<T>(name: string, richType: RichType<T>, defaultValue?: T): FlowGraphDataConnection<T> {
        const output = new FlowGraphDataConnection(name, FlowGraphConnectionType.Output, this, richType, defaultValue);
        this.dataOutputs.push(output);
        return output;
    }

    /**
     * Given the name of a data input, returns the connection if it exists
     * @param name the name of the input
     * @returns the connection if it exists, undefined otherwise
     */
    public getDataInput(name: string): FlowGraphDataConnection<any> | undefined {
        return this.dataInputs.find((i) => i.name === name);
    }

    /**
     * Given the name of a data output, returns the connection if it exists
     * @param name the name of the output
     * @returns the connection if it exists, undefined otherwise
     */
    public getDataOutput(name: string): FlowGraphDataConnection<any> | undefined {
        return this.dataOutputs.find((i) => i.name === name);
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     * @param _valueSerializeFunction a function that serializes a specific value
     */
    public serialize(serializationObject: any = {}, _valueSerializeFunction: (key: string, value: any, serializationObject: any) => any = defaultValueSerializationFunction) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject.config = {};
        if (this.config) {
            const config = this.config;
            const keys = Object.keys(config);
            for (const key of keys) {
                _valueSerializeFunction(key, config[key], serializationObject.config);
            }
        }
        serializationObject.dataInputs = [];
        serializationObject.dataOutputs = [];
        serializationObject.className = this.getClassName();
        for (const input of this.dataInputs) {
            const serializedInput: any = {};
            input.serialize(serializedInput);
            serializationObject.dataInputs.push(serializedInput);
        }
        for (const output of this.dataOutputs) {
            const serializedOutput: any = {};
            output.serialize(serializedOutput);
            serializationObject.dataOutputs.push(serializedOutput);
        }
    }

    /**
     * Deserializes this block
     * @param _serializationObject the object to deserialize from
     */
    public deserialize(_serializationObject: ISerializedFlowGraphBlock) {
        // no-op by default
    }

    protected _log(context: FlowGraphContext, action: FlowGraphAction, payload?: any) {
        context.logger?.addLogItem({
            action,
            payload,
            className: this.getClassName(),
            uniqueId: this.uniqueId,
        });
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public getClassName() {
        return "FlowGraphBlock";
    }
}
