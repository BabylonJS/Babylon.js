import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphConnectionPoint";
import type { DataUpdater } from "../../iDataUpdater";

export class ConvertDataBlock<T, E> extends FlowGraphBlock implements DataUpdater {
    public input: FlowGraphDataConnectionPoint<T>;
    public output: FlowGraphDataConnectionPoint<E>;

    private _convertFunction: (input: T) => E;

    constructor(graph: FlowGraph, defaultValueForInput: T, defaultValueForOutput: E, convertFunction: (input: T) => E) {
        super(graph);

        this.input = this._registerDataInput("input", defaultValueForInput);
        this.output = this._registerDataOutput("output", defaultValueForOutput);
        this._convertFunction = convertFunction;
    }

    public updateOutputs(): void {
        this.output.value = this._convertFunction(this.input.value);
    }
}
