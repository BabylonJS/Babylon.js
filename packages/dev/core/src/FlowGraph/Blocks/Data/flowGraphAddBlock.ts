import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { IDataUpdater } from "../../dataUpdater";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphDataConnectionPoint";
import type { ValueSetter } from "../../valueContainer";

/**
 * @experimental
 */
class FlowGraphBinaryOpBaseBlock<LeftType, RightType, OutputType> extends FlowGraphBlock implements IDataUpdater {
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

    /**
     * Set the value of the left input
     */
    public setLeft: ValueSetter<LeftType>;
    /**
     * Set the value of the right input
     */
    public setRight: ValueSetter<RightType>;
    private _setOutput: ValueSetter<OutputType>;

    constructor(graph: FlowGraph, defaultLeftValue: LeftType, defaultRightValue: RightType, defaultOutValue: OutputType, binOp: (left: LeftType, right: RightType) => OutputType) {
        super(graph);

        const leftRegister = this._registerDataInput("left", defaultLeftValue);
        this.left = leftRegister.connectionPoint;
        this.setLeft = leftRegister.valueSetter;

        const rightRegister = this._registerDataInput("right", defaultRightValue);
        this.right = rightRegister.connectionPoint;
        this.setRight = rightRegister.valueSetter;

        const outRegister = this._registerDataOutput("output", defaultOutValue);
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
    constructor(graph: FlowGraph) {
        super(graph, 0, 0, 0, (left, right) => left + right);
    }
}
