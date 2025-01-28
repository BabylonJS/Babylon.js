import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphTypes, getRichTypeByFlowGraphType, RichTypeAny, RichTypeBoolean, RichTypeFlowGraphInteger, RichTypeNumber } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphTernaryOperationBlock } from "../flowGraphTernaryOperationBlock";
import { FlowGraphInteger } from "../../../CustomTypes/flowGraphInteger";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes";

export type FlowGraphNumber = number | FlowGraphInteger;
export type FlowGraphVector = Vector2 | Vector3 | Vector4;
export type FlowGraphMatrix = Matrix | FlowGraphMatrix2D | FlowGraphMatrix3D;
export type FlowGraphMathOperationType = FlowGraphNumber | FlowGraphVector | FlowGraphMatrix | boolean;

/**
 * @internal
 */
export function _getClassNameOf(v: any) {
    if (v.getClassName) {
        return v.getClassName();
    }
    return;
}

/**
 * @internal
 * @returns
 */
function _areSameVectorClass(className: string, className2: string) {
    return className === className2 && (className === FlowGraphTypes.Vector2 || className === FlowGraphTypes.Vector3 || className === FlowGraphTypes.Vector4);
}

/**
 * @internal
 * @returns
 */
function _areSameMatrixClass(className: string, className2: string) {
    return className === className2 && (className === FlowGraphTypes.Matrix || className === FlowGraphTypes.Matrix2D || className === FlowGraphTypes.Matrix3D);
}

/**
 * @internal
 * @returns
 */
function _areSameIntegerClass(className: string, className2: string) {
    return className === "FlowGraphInteger" && className2 === "FlowGraphInteger";
}

function isNumeric(a: FlowGraphMathOperationType): a is FlowGraphNumber {
    return typeof a === "number" || (a as FlowGraphInteger).value !== undefined;
}

function getNumericValue(a: FlowGraphNumber): number {
    return typeof a === "number" ? a : a.value;
}

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphAddBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphBlockNames.Add, config);
    }

    private _polymorphicAdd(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameMatrixClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName)) {
            // cast to vector3, but any other cast will be fine
            return (a as Vector3).add(b as Vector3);
        } else {
            return (a as number) + (b as number);
        }
    }
}
RegisterClass(FlowGraphBlockNames.Add, FlowGraphAddBlock);

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphSubtractBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicSubtract(a, b), FlowGraphBlockNames.Subtract, config);
    }

    private _polymorphicSubtract(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName) || _areSameMatrixClass(aClassName, bClassName)) {
            return (a as Vector3).subtract(b as Vector3);
        } else {
            return (a as number) - (b as number);
        }
    }
}
RegisterClass(FlowGraphBlockNames.Subtract, FlowGraphSubtractBlock);

export interface IFlowGraphMathBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * If true, the multiplication is done per component.
     * This is the behavior in glTF interactivity.
     */
    useMatrixPerComponent?: boolean;
}

/**
 * @experimental
 * Polymorphic multiply block.
 * In case of matrix, it is a component wise multiplication.
 */
export class FlowGraphMultiplyBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphMathBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMultiply(a, b), FlowGraphBlockNames.Multiply, config);
    }

    private _polymorphicMultiply(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName)) {
            return (a as Vector3).multiply(b as Vector3);
        } else if (_areSameMatrixClass(aClassName, bClassName)) {
            if (this.config?.useMatrixPerComponent) {
                // this is the definition of multiplication of glTF interactivity
                // get a's m as array, and multiply each component with b's m
                const aM = (a as FlowGraphMatrix2D).m;
                for (let i = 0; i < aM.length; i++) {
                    aM[i] *= (b as FlowGraphMatrix2D).m[i];
                }
                if (aClassName === FlowGraphTypes.Matrix2D) {
                    return new FlowGraphMatrix2D(aM);
                } else if (aClassName === FlowGraphTypes.Matrix3D) {
                    return new FlowGraphMatrix3D(aM);
                } else {
                    return Matrix.FromArray(aM);
                }
            } else {
                a = a as Matrix;
                b = b as Matrix;
                return a.multiply(b);
            }
        } else {
            return (a as number) * (b as number);
        }
    }
}
RegisterClass(FlowGraphBlockNames.Multiply, FlowGraphMultiplyBlock);

/**
 * @experimental
 * Polymorphic division block.
 */
export class FlowGraphDivideBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphMathBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicDivide(a, b), FlowGraphBlockNames.Divide, config);
    }

    private _polymorphicDivide(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName)) {
            // cast to vector3, but it can be casted to any vector type
            return (a as Vector3).divide(b as Vector3);
        } else if (_areSameMatrixClass(aClassName, bClassName)) {
            if (this.config?.useMatrixPerComponent) {
                // get a's m as array, and divide each component with b's m
                const aM = (a as FlowGraphMatrix2D).m;
                for (let i = 0; i < aM.length; i++) {
                    aM[i] /= (b as FlowGraphMatrix2D).m[i];
                }
                if (aClassName === FlowGraphTypes.Matrix2D) {
                    return new FlowGraphMatrix2D(aM);
                } else if (aClassName === FlowGraphTypes.Matrix3D) {
                    return new FlowGraphMatrix3D(aM);
                } else {
                    return Matrix.FromArray(aM);
                }
            } else {
                a = a as Matrix;
                b = b as Matrix;
                return a.divide(b);
            }
        } else {
            return (a as number) / (b as number);
        }
    }
}
RegisterClass(FlowGraphBlockNames.Divide, FlowGraphDivideBlock);

