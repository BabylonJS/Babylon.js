import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RichTypeAny, RichTypeBoolean, RichTypeFlowGraphInteger, RichTypeMatrix, RichTypeNumber, RichTypeVector2, RichTypeVector3 } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphTernaryOperationBlock } from "../flowGraphTernaryOperationBlock";
import { FlowGraphInteger } from "../../../flowGraphInteger";

export type FlowGraphNumber = number | FlowGraphInteger;
export type FlowGraphVector = Vector2 | Vector3 | Vector4;
export type FlowGraphMathOperationType = FlowGraphNumber | FlowGraphVector | Matrix | boolean;

/**
 * @internal
 */
function _getClassNameOf(v: any) {
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
    return className === className2 && (className === "Vector2" || className === "Vector3" || className === "Vector4");
}

/**
 * @internal
 * @returns
 */
function _areSameMatrixClass(className: string, className2: string) {
    return className === "Matrix" && className2 === "Matrix";
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
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphAddBlock.ClassName, config);
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

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAddBlock";
}
RegisterClass(FlowGraphAddBlock.ClassName, FlowGraphAddBlock);

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphSubtractBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphSubtractBlock.ClassName, config);
    }

    private _polymorphicAdd(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName) || _areSameMatrixClass(aClassName, bClassName)) {
            return (a as Vector3).subtract(b as Vector3);
        } else {
            return (a as number) - (b as number);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSubBlock";
}
RegisterClass(FlowGraphSubtractBlock.ClassName, FlowGraphSubtractBlock);

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
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMultiply(a, b), FlowGraphMultiplyBlock.ClassName, config);
    }

    private _polymorphicMultiply(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName)) {
            return (a as Vector3).multiply(b as Vector3);
        } else if (_areSameMatrixClass(aClassName, bClassName)) {
            a = a as Matrix;
            b = b as Matrix;
            if (this.config?.useMatrixPerComponent) {
                // this is the definition of multiplication of glTF interactivity
                return Matrix.FromValues(
                    a.m[0] * b.m[0],
                    a.m[4] * b.m[4],
                    a.m[8] * b.m[8],
                    a.m[12] * b.m[12],
                    a.m[1] * b.m[1],
                    a.m[5] * b.m[5],
                    a.m[9] * b.m[9],
                    a.m[13] * b.m[13],
                    a.m[2] * b.m[2],
                    a.m[6] * b.m[6],
                    a.m[10] * b.m[10],
                    a.m[14] * b.m[14],
                    a.m[3] * b.m[3],
                    a.m[7] * b.m[7],
                    a.m[11] * b.m[11],
                    a.m[15] * b.m[15]
                );
            } else {
                return a.multiply(b);
            }
        } else {
            return (a as number) * (b as number);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGMultiplyBlock";
}
RegisterClass(FlowGraphMultiplyBlock.ClassName, FlowGraphMultiplyBlock);

/**
 * @experimental
 * Polymorphic division block.
 */
export class FlowGraphDivideBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphMathBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicDivide(a, b), FlowGraphDivideBlock.ClassName, config);
    }

    private _polymorphicDivide(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName) || _areSameIntegerClass(aClassName, bClassName)) {
            // cast to vector3, but it can be casted to any vector type
            return (a as Vector3).divide(b as Vector3);
        } else if (_areSameMatrixClass(aClassName, bClassName)) {
            a = a as Matrix;
            b = b as Matrix;
            if (this.config?.useMatrixPerComponent) {
                return Matrix.FromValues(
                    a.m[0] / b.m[0],
                    a.m[4] / b.m[4],
                    a.m[8] / b.m[8],
                    a.m[12] / b.m[12],
                    a.m[1] / b.m[1],
                    a.m[5] / b.m[5],
                    a.m[9] / b.m[9],
                    a.m[13] / b.m[13],
                    a.m[2] / b.m[2],
                    a.m[6] / b.m[6],
                    a.m[10] / b.m[10],
                    a.m[14] / b.m[14],
                    a.m[3] / b.m[3],
                    a.m[7] / b.m[7],
                    a.m[11] / b.m[11],
                    a.m[15] / b.m[15]
                );
            } else {
                return a.divide(b);
            }
        } else {
            return (a as number) / (b as number);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGDivideBlock";
}
RegisterClass(FlowGraphDivideBlock.ClassName, FlowGraphDivideBlock);

