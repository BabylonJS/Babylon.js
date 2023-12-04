import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RichTypeAny, RichTypeBoolean, RichTypeNumber, RichTypeVector2, RichTypeVector3 } from "../../../flowGraphRichTypes";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphConstantOperationBlock } from "../flowGraphConstantOperationBlock";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../../Maths/math.vector";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphTernaryOperationBlock } from "../flowGraphTernaryOperationBlock";

/**
 * @internal
 * @param v
 * @returns
 */
function _getClassNameOf(v: any) {
    if (v.getClassName) {
        return v.getClassName();
    }
    return "";
}

/**
 * @internal
 * @param className
 * @param className2
 * @returns
 */
function _areSameVectorClass(className: string, className2: string) {
    return (className === "Vector2" && className2 === "Vector2") || (className === "Vector3" && className2 === "Vector3") || (className === "Vector4" && className2 === "Vector4");
}

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphAddBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphAddBlock.ClassName, config);
    }

    private _polymorphicAdd(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
            return a.add(b);
        } else {
            return a + b;
        }
    }

    public getClassName(): string {
        return FlowGraphAddBlock.ClassName;
    }

    public static ClassName = "FGAddBlock";
}
RegisterClass(FlowGraphAddBlock.ClassName, FlowGraphAddBlock);

/**
 * @experimental
 * Polymorphic add block.
 */
export class FlowGraphSubtractBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAdd(a, b), FlowGraphSubtractBlock.ClassName, config);
    }

    private _polymorphicAdd(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
            return a.subtract(b);
        } else {
            return a - b;
        }
    }

    public getClassName(): string {
        return FlowGraphSubtractBlock.ClassName;
    }

    public static ClassName = "FGSubBlock";
}
RegisterClass(FlowGraphSubtractBlock.ClassName, FlowGraphSubtractBlock);

export class FlowGraphMultiplyBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMultiply(a, b), FlowGraphMultiplyBlock.ClassName, config);
    }

    private _polymorphicMultiply(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
            return a.multiply(b);
        } else {
            return a * b;
        }
    }

    public static ClassName = "FGMultiplyBlock";
}
RegisterClass(FlowGraphMultiplyBlock.ClassName, FlowGraphMultiplyBlock);

export class FlowGraphDivideBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicDivide(a, b), FlowGraphDivideBlock.ClassName, config);
    }

    private _polymorphicDivide(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
            return a.divide(b);
        } else {
            return a / b;
        }
    }

    public static ClassName = "FGDivideBlock";
}
RegisterClass(FlowGraphDivideBlock.ClassName, FlowGraphDivideBlock);

export class FlowGraphRandomBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.random(), FlowGraphRandomBlock.ClassName, config);
    }

    public static ClassName = "FGRandomBlock";
}
RegisterClass(FlowGraphRandomBlock.ClassName, FlowGraphRandomBlock);

export class FlowGraphDotBlock extends FlowGraphBinaryOperationBlock<any, any, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeNumber, (a, b) => this._polymorphicDot(a, b), FlowGraphDotBlock.ClassName, config);
    }

    private _polymorphicDot(a: any, b: any) {
        const className = _getClassNameOf(a);
        switch (className) {
            case "Vector2":
                return Vector2.Dot(a, b);
            case "Vector3":
                return Vector3.Dot(a, b);
            case "Vector4":
                return Vector4.Dot(a, b);
            default:
                throw new Error(`Cannot get dot product of ${a} and ${b}`);
        }
    }

    public static ClassName = "FGDotBlock";
}
RegisterClass(FlowGraphDotBlock.ClassName, FlowGraphDotBlock);

export class FlowGraphEBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.E, FlowGraphEBlock.ClassName, config);
    }

    public static ClassName = "FGEBlock";
}
RegisterClass(FlowGraphEBlock.ClassName, FlowGraphEBlock);

export class FlowGraphPiBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Math.PI, FlowGraphPiBlock.ClassName, config);
    }

    public static ClassName = "FGPIBlock";
}
RegisterClass(FlowGraphPiBlock.ClassName, FlowGraphPiBlock);

export class FlowGraphInfBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Number.POSITIVE_INFINITY, FlowGraphInfBlock.ClassName, config);
    }

    public static ClassName = "FGInfBlock";
}
RegisterClass(FlowGraphInfBlock.ClassName, FlowGraphInfBlock);