/**
 * @experimental
 * Random number between min and max (defaults to 0 to 1)
 *
 * This node will cache the result for he same node reference. i.e., a Math.eq that references the SAME random node will always return true.
 * TODO - write a test for that.
 */
export class FlowGraphRandomBlock extends FlowGraphConstantOperationBlock<FlowGraphMathOperationType> {
    /**
     * The minimum value. defaults to 0.
     */
    public readonly min: FlowGraphDataConnection<number>;
    /**
     * The maximum value. defaults to 1.
     */
    public readonly max: FlowGraphDataConnection<number>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, (context) => this._random(context), FlowGraphBlockNames.Random, config);
        this.min = this.registerDataInput("min", RichTypeNumber, 0);
        this.max = this.registerDataInput("max", RichTypeNumber, 1);
    }

    private _random(context: FlowGraphContext) {
        const min = this.min.getValue(context);
        const max = this.max.getValue(context);
        return Math.random() * (max - min) + min;
    }
}
RegisterClass(FlowGraphBlockNames.Random, FlowGraphRandomBlock);

/**
 * @experimental
 * E constant.
 */
export class FlowGraphEBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.E, FlowGraphBlockNames.E, config);
    }
}
RegisterClass(FlowGraphBlockNames.E, FlowGraphEBlock);

/**
 * @experimental
 * Pi constant.
 */
export class FlowGraphPiBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.PI, FlowGraphBlockNames.PI, config);
    }
}
RegisterClass(FlowGraphBlockNames.PI, FlowGraphPiBlock);

/**
 * @experimental
 * Positive inf constant.
 */
export class FlowGraphInfBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Number.POSITIVE_INFINITY, FlowGraphBlockNames.Inf, config);
    }
}
RegisterClass(FlowGraphBlockNames.Inf, FlowGraphInfBlock);

/**
 * @experimental
 * NaN constant.
 */
export class FlowGraphNaNBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Number.NaN, FlowGraphBlockNames.NaN, config);
    }
}
RegisterClass(FlowGraphBlockNames.NaN, FlowGraphNaNBlock);

function _componentWiseUnaryOperation(a: FlowGraphMathOperationType, op: (a: number) => number) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "FlowGraphInteger":
            a = a as FlowGraphInteger;
            return new FlowGraphInteger(op(a.value));
        case FlowGraphTypes.Vector2:
            a = a as Vector2;
            return new Vector2(op(a.x), op(a.y));
        case FlowGraphTypes.Vector3:
            a = a as Vector3;
            return new Vector3(op(a.x), op(a.y), op(a.z));
        case FlowGraphTypes.Vector4:
            a = a as Vector4;
            return new Vector4(op(a.x), op(a.y), op(a.z), op(a.w));
        case FlowGraphTypes.Matrix:
            a = a as Matrix;
            return Matrix.FromValues(
                op(a.m[0]),
                op(a.m[4]),
                op(a.m[8]),
                op(a.m[12]),
                op(a.m[1]),
                op(a.m[5]),
                op(a.m[9]),
                op(a.m[13]),
                op(a.m[2]),
                op(a.m[6]),
                op(a.m[10]),
                op(a.m[14]),
                op(a.m[3]),
                op(a.m[7]),
                op(a.m[11]),
                op(a.m[15])
            );
        case FlowGraphTypes.Matrix2D:
            a = a as FlowGraphMatrix2D;
            // reason for not using .map is performance
            return new FlowGraphMatrix2D([op(a.m[0]), op(a.m[1]), op(a.m[2]), op(a.m[3])]);
        case FlowGraphTypes.Matrix3D:
            a = a as FlowGraphMatrix3D;
            return new FlowGraphMatrix3D([op(a.m[0]), op(a.m[1]), op(a.m[2]), op(a.m[3]), op(a.m[4]), op(a.m[5]), op(a.m[6]), op(a.m[7]), op(a.m[8])]);
        default:
            a = a as number;
            return op(a);
    }
}

/**
 * @experimental
 * Absolute value block.
 */
export class FlowGraphAbsBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicAbs(a), FlowGraphBlockNames.Abs, config);
    }

    private _polymorphicAbs(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.abs);
    }
}
RegisterClass(FlowGraphBlockNames.Abs, FlowGraphAbsBlock);

/**
 * @experimental
 * Sign block.
 */
export class FlowGraphSignBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicSign(a), FlowGraphBlockNames.Sign, config);
    }

    private _polymorphicSign(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sign);
    }
}
RegisterClass(FlowGraphBlockNames.Sign, FlowGraphSignBlock);

/**
 * @experimental
 * Truncation block.
 */