/**
 * @experimental
 * Random number between 0 and 1.
 */
export class FlowGraphRandomBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.random(), FlowGraphRandomBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGRandomBlock";
}
RegisterClass(FlowGraphRandomBlock.ClassName, FlowGraphRandomBlock);

/**
 * @experimental
 * E constant.
 */
export class FlowGraphEBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.E, FlowGraphEBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGEBlock";
}
RegisterClass(FlowGraphEBlock.ClassName, FlowGraphEBlock);

/**
 * @experimental
 * Pi constant.
 */
export class FlowGraphPiBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.PI, FlowGraphPiBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGPIBlock";
}
RegisterClass(FlowGraphPiBlock.ClassName, FlowGraphPiBlock);

/**
 * @experimental
 * Positive inf constant.
 */
export class FlowGraphInfBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Number.POSITIVE_INFINITY, FlowGraphInfBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGInfBlock";
}
RegisterClass(FlowGraphInfBlock.ClassName, FlowGraphInfBlock);

/**
 * @experimental
 * NaN constant.
 */
export class FlowGraphNaNBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Number.NaN, FlowGraphNaNBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGNaNBlock";
}
RegisterClass(FlowGraphNaNBlock.ClassName, FlowGraphNaNBlock);

function _componentWiseUnaryOperation(a: FlowGraphMathOperationType, op: (a: number) => number) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "FlowGraphInteger":
            a = a as FlowGraphInteger;
            return new FlowGraphInteger(op(a.value));
        case "Vector2":
            a = a as Vector2;
            return new Vector2(op(a.x), op(a.y));
        case "Vector3":
            a = a as Vector3;
            return new Vector3(op(a.x), op(a.y), op(a.z));
        case "Vector4":
            a = a as Vector4;
            return new Vector4(op(a.x), op(a.y), op(a.z), op(a.w));
        case "Matrix":
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
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAbs(a), FlowGraphAbsBlock.ClassName, config);
    }

    private _polymorphicAbs(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.abs);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAbsBlock";
}
RegisterClass(FlowGraphAbsBlock.ClassName, FlowGraphAbsBlock);

/**
 * @experimental
 * Sign block.
 */
export class FlowGraphSignBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSign(a), FlowGraphSignBlock.ClassName, config);
    }

    private _polymorphicSign(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sign);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSignBlock";
}
RegisterClass(FlowGraphSignBlock.ClassName, FlowGraphSignBlock);

/**
 * @experimental
 * Truncation block.
 */
export class FlowGraphTruncBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTrunc(a), FlowGraphTruncBlock.ClassName, config);
    }

    private _polymorphicTrunc(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.trunc);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGTruncBlock";
}
RegisterClass(FlowGraphTruncBlock.ClassName, FlowGraphTruncBlock);

/**
 * @experimental
 * Floor block.
 */
export class FlowGraphFloorBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicFloor(a), FlowGraphFloorBlock.ClassName, config);
    }

    private _polymorphicFloor(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.floor);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGFloorBlock";
}
RegisterClass(FlowGraphFloorBlock.ClassName, FlowGraphFloorBlock);

/**
 * @experimental
 * Ceiling block.
 */
export class FlowGraphCeilBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCeiling(a), FlowGraphCeilBlock.ClassName, config);
    }

    private _polymorphicCeiling(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.ceil);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCeilBlock";
}
RegisterClass(FlowGraphCeilBlock.ClassName, FlowGraphCeilBlock);

/**
 * @experimental
 * Fract block.
 */
export class FlowGraphFractBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicFract(a), FlowGraphFractBlock.ClassName, config);
    }

    private _polymorphicFract(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, (a) => a - Math.floor(a));
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGFractBlock";
}
RegisterClass(FlowGraphFractBlock.ClassName, FlowGraphFractBlock);

/**
 * @experimental
 * Negation block.
 */