export class FlowGraphNaNBlock extends FlowGraphConstantOperationBlock<number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeNumber, () => Number.NaN, FlowGraphNaNBlock.ClassName, config);
    }

    public static ClassName = "FGNaNBlock";
}
RegisterClass(FlowGraphNaNBlock.ClassName, FlowGraphNaNBlock);

function _componentWiseUnaryOperation(a: any, op: (a: any) => any) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "Vector2":
            return new Vector2(op(a.x), op(a.y));
        case "Vector3":
            return new Vector3(op(a.x), op(a.y), op(a.z));
        case "Vector4":
            return new Vector4(op(a.x), op(a.y), op(a.z), op(a.w));
        default:
            return op(a);
    }
}

export class FlowGraphAbsBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAbs(a), FlowGraphAbsBlock.ClassName, config);
    }

    private _polymorphicAbs(a: any) {
        return _componentWiseUnaryOperation(a, Math.abs);
    }

    public static ClassName = "FGAbsBlock";
}
RegisterClass(FlowGraphAbsBlock.ClassName, FlowGraphAbsBlock);

export class FlowGraphSignBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSign(a), FlowGraphSignBlock.ClassName, config);
    }

    private _polymorphicSign(a: any) {
        return _componentWiseUnaryOperation(a, Math.sign);
    }

    public static ClassName = "FGSignBlock";
}
RegisterClass(FlowGraphSignBlock.ClassName, FlowGraphSignBlock);

export class FlowGraphTruncBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTrunc(a), FlowGraphTruncBlock.ClassName, config);
    }

    private _polymorphicTrunc(a: any) {
        return _componentWiseUnaryOperation(a, Math.trunc);
    }

    public static ClassName = "FGTruncBlock";
}
RegisterClass(FlowGraphTruncBlock.ClassName, FlowGraphTruncBlock);

export class FlowGraphFloorBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicFloor(a), FlowGraphFloorBlock.ClassName, config);
    }

    private _polymorphicFloor(a: any) {
        return _componentWiseUnaryOperation(a, Math.floor);
    }

    public static ClassName = "FGFloorBlock";
}
RegisterClass(FlowGraphFloorBlock.ClassName, FlowGraphFloorBlock);

export class FlowGraphCeilBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCeiling(a), FlowGraphCeilBlock.ClassName, config);
    }

    private _polymorphicCeiling(a: any) {
        return _componentWiseUnaryOperation(a, Math.ceil);
    }

    public static ClassName = "FGCeilBlock";
}
RegisterClass(FlowGraphCeilBlock.ClassName, FlowGraphCeilBlock);

export class FlowGraphFractBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicFract(a), FlowGraphFractBlock.ClassName, config);
    }

    private _polymorphicFract(a: any) {
        return _componentWiseUnaryOperation(a, (a) => a - Math.floor(a));
    }

    public static ClassName = "FGFractBlock";
}
RegisterClass(FlowGraphFractBlock.ClassName, FlowGraphFractBlock);

export class FlowGraphNegBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicNeg(a), FlowGraphNegBlock.ClassName, config);
    }

    private _polymorphicNeg(a: any) {
        return _componentWiseUnaryOperation(a, (a) => -a);
    }

    public static ClassName = "FGNegBlock";
}
RegisterClass(FlowGraphNegBlock.ClassName, FlowGraphNegBlock);

function _componentWiseBinaryOperation(a: any, b: any, op: (a: any, b: any) => any) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "Vector2":
            return new Vector2(op(a.x, b.x), op(a.y, b.y));
        case "Vector3":
            return new Vector3(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z));
        case "Vector4":
            return new Vector4(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z), op(a.w, b.w));
        default:
            return op(a, b);
    }
}

export class FlowGraphRemainderBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicRemainder(a, b), FlowGraphRemainderBlock.ClassName, config);
    }

    private _polymorphicRemainder(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, (a, b) => a % b);
    }

    public static ClassName = "FGRemainderBlock";
}
RegisterClass(FlowGraphRemainderBlock.ClassName, FlowGraphRemainderBlock);

export class FlowGraphMinBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMin(a, b), FlowGraphMinBlock.ClassName, config);
    }

    private _polymorphicMin(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, Math.min);
    }

    public static ClassName = "FGMinBlock";
}
RegisterClass(FlowGraphMinBlock.ClassName, FlowGraphMinBlock);

export class FlowGraphMaxBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicMax(a, b), FlowGraphMaxBlock.ClassName, config);
    }

    private _polymorphicMax(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, Math.max);
    }

    public static ClassName = "FGMaxBlock";
}
RegisterClass(FlowGraphMaxBlock.ClassName, FlowGraphMaxBlock);

