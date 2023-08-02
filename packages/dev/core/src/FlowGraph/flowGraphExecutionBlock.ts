import type { FlowGraph } from "./flowGraph";
import { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnectionPointDirection, FlowGraphSignalConnectionPoint } from "./flowGraphConnectionPoint";

/**
 * @experimental
 * A block that executes some action. Always has an input signal.
 * Can have one or more output signals.
 */
export abstract class FlowGraphExecutionBlock extends FlowGraphBlock {
    /**
     * The input signal of the block.
     */
    public readonly onStart: FlowGraphSignalConnectionPoint;

    private readonly _signalInputs: FlowGraphSignalConnectionPoint[] = [];
    private readonly _signalOutputs: FlowGraphSignalConnectionPoint[] = [];

    constructor(graph: FlowGraph) {
        super(graph);

        this.onStart = this._registerSignalInput("onStart");
    }
    /**
     * @internal
     * Executes the flow graph execution block.
     */
    public abstract _execute(): void;

    protected _registerSignalInput(name: string): FlowGraphSignalConnectionPoint {
        const input = new FlowGraphSignalConnectionPoint(name, FlowGraphConnectionPointDirection.Input, this);
        this._signalInputs.push(input);
        return input;
    }

    protected _registerSignalOutput(name: string): FlowGraphSignalConnectionPoint {
        const output = new FlowGraphSignalConnectionPoint(name, FlowGraphConnectionPointDirection.Output, this);
        this._signalOutputs.push(output);
        return output;
    }
}
