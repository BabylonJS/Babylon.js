import { FlowGraphBlock } from "../../../flowGraphBlock";
import { RichTypeBoolean, RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import type { FlowGraphContext } from "../../../flowGraphContext";

/**
 * Module for all of the number math blocks.
 * @see https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 */

/**
 * Outputs the addition of the left and right inputs.
 * @experimental
 */
export class FlowGraphAddNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + right, "FlowGraphAddNumberBlock");
    }
}

/**
 * Outputs the subtraction of the left and right inputs.
 * @experimental
 */
export class FlowGraphSubtractNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left - right, "FlowGraphSubtractNumberBlock");
    }
}

/**
 * Outputs the multiplication of the left and right inputs.
 * @experimental
 */
export class FlowGraphMultiplyNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left * right, "FlowGraphMultiplyNumberBlock");
    }
}

/**
 * Ouputs the division of the left and right inputs.
 * @experimental
 */
export class FlowGraphDivideNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left / right, "FlowGraphDivideNumberBlock");
    }
}

/**
 * Outputs the modulo of the left and right inputs.
 * @experimental
 */
export class FlowGraphModNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left % right, "FlowGraphModNumberBlock");
    }
}

/**
 * Outputs left to the power of right.
 * @experimental
 */
export class FlowGraphPowNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.pow(left, right), "FlowGraphPowNumberBlock");
    }
}

/**
 * Outputs true if the number is NaN, false otherwise.
 * @experimental
 */
export class FlowGraphIsNaNNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeBoolean, (input) => isNaN(input), "FlowGraphIsNaNNumberBlock");
    }
}

/**
 * Outputs true if the number is infinite, false otherwise.
 * @experimental
 */
export class FlowGraphIsInfinityNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeBoolean, (input) => !isFinite(input), "FlowGraphIsInfinityNumberBlock");
    }
}

/**
 * Outputs the square root of the input.
 * @experimental
 */
export class FlowGraphSqrtNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.sqrt(input), "FlowGraphSqrtNumberBlock");
    }
}

/**
 * Outputs the absolute value of the input.
 * @experimental
 */
export class FlowGraphAbsNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.abs(input), "FlowGraphAbsNumberBlock");
    }
}

/**
 * Negates the input.
 * @experimental
 */
export class FlowGraphNegateNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => -input, "FlowGraphNegateNumberBlock");
    }
}

/**
 * Outputs the floor of the input.
 * @experimental
 */
export class FlowGraphFloorNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.floor(input), "FlowGraphFloorNumberBlock");
    }
}

/**
 * Outputs the ceiling of the input.
 * @experimental
 */
export class FlowGraphCeilNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.ceil(input), "FlowGraphCeilNumberBlock");
    }
}

/**
 * Rounds the left input to right digits of precision.
 * @see rounding function from: https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 * @experimental
 */
export class FlowGraphRoundNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (input, digits) => Math.round(input / Math.pow(10, digits)) / Math.pow(10, digits), "FlowGraphRoundNumberBlock");
    }
}

/**
 * Truncates the input.
 * @experimental
 */
export class FlowGraphTruncNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.trunc(input), "FlowGraphTruncNumberBlock");
    }
}

/**
 * Outputs the exponential of the input.
 * @experimental
 */
export class FlowGraphExpNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.exp(input), "FlowGraphExpNumberBlock");
    }
}

/**
 * Outputs the base 10 logarithm of the input.
 * @experimental
 */
export class FlowGraphLog10NumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log10(input), "FlowGraphLog10NumberBlock");
    }
}

/**
 * Outputs the natural logarithm of the input.
 * @experimental
 */
export class FlowGraphLogNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log(input), "FlowGraphLogNumberBlock");
    }
}

/**
 * Outputs the base 2 logarithm of the input.
 * @experimental
 */
export class FlowGraphLnNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log(input) / Math.LN2, "FlowGraphLnNumberBlock");
    }
}