function _clamp(a: number, b: number, c: number) {
    return Math.min(Math.max(a, b), c);
}

function _componentWiseTernaryOperation(a: any, b: any, c: any, op: (a: any, b: any, c: any) => any) {
    const aClassName = _getClassNameOf(a);
    switch (aClassName) {
        case "Vector2":
            return new Vector2(op(a.x, b.x, c.x), op(a.y, b.y, c.y));
        case "Vector3":
            return new Vector3(op(a.x, b.x, c.x), op(a.y, b.y, c.y), op(a.z, b.z, c.z));
        case "Vector4":
            return new Vector4(op(a.x, b.x, c.x), op(a.y, b.y, c.y), op(a.z, b.z, c.z), op(a.w, b.w, c.w));
        default:
            return op(a, b, c);
    }
}

export class FlowGraphClampBlock extends FlowGraphTernaryOperationBlock<any, any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, RichTypeAny, (a, b, c) => this._polymorphicClamp(a, b, c), FlowGraphClampBlock.ClassName, config);
    }

    private _polymorphicClamp(a: any, b: any, c: any) {
        return _componentWiseTernaryOperation(a, b, c, _clamp);
    }

    public static ClassName = "FGClampBlock";
}
RegisterClass(FlowGraphClampBlock.ClassName, FlowGraphClampBlock);

export class FlowGraphSaturateBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSaturate(a), FlowGraphSaturateBlock.ClassName, config);
    }

    private _polymorphicSaturate(a: any) {
        return _componentWiseUnaryOperation(a, (a) => _clamp(a, 0, 1));
    }

    public static ClassName = "FGSaturateBlock";
}
RegisterClass(FlowGraphSaturateBlock.ClassName, FlowGraphSaturateBlock);

export class FlowGraphInterpolateBlock extends FlowGraphTernaryOperationBlock<any, any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, RichTypeAny, (a, b, c) => this._polymorphicInterpolate(a, b, c), FlowGraphInterpolateBlock.ClassName, config);
    }

    private _interpolate(a: number, b: number, c: number) {
        return (1 - c) * a + c * b;
    }

    private _polymorphicInterpolate(a: any, b: any, c: any) {
        return _componentWiseTernaryOperation(a, b, c, this._interpolate);
    }

    public static ClassName = "FGInterpolateBlock";
}
RegisterClass(FlowGraphInterpolateBlock.ClassName, FlowGraphInterpolateBlock);

export class FlowGraphEqBlock extends FlowGraphBinaryOperationBlock<any, any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicEq(a, b), FlowGraphEqBlock.ClassName, config);
    }

    private _polymorphicEq(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        const bClassName = _getClassNameOf(b);
        if (_areSameVectorClass(aClassName, bClassName)) {
            return a.equals(b);
        } else {
            return a === b;
        }
    }

    public static ClassName = "FGEqBlock";
}
RegisterClass(FlowGraphEqBlock.ClassName, FlowGraphEqBlock);

export class FlowGraphLessThanBlock extends FlowGraphBinaryOperationBlock<any, any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicLessThan(a, b), FlowGraphLessThanBlock.ClassName, config);
    }

    private _polymorphicLessThan(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
                return a.x < b.x && a.y < b.y;
            case "Vector3":
                return a.x < b.x && a.y < b.y && a.z < b.z;
            case "Vector4":
                return a.x < b.x && a.y < b.y && a.z < b.z && a.w < b.w;
            default:
                return a < b;
        }
    }

    public static ClassName = "FGLessThanBlock";
}
RegisterClass(FlowGraphLessThanBlock.ClassName, FlowGraphLessThanBlock);

export class FlowGraphLessThanOrEqualBlock extends FlowGraphBinaryOperationBlock<any, any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicLessThanOrEqual(a, b), FlowGraphLessThanOrEqualBlock.ClassName, config);
    }

    private _polymorphicLessThanOrEqual(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
                return a.x <= b.x && a.y <= b.y;
            case "Vector3":
                return a.x <= b.x && a.y <= b.y && a.z <= b.z;
            case "Vector4":
                return a.x <= b.x && a.y <= b.y && a.z <= b.z && a.w <= b.w;
            default:
                return a <= b;
        }
    }

    public static ClassName = "FGLessThanOrEqualBlock";
}

