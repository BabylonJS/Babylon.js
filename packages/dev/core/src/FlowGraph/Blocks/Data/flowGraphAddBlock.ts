import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphConnectionPoint";
import type { iDataUpdater } from "../../dataUpdater";

/**
 * @experimental
 */
class FlowGraphBinaryOpBaseBlock<LeftType, RightType, OutputType> extends FlowGraphBlock implements iDataUpdater {
    /**
     * The left input of the binary operation.
     */
    public readonly left: FlowGraphDataConnectionPoint<LeftType>;
    /**
     * The right input of the binary operation.
     */
    public readonly right: FlowGraphDataConnectionPoint<RightType>;
    /**
     * The output of the binary operation.
     */
    public readonly output: FlowGraphDataConnectionPoint<OutputType>;
    private _binOp: (left: LeftType, right: RightType) => OutputType;

    constructor(graph: FlowGraph, defaultLeftValue: LeftType, defaultRightValue: RightType, defaultOutValue: OutputType, binOp: (left: LeftType, right: RightType) => OutputType) {
        super(graph);

        this.left = this._registerDataInput("left", defaultLeftValue);
        this.right = this._registerDataInput("right", defaultRightValue);
        this.output = this._registerDataOutput("output", defaultOutValue);
        this._binOp = binOp;
    }

    public _updateOutputs(): void {
        this.output.value = this._binOp(this.left.value, this.right.value);
    }
}

/**
 * @experimental
 * Block that adds two numbers.
 */
export class FlowGraphAddNumberBlock extends FlowGraphBinaryOpBaseBlock<number, number, number> {
    constructor(graph: FlowGraph) {
        super(graph, 0, 0, 0, (left, right) => left + right);
    }
}
