import { FlowGraphBlock } from "../../../flowGraphBlock";
import { RichTypeBoolean, RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Module for all of the number math blocks.
 * @see https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 */

const ADDNAME = "FlowGraphAddNumberBlock";
/**
 * Outputs the addition of the left and right inputs.
 * @experimental
 */
export class FlowGraphAddNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + right, ADDNAME);
    }
}
RegisterClass(ADDNAME, FlowGraphAddNumberBlock);

const SUBNAME = "FlowGraphSubtractNumberBlock";
/**
 * Outputs the subtraction of the left and right inputs.
 * @experimental
 */
export class FlowGraphSubtractNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left - right, SUBNAME);
    }
}
RegisterClass(SUBNAME, FlowGraphSubtractNumberBlock);

const MULTIPLYNAME = "FlowGraphMultiplyNumberBlock";
/**
 * Outputs the multiplication of the left and right inputs.
 * @experimental
 */
export class FlowGraphMultiplyNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left * right, MULTIPLYNAME);
    }
}
RegisterClass(MULTIPLYNAME, FlowGraphMultiplyNumberBlock);

const DIVIDENAME = "FlowGraphDivideNumberBlock";
/**
 * Ouputs the division of the left and right inputs.
 * @experimental
 */
export class FlowGraphDivideNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left / right, DIVIDENAME);
    }
}
RegisterClass(DIVIDENAME, FlowGraphDivideNumberBlock);

const MODNAME = "FlowGraphModNumberBlock";
/**
 * Outputs the modulo of the left and right inputs.
 * @experimental
 */
export class FlowGraphModNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left % right, MODNAME);
    }
}
RegisterClass(MODNAME, FlowGraphModNumberBlock);

const POWNAME = "FlowGraphPowNumberBlock";
/**
 * Outputs left to the power of right.
 * @experimental
 */
export class FlowGraphPowNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.pow(left, right), POWNAME);
    }
}
RegisterClass(POWNAME, FlowGraphPowNumberBlock);

const ISNANNAME = "FlowGraphIsNaNNumberBlock";
/**
 * Outputs true if the number is NaN, false otherwise.
 * @experimental
 */
export class FlowGraphIsNaNNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeBoolean, (input) => isNaN(input), ISNANNAME);
    }
}
RegisterClass(ISNANNAME, FlowGraphIsNaNNumberBlock);

const ISINFINITENAME = "FlowGraphIsInfinityNumberBlock";
/**
 * Outputs true if the number is infinite, false otherwise.
 * @experimental
 */
export class FlowGraphIsInfinityNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeBoolean, (input) => !isFinite(input), ISINFINITENAME);
    }
}
RegisterClass(ISINFINITENAME, FlowGraphIsInfinityNumberBlock);

const SQRTNAME = "FlowGraphSqrtNumberBlock";
/**
 * Outputs the square root of the input.
 * @experimental
 */
export class FlowGraphSqrtNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.sqrt(input), SQRTNAME);
    }
}
RegisterClass(SQRTNAME, FlowGraphSqrtNumberBlock);

const ABSNAME = "FlowGraphAbsNumberBlock";
/**
 * Outputs the absolute value of the input.
 * @experimental
 */
export class FlowGraphAbsNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.abs(input), ABSNAME);
    }
}
RegisterClass(ABSNAME, FlowGraphAbsNumberBlock);

const NEGNAME = "FlowGraphNegateNumberBlock";
/**
 * Negates the input.
 * @experimental
 */
export class FlowGraphNegateNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => -input, NEGNAME);
    }
}
RegisterClass(NEGNAME, FlowGraphNegateNumberBlock);

const FLOORNAME = "FlowGraphFloorNumberBlock";
/**
 * Outputs the floor of the input.
 * @experimental
 */
export class FlowGraphFloorNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.floor(input), FLOORNAME);
    }
}
RegisterClass(FLOORNAME, FlowGraphFloorNumberBlock);

const CEILNAME = "FlowGraphCeilNumberBlock";
/**
 * Outputs the ceiling of the input.
 * @experimental
 */
export class FlowGraphCeilNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.ceil(input), CEILNAME);
    }
}
RegisterClass(CEILNAME, FlowGraphCeilNumberBlock);

const ROUNDNAME = "FlowGraphRoundNumberBlock";
/**
 * Rounds the left input to right digits of precision.
 * @see rounding function from: https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 * @experimental
 */
export class FlowGraphRoundNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (input, digits) => Math.round(input / Math.pow(10, digits)) / Math.pow(10, digits), ROUNDNAME);
    }
}
RegisterClass(ROUNDNAME, FlowGraphRoundNumberBlock);

const TRUNCNAME = "FlowGraphTruncNumberBlock";
/**
 * Truncates the input.
 * @experimental
 */
export class FlowGraphTruncNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.trunc(input), TRUNCNAME);
    }
}
RegisterClass(TRUNCNAME, FlowGraphTruncNumberBlock);

const EXPNAME = "FlowGraphExpNumberBlock";
/**
 * Outputs the exponential of the input.
 * @experimental
 */
export class FlowGraphExpNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.exp(input), EXPNAME);
    }
}
RegisterClass(EXPNAME, FlowGraphExpNumberBlock);

const LOG10NAME = "FlowGraphLog10NumberBlock";
/**
 * Outputs the base 10 logarithm of the input.
 * @experimental
 */
export class FlowGraphLog10NumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log10(input), LOG10NAME);
    }
}
RegisterClass(LOG10NAME, FlowGraphLog10NumberBlock);

const LOGNAME = "FlowGraphLogNumberBlock";
/**
 * Outputs the natural logarithm of the input.
 * @experimental
 */