/**
 * Outputs the sine of the input.
 * @experimental
 */
export class FlowGraphSinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.sin(input), "FlowGraphSinNumberBlock");
    }
}

/**
 * Outputs the cosine of the input.
 * @experimental
 */
export class FlowGraphCosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.cos(input), "FlowGraphCosNumberBlock");
    }
}

/**
 * Outputs the tangent of the input.
 * @experimental
 */
export class FlowGraphTanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.tan(input), "FlowGraphTanNumberBlock");
    }
}

/**
 * Outputs the arcsine of the input.
 * @experimental
 */
export class FlowGraphASinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.asin(input), "FlowGraphASinNumberBlock");
    }
}

/**
 * Outputs the arccosine of the input.
 * @experimental
 */
export class FlowGraphACosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.acos(input), "FlowGraphACosNumberBlock");
    }
}

/**
 * Outputs the arctangent of the input.
 * @experimental
 */
export class FlowGraphATanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.atan(input), "FlowGraphATanNumberBlock");
    }
}

/**
 * Outputs the number E.
 * @experimental
 */
export class FlowGraphENumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor() {
        super(RichTypeNumber, () => Math.E);
    }
}

/**
 * Outputs the number PI.
 * @experimental
 */
export class FlowGraphPiNumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor() {
        super(RichTypeNumber, () => Math.PI);
    }
}

/**
 * Outputs the arctan2 of the left and right inputs.
 * @experimental
 */
export class FlowGraphATan2NumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.atan2(left, right), "FlowGraphATan2NumberBlock");
    }
}

/**
 * @experimental
 * Outputs a number between left and right.
 */
export class FlowGraphRandomNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + Math.random() * (right - left), "FlowGraphRandomNumberBlock");
    }
}

/**
 * Outputs the minimum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMinNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.min(left, right), "FlowGraphMinNumberBlock");
    }
}

/**
 * Outputs the maximum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMaxNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.max(left, right), "FlowGraphMaxNumberBlock");
    }
}

/**
 * Outputs true if left is equal to right, false otherwise.
 * @experimental
 */
export class FlowGraphEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left === right, "FlowGraphEqualsNumberBlock");
    }
}

/**
 * Outputs true if left is greater than right, false otherwise.
 */
export class FlowGraphGreaterThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left > right, "FlowGraphGreaterThanNumberBlock");
    }
}

/**
 * Outputs true if left is greater than or equal to right, false otherwise.
 */
export class FlowGraphGreaterThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left >= right, "FlowGraphGreaterThanOrEqualsNumberBlock");
    }
}

/**
 * Outputs true if left is less than right, false otherwise.
 */
export class FlowGraphLessThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left < right, "FlowGraphLessThanNumberBlock");
    }
}

/**
 * Outputs true if left is less than or equal to right, false otherwise.
 */
export class FlowGraphLessThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left <= right, "FlowGraphLessThanOrEqualsNumberBlock");
    }
}

/**
 * Outputs a mix of left and right based on alpha.
 * @experimental
 */
export class FlowGraphMixNumberBlock extends FlowGraphBlock {
    public leftInput: FlowGraphDataConnection<number>;
    public rightInput: FlowGraphDataConnection<number>;
    public alphaInput: FlowGraphDataConnection<number>;

    public resultOutput: FlowGraphDataConnection<number>;

    constructor() {
        super();
        this.leftInput = this._registerDataInput("leftInput", RichTypeNumber);
        this.rightInput = this._registerDataInput("rightInput", RichTypeNumber);
        this.alphaInput = this._registerDataInput("alphaInput", RichTypeNumber);
        this.resultOutput = this._registerDataOutput("resultOutput", RichTypeNumber);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const left = this.leftInput.getValue(_context);
        const right = this.rightInput.getValue(_context);
        const alpha = this.alphaInput.getValue(_context);
        const mix = left + (right - left) * alpha;
        this.resultOutput.setValue(mix, _context);
    }
}
