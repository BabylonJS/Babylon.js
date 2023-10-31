import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";
import { Tools } from "core/Misc/tools";
import type { ISerializedFlowGraphBlock } from "./typeDefinitions";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { defaultValueParseFunction, defaultValueSerializationFunction } from "./serialization";
import type { Scene } from "../scene";

export interface IFlowGraphBlockConfiguration {
    name?: string;
    [key: string]: any;
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

    public metadata: any;

    /** Constructor is protected so only subclasses can be instantiated */
    protected constructor(public config?: IFlowGraphBlockConfiguration) {
        this.configure();
    }

    public configure() {
        // overriden in child classes, uses config
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

    protected _registerDataInput<T>(name: string, className: RichType<T>): FlowGraphDataConnection<T> {
        const input = new FlowGraphDataConnection(name, FlowGraphConnectionType.Input, this, className);
        this.dataInputs.push(input);
        return input;
    }

    protected _registerDataOutput<T>(name: string, className: RichType<T>): FlowGraphDataConnection<T> {
        const output = new FlowGraphDataConnection(name, FlowGraphConnectionType.Output, this, className);
        this.dataOutputs.push(output);
        return output;
    }

    public getDataInput(name: string): FlowGraphDataConnection<any> | undefined {
        return this.dataInputs.find((i) => i.name === name);
    }
    private _serializeConfig(configObject: any, valueSerializeFunction: (key: string, value: any, serializationObject: any) => void = defaultValueSerializationFunction) {
        if (this.config) {
            for (const key in this.config) {
                valueSerializeFunction(key, this.config[key], configObject);
            }
        }
    }

    public serialize(serializationObject: any = {}, valueSerializeFunction?: (key: string, value: any, serializationObject: any) => void) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject.config = {};
        this._serializeConfig(serializationObject.config, valueSerializeFunction);
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

    public getClassName() {
        return "FGBlock";
    }

    private static _ParseConfig(
        serializationObject: any,
        scene: Scene,
        valueParseFunction: (key: string, serializationObject: any, scene: Scene) => any = defaultValueParseFunction
    ): IFlowGraphBlockConfiguration {
        const config: IFlowGraphBlockConfiguration = {};
        if (serializationObject.config) {
            for (const key in serializationObject.config) {
                config[key] = valueParseFunction(key, serializationObject.config, scene);
            }
        }
        return config;
    }

    public static Parse(
        serializationObject: ISerializedFlowGraphBlock,
        scene: Scene,
        valueParseFunction: (key: string, serializationObject: any, scene: Scene) => any = defaultValueParseFunction
    ): FlowGraphBlock {
        const classType = Tools.Instantiate(serializationObject.className);
        const config = FlowGraphBlock._ParseConfig(serializationObject, scene, valueParseFunction);
        const obj = new classType(config) as FlowGraphBlock;
        obj.uniqueId = serializationObject.uniqueId;
        for (let i = 0; i < serializationObject.dataInputs.length; i++) {
            obj.dataInputs[i].deserialize(serializationObject.dataInputs[i]);
        }
        for (let i = 0; i < serializationObject.dataOutputs.length; i++) {
            obj.dataOutputs[i].deserialize(serializationObject.dataOutputs[i]);
        }
        obj.metadata = serializationObject.metadata;
        if (obj instanceof FlowGraphExecutionBlock) {
            for (let i = 0; i < serializationObject.signalInputs.length; i++) {
                obj.signalInputs[i].deserialize(serializationObject.signalInputs[i]);
            }
            for (let i = 0; i < serializationObject.signalOutputs.length; i++) {
                obj.signalOutputs[i].deserialize(serializationObject.signalOutputs[i]);
            }
        }
        return obj;
    }
}