export class FlowGraphNegBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    /**
     * construct a new negation block.
     * @param config optional configuration
     */
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicNeg(a), FlowGraphNegBlock.ClassName, config);
    }

    private _polymorphicNeg(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, (a) => -a);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGNegBlock";
}
RegisterClass(FlowGraphNegBlock.ClassName, FlowGraphNegBlock);

function _componentWiseBinaryOperation(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType, op: (a: number, b: number) => number) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "FlowGraphInteger":
            a = a as FlowGraphInteger;
            b = b as FlowGraphInteger;
            return new FlowGraphInteger(op(a.value, b.value));
        case "Vector2":
            a = a as Vector2;
            b = b as Vector2;
            return new Vector2(op(a.x, b.x), op(a.y, b.y));
        case "Vector3":
            a = a as Vector3;
            b = b as Vector3;
            return new Vector3(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z));
        case "Vector4":
            a = a as Vector4;
            b = b as Vector4;
            return new Vector4(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z), op(a.w, b.w));
        case "Matrix":
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
        default:
            return op(a as number, b as number);
    }
}

/**
 * @experimental
 * Remainder block.
 */
export class FlowGraphRemainderBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicRemainder(a, b), FlowGraphRemainderBlock.ClassName, config);
    }

    private _polymorphicRemainder(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, (a, b) => a % b);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGRemainderBlock";
}
RegisterClass(FlowGraphRemainderBlock.ClassName, FlowGraphRemainderBlock);

/**
 * @experimental
 * Min block.
 */
export class FlowGraphMinBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMin(a, b), FlowGraphMinBlock.ClassName, config);
    }

    private _polymorphicMin(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, Math.min);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGMinBlock";
}
RegisterClass(FlowGraphMinBlock.ClassName, FlowGraphMinBlock);

/**
 * @experimental
 * Max block
 */
export class FlowGraphMaxBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMax(a, b), FlowGraphMaxBlock.ClassName, config);
    }

    private _polymorphicMax(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, Math.max);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGMaxBlock";
}
RegisterClass(FlowGraphMaxBlock.ClassName, FlowGraphMaxBlock);

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
        case "Vector2":
            a = a as Vector2;
            b = b as Vector2;
            c = c as Vector2;
            return new Vector2(op(a.x, b.x, c.x), op(a.y, b.y, c.y));
        case "Vector3":
            a = a as Vector3;
            b = b as Vector3;
            c = c as Vector3;
            return new Vector3(op(a.x, b.x, c.x), op(a.y, b.y, c.y), op(a.z, b.z, c.z));
        case "Vector4":
            a = a as Vector4;
            b = b as Vector4;
            c = c as Vector4;
            return new Vector4(op(a.x, b.x, c.x), op(a.y, b.y, c.y), op(a.z, b.z, c.z), op(a.w, b.w, c.w));
        case "Matrix":
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
        super(RichTypeAny, RichTypeAny, RichTypeAny, RichTypeAny, (a, b, c) => this._polymorphicClamp(a, b, c), FlowGraphClampBlock.ClassName, config);
    }

    private _polymorphicClamp(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType, c: FlowGraphMathOperationType) {
        return _componentWiseTernaryOperation(a, b, c, _clamp);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGClampBlock";
}
RegisterClass(FlowGraphClampBlock.ClassName, FlowGraphClampBlock);

function _saturate(a: number): number {
    return Math.min(Math.max(a, 0), 1);
}

/**
 * @experimental
 * Saturate block.
 */
export class FlowGraphSaturateBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSaturate(a), FlowGraphSaturateBlock.ClassName, config);
    }

    private _polymorphicSaturate(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, _saturate);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSaturateBlock";
}
RegisterClass(FlowGraphSaturateBlock.ClassName, FlowGraphSaturateBlock);

function _interpolate(a: number, b: number, c: number) {
    return (1 - c) * a + c * b;
}

/**
 * @experimental
 * Interpolate block.
 */
export class FlowGraphInterpolateBlock extends FlowGraphTernaryOperationBlock<
    FlowGraphMathOperationType,
    FlowGraphMathOperationType,
    FlowGraphMathOperationType,
    FlowGraphMathOperationType
> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, RichTypeAny, (a, b, c) => this._polymorphicInterpolate(a, b, c), FlowGraphInterpolateBlock.ClassName, config);
    }

    private _polymorphicInterpolate(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType, c: FlowGraphMathOperationType) {
        return _componentWiseTernaryOperation(a, b, c, _interpolate);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGInterpolateBlock";
}
RegisterClass(FlowGraphInterpolateBlock.ClassName, FlowGraphInterpolateBlock);

/**
 * @experimental
 * Equals block.
 */
export class FlowGraphEqBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicEq(a, b), FlowGraphEqBlock.ClassName, config);
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

    /**
     * the class name of the block.
     */
    public static ClassName = "FGEqBlock";
}
RegisterClass(FlowGraphEqBlock.ClassName, FlowGraphEqBlock);

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
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicLessThan(a, b), FlowGraphLessThanBlock.ClassName, config);
    }

    private _polymorphicLessThan(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a < b);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGLessThanBlock";
}
RegisterClass(FlowGraphLessThanBlock.ClassName, FlowGraphLessThanBlock);

/**
 * @experimental
 * Less than or equal block.
 */
export class FlowGraphLessThanOrEqualBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicLessThanOrEqual(a, b), FlowGraphLessThanOrEqualBlock.ClassName, config);
    }

    private _polymorphicLessThanOrEqual(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a <= b);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGLessThanOrEqualBlock";
}

/**
 * @experimental
 * Greater than block.
 */
export class FlowGraphGreaterThanBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicGreaterThan(a, b), FlowGraphGreaterThanBlock.ClassName, config);
    }

    private _polymorphicGreaterThan(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a > b);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGGreaterThanBlock";
}
RegisterClass(FlowGraphGreaterThanBlock.ClassName, FlowGraphGreaterThanBlock);

/**
 * @experimental
 * Greater than or equal block.
 */
export class FlowGraphGreaterThanOrEqualBlock extends FlowGraphBinaryOperationBlock<FlowGraphNumber, FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicGreaterThanOrEqual(a, b), FlowGraphGreaterThanOrEqualBlock.ClassName, config);
    }

    private _polymorphicGreaterThanOrEqual(a: FlowGraphNumber, b: FlowGraphNumber) {
        return _comparisonOperators(a, b, (a, b) => a >= b);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGGreaterThanOrEqualBlock";
}
RegisterClass(FlowGraphGreaterThanOrEqualBlock.ClassName, FlowGraphGreaterThanOrEqualBlock);

/**
 * @experimental
 * Is NaN block.
 */
export class FlowGraphIsNanBlock extends FlowGraphUnaryOperationBlock<FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeBoolean, (a) => this._polymorphicIsNan(a), FlowGraphIsNanBlock.ClassName, config);
    }

    private _polymorphicIsNan(a: FlowGraphNumber) {
        if (isNumeric(a)) {
            return isNaN(getNumericValue(a));
        } else {
            throw new Error(`Cannot get NaN of ${a}`);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGIsNanBlock";
}
RegisterClass(FlowGraphIsNanBlock.ClassName, FlowGraphIsNanBlock);

/**
 * @experimental
 * Is Inf block.
 */
export class FlowGraphIsInfBlock extends FlowGraphUnaryOperationBlock<FlowGraphNumber, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeBoolean, (a) => this._polymorphicIsInf(a), FlowGraphIsInfBlock.ClassName, config);
    }

    private _polymorphicIsInf(a: FlowGraphNumber) {
        if (isNumeric(a)) {
            return !isFinite(getNumericValue(a));
        } else {
            throw new Error(`Cannot get isInf of ${a}`);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGIsInfBlock";
}

/**
 * @experimental
 * Convert degrees to radians block.
 */
export class FlowGraphDegToRadBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicDegToRad(a), FlowGraphDegToRadBlock.ClassName, config);
    }

    private _degToRad(a: number) {
        return (a * Math.PI) / 180;
    }

    private _polymorphicDegToRad(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, this._degToRad);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGDegToRadBlock";
}
RegisterClass(FlowGraphDegToRadBlock.ClassName, FlowGraphDegToRadBlock);

