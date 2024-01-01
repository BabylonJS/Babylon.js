import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";
import { Tools } from "core/Misc/tools";
import type { ISerializedFlowGraphBlock } from "./typeDefinitions";
import { defaultValueParseFunction, defaultValueSerializationFunction } from "./serialization";
import type { Scene } from "../scene";

export interface IFlowGraphBlockConfiguration {
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

    public registerDataInput<T>(name: string, className: RichType<T>): FlowGraphDataConnection<T> {
        const input = new FlowGraphDataConnection(name, FlowGraphConnectionType.Input, this, className);
        this.dataInputs.push(input);
        return input;
    }

    public registerDataOutput<T>(name: string, className: RichType<T>): FlowGraphDataConnection<T> {
        const output = new FlowGraphDataConnection(name, FlowGraphConnectionType.Output, this, className);
        this.dataOutputs.push(output);
        return output;
    }

    public getDataInput(name: string): FlowGraphDataConnection<any> | undefined {
        return this.dataInputs.find((i) => i.name === name);
    }

    public getDataOutput(name: string): FlowGraphDataConnection<any> | undefined {
        return this.dataOutputs.find((i) => i.name === name);
    }

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

    public getClassName() {
        return "FGBlock";
    }

    public static Parse(
        serializationObject: ISerializedFlowGraphBlock,
        scene: Scene,
        valueParseFunction: (key: string, serializationObject: any, scene: Scene) => any = defaultValueParseFunction
    ): FlowGraphBlock {
        const classType = Tools.Instantiate(serializationObject.className);
        const parsedConfig: any = {};
        if (serializationObject.config) {
            for (const key in serializationObject.config) {
                parsedConfig[key] = valueParseFunction(key, serializationObject.config, scene);
            }
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