export class FlowGraphGreaterThanBlock extends FlowGraphBinaryOperationBlock<any, any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicGreaterThan(a, b), FlowGraphGreaterThanBlock.ClassName, config);
    }

    private _polymorphicGreaterThan(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
                return a.x > b.x && a.y > b.y;
            case "Vector3":
                return a.x > b.x && a.y > b.y && a.z > b.z;
            case "Vector4":
                return a.x > b.x && a.y > b.y && a.z > b.z && a.w > b.w;
            default:
                return a > b;
        }
    }

    public static ClassName = "FGGreaterThanBlock";
}
RegisterClass(FlowGraphGreaterThanBlock.ClassName, FlowGraphGreaterThanBlock);

export class FlowGraphGreaterThanOrEqualBlock extends FlowGraphBinaryOperationBlock<any, any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeBoolean, (a, b) => this._polymorphicGreaterThanOrEqual(a, b), FlowGraphGreaterThanOrEqualBlock.ClassName, config);
    }

    private _polymorphicGreaterThanOrEqual(a: any, b: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
                return a.x >= b.x && a.y >= b.y;
            case "Vector3":
                return a.x >= b.x && a.y >= b.y && a.z >= b.z;
            case "Vector4":
                return a.x >= b.x && a.y >= b.y && a.z >= b.z && a.w >= b.w;
            default:
                return a >= b;
        }
    }

    public static ClassName = "FGGreaterThanOrEqualBlock";
}
RegisterClass(FlowGraphGreaterThanOrEqualBlock.ClassName, FlowGraphGreaterThanOrEqualBlock);

export class FlowGraphIsNanBlock extends FlowGraphUnaryOperationBlock<any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeBoolean, (a) => this._polymorphicIsNan(a), FlowGraphIsNanBlock.ClassName, config);
    }

    private _polymorphicIsNan(a: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
                return isNaN(a.x) || isNaN(a.y);
            case "Vector3":
                return isNaN(a.x) || isNaN(a.y) || isNaN(a.z);
            case "Vector4":
                return isNaN(a.x) || isNaN(a.y) || isNaN(a.z) || isNaN(a.w);
            default:
                return isNaN(a);
        }
    }

    public static ClassName = "FGIsNanBlock";
}
RegisterClass(FlowGraphIsNanBlock.ClassName, FlowGraphIsNanBlock);

export class FlowGraphIsInfBlock extends FlowGraphUnaryOperationBlock<any, boolean> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeBoolean, (a) => this._polymorphicIsInf(a), FlowGraphIsInfBlock.ClassName, config);
    }

    private _polymorphicIsInf(a: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
                return !isFinite(a.x) || !isFinite(a.y);
            case "Vector3":
                return !isFinite(a.x) || !isFinite(a.y) || !isFinite(a.z);
            case "Vector4":
                return !isFinite(a.x) || !isFinite(a.y) || !isFinite(a.z) || !isFinite(a.w);
            default:
                return !isFinite(a);
        }
    }

    public static ClassName = "FGIsInfBlock";
}

export class FlowGraphDegToRadBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicDegToRad(a), FlowGraphDegToRadBlock.ClassName, config);
    }

    private _degToRad(a: number) {
        return (a * Math.PI) / 180;
    }

    private _polymorphicDegToRad(a: any) {
        return _componentWiseUnaryOperation(a, this._degToRad);
    }

    public static ClassName = "FGDegToRadBlock";
}
RegisterClass(FlowGraphDegToRadBlock.ClassName, FlowGraphDegToRadBlock);

export class FlowGraphRadToDegBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicRadToDeg(a), FlowGraphRadToDegBlock.ClassName, config);
    }

    private _radToDeg(a: number) {
        return (a * 180) / Math.PI;
    }

    private _polymorphicRadToDeg(a: any) {
        return _componentWiseUnaryOperation(a, this._radToDeg);
    }

    public static ClassName = "FGRadToDegBlock";
}
RegisterClass(FlowGraphRadToDegBlock.ClassName, FlowGraphRadToDegBlock);

export class FlowGraphSinBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSin(a), FlowGraphSinBlock.ClassName, config);
    }

    private _polymorphicSin(a: any) {
        return _componentWiseUnaryOperation(a, Math.sin);
    }

    public static ClassName = "FGSinBlock";
}
RegisterClass(FlowGraphSinBlock.ClassName, FlowGraphSinBlock);

export class FlowGraphCosBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCos(a), FlowGraphCosBlock.ClassName, config);
    }

    private _polymorphicCos(a: any) {
        return _componentWiseUnaryOperation(a, Math.cos);
    }

    public static ClassName = "FGCosBlock";
}
RegisterClass(FlowGraphCosBlock.ClassName, FlowGraphCosBlock);

