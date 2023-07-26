import type { FlowGraph } from "./flowGraph";
import { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnectionPointDirection, FlowGraphSignalConnectionPoint } from "./flowGraphConnectionPoint";

export abstract class FlowGraphExecutionBlock extends FlowGraphBlock {
    public readonly flowIn: FlowGraphSignalConnectionPoint;

    private readonly _signalInputs: FlowGraphSignalConnectionPoint[] = [];
    private readonly _signalOutputs: FlowGraphSignalConnectionPoint[] = [];

    constructor(graph: FlowGraph) {
        super(graph);

        this.flowIn = this._registerSignalInput("flowIn");
    }
    /**
     * Executes the flow graph execution block.
     */
    abstract execute(): void;

    protected _registerSignalInput(name: string): FlowGraphSignalConnectionPoint {
        const input = new FlowGraphSignalConnectionPoint();
        input.name = name;
        input.direction = FlowGraphConnectionPointDirection.Input;
        input.ownerBlock = this;
        this._signalInputs.push(input);
        return input;
    }

    protected _registerSignalOutput(name: string): FlowGraphSignalConnectionPoint {
        const output = new FlowGraphSignalConnectionPoint();
        output.name = name;
        output.direction = FlowGraphConnectionPointDirection.Output;
        output.ownerBlock = this;
        this._signalOutputs.push(output);
        return output;
    }
}
