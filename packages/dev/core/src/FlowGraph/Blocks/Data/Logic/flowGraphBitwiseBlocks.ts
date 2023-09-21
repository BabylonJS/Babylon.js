import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";

export class FlowGraphBitwiseAndBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left & right);
    }
}

export class FlowGraphBitwiseOrBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left | right);
    }
}

export class FlowGraphBitwiseXorBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left ^ right);
    }
}

export class FlowGraphBitwiseNotBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (value) => ~value);
    }
}

export class FlowGraphBitwiseLeftShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left << right);
    }
}

export class FlowGraphBitwiseRightShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left >> right);
    }
}

export class FlowGraphCountLeadingZerosBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (value) => Math.clz32(value));
    }
}

export class FlowGraphCountTrailingZerosBlock extends FlowGraphUnaryOperationBlock<number, number> {
    // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32#implementing_count_leading_ones_and_beyond
    private _ctrz(integer: number) {
        integer >>>= 0; // coerce to Uint32
        if (integer === 0) {
            // skipping this step would make it return -1
            return 32;
        }
        integer &= -integer; // equivalent to `int = int & (~int + 1)`
        return 31 - Math.clz32(integer);
    }

    constructor() {
        super(RichTypeNumber, RichTypeNumber, (value) => this._ctrz(value));
    }
}
