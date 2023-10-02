import { FlowGraphBlock } from "../../../flowGraphBlock";
import { RichTypeBoolean, RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Module for all of the number math blocks.
 * @see https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 */

/**
 * Outputs the addition of the left and right inputs.
 * @experimental
 */
export class FlowGraphAddNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAddNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + right, "FlowGraphAddNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphAddNumberBlock";
    }
}
RegisterClass("FlowGraphAddNumberBlock", FlowGraphAddNumberBlock);
/**
 * Outputs the subtraction of the left and right inputs.
 * @experimental
 */
export class FlowGraphSubtractNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSubtractNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left - right, "FlowGraphSubtractNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphSubtractNumberBlock";
    }
}
RegisterClass("FlowGraphSubtractNumberBlock", FlowGraphSubtractNumberBlock);

/**
 * Outputs the multiplication of the left and right inputs.
 * @experimental
 */
export class FlowGraphMultiplyNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMultiplyNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left * right, "FlowGraphMultiplyNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphMultiplyNumberBlock";
    }
}
RegisterClass("FlowGraphMultiplyNumberBlock", FlowGraphMultiplyNumberBlock);

/**
 * Ouputs the division of the left and right inputs.
 * @experimental
 */
export class FlowGraphDivideNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphDivideNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left / right, "FlowGraphDivideNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphDivideNumberBlock";
    }
}
RegisterClass("FlowGraphDivideNumberBlock", FlowGraphDivideNumberBlock);
/**
 * Outputs the modulo of the left and right inputs.
 * @experimental
 */
export class FlowGraphModNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphModNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left % right, "FlowGraphModNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphModNumberBlock";
    }
}
RegisterClass("FlowGraphModNumberBlock", FlowGraphModNumberBlock);
/**
 * Outputs left to the power of right.
 * @experimental
 */
export class FlowGraphPowNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphPowNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.pow(left, right), "FlowGraphPowNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphPowNumberBlock";
    }
}
RegisterClass("FlowGraphPowNumberBlock", FlowGraphPowNumberBlock);

/**
 * Outputs true if the number is NaN, false otherwise.
 * @experimental
 */
export class FlowGraphIsNaNNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphIsNaNNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeBoolean, (input) => isNaN(input), "FlowGraphIsNaNNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphIsNaNNumberBlock";
    }
}
RegisterClass("FlowGraphIsNaNNumberBlock", FlowGraphIsNaNNumberBlock);

/**
 * Outputs true if the number is infinite, false otherwise.
 * @experimental
 */
export class FlowGraphIsInfinityNumberBlock extends FlowGraphUnaryOperationBlock<number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphIsInfinityNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeBoolean, (input) => !isFinite(input), "FlowGraphIsInfinityNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphIsInfinityNumberBlock";
    }
}
RegisterClass("FlowGraphIsInfinityNumberBlock", FlowGraphIsInfinityNumberBlock);
/**
 * Outputs the square root of the input.
 * @experimental
 */
export class FlowGraphSqrtNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSqrtNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.sqrt(input), "FlowGraphSqrtNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphSqrtNumberBlock";
    }
}
RegisterClass("FlowGraphSqrtNumberBlock", FlowGraphSqrtNumberBlock);
/**
 * Outputs the absolute value of the input.
 * @experimental
 */
export class FlowGraphAbsNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphAbsNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.abs(input), "FlowGraphAbsNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphAbsNumberBlock";
    }
}
RegisterClass("FlowGraphAbsNumberBlock", FlowGraphAbsNumberBlock);

/**
 * Negates the input.
 * @experimental
 */
export class FlowGraphNegateNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphNegateNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => -input, "FlowGraphNegateNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphNegateNumberBlock";
    }
}
RegisterClass("FlowGraphNegateNumberBlock", FlowGraphNegateNumberBlock);

/**
 * Outputs the floor of the input.
 * @experimental
 */
export class FlowGraphFloorNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphFloorNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.floor(input), "FlowGraphFloorNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphFloorNumberBlock";
    }
}
RegisterClass("FlowGraphFloorNumberBlock", FlowGraphFloorNumberBlock);
/**
 * Outputs the ceiling of the input.
 * @experimental
 */
export class FlowGraphCeilNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCeilNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.ceil(input), "FlowGraphCeilNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphCeilNumberBlock";
    }
}
RegisterClass("FlowGraphCeilNumberBlock", FlowGraphCeilNumberBlock);
/**
 * Rounds the left input to right digits of precision.
 * @see rounding function from: https://docs.google.com/spreadsheets/d/1wSFUFLPpRFVlL-va3YtYC6sepNvPapVawG1-nzoTF34/edit#gid=0
 * @experimental
 */
