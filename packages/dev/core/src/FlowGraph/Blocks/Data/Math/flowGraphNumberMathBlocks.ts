import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
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

const ADDNAME = "FGAddNumberBlock";
/**
 * Outputs the addition of the left and right inputs.
 * @experimental
 */
export class FlowGraphAddNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + right, ADDNAME, config);
    }
}
RegisterClass(ADDNAME, FlowGraphAddNumberBlock);

const SUBNAME = "FGSubtractNumberBlock";
/**
 * Outputs the subtraction of the left and right inputs.
 * @experimental
 */
export class FlowGraphSubtractNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left - right, SUBNAME, config);
    }
}
RegisterClass(SUBNAME, FlowGraphSubtractNumberBlock);

const MULTIPLYNAME = "FGMultiplyNumberBlock";
/**
 * Outputs the multiplication of the left and right inputs.
 * @experimental
 */
export class FlowGraphMultiplyNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left * right, MULTIPLYNAME, config);
    }
}
RegisterClass(MULTIPLYNAME, FlowGraphMultiplyNumberBlock);

const DIVIDENAME = "FGDivideNumberBlock";
/**
 * Ouputs the division of the left and right inputs.
 * @experimental
 */
export class FlowGraphDivideNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left / right, DIVIDENAME, config);
    }
}
RegisterClass(DIVIDENAME, FlowGraphDivideNumberBlock);

const MODNAME = "FGModNumberBlock";
/**
 * Outputs the modulo of the left and right inputs.
 * @experimental
 */
export class FlowGraphModNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left % right, MODNAME, config);
    }
}
RegisterClass(MODNAME, FlowGraphModNumberBlock);

const POWNAME = "FGPowNumberBlock";
/**
 * Outputs left to the power of right.
 * @experimental
 */
export class FlowGraphPowNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.pow(left, right), POWNAME, config);
    }
}
RegisterClass(POWNAME, FlowGraphPowNumberBlock);

const ISNANNAME = "FGIsNaNNumberBlock";
/**
 * Outputs true if the number is NaN, false otherwise.
 * @experimental
 */
export class FlowGraphIsNaNNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeBoolean, (input) => isNaN(input), ISNANNAME, config);
    }
}
RegisterClass(ISNANNAME, FlowGraphIsNaNNumberBlock);

const ISINFINITENAME = "FGIsInfinityNumberBlock";
/**
 * Outputs true if the number is infinite, false otherwise.
 * @experimental
 */
export class FlowGraphIsInfinityNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeBoolean, (input) => !isFinite(input), ISINFINITENAME, config);
    }
}
RegisterClass(ISINFINITENAME, FlowGraphIsInfinityNumberBlock);

const SQRTNAME = "FGSqrtNumberBlock";
/**
 * Outputs the square root of the input.
 * @experimental
 */
export class FlowGraphSqrtNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.sqrt(input), SQRTNAME, config);
    }
}
RegisterClass(SQRTNAME, FlowGraphSqrtNumberBlock);

const ABSNAME = "FGAbsNumberBlock";
/**
 * Outputs the absolute value of the input.
 * @experimental
 */
export class FlowGraphAbsNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.abs(input), ABSNAME, config);
    }
}
RegisterClass(ABSNAME, FlowGraphAbsNumberBlock);

const NEGNAME = "FGNegateNumberBlock";
/**
 * Negates the input.
 * @experimental
 */
export class FlowGraphNegateNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => -input, NEGNAME, config);
    }
}
RegisterClass(NEGNAME, FlowGraphNegateNumberBlock);

const FLOORNAME = "FGFloorNumberBlock";
/**
 * Outputs the floor of the input.
 * @experimental
 */
export class FlowGraphFloorNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.floor(input), FLOORNAME, config);
    }
}

RegisterClass(FLOORNAME, FlowGraphFloorNumberBlock);

const CEILNAME = "FGCeilNumberBlock";
/**
 * Outputs the ceiling of the input.
 * @experimental
 */
export class FlowGraphCeilNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.ceil(input), CEILNAME, config);
    }
}
RegisterClass(CEILNAME, FlowGraphCeilNumberBlock);

const ROUNDNAME = "FGRoundNumberBlock";
/**
 * Rounds the left input to right digits of precision.
 * @see rounding function from: https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 * @experimental
 */
export class FlowGraphRoundNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (input, digits) => Math.round(input / Math.pow(10, digits)) / Math.pow(10, digits), ROUNDNAME, config);
    }
}
RegisterClass(ROUNDNAME, FlowGraphRoundNumberBlock);

const TRUNCNAME = "FGTruncNumberBlock";
/**
 * Truncates the input.
 * @experimental
 */
export class FlowGraphTruncNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.trunc(input), TRUNCNAME, config);
    }
}
RegisterClass(TRUNCNAME, FlowGraphTruncNumberBlock);

const EXPNAME = "FGExpNumberBlock";
/**
 * Outputs the exponential of the input.
 * @experimental
 */
export class FlowGraphExpNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.exp(input), EXPNAME, config);
    }
}
RegisterClass(EXPNAME, FlowGraphExpNumberBlock);

const LOG10NAME = "FGLog10NumberBlock";
/**
 * Outputs the base 10 logarithm of the input.
 * @experimental
 */
export class FlowGraphLog10NumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log10(input), LOG10NAME, config);
    }
}
RegisterClass(LOG10NAME, FlowGraphLog10NumberBlock);

const LOGNAME = "FGLogNumberBlock";
/**
 * Outputs the natural logarithm of the input.
 * @experimental
 */
export class FlowGraphLogNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log(input), LOGNAME, config);
    }
}
RegisterClass(LOGNAME, FlowGraphLogNumberBlock);