export class FlowGraphTruncBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicTrunc(a), FlowGraphBlockNames.Trunc, config);
    }

    private _polymorphicTrunc(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.trunc);
    }
}
RegisterClass(FlowGraphBlockNames.Trunc, FlowGraphTruncBlock);

/**
 * @experimental
 * Floor block.
 */
export class FlowGraphFloorBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicFloor(a), FlowGraphBlockNames.Floor, config);
    }

    private _polymorphicFloor(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.floor);
    }
}
RegisterClass(FlowGraphBlockNames.Floor, FlowGraphFloorBlock);

/**
 * @experimental
 * Ceiling block.
 */
export class FlowGraphCeilBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCeiling(a), FlowGraphBlockNames.Ceil, config);
    }

    private _polymorphicCeiling(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.ceil);
    }
}
RegisterClass(FlowGraphBlockNames.Ceil, FlowGraphCeilBlock);

/**
 * Configuration for the round block.
 */
export interface IFlowGraphRoundBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * If true, the rounding is away from zero, even when negative. i.e. -7.5 goes to -8, and not -7 as Math.round does (it rounds up).
     * This is the default when using glTF
     */
    roundHalfAwayFromZero?: boolean;
}
/**
 * @experimental
 * Round block.
 */
export class FlowGraphRoundBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphRoundBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicRound(a), FlowGraphBlockNames.Round, config);
    }

    private _polymorphicRound(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, (a) => (a < 0 && this.config?.roundHalfAwayFromZero ? -Math.round(-a) : Math.round(a)));
    }
}

RegisterClass(FlowGraphBlockNames.Round, FlowGraphRoundBlock);

/**
 * @experimental
 * Fract block.
 */
export class FlowGraphFractBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicFract(a), FlowGraphBlockNames.Fract, config);
    }

    private _polymorphicFract(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, (a) => a - Math.floor(a));
    }
}
RegisterClass(FlowGraphBlockNames.Fract, FlowGraphFractBlock);

/**
 * @experimental
 * Negation block.
 */
export class FlowGraphNegationBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    /**
     * construct a new negation block.
     * @param config optional configuration
     */
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicNeg(a), FlowGraphBlockNames.Negation, config);
    }

    private _polymorphicNeg(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, (a) => -a);
    }
}
RegisterClass(FlowGraphBlockNames.Negation, FlowGraphNegationBlock);

function _componentWiseBinaryOperation(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType, op: (a: number, b: number) => number) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "FlowGraphInteger":
            a = a as FlowGraphInteger;
            b = b as FlowGraphInteger;
            return new FlowGraphInteger(op(a.value, b.value));
        case FlowGraphTypes.Vector2:
            a = a as Vector2;
            b = b as Vector2;
            return new Vector2(op(a.x, b.x), op(a.y, b.y));
        case FlowGraphTypes.Vector3:
            a = a as Vector3;
            b = b as Vector3;
            return new Vector3(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z));
        case FlowGraphTypes.Vector4:
            a = a as Vector4;
            b = b as Vector4;
            return new Vector4(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z), op(a.w, b.w));
        case FlowGraphTypes.Matrix:
            a = a as Matrix;
            b = b as Matrix;
            return Matrix.FromValues(
                op(a.m[0], b.m[0]),
                op(a.m[4], b.m[4]),
                op(a.m[8], b.m[8]),
                op(a.m[12], b.m[12]),
                op(a.m[1], b.m[1]),
                op(a.m[5], b.m[5]),
                op(a.m[9], b.m[9]),
                op(a.m[13], b.m[13]),
                op(a.m[2], b.m[2]),
                op(a.m[6], b.m[6]),
                op(a.m[10], b.m[10]),
                op(a.m[14], b.m[14]),
                op(a.m[3], b.m[3]),
                op(a.m[7], b.m[7]),
                op(a.m[11], b.m[11]),
                op(a.m[15], b.m[15])
            );
        case FlowGraphTypes.Matrix2D:
            a = a as FlowGraphMatrix2D;
            b = b as FlowGraphMatrix2D;
            return new FlowGraphMatrix2D([op(a.m[0], b.m[0]), op(a.m[1], b.m[1]), op(a.m[2], b.m[2]), op(a.m[3], b.m[3])]);
        case FlowGraphTypes.Matrix3D:
            a = a as FlowGraphMatrix3D;
            b = b as FlowGraphMatrix3D;
            return new FlowGraphMatrix3D([
                op(a.m[0], b.m[0]),
                op(a.m[1], b.m[1]),
                op(a.m[2], b.m[2]),
                op(a.m[3], b.m[3]),
                op(a.m[4], b.m[4]),
                op(a.m[5], b.m[5]),
                op(a.m[6], b.m[6]),
                op(a.m[7], b.m[7]),
                op(a.m[8], b.m[8]),
            ]);
        default:
            return op(a as number, b as number);
    }
}

/**
 * @experimental
 * Remainder block.
 */
export class FlowGraphModuloBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicRemainder(a, b), FlowGraphBlockNames.Modulo, config);
    }

    private _polymorphicRemainder(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, (a, b) => a % b);
    }
}
RegisterClass(FlowGraphBlockNames.Modulo, FlowGraphModuloBlock);

