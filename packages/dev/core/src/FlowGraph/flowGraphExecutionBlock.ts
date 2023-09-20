import { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * @experimental
 * A block that executes some action. Always has an input signal (which is not used by event blocks).
 * Can have one or more output signals.
 */
export abstract class FlowGraphExecutionBlock extends FlowGraphBlock {
    /**
     * Input connection: The input signal of the block.
     */
    public readonly onStart: FlowGraphSignalConnection;

    private readonly _signalInputs: FlowGraphSignalConnection[] = [];
    private readonly _signalOutputs: FlowGraphSignalConnection[] = [];

    protected constructor() {
        super();
        this.onStart = this._registerSignalInput("onStart");
    }
    /**
     * @internal
     * Executes the flow graph execution block.
     */
    public abstract _execute(context: FlowGraphContext): void;

    protected _registerSignalInput(name: string): FlowGraphSignalConnection {
        const input = new FlowGraphSignalConnection(name, FlowGraphConnectionType.Input, this);
        this._signalInputs.push(input);
        return input;
    }

    protected _registerSignalOutput(name: string): FlowGraphSignalConnection {
        const output = new FlowGraphSignalConnection(name, FlowGraphConnectionType.Output, this);
        this._signalOutputs.push(output);
        return output;
    }
}