export class FlowGraphRoundNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphRoundNumberBlock" }) {
        super(
            config,
            RichTypeNumber,
            RichTypeNumber,
            RichTypeNumber,
            (input, digits) => Math.round(input / Math.pow(10, digits)) / Math.pow(10, digits),
            "FlowGraphRoundNumberBlock"
        );
    }

    public getClassName(): string {
        return "FlowGraphRoundNumberBlock";
    }
}
RegisterClass("FlowGraphRoundNumberBlock", FlowGraphRoundNumberBlock);
/**
 * Truncates the input.
 * @experimental
 */
export class FlowGraphTruncNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphTruncNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.trunc(input), "FlowGraphTruncNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphTruncNumberBlock";
    }
}
RegisterClass("FlowGraphTruncNumberBlock", FlowGraphTruncNumberBlock);

/**
 * Outputs the exponential of the input.
 * @experimental
 */
export class FlowGraphExpNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphExpNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.exp(input), "FlowGraphExpNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphExpNumberBlock";
    }
}
RegisterClass("FlowGraphExpNumberBlock", FlowGraphExpNumberBlock);

/**
 * Outputs the base 10 logarithm of the input.
 * @experimental
 */
export class FlowGraphLog10NumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLog10NumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.log10(input), "FlowGraphLog10NumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphLog10NumberBlock";
    }
}
RegisterClass("FlowGraphLog10NumberBlock", FlowGraphLog10NumberBlock);

/**
 * Outputs the natural logarithm of the input.
 * @experimental
 */
export class FlowGraphLogNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLogNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.log(input), "FlowGraphLogNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphLogNumberBlock";
    }
}
RegisterClass("FlowGraphLogNumberBlock", FlowGraphLogNumberBlock);

/**
 * Outputs the base 2 logarithm of the input.
 * @experimental
 */
export class FlowGraphLnNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLnNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.log(input) / Math.LN2, "FlowGraphLnNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphLnNumberBlock";
    }
}
RegisterClass("FlowGraphLnNumberBlock", FlowGraphLnNumberBlock);

/**
 * Outputs the sine of the input.
 * @experimental
 */
export class FlowGraphSinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphSinNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.sin(input), "FlowGraphSinNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphSinNumberBlock";
    }
}
RegisterClass("FlowGraphSinNumberBlock", FlowGraphSinNumberBlock);

/**
 * Outputs the cosine of the input.
 * @experimental
 */
export class FlowGraphCosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphCosNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.cos(input), "FlowGraphCosNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphCosNumberBlock";
    }
}
RegisterClass("FlowGraphCosNumberBlock", FlowGraphCosNumberBlock);

/**
 * Outputs the tangent of the input.
 * @experimental
 */
export class FlowGraphTanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphTanNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.tan(input), "FlowGraphTanNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphTanNumberBlock";
    }
}
RegisterClass("FlowGraphTanNumberBlock", FlowGraphTanNumberBlock);

/**
 * Outputs the arcsine of the input.
 * @experimental
 */
export class FlowGraphASinNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphASinNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.asin(input), "FlowGraphASinNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphASinNumberBlock";
    }
}
RegisterClass("FlowGraphASinNumberBlock", FlowGraphASinNumberBlock);

/**
 * Outputs the arccosine of the input.
 * @experimental
 */
export class FlowGraphACosNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphACosNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.acos(input), "FlowGraphACosNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphACosNumberBlock";
    }
}
RegisterClass("FlowGraphACosNumberBlock", FlowGraphACosNumberBlock);

/**
 * Outputs the arctangent of the input.
 * @experimental
 */
export class FlowGraphATanNumberBlock extends FlowGraphUnaryOperationBlock<number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphATanNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, (input) => Math.atan(input), "FlowGraphATanNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphATanNumberBlock";
    }
}
RegisterClass("FlowGraphATanNumberBlock", FlowGraphATanNumberBlock);

/**
 * Outputs the number E.
 * @experimental
 */
export class FlowGraphENumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphENumberBlock" }) {
        super(config, RichTypeNumber, () => Math.E);
    }

    public getClassName(): string {
        return "FlowGraphENumberBlock";
    }
}
RegisterClass("FlowGraphENumberBlock", FlowGraphENumberBlock);

