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
    /**
     * Set the value of the left input
     */
    public readonly setLeft: (value: LeftT) => void;
    /**
     * Set the value of the right input
     */
    public readonly setRight: (value: RightT) => void;

    private readonly _binOp: (left: LeftT, right: RightT) => OutputT;
    private readonly _setOutput: (value: OutputT) => void;

    public constructor(graph: FlowGraph, defaultLeftValue: LeftT, defaultRightValue: RightT, binOp: (left: LeftT, right: RightT) => OutputT) {
        super(graph);

        const leftRegister = this._registerDataInput("left", defaultLeftValue);
        this.left = leftRegister.connectionPoint;
        this.setLeft = leftRegister.valueSetter;

        const rightRegister = this._registerDataInput("right", defaultRightValue);
        this.right = rightRegister.connectionPoint;
        this.setRight = rightRegister.valueSetter;

        const outRegister = this._registerDataOutput("output", binOp(defaultLeftValue, defaultRightValue));
        this.output = outRegister.connectionPoint;
        this._setOutput = outRegister.valueSetter;

        this._binOp = binOp;
    }

    public _updateOutputs(): void {
        this._setOutput(this._binOp(this.left.value, this.right.value));
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
