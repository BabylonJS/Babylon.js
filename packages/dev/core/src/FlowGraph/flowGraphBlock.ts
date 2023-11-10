import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";
import { Tools } from "core/Misc/tools";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";

export interface IFlowGraphBlockConfiguration {
    name?: string;
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

    public serialize(serializationObject: any = {}) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject.config = this.config;
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

    public static Parse(serializationObject: any): FlowGraphBlock {
        const classType = Tools.Instantiate(serializationObject.className);
        const obj = new classType(serializationObject.config);
        obj.uniqueId = serializationObject.uniqueId;
        for (let i = 0; i < serializationObject.dataInputs.length; i++) {
            obj.dataInputs[i].deserialize(serializationObject.dataInputs[i]);
        }
        for (let i = 0; i < serializationObject.dataOutputs.length; i++) {
            obj.dataOutputs[i].deserialize(serializationObject.dataOutputs[i]);
        }
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
