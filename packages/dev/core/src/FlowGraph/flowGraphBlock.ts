import { serialize } from "core/Misc/decorators";
import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";
import { Tools } from "core/Misc/tools";

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
    @serialize()
    public uniqueId = RandomGUID();
    /**
     * The data inputs of the block.
     */
    public readonly dataInputs: FlowGraphDataConnection<any>[] = [];
    /**
     * The data outputs of the block.
     */
    public readonly dataOutputs: FlowGraphDataConnection<any>[] = [];

    /** Constructor is protected so only subclasses can be instantiated */
    protected constructor() {}

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

    public serialize(serializationObject: any = {}) {
        serializationObject.uniqueId = this.uniqueId;
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
        return "FlowGraphBlock";
    }

    public static Parse(serializationObject: any): FlowGraphBlock {
        const classType = Tools.Instantiate(serializationObject.className);
        const obj = new classType();
        obj.uniqueId = serializationObject.uniqueId;
        for (let i = 0; i < serializationObject.dataInputs.length; i++) {
            obj.dataInputs[i].uniqueId = serializationObject.dataInputs[i].uniqueId;
        }
        for (let i = 0; i < serializationObject.dataOutputs.length; i++) {
            obj.dataOutputs[i].uniqueId = serializationObject.dataOutputs[i].uniqueId;
        }
        return obj;
    }
}