/**
 * @experimental
 * Convert radians to degrees block.
 */
export class FlowGraphRadToDegBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicRadToDeg(a), FlowGraphRadToDegBlock.ClassName, config);
    }

    private _radToDeg(a: number) {
        return (a * 180) / Math.PI;
    }

    private _polymorphicRadToDeg(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, this._radToDeg);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGRadToDegBlock";
}
RegisterClass(FlowGraphRadToDegBlock.ClassName, FlowGraphRadToDegBlock);

/**
 * @experimental
 * Sin block.
 */
export class FlowGraphSinBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSin(a), FlowGraphSinBlock.ClassName, config);
    }

    private _polymorphicSin(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sin);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSinBlock";
}
RegisterClass(FlowGraphSinBlock.ClassName, FlowGraphSinBlock);

/**
 * @experimental
 * Cos block.
 */
export class FlowGraphCosBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCos(a), FlowGraphCosBlock.ClassName, config);
    }

    private _polymorphicCos(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.cos);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCosBlock";
}
RegisterClass(FlowGraphCosBlock.ClassName, FlowGraphCosBlock);

/**
 * @experimental
 * Tan block.
 */
export class FlowGraphTanBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTan(a), FlowGraphTanBlock.ClassName, config);
    }

    private _polymorphicTan(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.tan);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGTanBlock";
}
RegisterClass(FlowGraphTanBlock.ClassName, FlowGraphTanBlock);

/**
 * @experimental
 * Arcsin block.
 */
export class FlowGraphAsinBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAsin(a), FlowGraphAsinBlock.ClassName, config);
    }

    private _polymorphicAsin(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.asin);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAsinBlock";
}
RegisterClass(FlowGraphAsinBlock.ClassName, FlowGraphAsinBlock);

/**
 * @experimental
 * Arccos block.
 */
export class FlowGraphAcosBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAcos(a), FlowGraphAcosBlock.ClassName, config);
    }

    private _polymorphicAcos(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.acos);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAcosBlock";
}
RegisterClass(FlowGraphAcosBlock.ClassName, FlowGraphAcosBlock);

/**
 * @experimental
 * Arctan block.
 */
export class FlowGraphAtanBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAtan(a), FlowGraphAtanBlock.ClassName, config);
    }

    private _polymorphicAtan(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.atan);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAtanBlock";
}
RegisterClass(FlowGraphAtanBlock.ClassName, FlowGraphAtanBlock);

/**
 * @experimental
 * Arctan2 block.
 */
export class FlowGraphAtan2Block extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAtan2(a, b), FlowGraphAtan2Block.ClassName, config);
    }

    private _polymorphicAtan2(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, Math.atan2);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAtan2Block";
}
RegisterClass(FlowGraphAtan2Block.ClassName, FlowGraphAtan2Block);

/**
 * @experimental
 * Hyperbolic sin block.
 */
export class FlowGraphSinhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSinh(a), FlowGraphSinhBlock.ClassName, config);
    }

    private _polymorphicSinh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sinh);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSinhBlock";
}
RegisterClass(FlowGraphSinhBlock.ClassName, FlowGraphSinhBlock);

/**
 * @experimental
 * Hyperbolic cos block.
 */
export class FlowGraphCoshBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCosh(a), FlowGraphCoshBlock.ClassName, config);
    }

    private _polymorphicCosh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.cosh);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCoshBlock";
}
RegisterClass(FlowGraphCoshBlock.ClassName, FlowGraphCoshBlock);

/**
 * @experimental
 * Hyperbolic tan block.
 */
export class FlowGraphTanhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTanh(a), FlowGraphTanhBlock.ClassName, config);
    }

    private _polymorphicTanh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.tanh);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGTanhBlock";
}
RegisterClass(FlowGraphTanhBlock.ClassName, FlowGraphTanhBlock);

/**
 * @experimental
 * Hyperbolic arcsin block.
 */
export class FlowGraphAsinhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAsinh(a), FlowGraphAsinhBlock.ClassName, config);
    }

    private _polymorphicAsinh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.asinh);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAsinhBlock";
}
RegisterClass(FlowGraphAsinhBlock.ClassName, FlowGraphAsinhBlock);

