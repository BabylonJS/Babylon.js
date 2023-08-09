import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export interface IFlowGraphBinaryOpBaseBlockParams<LeftT, RightT, OutputT> {
    graph: FlowGraph;
    defaultLeftValue: LeftT;
    defaultRightValue: RightT;
    binOp: (left: LeftT, right: RightT) => OutputT;
}

/**
 * @experimental
 */
export class FlowGraphBinaryOpBaseBlock<LeftT, RightT, OutputT> extends FlowGraphBlock {
    /**
     * The left input of the binary operation.
     */
    public readonly left: FlowGraphDataConnection<LeftT>;
    /**
     * The right input of the binary operation.
     */
    public readonly right: FlowGraphDataConnection<RightT>;
    /**
     * The output of the binary operation.
     */
    public readonly output: FlowGraphDataConnection<OutputT>;

    private readonly _binOp: (left: LeftT, right: RightT) => OutputT;

    public constructor(params: IFlowGraphBinaryOpBaseBlockParams<LeftT, RightT, OutputT>) {
        super(params.graph);

        this._binOp = params.binOp;

        this.left = this._registerDataInput("left", params.defaultLeftValue);
        this.right = this._registerDataInput("right", params.defaultRightValue);
        this.output = this._registerDataOutput("output", this._binOp(params.defaultLeftValue, params.defaultRightValue));
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        this.output.value = this._binOp(this.left.value, this.right.value);
    }
}