const LNNAME = "FGLnNumberBlock";
/**
 * Outputs the base 2 logarithm of the input.
 * @experimental
 */
export class FlowGraphLnNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.log(input) / Math.LN2, LNNAME, config);
    }
}
RegisterClass(LNNAME, FlowGraphLnNumberBlock);

const SINENAME = "FGSineNumberBlock";
/**
 * Outputs the sine of the input.
 * @experimental
 */
export class FlowGraphSinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.sin(input), SINENAME, config);
    }
}
RegisterClass(SINENAME, FlowGraphSinNumberBlock);

const COSNAME = "FGCosNumberBlock";
/**
 * Outputs the cosine of the input.
 * @experimental
 */
export class FlowGraphCosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.cos(input), COSNAME, config);
    }
}
RegisterClass(COSNAME, FlowGraphCosNumberBlock);

const TANNAME = "FGTanNumberBlock";
/**
 * Outputs the tangent of the input.
 * @experimental
 */
export class FlowGraphTanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.tan(input), TANNAME, config);
    }
}
RegisterClass(TANNAME, FlowGraphTanNumberBlock);

const ASINENAME = "FGASineNumberBlock";
/**
 * Outputs the arcsine of the input.
 * @experimental
 */
export class FlowGraphASinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.asin(input), ASINENAME, config);
    }
}
RegisterClass(ASINENAME, FlowGraphASinNumberBlock);

const ACOSNAME = "FGACosNumberBlock";
/**
 * Outputs the arccosine of the input.
 * @experimental
 */
export class FlowGraphACosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.acos(input), ACOSNAME, config);
    }
}
RegisterClass(ACOSNAME, FlowGraphACosNumberBlock);

const ATANNAME = "FGATanNumberBlock";
/**
 * Outputs the arctangent of the input.
 * @experimental
 */
export class FlowGraphATanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (input) => Math.atan(input), ATANNAME, config);
    }
}
RegisterClass(ATANNAME, FlowGraphATanNumberBlock);

const ENAME = "FGENumberBlock";
/**
 * Outputs the number E.
 * @experimental
 */
export class FlowGraphENumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.E, ENAME, config);
    }
}
RegisterClass(ENAME, FlowGraphENumberBlock);

const PINAME = "FGPiNumberBlock";
/**
 * Outputs the number PI.
 * @experimental
 */
export class FlowGraphPiNumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.PI, PINAME, config);
    }
}
RegisterClass(PINAME, FlowGraphPiNumberBlock);

const ATAN2NAME = "FGATan2NumberBlock";
/**
 * Outputs the arctan2 of the left and right inputs.
 * @experimental
 */
export class FlowGraphATan2NumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.atan2(left, right), ATAN2NAME, config);
    }
}
RegisterClass(ATAN2NAME, FlowGraphATan2NumberBlock);

const RNDNAME = "FGRandomNumberBlock";
/**
 * @experimental
 * Outputs a number between left and right.
 */
export class FlowGraphRandomNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + Math.random() * (right - left), RNDNAME, config);
    }
}
RegisterClass(RNDNAME, FlowGraphRandomNumberBlock);

const MINNAME = "FGMinNumberBlock";
/**
 * Outputs the minimum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMinNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.min(left, right), MINNAME, config);
    }
}
RegisterClass(MINNAME, FlowGraphMinNumberBlock);

const MAXNAME = "FGMaxNumberBlock";
/**
 * Outputs the maximum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMaxNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.max(left, right), MAXNAME, config);
    }
}
RegisterClass(MAXNAME, FlowGraphMaxNumberBlock);

const EQUALSNAME = "FGEqualsNumberBlock";
/**
 * Outputs true if left is equal to right, false otherwise.
 * @experimental
 */
export class FlowGraphEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left === right, EQUALSNAME, config);
    }
}
RegisterClass(EQUALSNAME, FlowGraphEqualsNumberBlock);

const GREATERTHANNAME = "FGGreaterThanNumberBlock";
/**
 * Outputs true if left is greater than right, false otherwise.
 */
export class FlowGraphGreaterThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left > right, GREATERTHANNAME, config);
    }
}
RegisterClass(GREATERTHANNAME, FlowGraphGreaterThanNumberBlock);

const GREATEROREQUALNAME = "FGGreaterThanOrEqualsNumberBlock";
/**
 * Outputs true if left is greater than or equal to right, false otherwise.
 */
export class FlowGraphGreaterThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left >= right, GREATEROREQUALNAME, config);
    }
}
RegisterClass(GREATEROREQUALNAME, FlowGraphGreaterThanOrEqualsNumberBlock);

const LESSTHANNAME = "FGLessThanNumberBlock";
/**
 * Outputs true if left is less than right, false otherwise.
 */
export class FlowGraphLessThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left < right, LESSTHANNAME, config);
    }
}
RegisterClass(LESSTHANNAME, FlowGraphLessThanNumberBlock);

const LESSOREQUALNAME = "FGLessThanOrEqualsNumberBlock";
/**
 * Outputs true if left is less than or equal to right, false otherwise.
 */
export class FlowGraphLessThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left <= right, LESSOREQUALNAME, config);
    }
}
RegisterClass(LESSOREQUALNAME, FlowGraphLessThanOrEqualsNumberBlock);

const MIXNAME = "FGMixNumberBlock";
/**
 * Outputs a mix of left and right based on alpha.
 * @experimental
 */
export class FlowGraphMixNumberBlock extends FlowGraphBlock {
    public leftInput: FlowGraphDataConnection<number>;
    public rightInput: FlowGraphDataConnection<number>;
    public alphaInput: FlowGraphDataConnection<number>;

    public resultOutput: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
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