export class FlowGraphTanBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTan(a), FlowGraphTanBlock.ClassName, config);
    }

    private _polymorphicTan(a: any) {
        return _componentWiseUnaryOperation(a, Math.tan);
    }

    public static ClassName = "FGTanBlock";
}
RegisterClass(FlowGraphTanBlock.ClassName, FlowGraphTanBlock);

export class FlowGraphAsinBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAsin(a), FlowGraphAsinBlock.ClassName, config);
    }

    private _polymorphicAsin(a: any) {
        return _componentWiseUnaryOperation(a, Math.asin);
    }

    public static ClassName = "FGAsinBlock";
}
RegisterClass(FlowGraphAsinBlock.ClassName, FlowGraphAsinBlock);

export class FlowGraphAcosBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAcos(a), FlowGraphAcosBlock.ClassName, config);
    }

    private _polymorphicAcos(a: any) {
        return _componentWiseUnaryOperation(a, Math.acos);
    }

    public static ClassName = "FGAcosBlock";
}
RegisterClass(FlowGraphAcosBlock.ClassName, FlowGraphAcosBlock);

export class FlowGraphAtanBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicAtan(a), FlowGraphAtanBlock.ClassName, config);
    }

    private _polymorphicAtan(a: any) {
        return _componentWiseUnaryOperation(a, Math.atan);
    }

    public static ClassName = "FGAtanBlock";
}
RegisterClass(FlowGraphAtanBlock.ClassName, FlowGraphAtanBlock);

export class FlowGraphAtan2Block extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeAny, (a, b) => this._polymorphicAtan2(a, b), FlowGraphAtan2Block.ClassName, config);
    }

    private _polymorphicAtan2(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, Math.atan2);
    }

    public static ClassName = "FGAtan2Block";
}
RegisterClass(FlowGraphAtan2Block.ClassName, FlowGraphAtan2Block);

export class FlowGraphSinhBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicSinh(a), FlowGraphSinhBlock.ClassName, config);
    }

    private _polymorphicSinh(a: any) {
        return _componentWiseUnaryOperation(a, Math.sinh);
    }

    public static ClassName = "FGSinhBlock";
}
RegisterClass(FlowGraphSinhBlock.ClassName, FlowGraphSinhBlock);

export class FlowGraphCoshBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicCosh(a), FlowGraphCoshBlock.ClassName, config);
    }

    private _polymorphicCosh(a: any) {
        return _componentWiseUnaryOperation(a, Math.cosh);
    }

    public static ClassName = "FGCoshBlock";
}
RegisterClass(FlowGraphCoshBlock.ClassName, FlowGraphCoshBlock);

export class FlowGraphTanhBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicTanh(a), FlowGraphTanhBlock.ClassName, config);
    }

    private _polymorphicTanh(a: any) {
        return _componentWiseUnaryOperation(a, Math.tanh);
    }

    public static ClassName = "FGTanhBlock";
}
RegisterClass(FlowGraphTanhBlock.ClassName, FlowGraphTanhBlock);

export class FlowGraphAsinhBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAsinh(a), FlowGraphAsinhBlock.ClassName, config);
    }

    private _polymorphicAsinh(a: any) {
        return _componentWiseUnaryOperation(a, Math.asinh);
    }

    public static ClassName = "FGAsinhBlock";
}
RegisterClass(FlowGraphAsinhBlock.ClassName, FlowGraphAsinhBlock);

export class FlowGraphAcoshBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAcosh(a), FlowGraphAcoshBlock.ClassName, config);
    }

    private _polymorphicAcosh(a: any) {
        return _componentWiseUnaryOperation(a, Math.acosh);
    }

    public static ClassName = "FGAcoshBlock";
}
RegisterClass(FlowGraphAcoshBlock.ClassName, FlowGraphAcoshBlock);

export class FlowGraphAtanhBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicAtanh(a), FlowGraphAtanhBlock.ClassName, config);
    }

    private _polymorphicAtanh(a: any) {
        return _componentWiseUnaryOperation(a, Math.atanh);
    }

    public static ClassName = "FGAtanhBlock";
}
RegisterClass(FlowGraphAtanhBlock.ClassName, FlowGraphAtanhBlock);

export class FlowGraphExpBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicExp(a), FlowGraphExpBlock.ClassName, config);
    }

    private _polymorphicExp(a: any) {
        return _componentWiseUnaryOperation(a, Math.exp);
    }

    public static ClassName = "FGExpBlock";
}
RegisterClass(FlowGraphExpBlock.ClassName, FlowGraphExpBlock);