/**
 * @experimental
 * Hyperbolic arccos block.
 */
export class FlowGraphAcoshBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAcosh(a), FlowGraphAcoshBlock.ClassName, config);
    }

    private _polymorphicAcosh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.acosh);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAcoshBlock";
}
RegisterClass(FlowGraphAcoshBlock.ClassName, FlowGraphAcoshBlock);

/**
 * @experimental
 * Hyperbolic arctan block.
 */
export class FlowGraphAtanhBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAtanh(a), FlowGraphAtanhBlock.ClassName, config);
    }

    private _polymorphicAtanh(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.atanh);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGAtanhBlock";
}
RegisterClass(FlowGraphAtanhBlock.ClassName, FlowGraphAtanhBlock);

/**
 * @experimental
 * Exponential block.
 */
export class FlowGraphExpBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicExp(a), FlowGraphExpBlock.ClassName, config);
    }

    private _polymorphicExp(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.exp);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGExpBlock";
}
RegisterClass(FlowGraphExpBlock.ClassName, FlowGraphExpBlock);

/**
 * @experimental
 * Logarithm block.
 */
export class FlowGraphLogBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog(a), FlowGraphLogBlock.ClassName, config);
    }

    private _polymorphicLog(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.log);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGLogBlock";
}
RegisterClass(FlowGraphLogBlock.ClassName, FlowGraphLogBlock);

/**
 * @experimental
 * Base 2 logarithm block.
 */
export class FlowGraphLog2Block extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog2(a), FlowGraphLog2Block.ClassName, config);
    }

    private _polymorphicLog2(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.log2);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGLog2Block";
}
RegisterClass(FlowGraphLog2Block.ClassName, FlowGraphLog2Block);

/**
 * @experimental
 * Base 10 logarithm block.
 */
export class FlowGraphLog10Block extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog10(a), FlowGraphLog10Block.ClassName, config);
    }

    private _polymorphicLog10(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.log10);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGLog10Block";
}
RegisterClass(FlowGraphLog10Block.ClassName, FlowGraphLog10Block);

/**
 * @experimental
 * Square root block.
 */
export class FlowGraphSqrtBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicSqrt(a), FlowGraphSqrtBlock.ClassName, config);
    }

    private _polymorphicSqrt(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.sqrt);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSqrtBlock";
}
RegisterClass(FlowGraphSqrtBlock.ClassName, FlowGraphSqrtBlock);

/**
 * @experimental
 * Cube root block.
 */
export class FlowGraphCubeRootBlock extends FlowGraphUnaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicCubeRoot(a), FlowGraphCubeRootBlock.ClassName, config);
    }

    private _polymorphicCubeRoot(a: FlowGraphMathOperationType) {
        return _componentWiseUnaryOperation(a, Math.cbrt);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCubeRootBlock";
}
RegisterClass(FlowGraphCubeRootBlock.ClassName, FlowGraphCubeRootBlock);

/**
 * @experimental
 * Power block.
 */
export class FlowGraphPowBlock extends FlowGraphBinaryOperationBlock<FlowGraphMathOperationType, FlowGraphMathOperationType, FlowGraphMathOperationType> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, RichTypeNumber, (a, b) => this._polymorphicPow(a, b), FlowGraphPowBlock.ClassName, config);
    }

    private _polymorphicPow(a: FlowGraphMathOperationType, b: FlowGraphMathOperationType) {
        return _componentWiseBinaryOperation(a, b, Math.pow);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGPowBlock";
}
RegisterClass(FlowGraphPowBlock.ClassName, FlowGraphPowBlock);

/**
 * @experimental
 * Vector length block.
 */
export class FlowGraphLengthBlock extends FlowGraphUnaryOperationBlock<FlowGraphVector, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLength(a), FlowGraphLengthBlock.ClassName, config);
    }

    private _polymorphicLength(a: FlowGraphVector) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
            case "Vector3":
            case "Vector4":
                return (a as Vector3).length();
            default:
                throw new Error(`Cannot compute length of value ${a}`);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGLengthBlock";
}
RegisterClass(FlowGraphLengthBlock.ClassName, FlowGraphLengthBlock);