/**
 * @experimental
 * Min block.
 */
export class FlowGraphMinBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMin(a, b), FlowGraphBlockNames.Min, config);
    }

    private _polymorphicMin(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, Math.min);
    }
}
RegisterClass(FlowGraphBlockNames.Min, FlowGraphMinBlock);

/**
 * @experimental
 * Max block
 */
export class FlowGraphMaxBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMax(a, b), FlowGraphBlockNames.Max, config);
    }

    private _polymorphicMax(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, Math.max);
    }
}
RegisterClass(FlowGraphBlockNames.Max, FlowGraphMaxBlock);

function _clamp(a: number, b: number, c: number) {
    return Math.min(Math.max(a, Math.min(b, c)), Math.max(b, c));
}

function _componentWiseTernaryOperation(
    a: FlowGraphMathOperationType,
    b: FlowGraphMathOperationType,
    c: FlowGraphMathOperationType,
    op: (a: number, b: number, c: number) => number
) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "FlowGraphInteger":
            a = a as FlowGraphInteger;
            b = b as FlowGraphInteger;
            c = c as FlowGraphInteger;
            return new FlowGraphInteger(op(a.value, b.value, c.value));
        case FlowGraphTypes.Vector2:
            a = a as Vector2;
            b = b as Vector2;
            c = c as Vector2;
            return new Vector2(op(a.x, b.x, c.x), op(a.y, b.y, c.y));
        case FlowGraphTypes.Vector3:
            a = a as Vector3;
            b = b as Vector3;
            c = c as Vector3;
            return new Vector3(op(a.x, b.x, c.x), op(a.y, b.y, c.y), op(a.z, b.z, c.z));
        case FlowGraphTypes.Vector4:
            a = a as Vector4;
            b = b as Vector4;
            c = c as Vector4;
            return new Vector4(op(a.x, b.x, c.x), op(a.y, b.y, c.y), op(a.z, b.z, c.z), op(a.w, b.w, c.w));
        case FlowGraphTypes.Matrix:
            a = a as Matrix;
            b = b as Matrix;
            c = c as Matrix;
            return Matrix.FromValues(
                op(a.m[0], b.m[0], c.m[0]),
                op(a.m[4], b.m[4], c.m[4]),
                op(a.m[8], b.m[8], c.m[8]),
                op(a.m[12], b.m[12], c.m[12]),
                op(a.m[1], b.m[1], c.m[1]),
                op(a.m[5], b.m[5], c.m[5]),
                op(a.m[9], b.m[9], c.m[9]),
                op(a.m[13], b.m[13], c.m[13]),
                op(a.m[2], b.m[2], c.m[2]),
                op(a.m[6], b.m[6], c.m[6]),
                op(a.m[10], b.m[10], c.m[10]),
                op(a.m[14], b.m[14], c.m[14]),
                op(a.m[3], b.m[3], c.m[3]),
                op(a.m[7], b.m[7], c.m[7]),
                op(a.m[11], b.m[11], c.m[11]),
                op(a.m[15], b.m[15], c.m[15])
            );
        case FlowGraphTypes.Matrix2D:
            a = a as FlowGraphMatrix2D;
            b = b as FlowGraphMatrix2D;
            c = c as FlowGraphMatrix2D;
            return new FlowGraphMatrix2D([op(a.m[0], b.m[0], c.m[0]), op(a.m[1], b.m[1], c.m[1]), op(a.m[2], b.m[2], c.m[2]), op(a.m[3], b.m[3], c.m[3])]);
        case FlowGraphTypes.Matrix3D:
            a = a as FlowGraphMatrix3D;
            b = b as FlowGraphMatrix3D;
            c = c as FlowGraphMatrix3D;
            return new FlowGraphMatrix3D([
                op(a.m[0], b.m[0], c.m[0]),
                op(a.m[1], b.m[1], c.m[1]),
                op(a.m[2], b.m[2], c.m[2]),
                op(a.m[3], b.m[3], c.m[3]),
                op(a.m[4], b.m[4], c.m[4]),
                op(a.m[5], b.m[5], c.m[5]),
                op(a.m[6], b.m[6], c.m[6]),
                op(a.m[7], b.m[7], c.m[7]),
                op(a.m[8], b.m[8], c.m[8]),
            ]);
        default:
            return op(a as number, b as number, c as number);
    }
}

/**
 * @experimental
 * Clamp block.
 */
export class FlowGraphClampBlock extends FlowGraphTernaryOperationBlock<
    FlowGraphMathOperationType,
    FlowGraphMathOperationType,
    FlowGraphMathOperationType,
    FlowGraphMathOperationType
> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, RichTypeAny, (a, b, c) => this._polymorphicClamp(a, b, c), FlowGraphBlockNames.Clamp, config);
    }

    private _polymorphicClamp(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType, c: FlowGraphMathOperationType) {
        return _componentWiseTernaryOperation(a, b, c, _clamp);
    }
}
RegisterClass(FlowGraphBlockNames.Clamp, FlowGraphClampBlock);

