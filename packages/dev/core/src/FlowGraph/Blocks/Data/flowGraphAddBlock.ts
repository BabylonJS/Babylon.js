import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnectionPoint } from "../../flowGraphConnectionPoint";
import type { DataUpdater } from "../../iDataUpdater";

/**
 * @experimental
 */
class FlowGraphBinaryOpBaseBlock<T, E, R> extends FlowGraphBlock implements DataUpdater {
    public left: FlowGraphDataConnectionPoint<T>;
    public right: FlowGraphDataConnectionPoint<E>;
    public output: FlowGraphDataConnectionPoint<R>;
    private _binOp: (left: T, right: E) => R;

    constructor(graph: FlowGraph, defaultT: T, defaultE: E, defaultR: R, binOp: (left: T, right: E) => R) {
        super(graph);

        this.left = this._registerDataInput("left", defaultT);
        this.right = this._registerDataInput("right", defaultE);
        this.output = this._registerDataOutput("output", defaultR);
        this._binOp = binOp;
    }

    public updateOutputs(): void {
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