/**
 * @experimental
 * Vector normalize block.
 */
export class FlowGraphNormalizeBlock extends FlowGraphUnaryOperationBlock<FlowGraphVector, FlowGraphVector> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicNormalize(a), FlowGraphNormalizeBlock.ClassName, config);
    }

    private _polymorphicNormalize(a: FlowGraphVector) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
            case "Vector3":
            case "Vector4":
                return (a as Vector3).normalize();
            default:
                throw new Error(`Cannot normalize value ${a}`);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGNormalizeBlock";
}
RegisterClass(FlowGraphNormalizeBlock.ClassName, FlowGraphNormalizeBlock);

/**
 * @experimental
 * Dot product block.
 */
export class FlowGraphDotBlock extends FlowGraphBinaryOperationBlock<FlowGraphVector, FlowGraphVector, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeNumber, (a, b) => this._polymorphicDot(a, b), FlowGraphDotBlock.ClassName, config);
    }

    private _polymorphicDot(a: FlowGraphVector, b: FlowGraphVector) {
        const className = _getClassNameOf(a);
        switch (className) {
            case "Vector2":
            case "Vector3":
            case "Vector4":
                return (a as Vector3).dot(b as Vector3);
            default:
                throw new Error(`Cannot get dot product of ${a} and ${b}`);
        }
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGDotBlock";
}
RegisterClass(FlowGraphDotBlock.ClassName, FlowGraphDotBlock);

/**
 * @experimental
 * Cross product block.
 */
export class FlowGraphCrossBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (a, b) => Vector3.Cross(a, b), FlowGraphCrossBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCrossBlock";
}
RegisterClass(FlowGraphCrossBlock.ClassName, FlowGraphCrossBlock);

/**
 * @experimental
 * 2D rotation block.
 */
export class FlowGraphRotate2DBlock extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeNumber, RichTypeVector2, (a, b) => Vector2.Transform(a, Matrix.RotationZ(b)), FlowGraphRotate2DBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGRotate2DBlock";
}
RegisterClass(FlowGraphRotate2DBlock.ClassName, FlowGraphRotate2DBlock);

/**
 * @experimental
 * 3D rotation block.
 */
export class FlowGraphRotate3DBlock extends FlowGraphTernaryOperationBlock<Vector3, Vector3, number, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeVector3,
            RichTypeVector3,
            RichTypeNumber,
            RichTypeVector3,
            (a, b, c) => Vector3.TransformCoordinates(a, Matrix.RotationAxis(b, c)),
            FlowGraphRotate3DBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGRotate3DBlock";
}
RegisterClass(FlowGraphRotate3DBlock.ClassName, FlowGraphRotate3DBlock);

/**
 * @experimental
 * Transposes a matrix.
 */
export class FlowGraphTransposeBlock extends FlowGraphUnaryOperationBlock<Matrix, Matrix> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeMatrix, RichTypeMatrix, (a) => Matrix.Transpose(a), FlowGraphTransposeBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGTransposeBlock";
}
RegisterClass(FlowGraphTransposeBlock.ClassName, FlowGraphTransposeBlock);

/**
 * @experimental
 * Gets the determinant of a matrix.
 */
export class FlowGraphDeterminantBlock extends FlowGraphUnaryOperationBlock<Matrix, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeMatrix, RichTypeNumber, (a) => a.determinant(), FlowGraphDeterminantBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGDeterminantBlock";
}
RegisterClass(FlowGraphDeterminantBlock.ClassName, FlowGraphDeterminantBlock);

/**
 * @experimental
 * Inverts a matrix.
 */
export class FlowGraphInvertMatrixBlock extends FlowGraphUnaryOperationBlock<Matrix, Matrix> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeMatrix, RichTypeMatrix, (a) => Matrix.Invert(a), FlowGraphInvertMatrixBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGInvertMatrixBlock";
}
RegisterClass(FlowGraphInvertMatrixBlock.ClassName, FlowGraphInvertMatrixBlock);

