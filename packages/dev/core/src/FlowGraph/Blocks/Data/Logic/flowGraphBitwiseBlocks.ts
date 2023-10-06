import { RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

const BLOCK_NAME_PREFIX = "FlowGraphBitwise";
const BLOCK_NAME_AND = "AndBlock";
const BLOCK_NAME_OR = "OrBlock";
const BLOCK_NAME_XOR = "XorBlock";
const BLOCK_NAME_NOT = "NotBlock";
const BLOCK_NAME_LEFT_SHIFT = "LeftShiftBlock";
const BLOCK_NAME_RIGHT_SHIFT = "RightShiftBlock";
const BLOCK_NAME_COUNT_LEADING_ZEROS = "CountLeadingZerosBlock";
const BLOCK_NAME_COUNT_TRAILING_ZEROS = "CountTrailingZerosBlock";

/**
 * @experimental
 * Performs a bitwise AND operation on two numbers.
 */
export class FlowGraphBitwiseAndBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left & right, `${BLOCK_NAME_PREFIX}${BLOCK_NAME_AND}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_AND}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_AND}`, FlowGraphBitwiseAndBlock);

/**
 * @experimental
 * Performs a bitwise OR operation on two numbers.
 */
export class FlowGraphBitwiseOrBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left | right, `${BLOCK_NAME_PREFIX}${BLOCK_NAME_OR}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_OR}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_OR}`, FlowGraphBitwiseOrBlock);

/**
 * @experimental
 * Performs a bitwise XOR operation on two numbers.
 */
export class FlowGraphBitwiseXorBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left ^ right, `${BLOCK_NAME_PREFIX}${BLOCK_NAME_XOR}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_XOR}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_XOR}`, FlowGraphBitwiseXorBlock);

/**
 * @experimental
 * Performs a bitwise NOT operation on a number.
 */
export class FlowGraphBitwiseNotBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (value) => ~value, `${BLOCK_NAME_PREFIX}${BLOCK_NAME_NOT}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_NOT}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_NOT}`, FlowGraphBitwiseNotBlock);

/**
 * @experimental
 * Left shifts a number by a specified amount.
 */
export class FlowGraphBitwiseLeftShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left << right, `${BLOCK_NAME_PREFIX}${BLOCK_NAME_LEFT_SHIFT}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_LEFT_SHIFT}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_LEFT_SHIFT}`, FlowGraphBitwiseLeftShiftBlock);

/**
 * @experimental
 * Right shifts a number by a specified amount.
 */
export class FlowGraphBitwiseRightShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left >> right, `${BLOCK_NAME_PREFIX}${BLOCK_NAME_RIGHT_SHIFT}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_RIGHT_SHIFT}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_RIGHT_SHIFT}`, FlowGraphBitwiseRightShiftBlock);

/**
 * @experimental
 * Counts the leading zero bits of a number
 */
export class FlowGraphCountLeadingZerosBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (value) => Math.clz32(value), `${BLOCK_NAME_PREFIX}${BLOCK_NAME_COUNT_LEADING_ZEROS}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_COUNT_LEADING_ZEROS}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_COUNT_LEADING_ZEROS}`, FlowGraphCountLeadingZerosBlock);

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
        super(RichTypeNumber, RichTypeNumber, (value) => this._ctrz(value), `${BLOCK_NAME_PREFIX}${BLOCK_NAME_COUNT_TRAILING_ZEROS}`, config);
    }

    public getClassName(): string {
        return `${BLOCK_NAME_PREFIX}${BLOCK_NAME_COUNT_TRAILING_ZEROS}`;
    }
}
RegisterClass(`${BLOCK_NAME_PREFIX}${BLOCK_NAME_COUNT_TRAILING_ZEROS}`, FlowGraphCountTrailingZerosBlock);