/**
 * Outputs the number PI.
 * @experimental
 */
export class FlowGraphPiNumberBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphPiNumberBlock" }) {
        super(config, RichTypeNumber, () => Math.PI);
    }

    public getClassName(): string {
        return "FlowGraphPiNumberBlock";
    }
}
RegisterClass("FlowGraphPiNumberBlock", FlowGraphPiNumberBlock);

/**
 * Outputs the arctan2 of the left and right inputs.
 * @experimental
 */
export class FlowGraphATan2NumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphATan2NumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.atan2(left, right), "FlowGraphATan2NumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphATan2NumberBlock";
    }
}
RegisterClass("FlowGraphATan2NumberBlock", FlowGraphATan2NumberBlock);

/**
 * @experimental
 * Outputs a number between left and right.
 */
export class FlowGraphRandomNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphRandomNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => left + Math.random() * (right - left), "FlowGraphRandomNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphRandomNumberBlock";
    }
}
RegisterClass("FlowGraphRandomNumberBlock", FlowGraphRandomNumberBlock);
/**
 * Outputs the minimum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMinNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMinNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.min(left, right), "FlowGraphMinNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphMinNumberBlock";
    }
}
RegisterClass("FlowGraphMinNumberBlock", FlowGraphMinNumberBlock);
/**
 * Outputs the maximum of the left and right inputs.
 * @experimental
 */
export class FlowGraphMaxNumberBlock extends FlowGraphBinaryOperationBlock<number, number, number> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMaxNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeNumber, (left, right) => Math.max(left, right), "FlowGraphMaxNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphMaxNumberBlock";
    }
}
RegisterClass("FlowGraphMaxNumberBlock", FlowGraphMaxNumberBlock);

/**
 * Outputs true if left is equal to right, false otherwise.
 * @experimental
 */
export class FlowGraphEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphEqualsNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left === right, "FlowGraphEqualsNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphEqualsNumberBlock";
    }
}
RegisterClass("FlowGraphEqualsNumberBlock", FlowGraphEqualsNumberBlock);

/**
 * Outputs true if left is greater than right, false otherwise.
 */
export class FlowGraphGreaterThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphGreaterThanNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left > right, "FlowGraphGreaterThanNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphGreaterThanNumberBlock";
    }
}
RegisterClass("FlowGraphGreaterThanNumberBlock", FlowGraphGreaterThanNumberBlock);

/**
 * Outputs true if left is greater than or equal to right, false otherwise.
 */
export class FlowGraphGreaterThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphGreaterThanOrEqualsNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left >= right, "FlowGraphGreaterThanOrEqualsNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphGreaterThanOrEqualsNumberBlock";
    }
}
RegisterClass("FlowGraphGreaterThanOrEqualsNumberBlock", FlowGraphGreaterThanOrEqualsNumberBlock);

/**
 * Outputs true if left is less than right, false otherwise.
 */
export class FlowGraphLessThanNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLessThanNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left < right, "FlowGraphLessThanNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphLessThanNumberBlock";
    }
}
RegisterClass("FlowGraphLessThanNumberBlock", FlowGraphLessThanNumberBlock);
/**
 * Outputs true if left is less than or equal to right, false otherwise.
 */
export class FlowGraphLessThanOrEqualsNumberBlock extends FlowGraphBinaryOperationBlock<number, number, boolean> {
    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphLessThanOrEqualsNumberBlock" }) {
        super(config, RichTypeNumber, RichTypeNumber, RichTypeBoolean, (left, right) => left <= right, "FlowGraphLessThanOrEqualsNumberBlock");
    }

    public getClassName(): string {
        return "FlowGraphLessThanOrEqualsNumberBlock";
    }
}
RegisterClass("FlowGraphLessThanOrEqualsNumberBlock", FlowGraphLessThanOrEqualsNumberBlock);
/**
 * Outputs a mix of left and right based on alpha.
 * @experimental
 */
export class FlowGraphMixNumberBlock extends FlowGraphBlock {
    public leftInput: FlowGraphDataConnection<number>;
    public rightInput: FlowGraphDataConnection<number>;
    public alphaInput: FlowGraphDataConnection<number>;

    public resultOutput: FlowGraphDataConnection<number>;

    constructor(config: IFlowGraphBlockConfiguration = { name: "FlowGraphMixNumberBlock" }) {
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
        return "FlowGraphMixNumberBlock";
    }
}
RegisterClass("FlowGraphMixNumberBlock", FlowGraphMixNumberBlock);
