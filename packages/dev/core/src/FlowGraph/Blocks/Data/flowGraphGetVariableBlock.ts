import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export class FlowGraphGetVariableBlock<T> extends FlowGraphBlock {
    public output: FlowGraphDataConnection<T>;
    constructor(graph: FlowGraph, private _variableName: string, private _defaultValue: T) {
        super(graph);

        this.output = this._registerDataOutput("output", _defaultValue);
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        this.output.value = this._graph.getVariable(this._variableName) ?? this._defaultValue;
    }
}