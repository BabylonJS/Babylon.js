import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
class FlowGraphBinaryOpBaseBlock<LeftT, RightT, OutputT> extends FlowGraphBlock {
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

    public constructor(graph: FlowGraph, defaultLeftValue: LeftT, defaultRightValue: RightT, binOp: (left: LeftT, right: RightT) => OutputT) {
        super(graph);

        this._binOp = binOp;

        this.left = this._registerDataInput("left", defaultLeftValue);
        this.right = this._registerDataInput("right", defaultRightValue);
        this.output = this._registerDataOutput("output", binOp(defaultLeftValue, defaultRightValue));
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        this.output.value = this._binOp(this.left.value, this.right.value);
    }
}

/**
 * @experimental
 * Block that adds two numbers.
 */
export class FlowGraphAddNumberBlock extends FlowGraphBinaryOpBaseBlock<number, number, number> {
    public constructor(graph: FlowGraph) {
        super(graph, 0, 0, (left, right) => left + right);
    }
}
