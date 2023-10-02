import { RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Performs a bitwise AND operation on two numbers.
 */
export class FlowGraphBitwiseAndBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphBitwiseAndBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left & right, "FlowGraphBitwiseAndBlock");
    }

    public getClassName(): string {
        return "FlowGraphBitwiseAndBlock";
    }
}
RegisterClass("FlowGraphBitwiseAndBlock", FlowGraphBitwiseAndBlock);

/**
 * @experimental
 * Performs a bitwise OR operation on two numbers.
 */
export class FlowGraphBitwiseOrBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphBitwiseOrBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left | right, "FlowGraphBitwiseOrBlock");
    }

    public getClassName(): string {
        return "FlowGraphBitwiseOrBlock";
    }
}
RegisterClass("FlowGraphBitwiseOrBlock", FlowGraphBitwiseOrBlock);

/**
 * @experimental
 * Performs a bitwise XOR operation on two numbers.
 */
export class FlowGraphBitwiseXorBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphBitwiseXorBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left ^ right, "FlowGraphBitwiseXorBlock");
    }

    public getClassName(): string {
        return "FlowGraphBitwiseXorBlock";
    }
}
RegisterClass("FlowGraphBitwiseXorBlock", FlowGraphBitwiseXorBlock);

/**
 * @experimental
 * Performs a bitwise NOT operation on a number.
 */
export class FlowGraphBitwiseNotBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphBitwiseNotBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (value) => ~value, "FlowGraphBitwiseNotBlock");
    }

    public getClassName(): string {
        return "FlowGraphBitwiseNotBlock";
    }
}
RegisterClass("FlowGraphBitwiseNotBlock", FlowGraphBitwiseNotBlock);
/**
 * @experimental
 * Left shifts a number by a specified amount.
 */
export class FlowGraphBitwiseLeftShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphBitwiseLeftShiftBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left << right, "FlowGraphBitwiseLeftShiftBlock");
    }

    public getClassName(): string {
        return "FlowGraphBitwiseLeftShiftBlock";
    }
}
RegisterClass("FlowGraphBitwiseLeftShiftBlock", FlowGraphBitwiseLeftShiftBlock);
/**
 * @experimental
 * Right shifts a number by a specified amount.
 */
export class FlowGraphBitwiseRightShiftBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphBitwiseRightShiftBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left >> right, "FlowGraphBitwiseRightShiftBlock");
    }

    public getClassName(): string {
        return "FlowGraphBitwiseRightShiftBlock";
    }
}
RegisterClass("FlowGraphBitwiseRightShiftBlock", FlowGraphBitwiseRightShiftBlock);
/**
 * @experimental
 * Counts the leading zero bits of a number
 */
export class FlowGraphCountLeadingZerosBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCountLeadingZerosBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (value) => Math.clz32(value), "FlowGraphCountLeadingZerosBlock");
    }

    public getClassName(): string {
        return "FlowGraphCountLeadingZerosBlock";
    }
}
RegisterClass("FlowGraphCountLeadingZerosBlock", FlowGraphCountLeadingZerosBlock);
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

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCountTrailingZerosBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (value) => this._ctrz(value), "FlowGraphCountTrailingZerosBlock");
    }

    public getClassName(): string {
        return "FlowGraphCountTrailingZerosBlock";
    }
}
RegisterClass("FlowGraphCountTrailingZerosBlock", FlowGraphCountTrailingZerosBlock);