function _saturate(a: number): number {
    return Math.min(Math.max(a, 0), 1);
}

/**
 * @experimental
 * Saturate block.
 */
export class FlowGraphSaturateBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSaturate(a), FlowGraphBlockNames.Saturate, config);
    }

    private _polymorphicSaturate(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, _saturate);
    }
}
RegisterClass(FlowGraphBlockNames.Saturate, FlowGraphSaturateBlock);

function _interpolate(a: number, b: number, c: number) {
    return (1 - c) * a + c * b;
}

/**
 * @experimental
 * Interpolate block.
 */
export class FlowGraphMathInterpolationBlock extends FlowGraphTernaryOperationBlock<
    FlowGraphMathOperationType,
    FlowGraphMathOperationType,
    FlowGraphMathOperationType,
    FlowGraphMathOperationType
> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, RichTypeAny, (a, b, c) => this._polymorphicInterpolate(a, b, c), FlowGraphBlockNames.MathInterpolation, config);
    }

    private _polymorphicInterpolate(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType, c: FlowGraphMathOperationType) {
        return _componentWiseTernaryOperation(a, b, c, _interpolate);
    }
}
RegisterClass(FlowGraphBlockNames.MathInterpolation, FlowGraphMathInterpolationBlock);

/**
 * @experimental
 * Equals block.
 */
export class FlowGraphEqualityBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicEq(a, b), FlowGraphBlockNames.Equality, config);
    }

    private _polymorphicEq(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameMatrixClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName)) {
            return (a as Vector3).equals(b as Vector3);
        } else {
            return a === b;
        }
    }
}
RegisterClass(FlowGraphBlockNames.Equality, FlowGraphEqualityBlock);

function _comparisonOperators(a: FlowGraphNumber, b: FlowGraphNumber, op: (a: number, b: number) => boolean) {
    if (isNumeric(a) && isNumeric(b)) {
        return op(getNumericValue(a), getNumericValue(b));
    } else {
        throw new Error(`Cannot compare ${a} and ${b}`);
    }
}

/**
 * @experimental
 * Less than block.
 */
export class FlowGraphLessThanBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicLessThan(a, b), FlowGraphBlockNames.LessThan, config);
    }

    private _polymorphicLessThan(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a < b);
    }
}
RegisterClass(FlowGraphBlockNames.LessThan, FlowGraphLessThanBlock);

/**
 * @experimental
 * Less than or equal block.
 */
export class FlowGraphLessThanOrEqualBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicLessThanOrEqual(a, b), FlowGraphBlockNames.LessThanOrEqual, config);
    }

    private _polymorphicLessThanOrEqual(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a <= b);
    }
}

RegisterClass(FlowGraphBlockNames.LessThanOrEqual, FlowGraphLessThanOrEqualBlock);

/**
 * @experimental
 * Greater than block.
 */
export class FlowGraphGreaterThanBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicGreaterThan(a, b), FlowGraphBlockNames.GreaterThan, config);
    }

    private _polymorphicGreaterThan(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a > b);
    }
}

RegisterClass(FlowGraphBlockNames.GreaterThan, FlowGraphGreaterThanBlock);

/**
 * @experimental
 * Greater than or equal block.
 */
export class FlowGraphGreaterThanOrEqualBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicGreaterThanOrEqual(a, b), FlowGraphBlockNames.GreaterThanOrEqual, config);
    }

    private _polymorphicGreaterThanOrEqual(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a >= b);
    }
}
RegisterClass(FlowGraphBlockNames.GreaterThanOrEqual, FlowGraphGreaterThanOrEqualBlock);

/**
 * @experimental
 * Is NaN block.
 */
export class FlowGraphIsNanBlock extends FlowGraphUnaryOperationBlock<FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeBoolean, (a) => this._polymorphicIsNan(a), FlowGraphBlockNames.IsNaN, config);
    }

    private _polymorphicIsNan(a: FlowGraphNumber) {
        if (isNumeric(a)) {
            return isNaN(getNumericValue(a));
        } else {
            throw new Error(`Cannot get NaN of ${a}`);
        }
    }
}
RegisterClass(FlowGraphBlockNames.IsNaN, FlowGraphIsNanBlock);

/**
 * @experimental
 * Is Inf block.
 */
export class FlowGraphIsInfinityBlock extends FlowGraphUnaryOperationBlock<FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeBoolean, (a) => this._polymorphicIsInf(a), FlowGraphBlockNames.IsInfinity, config);
    }

    private _polymorphicIsInf(a: FlowGraphNumber) {
        if (isNumeric(a)) {
            return !isFinite(getNumericValue(a));
        } else {
            throw new Error(`Cannot get isInf of ${a}`);
        }
    }
}

RegisterClass(FlowGraphBlockNames.IsInfinity, FlowGraphIsInfinityBlock);

/**
 * @experimental
 * Convert degrees to radians block.
 */