export class FlowGraphLogBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog(a), FlowGraphLogBlock.ClassName, config);
    }

    private _polymorphicLog(a: any) {
        return _componentWiseUnaryOperation(a, Math.log);
    }

    public static ClassName = "FGLogBlock";
}
RegisterClass(FlowGraphLogBlock.ClassName, FlowGraphLogBlock);

export class FlowGraphLog2Block extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog2(a), FlowGraphLog2Block.ClassName, config);
    }

    private _polymorphicLog2(a: any) {
        return _componentWiseUnaryOperation(a, Math.log2);
    }

    public static ClassName = "FGLog2Block";
}
RegisterClass(FlowGraphLog2Block.ClassName, FlowGraphLog2Block);

export class FlowGraphLog10Block extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLog10(a), FlowGraphLog10Block.ClassName, config);
    }

    private _polymorphicLog10(a: any) {
        return _componentWiseUnaryOperation(a, Math.log10);
    }

    public static ClassName = "FGLog10Block";
}
RegisterClass(FlowGraphLog10Block.ClassName, FlowGraphLog10Block);

export class FlowGraphSqrtBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicSqrt(a), FlowGraphSqrtBlock.ClassName, config);
    }

    private _polymorphicSqrt(a: any) {
        return _componentWiseUnaryOperation(a, Math.sqrt);
    }

    public static ClassName = "FGSqrtBlock";
}
RegisterClass(FlowGraphSqrtBlock.ClassName, FlowGraphSqrtBlock);

export class FlowGraphCubeRootBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicCubeRoot(a), FlowGraphCubeRootBlock.ClassName, config);
    }

    private _polymorphicCubeRoot(a: any) {
        return _componentWiseUnaryOperation(a, Math.cbrt);
    }

    public static ClassName = "FGCubeRootBlock";
}
RegisterClass(FlowGraphCubeRootBlock.ClassName, FlowGraphCubeRootBlock);

export class FlowGraphPowBlock extends FlowGraphBinaryOperationBlock<any, any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, RichTypeNumber, (a, b) => this._polymorphicPow(a, b), FlowGraphPowBlock.ClassName, config);
    }

    private _polymorphicPow(a: any, b: any) {
        return _componentWiseBinaryOperation(a, b, Math.pow);
    }

    public static ClassName = "FGPowBlock";
}
RegisterClass(FlowGraphPowBlock.ClassName, FlowGraphPowBlock);

export class FlowGraphLengthBlock extends FlowGraphUnaryOperationBlock<any, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLength(a), FlowGraphLengthBlock.ClassName, config);
    }

    private _polymorphicLength(a: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
            case "Vector3":
            case "Vector4":
                return a.length();
            default:
                throw new Error(`Cannot compute length of value ${a}`);
        }
    }

    public static ClassName = "FGLengthBlock";
}
RegisterClass(FlowGraphLengthBlock.ClassName, FlowGraphLengthBlock);

export class FlowGraphNormalizeBlock extends FlowGraphUnaryOperationBlock<any, any> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicNormalize(a), FlowGraphNormalizeBlock.ClassName, config);
    }

    private _polymorphicNormalize(a: any) {
        const aClassName = _getClassNameOf(a);
        switch (aClassName) {
            case "Vector2":
            case "Vector3":
            case "Vector4":
                return a.normalize();
            default:
                throw new Error(`Cannot normalize value ${a}`);
        }
    }

    public static ClassName = "FGNormalizeBlock";
}
RegisterClass(FlowGraphNormalizeBlock.ClassName, FlowGraphNormalizeBlock);

export class FlowGraphCrossBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (a, b) => Vector3.Cross(a, b), FlowGraphCrossBlock.ClassName, config);
    }

    public static ClassName = "FGCrossBlock";
}
RegisterClass(FlowGraphCrossBlock.ClassName, FlowGraphCrossBlock);

export class FlowGraphRotate2DBlock extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeNumber, RichTypeVector2, (a, b) => Vector2.Transform(a, Matrix.RotationZ(b)), FlowGraphRotate2DBlock.ClassName, config);
    }

    public static ClassName = "FGRotate2DBlock";
}
RegisterClass(FlowGraphRotate2DBlock.ClassName, FlowGraphRotate2DBlock);

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

    public static ClassName = "FGRotate3DBlock";
}
RegisterClass(FlowGraphRotate3DBlock.ClassName, FlowGraphRotate3DBlock);
