import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export interface IFlowGraphUnaryOpBaseBlockParams<InputT, OutputT> {
    defaultInputValue: InputT;
    op: (input: InputT) => OutputT;
}
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

    public constructor(params: IFlowGraphUnaryOpBaseBlockParams<InputT, OutputT>) {
        super();

        this._op = params.op;

        this.input = this._registerDataInput("input", params.defaultInputValue);
        this.output = this._registerDataOutput("output", this._op(params.defaultInputValue));
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        this.output.value = this._op(this.input.getValue(context)!);
    }
}