export class FlowGraphDegToRadBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicDegToRad(a), FlowGraphBlockNames.DegToRad, config);
    }

    private _degToRad(a: number) {
        return (a * Math.PI) / 180;
    }

    private _polymorphicDegToRad(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, this._degToRad);
    }
}

RegisterClass(FlowGraphBlockNames.DegToRad, FlowGraphDegToRadBlock);

/**
 * @experimental
 * Convert radians to degrees block.
 */
export class FlowGraphRadToDegBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicRadToDeg(a), FlowGraphBlockNames.RadToDeg, config);
    }

    private _radToDeg(a: number) {
        return (a * 180) / Math.PI;
    }

    private _polymorphicRadToDeg(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, this._radToDeg);
    }
}
RegisterClass(FlowGraphBlockNames.RadToDeg, FlowGraphRadToDegBlock);

/**
 * @experimental
 * Sin block.
 */
export class FlowGraphSinBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicSin(a), FlowGraphBlockNames.Sin, config);
    }

    private _polymorphicSin(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sin);
    }
}

/**
 * @experimental
 * Cos block.
 */
export class FlowGraphCosBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicCos(a), FlowGraphBlockNames.Cos, config);
    }

    private _polymorphicCos(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.cos);
    }
}

/**
 * @experimental
 * Tan block.
 */
export class FlowGraphTanBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicTan(a), FlowGraphBlockNames.Tan, config);
    }

    private _polymorphicTan(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.tan);
    }
}

/**
 * @experimental
 * Arcsin block.
 */
export class FlowGraphAsinBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicAsin(a), FlowGraphBlockNames.Asin, config);
    }

    private _polymorphicAsin(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.asin);
    }
}
RegisterClass(FlowGraphBlockNames.Asin, FlowGraphAsinBlock);

/**
 * @experimental
 * Arccos block.
 */
export class FlowGraphAcosBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicAcos(a), FlowGraphBlockNames.Acos, config);
    }

    private _polymorphicAcos(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.acos);
    }
}
RegisterClass(FlowGraphBlockNames.Acos, FlowGraphAcosBlock);

/**
 * @experimental
 * Arctan block.
 */
export class FlowGraphAtanBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, RichTypeNumber, (a) => this._polymorphicAtan(a), FlowGraphBlockNames.Atan, config);
    }

    private _polymorphicAtan(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.atan);
    }
}
RegisterClass(FlowGraphBlockNames.Atan, FlowGraphAtanBlock);

/**
 * @experimental
 * Arctan2 block.
 */
export class FlowGraphAtan2Block extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAtan2(a, b), FlowGraphBlockNames.Atan2, config);
    }

    private _polymorphicAtan2(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, Math.atan2);
    }
}
RegisterClass(FlowGraphBlockNames.Atan2, FlowGraphAtan2Block);

/**
 * @experimental
 * Hyperbolic sin block.
 */
export class FlowGraphSinhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSinh(a), FlowGraphBlockNames.Sinh, config);
    }

    private _polymorphicSinh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sinh);
    }
}
RegisterClass(FlowGraphBlockNames.Sinh, FlowGraphSinhBlock);

/**
 * @experimental
 * Hyperbolic cos block.
 */
export class FlowGraphCoshBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCosh(a), FlowGraphBlockNames.Cosh, config);
    }

    private _polymorphicCosh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.cosh);
    }
}
RegisterClass(FlowGraphBlockNames.Cosh, FlowGraphCoshBlock);

/**
 * @experimental
 * Hyperbolic tan block.
 */
export class FlowGraphTanhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTanh(a), FlowGraphBlockNames.Tanh, config);
    }

    private _polymorphicTanh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.tanh);
    }
}
RegisterClass(FlowGraphBlockNames.Tanh, FlowGraphTanhBlock);

/**
 * @experimental
 * Hyperbolic arcsin block.
 */
export class FlowGraphAsinhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAsinh(a), FlowGraphBlockNames.Asinh, config);
    }

    private _polymorphicAsinh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.asinh);
    }
}
RegisterClass(FlowGraphBlockNames.Asinh, FlowGraphAsinhBlock);

/**
 * @experimental
 * Hyperbolic arccos block.
 */
export class FlowGraphAcoshBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAcosh(a), FlowGraphBlockNames.Acosh, config);
    }

    private _polymorphicAcosh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.acosh);
    }
}
RegisterClass(FlowGraphBlockNames.Acosh, FlowGraphAcoshBlock);

/**
 * @experimental
 * Hyperbolic arctan block.
 */
export class FlowGraphAtanhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAtanh(a), FlowGraphBlockNames.Atanh, config);
    }

    private _polymorphicAtanh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.atanh);
    }
}
RegisterClass(FlowGraphBlockNames.Atanh, FlowGraphAtanhBlock);

/**
 * @experimental
 * Exponential block.
 */
export class FlowGraphExpBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicExp(a), FlowGraphBlockNames.Exponential, config);
    }

    private _polymorphicExp(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.exp);
    }
}
RegisterClass(FlowGraphBlockNames.Exponential, FlowGraphExpBlock);

/**
 * @experimental
 * Logarithm block.
 */
