import type { IFlowGraphBlockConfiguration } from "./flowGraphBlock";
import { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * A block that executes some action. Always has an input signal (which is not used by event blocks).
 * Can have one or more output signals.
 */
export abstract class FlowGraphExecutionBlock extends FlowGraphBlock {
    /**
     * Input connection: The input signal of the block.
     */
    public readonly in: FlowGraphSignalConnection;

    /**
     * An output connection that can be used to signal an error, if the block defines it.
     */
    public readonly error: FlowGraphSignalConnection;
    /**
     * Input connections that activate the block.
     */
    public signalInputs: FlowGraphSignalConnection[];
    /**
     * Output connections that can activate downstream blocks.
     */
    public signalOutputs: FlowGraphSignalConnection[];

    /**
     * The priority of the block. Higher priority blocks will be executed first.
     * Note that priority cannot be change AFTER the block was added as sorting happens when the block is added to the execution queue.
     */
    public readonly priority: number = 0;

    protected constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.signalInputs = [];
        this.signalOutputs = [];
        this.in = this._registerSignalInput("in");
        this.error = this._registerSignalOutput("error");
    }

    /**
     * @internal
     * Executes the flow graph execution block.
     */
    public abstract _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void;

    protected _registerSignalInput(name: string): FlowGraphSignalConnection {
        const input = new FlowGraphSignalConnection(name, FlowGraphConnectionType.Input, this);
        this.signalInputs.push(input);
        return input;
    }

    protected _registerSignalOutput(name: string): FlowGraphSignalConnection {
        const output = new FlowGraphSignalConnection(name, FlowGraphConnectionType.Output, this);
        this.signalOutputs.push(output);
        return output;
    }

    protected _unregisterSignalInput(name: string): void {
        const index = this.signalInputs.findIndex((input) => input.name === name);
        if (index !== -1) {
            this.signalInputs[index].dispose();
            this.signalInputs.splice(index, 1);
        }
    }

    protected _unregisterSignalOutput(name: string): void {
        const index = this.signalOutputs.findIndex((output) => output.name === name);
        if (index !== -1) {
            this.signalOutputs[index].dispose();
            this.signalOutputs.splice(index, 1);
        }
    }

    protected _reportError(context: FlowGraphContext, error: Error | string) {
        this.error.payload = typeof error === "string" ? new Error(error) : error;
        this.error._activateSignal(context);
    }

    /**
     * Given a name of a signal input, return that input if it exists
     * @param name the name of the input
     * @returns if the input exists, the input. Otherwise, undefined.
     */
    public getSignalInput(name: string): FlowGraphSignalConnection | undefined {
        return this.signalInputs.find((input) => input.name === name);
    }

    /**
     * Given a name of a signal output, return that input if it exists
     * @param name the name of the input
     * @returns if the input exists, the input. Otherwise, undefined.
     */
    public getSignalOutput(name: string): FlowGraphSignalConnection | undefined {
        return this.signalOutputs.find((output) => output.name === name);
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize in
     */
    public override serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.signalInputs = [];
        serializationObject.signalOutputs = [];
        for (const input of this.signalInputs) {
            const serializedInput: any = {};
            input.serialize(serializedInput);
            serializationObject.signalInputs.push(serializedInput);
        }
        for (const output of this.signalOutputs) {
            const serializedOutput: any = {};
            output.serialize(serializedOutput);
            serializationObject.signalOutputs.push(serializedOutput);
        }
    }

    /**
     * Deserializes from an object
     * @param serializationObject the object to deserialize from
     */
    public override deserialize(serializationObject: any) {
        for (let i = 0; i < serializationObject.signalInputs.length; i++) {
            const signalInput = this.getSignalInput(serializationObject.signalInputs[i].name);
            if (signalInput) {
                signalInput.deserialize(serializationObject.signalInputs[i]);
            } else {
                throw new Error("Could not find signal input with name " + serializationObject.signalInputs[i].name + " in block " + serializationObject.className);
            }
        }
        for (let i = 0; i < serializationObject.signalOutputs.length; i++) {
            const signalOutput = this.getSignalOutput(serializationObject.signalOutputs[i].name);
            if (signalOutput) {
                signalOutput.deserialize(serializationObject.signalOutputs[i]);
            } else {
                throw new Error("Could not find signal output with name " + serializationObject.signalOutputs[i].name + " in block " + serializationObject.className);
            }
        }
    }

    /**
     * @returns the class name
     */
    public override getClassName(): string {
        return "FlowGraphExecutionBlock";
    }
}
