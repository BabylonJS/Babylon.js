import { RandomGUID } from "../Misc/guid";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { RichType } from "./flowGraphRichTypes";

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
}