export class FlowGraphLogBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog(a), FlowGraphBlockNames.Log, config);
    }

    private _polymorphicLog(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.log);
    }
}
RegisterClass(FlowGraphBlockNames.Log, FlowGraphLogBlock);

/**
 * @experimental
 * Base 2 logarithm block.
 */
export class FlowGraphLog2Block extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog2(a), FlowGraphBlockNames.Log2, config);
    }

    private _polymorphicLog2(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.log2);
    }
}
RegisterClass(FlowGraphBlockNames.Log2, FlowGraphLog2Block);

/**
 * @experimental
 * Base 10 logarithm block.
 */
export class FlowGraphLog10Block extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog10(a), FlowGraphBlockNames.Log10, config);
    }

    private _polymorphicLog10(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.log10);
    }
}
RegisterClass(FlowGraphBlockNames.Log10, FlowGraphLog10Block);

/**
 * @experimental
 * Square root block.
 */
export class FlowGraphSquareRootBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicSqrt(a), FlowGraphBlockNames.SquareRoot, config);
    }

    private _polymorphicSqrt(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sqrt);
    }
}
RegisterClass(FlowGraphBlockNames.SquareRoot, FlowGraphSquareRootBlock);

/**
 * @experimental
 * Cube root block.
 */
export class FlowGraphCubeRootBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicCubeRoot(a), FlowGraphBlockNames.CubeRoot, config);
    }

    private _polymorphicCubeRoot(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.cbrt);
    }
}
RegisterClass(FlowGraphBlockNames.CubeRoot, FlowGraphCubeRootBlock);

/**
 * @experimental
 * Power block.
 */
export class FlowGraphPowerBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, RichTypeNumber, (a, b) => this._polymorphicPow(a, b), FlowGraphBlockNames.Power, config);
    }

    private _polymorphicPow(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, Math.pow);
    }
}

RegisterClass(FlowGraphBlockNames.Power, FlowGraphPowerBlock);

export interface IFlowGraphMatrixBlockConfiguration extends IFlowGraphBlockConfiguration {
    matrixType: FlowGraphTypes;
}
/**
 * @experimental
 * Transposes a matrix.
 */
export class FlowGraphTransposeBlock extends FlowGraphUnaryOperationBlock<FlowGraphMatrix, FlowGraphMatrix> {
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            (a) => (a.transpose ? a.transpose() : Matrix.Transpose(a as Matrix)),
            FlowGraphBlockNames.Transpose,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.Transpose, FlowGraphTransposeBlock);

/**
 * @experimental
 * Gets the determinant of a matrix.
 */
export class FlowGraphDeterminantBlock extends FlowGraphUnaryOperationBlock<FlowGraphMatrix, number> {
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix), RichTypeNumber, (a) => a.determinant(), FlowGraphBlockNames.Determinant, config);
    }
}
RegisterClass(FlowGraphBlockNames.Determinant, FlowGraphDeterminantBlock);

/**
 * @experimental
 * Inverts a matrix.
 */
export class FlowGraphInvertMatrixBlock extends FlowGraphUnaryOperationBlock<FlowGraphMatrix, FlowGraphMatrix> {
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            (a) => ((a as FlowGraphMatrix2D).inverse ? (a as FlowGraphMatrix2D).inverse() : Matrix.Invert(a as Matrix)),
            FlowGraphBlockNames.InvertMatrix,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.InvertMatrix, FlowGraphInvertMatrixBlock);

/**
 * @experimental
 * Multiplies two matrices.
 */
export class FlowGraphMatrixMultiplicationBlock extends FlowGraphBinaryOperationBlock<FlowGraphMatrix, FlowGraphMatrix, FlowGraphMatrix> {
    constructor(config?: IFlowGraphMatrixBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            getRichTypeByFlowGraphType(config?.matrixType || FlowGraphTypes.Matrix),
            (a, b) => b.multiply(a as any),
            FlowGraphBlockNames.MatrixMultiplication,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.MatrixMultiplication, FlowGraphMatrixMultiplicationBlock);

/**
 * Configuration for bitwise operators
 */
export interface IFlowGraphBitwiseBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The type of the values that will be operated on
     * Defaults to FlowGraphInteger, but can be a number or boolean as well.
     */
    valueType: FlowGraphTypes;
}

type FlowGraphBitwiseTypes = FlowGraphInteger | FlowGraphNumber | boolean;
/**
 * @experimental
 * Bitwise NOT operation
 */
export class FlowGraphBitwiseNotBlock extends FlowGraphUnaryOperationBlock<FlowGraphBitwiseTypes, FlowGraphBitwiseTypes> {
    constructor(config?: IFlowGraphBitwiseBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            (a) => {
                if (typeof a === "boolean") {
                    return !a;
                } else if (typeof a === "number") {
                    return ~a;
                }
                return new FlowGraphInteger(~a.value);
            },
            FlowGraphBlockNames.BitwiseNot,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.BitwiseNot, FlowGraphBitwiseNotBlock);

/**
 * @experimental
 * Bitwise AND operation
 */
export class FlowGraphBitwiseAndBlock extends FlowGraphBinaryOperationBlock<FlowGraphBitwiseTypes, FlowGraphBitwiseTypes, FlowGraphBitwiseTypes> {
    constructor(config?: IFlowGraphBitwiseBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            (a, b) => {
                if (typeof a === "boolean" && typeof b === "boolean") {
                    return a && b;
                } else if (typeof a === "number" && typeof b === "number") {
                    return a & b;
                } else if (typeof a === "object" && typeof b === "object") {
                    return new FlowGraphInteger(a.value & b.value);
                } else {
                    throw new Error(`Cannot perform bitwise AND on ${a} and ${b}`);
                }
            },
            FlowGraphBlockNames.BitwiseAnd,
            config
        );
    }
}