export class FlowGraphLogNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log(input), LOGNAME);
    }
}
RegisterClass(LOGNAME, FlowGraphLogNumberBlock);

const LNNAME = "FlowGraphLnNumberBlock";
/**
 * Outputs the base 2 logarithm of the input.
 * @experimental
 */
export class FlowGraphLnNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log(input) / Math.LN2, LNNAME);
    }
}
RegisterClass(LNNAME, FlowGraphLnNumberBlock);

const SINENAME = "FlowGraphSineNumberBlock";
/**
 * Outputs the sine of the input.
 * @experimental
 */
export class FlowGraphSinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.sin(input), SINENAME);
    }
}
RegisterClass(SINENAME, FlowGraphSinNumberBlock);

const COSNAME = "FlowGraphCosNumberBlock";
/**
 * Outputs the cosine of the input.
 * @experimental
 */
export class FlowGraphCosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.cos(input), COSNAME);
    }
}
RegisterClass(COSNAME, FlowGraphCosNumberBlock);

const TANNAME = "FlowGraphTanNumberBlock";
/**
 * Outputs the tangent of the input.
 * @experimental
 */
export class FlowGraphTanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.tan(input), TANNAME);
    }
}
RegisterClass(TANNAME, FlowGraphTanNumberBlock);

const ASINENAME = "FlowGraphASineNumberBlock";
/**
 * Outputs the arcsine of the input.
 * @experimental
 */
export class FlowGraphASinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.asin(input), ASINENAME);
    }
}
RegisterClass(ASINENAME, FlowGraphASinNumberBlock);

const ACOSNAME = "FlowGraphACosNumberBlock";
/**
 * Outputs the arccosine of the input.
 * @experimental
 */
export class FlowGraphACosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.acos(input), ACOSNAME);
    }
}
RegisterClass(ACOSNAME, FlowGraphACosNumberBlock);

const ATANNAME = "FlowGraphATanNumberBlock";
/**
 * Outputs the arctangent of the input.
 * @experimental
 */
export class FlowGraphATanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.atan(input), ATANNAME);
    }
}
RegisterClass(ATANNAME, FlowGraphATanNumberBlock);

const ENAME = "FlowGraphENumberBlock";
/**
 * Outputs the number E.
 * @experimental
 */
export class FlowGraphENumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor() {
        super(RichTypeNumber, () => Math.E, ENAME);
    }
}
RegisterClass(ENAME, FlowGraphENumberBlock);

const PINAME = "FlowGraphPiNumberBlock";
/**
 * Outputs the number PI.
 * @experimental
 */
export class FlowGraphPiNumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor() {
        super(RichTypeNumber, () => Math.PI, PINAME);
    }
}
RegisterClass(PINAME, FlowGraphPiNumberBlock);

const ATAN2NAME = "FlowGraphATan2NumberBlock";
/**
 * Outputs the arctan2 of the left and right inputs.
 * @experimental
 */
export class FlowGraphATan2NumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.atan2(left, right), ATAN2NAME);
    }
}
RegisterClass(ATAN2NAME, FlowGraphATan2NumberBlock);

const RNDNAME = "FlowGraphRandomNumberBlock";
/**
 * @experimental
 * Outputs a number between left and right.
 */
export class FlowGraphRandomNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + Math.random() * (right - left), RNDNAME);
    }
}
RegisterClass(RNDNAME, FlowGraphRandomNumberBlock);

const MINNAME = "FlowGraphMinNumberBlock";
/**
 * Outputs the minimum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMinNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.min(left, right), MINNAME);
    }
}
RegisterClass(MINNAME, FlowGraphMinNumberBlock);

const MAXNAME = "FlowGraphMaxNumberBlock";
/**
 * Outputs the maximum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMaxNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.max(left, right), MAXNAME);
    }
}
RegisterClass(MAXNAME, FlowGraphMaxNumberBlock);

const EQUALSNAME = "FlowGraphEqualsNumberBlock";
/**
 * Outputs true if left is equal to right, false otherwise.
 * @experimental
 */
export class FlowGraphEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left === right, EQUALSNAME);
    }
}
RegisterClass(EQUALSNAME, FlowGraphEqualsNumberBlock);

const GREATERTHANNAME = "FlowGraphGreaterThanNumberBlock";
/**
 * Outputs true if left is greater than right, false otherwise.
 */
export class FlowGraphGreaterThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left > right, GREATERTHANNAME);
    }
}
RegisterClass(GREATERTHANNAME, FlowGraphGreaterThanNumberBlock);

const GREATEROREQUALNAME = "FlowGraphGreaterThanOrEqualsNumberBlock";
/**
 * Outputs true if left is greater than or equal to right, false otherwise.
 */
export class FlowGraphGreaterThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left >= right, GREATEROREQUALNAME);
    }
}
RegisterClass(GREATEROREQUALNAME, FlowGraphGreaterThanOrEqualsNumberBlock);

const LESSTHANNAME = "FlowGraphLessThanNumberBlock";
/**
 * Outputs true if left is less than right, false otherwise.
 */
export class FlowGraphLessThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left < right, LESSTHANNAME);
    }
}
RegisterClass(LESSTHANNAME, FlowGraphLessThanNumberBlock);

const LESSOREQUALNAME = "FlowGraphLessThanOrEqualsNumberBlock";
/**
 * Outputs true if left is less than or equal to right, false otherwise.
 */
export class FlowGraphLessThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor() {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left <= right, LESSOREQUALNAME);
    }
}
RegisterClass(LESSOREQUALNAME, FlowGraphLessThanOrEqualsNumberBlock);

const MIXNAME = "FlowGraphMixNumberBlock";
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

    public getClassName(): string {
        return MIXNAME;
    }
}
RegisterClass(MIXNAME, FlowGraphMixNumberBlock);
