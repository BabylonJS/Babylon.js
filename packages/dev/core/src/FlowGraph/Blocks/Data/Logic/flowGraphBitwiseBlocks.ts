import { RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

const PREFIX = "FGBitwise";
const AND = "AndBlock";
const OR = "OrBlock";
const XOR = "XorBlock";
const NOT = "NotBlock";
const LSHIFT = "LeftShiftBlock";
const RSHIFT = "RightShiftBlock";
const CLZ = "CountLeadingZerosBlock";
const CTZ = "CountTrailingZerosBlock";

/**
 * @experimental
 * Performs a bitwise AND operation on two numbers.
 */
export class FlowGraphBitwiseAndBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left & right, `${PREFIX}${AND}`, config);
    }
}
RegisterClass(`${PREFIX}${AND}`, FlowGraphBitwiseAndBlock);

/**
 * @experimental
 * Performs a bitwise OR operation on two numbers.
 */
export class FlowGraphBitwiseOrBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left | right, `${PREFIX}${OR}`, config);
    }
}
RegisterClass(`${PREFIX}${OR}`, FlowGraphBitwiseOrBlock);

/**
 * @experimental
 * Performs a bitwise XOR operation on two numbers.
 */
export class FlowGraphBitwiseXorBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left ^ right, `${PREFIX}${XOR}`, config);
    }
}
RegisterClass(`${PREFIX}${XOR}`, FlowGraphBitwiseXorBlock);

/**
 * @experimental
 * Performs a bitwise NOT operation on a number.
 */
export class FlowGraphBitwiseNotBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (value) => ~value, `${PREFIX}${NOT}`, config);
    }
}
RegisterClass(`${PREFIX}${NOT}`, FlowGraphBitwiseNotBlock);

/**
 * @experimental
 * Left shifts a number by a specified amount.
 */
export class FlowGraphBitwiseLeftShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left << right, `${PREFIX}${LSHIFT}`, config);
    }
}
RegisterClass(`${PREFIX}${LSHIFT}`, FlowGraphBitwiseLeftShiftBlock);

/**
 * @experimental
 * Right shifts a number by a specified amount.
 */
export class FlowGraphBitwiseRightShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left >> right, `${PREFIX}${RSHIFT}`, config);
    }
}
RegisterClass(`${PREFIX}${RSHIFT}`, FlowGraphBitwiseRightShiftBlock);

/**
 * @experimental
 * Counts the leading zero bits of a number
 */
export class FlowGraphCountLeadingZerosBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (value) => Math.clz32(value), `${PREFIX}${CLZ}`, config);
    }
}
RegisterClass(`${PREFIX}${CLZ}`, FlowGraphCountLeadingZerosBlock);

/**
 * @experimental
 * Counts the trailing zero bits of a number
 */
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

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (value) => this._ctrz(value), `${PREFIX}${CTZ}`, config);
    }
}
RegisterClass(`${PREFIX}${CTZ}`, FlowGraphCountTrailingZerosBlock);