RegisterClass(FlowGraphBlockNames.BitwiseAnd, FlowGraphBitwiseAndBlock);

/**
 * @experimental
 * Bitwise OR operation
 */
export class FlowGraphBitwiseOrBlock extends FlowGraphBinaryOperationBlock<FlowGraphBitwiseTypes, FlowGraphBitwiseTypes, FlowGraphBitwiseTypes> {
    constructor(config?: IFlowGraphBitwiseBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            (a, b) => {
                if (typeof a === "boolean" && typeof b === "boolean") {
                    return a || b;
                } else if (typeof a === "number" && typeof b === "number") {
                    return a | b;
                } else if (typeof a === "object" && typeof b === "object") {
                    return new FlowGraphInteger(a.value | b.value);
                } else {
                    throw new Error(`Cannot perform bitwise OR on ${a} and ${b}`);
                }
            },
            FlowGraphBlockNames.BitwiseOr,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.BitwiseOr, FlowGraphBitwiseOrBlock);

/**
 * @experimental
 * Bitwise XOR operation
 */
export class FlowGraphBitwiseXorBlock extends FlowGraphBinaryOperationBlock<FlowGraphBitwiseTypes, FlowGraphBitwiseTypes, FlowGraphBitwiseTypes> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            getRichTypeByFlowGraphType(config?.valueType || FlowGraphTypes.Integer),
            (a, b) => {
                if (typeof a === "boolean" && typeof b === "boolean") {
                    return a !== b;
                } else if (typeof a === "number" && typeof b === "number") {
                    return a ^ b;
                } else if (typeof a === "object" && typeof b === "object") {
                    return new FlowGraphInteger(a.value ^ b.value);
                } else {
                    throw new Error(`Cannot perform bitwise XOR on ${a} and ${b}`);
                }
            },
            FlowGraphBlockNames.BitwiseXor,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.BitwiseXor, FlowGraphBitwiseXorBlock);

/**
 * @experimental
 * Bitwise left shift operation
 */
export class FlowGraphBitwiseLeftShiftBlock extends FlowGraphBinaryOperationBlock<FlowGraphInteger, FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a, b) => new FlowGraphInteger(a.value << b.value),
            FlowGraphBlockNames.BitwiseLeftShift,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.BitwiseLeftShift, FlowGraphBitwiseLeftShiftBlock);

/**
 * @experimental
 * Bitwise right shift operation
 */
export class FlowGraphBitwiseRightShiftBlock extends FlowGraphBinaryOperationBlock<FlowGraphInteger, FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a, b) => new FlowGraphInteger(a.value >> b.value),
            FlowGraphBlockNames.BitwiseRightShift,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.BitwiseRightShift, FlowGraphBitwiseRightShiftBlock);

/**
 * @experimental
 * Count leading zeros operation
 */
export class FlowGraphLeadingZerosBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeFlowGraphInteger, (a) => new FlowGraphInteger(Math.clz32(a.value)), FlowGraphBlockNames.LeadingZeros, config);
    }
}
RegisterClass(FlowGraphBlockNames.LeadingZeros, FlowGraphLeadingZerosBlock);

/**
 * @experimental
 * Count trailing zeros operation
 */
export class FlowGraphTrailingZerosBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a) => new FlowGraphInteger(a.value ? 31 - Math.clz32(a.value & -a.value) : 32),
            FlowGraphBlockNames.TrailingZeros,
            config
        );
    }
}
RegisterClass(FlowGraphBlockNames.TrailingZeros, FlowGraphTrailingZerosBlock);

/**
 * Given a number (which is converted to a 32-bit integer), return the
 * number of bits set to one on that number.
 * @param n the number to run the op on
 * @returns the number of bits set to one on that number
 */
function _countOnes(n: number) {
    let result = 0;
    while (n) {
        // This zeroes out all bits except for the least significant one.
        // So if the bit is set, it will be 1, otherwise it will be 0.
        result += n & 1;
        // This shifts n's bits to the right by one
        n >>= 1;
    }
    return result;
}

/**
 * @experimental
 * Count one bits operation
 */
export class FlowGraphOneBitsCounterBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeFlowGraphInteger, (a) => new FlowGraphInteger(_countOnes(a.value)), FlowGraphBlockNames.OneBitsCounter, config);
    }
}
RegisterClass(FlowGraphBlockNames.OneBitsCounter, FlowGraphOneBitsCounterBlock);
