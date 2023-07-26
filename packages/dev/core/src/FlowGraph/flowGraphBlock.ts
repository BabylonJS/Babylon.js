import type { FlowGraph } from "./flowGraph";
import { FlowGraphDataConnectionPoint, FlowGraphConnectionPointDirection } from "./flowGraphConnectionPoint";

export abstract class FlowGraphBlock {
    public name: string;
    public dataInputs: FlowGraphDataConnectionPoint<any>[] = [];
    public dataOutputs: FlowGraphDataConnectionPoint<any>[] = [];
    private _graph: FlowGraph;

    constructor(graph: FlowGraph) {
        this._graph = graph;
        this._graph.addBlock(this);
    }

    protected _registerDataInput<T>(name: string, defaultValue: T): FlowGraphDataConnectionPoint<T> {
        const input = new FlowGraphDataConnectionPoint<T>();
        input.name = name;
        input.direction = FlowGraphConnectionPointDirection.Input;
        input.value = defaultValue;
        input.ownerBlock = this;
        this.dataInputs.push(input);
        return input;
    }

    protected _registerDataOutput<T>(name: string, defaultValue: T): FlowGraphDataConnectionPoint<T> {
        const output = new FlowGraphDataConnectionPoint<T>();
        output.name = name;
        output.direction = FlowGraphConnectionPointDirection.Output;
        output.value = defaultValue;
        output.ownerBlock = this;
        this.dataOutputs.push(output);
        return output;
    }
}