/**
 * @experimental
 * Multiplies two matrices.
 */
export class FlowGraphMatMulBlock extends FlowGraphBinaryOperationBlock<Matrix, Matrix, Matrix> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeMatrix, RichTypeMatrix, RichTypeMatrix, (a, b) => b.multiply(a), FlowGraphMatMulBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGMatMulBlock";
}
RegisterClass(FlowGraphMatMulBlock.ClassName, FlowGraphMatMulBlock);

/**
 * @experimental
 * Bitwise NOT operation
 */
export class FlowGraphBitwiseNotBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeFlowGraphInteger, (a) => new FlowGraphInteger(~a.value), FlowGraphBitwiseNotBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGBitwiseNotBlock";
}
RegisterClass(FlowGraphBitwiseNotBlock.ClassName, FlowGraphBitwiseNotBlock);

/**
 * @experimental
 * Bitwise AND operation
 */
export class FlowGraphBitwiseAndBlock extends FlowGraphBinaryOperationBlock<FlowGraphInteger, FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a, b) => new FlowGraphInteger(a.value & b.value),
            FlowGraphBitwiseAndBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGBitwiseAndBlock";
}
RegisterClass(FlowGraphBitwiseAndBlock.ClassName, FlowGraphBitwiseAndBlock);

/**
 * @experimental
 * Bitwise OR operation
 */
export class FlowGraphBitwiseOrBlock extends FlowGraphBinaryOperationBlock<FlowGraphInteger, FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a, b) => new FlowGraphInteger(a.value | b.value),
            FlowGraphBitwiseOrBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGBitwiseOrBlock";
}
RegisterClass(FlowGraphBitwiseOrBlock.ClassName, FlowGraphBitwiseOrBlock);

/**
 * @experimental
 * Bitwise XOR operation
 */
export class FlowGraphBitwiseXorBlock extends FlowGraphBinaryOperationBlock<FlowGraphInteger, FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a, b) => new FlowGraphInteger(a.value ^ b.value),
            FlowGraphBitwiseXorBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGBitwiseXorBlock";
}
RegisterClass(FlowGraphBitwiseXorBlock.ClassName, FlowGraphBitwiseXorBlock);

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
            FlowGraphBitwiseLeftShiftBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGBitwiseLeftShiftBlock";
}
RegisterClass(FlowGraphBitwiseLeftShiftBlock.ClassName, FlowGraphBitwiseLeftShiftBlock);

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
            FlowGraphBitwiseRightShiftBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGBitwiseRightShiftBlock";
}
RegisterClass(FlowGraphBitwiseRightShiftBlock.ClassName, FlowGraphBitwiseRightShiftBlock);

/**
 * @experimental
 * Count leading zeros operation
 */
export class FlowGraphCountLeadingZerosBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeFlowGraphInteger, (a) => new FlowGraphInteger(Math.clz32(a.value)), FlowGraphCountLeadingZerosBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCountLeadingZerosBlock";
}
RegisterClass(FlowGraphCountLeadingZerosBlock.ClassName, FlowGraphCountLeadingZerosBlock);

/**
 * @experimental
 * Count trailing zeros operation
 */
export class FlowGraphCountTrailingZerosBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(
            RichTypeFlowGraphInteger,
            RichTypeFlowGraphInteger,
            (a) => new FlowGraphInteger(a.value ? 31 - Math.clz32(a.value & -a.value) : 32),
            FlowGraphCountTrailingZerosBlock.ClassName,
            config
        );
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCountTrailingZerosBlock";
}
RegisterClass(FlowGraphCountTrailingZerosBlock.ClassName, FlowGraphCountTrailingZerosBlock);

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
export class FlowGraphCountOneBitsBlock extends FlowGraphUnaryOperationBlock<FlowGraphInteger, FlowGraphInteger> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeFlowGraphInteger, RichTypeFlowGraphInteger, (a) => new FlowGraphInteger(_countOnes(a.value)), FlowGraphCountOneBitsBlock.ClassName, config);
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGCountOneBitsBlock";
}
RegisterClass(FlowGraphCountOneBitsBlock.ClassName, FlowGraphCountOneBitsBlock);
