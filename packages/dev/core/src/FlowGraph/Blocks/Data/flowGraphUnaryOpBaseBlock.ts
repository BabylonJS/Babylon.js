import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export class FlowGraphUnaryOpBaseBlock<InputT, OutputT> extends FlowGraphBlock {
    public readonly input: FlowGraphDataConnection<InputT>;
    /**
     * The output of the operation.
     */
    public readonly output: FlowGraphDataConnection<OutputT>;

    private readonly _op: (input: InputT) => OutputT;

    public constructor(graph: FlowGraph, defaultInputValue: InputT, op: (input: InputT) => OutputT) {
        super(graph);

        this._op = op;

        this.input = this._registerDataInput("input", defaultInputValue);
        this.output = this._registerDataOutput("output", op(defaultInputValue));
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        this.output.value = this._op(this.input.value);
    }
}
