import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     *
     */
    public readonly input: FlowGraphDataConnection<T>;
    constructor(graph: FlowGraph, private _variableName: string, defaultValue: T) {
        super(graph);

        this.input = this._registerDataInput("input", defaultValue);
    }

    public _execute(): void {
        this._graph.setVariable(this._variableName, this.input.value);
        this.onDone._activateSignal();
    }
}