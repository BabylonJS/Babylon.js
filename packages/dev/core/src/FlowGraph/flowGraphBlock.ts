import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";
import { Tools } from "../Misc/tools";
import type { ISerializedFlowGraphBlock, IObjectAccessor } from "./typeDefinitions";
import { defaultValueParseFunction, defaultValueSerializationFunction, needsPathConverter } from "./serialization";
import type { Scene } from "../scene";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";

/**
 * @experimental
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
    valueParseFunction?: (key: string, serializationObject: any, scene: Scene) => any;
    /**
     * The scene that the block is being parsed in.
     */
    scene: Scene;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
}

/**
 * @experimental
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
 * @experimental
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
     */
    protected constructor(
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
     */
    public _updateOutputs(_context: FlowGraphContext): void {
        // empty by default, overriden in data blocks
    }

    /**
     * Registers a data input on the block.
     * @param name the name of the input
     * @param richType the type of the input
     * @returns the created connection
     */
    public registerDataInput<T>(name: string, richType: RichType<T>): FlowGraphDataConnection<T> {
        const input = new FlowGraphDataConnection(name, FlowGraphConnectionType.Input, this, richType);
        this.dataInputs.push(input);
        return input;
    }

    /**
     * Registers a data output on the block.
     * @param name the name of the input
     * @param richType the type of the input
     * @returns the created connection
     */
    public registerDataOutput<T>(name: string, richType: RichType<T>): FlowGraphDataConnection<T> {
        const output = new FlowGraphDataConnection(name, FlowGraphConnectionType.Output, this, richType);
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
            serializationObject.config["name"] = this.config.name;
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
     * Gets the class name of this block
     * @returns the class name
     */
    public getClassName() {
        return "FGBlock";
    }

    /**
     * Parses a block from a serialization object
     * @param serializationObject the object to parse from
     * @param parseOptions options for parsing the block
     * @returns the parsed block
     */
    public static Parse(serializationObject: ISerializedFlowGraphBlock, parseOptions: IFlowGraphBlockParseOptions): FlowGraphBlock {
        const classType = Tools.Instantiate(serializationObject.className);
        const parsedConfig: any = {};
        const valueParseFunction = parseOptions.valueParseFunction ?? defaultValueParseFunction;
        if (serializationObject.config) {
            for (const key in serializationObject.config) {
                parsedConfig[key] = valueParseFunction(key, serializationObject.config, parseOptions.scene);
            }
        }
        if (needsPathConverter(serializationObject.className)) {
            parsedConfig.pathConverter = parseOptions.pathConverter;
        }
        const obj = new classType(parsedConfig);
        obj.uniqueId = serializationObject.uniqueId;
        for (let i = 0; i < serializationObject.dataInputs.length; i++) {
            const dataInput = obj.getDataInput(serializationObject.dataInputs[i].name);
            if (dataInput) {
                dataInput.deserialize(serializationObject.dataInputs[i]);
            } else {
                throw new Error("Could not find data input with name " + serializationObject.dataInputs[i].name + " in block " + serializationObject.className);
            }
        }
        for (let i = 0; i < serializationObject.dataOutputs.length; i++) {
            const dataOutput = obj.getDataOutput(serializationObject.dataOutputs[i].name);
            if (dataOutput) {
                dataOutput.deserialize(serializationObject.dataOutputs[i]);
            } else {
                throw new Error("Could not find data output with name " + serializationObject.dataOutputs[i].name + " in block " + serializationObject.className);
            }
        }
        obj.metadata = serializationObject.metadata;
        obj.deserialize && obj.deserialize(serializationObject);
        return obj;
    }
}
