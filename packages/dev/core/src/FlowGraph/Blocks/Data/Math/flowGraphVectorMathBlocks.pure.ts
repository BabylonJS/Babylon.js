/** This file must only contain pure code and pure imports */

import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import {
    RichTypeVector3,
    FlowGraphTypes,
    RichTypeNumber,
    RichTypeAny,
    RichTypeVector2,
    RichTypeMatrix,
    getRichTypeByFlowGraphType,
    RichTypeQuaternion,
    RichTypeBoolean,
} from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { FlowGraphTernaryOperationBlock } from "../flowGraphTernaryOperationBlock";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { Quaternion, Vector3, Vector4, type Matrix, type Vector2 } from "core/Maths/math.vector.pure";
import { type FlowGraphMatrix2D, type FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes";
import { type FlowGraphMatrix, type FlowGraphVector, _GetClassNameOf } from "core/FlowGraph/utils";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type Nullable } from "../../../../types";
import {
    GetAngleBetweenQuaternions,
    GetQuaternionFromDirections,
    GetQuaternionFromEulerAngles,
    GetQuaternionFromUpForward,
    GetVector2Slerp,
    GetVector3Slerp,
    QuaternionEulerAngleOrders,
} from "core/FlowGraph/flowGraphMath";
import { RegisterClass } from "core/Misc/typeStore";

const AxisCacheName = "cachedOperationAxis";
const AngleCacheName = "cachedOperationAngle";
const CacheExecIdName = "cachedExecutionId";

/**
 * Vector length block.
 */
export class FlowGraphLengthBlock extends FlowGraphUnaryOperationBlock<FlowGraphVector, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeNumber, (a) => this._polymorphicLength(a), FlowGraphBlockNames.Length, config);
    }

    private _polymorphicLength(a: FlowGraphVector) {
        const aClassName = _GetClassNameOf(a);
        switch (aClassName) {
            case FlowGraphTypes.Vector2:
            case FlowGraphTypes.Vector3:
            case FlowGraphTypes.Vector4:
            case FlowGraphTypes.Quaternion:
                return (a as Vector3).length();
            default:
                throw new Error(`Cannot compute length of value ${a}`);
        }
    }
}

/**
 * Configuration for normalized vector
 */
export interface IFlowGraphNormalizeBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * If true, the block will return NaN if the input vector has a length of 0.
     * This is the expected behavior for glTF interactivity graphs.
     */
    nanOnZeroLength?: boolean;
}

/**
 * Vector normalize block.
 */
export class FlowGraphNormalizeBlock extends FlowGraphCachedOperationBlock<FlowGraphVector> {
    /**
     * The vector to normalize.
     */
    public readonly a: FlowGraphDataConnection<FlowGraphVector>;

    constructor(config?: IFlowGraphNormalizeBlockConfiguration) {
        super(RichTypeAny, config);
        this.a = this.registerDataInput("a", RichTypeAny);
    }

    public override _doOperation(context: FlowGraphContext): FlowGraphVector | undefined {
        return this._polymorphicNormalize(this.a.getValue(context));
    }

    private _polymorphicNormalize(a: FlowGraphVector): FlowGraphVector | undefined {
        const aClassName = _GetClassNameOf(a);
        switch (aClassName) {
            case FlowGraphTypes.Vector2:
            case FlowGraphTypes.Vector3:
            case FlowGraphTypes.Vector4:
            case FlowGraphTypes.Quaternion: {
                // Per the KHR_interactivity spec, normalization is only valid when the length is a positive finite
                // number. For zero, NaN, or +Infinity length the operation is invalid: returning undefined makes the
                // cached base report isValid = false (the `value` output keeps the type default).
                const length = (a as Vector3).length();
                if (length === 0 || !Number.isFinite(length)) {
                    if (this.config?.nanOnZeroLength) {
                        // Legacy behavior preserved for non-glTF consumers that opt into NaN output.
                        const nanVector = a.normalizeToNew();
                        nanVector.setAll(NaN);
                        return nanVector;
                    }
                    return undefined;
                }
                return a.normalizeToNew();
            }
            default:
                throw new Error(`Cannot normalize value ${a}`);
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.Normalize;
    }
}

/**
 * Dot product block.
 */
export class FlowGraphDotBlock extends FlowGraphBinaryOperationBlock<FlowGraphVector, FlowGraphVector, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeNumber, (a, b) => this._polymorphicDot(a, b), FlowGraphBlockNames.Dot, config);
    }

    private _polymorphicDot(a: FlowGraphVector, b: FlowGraphVector) {
        const className = _GetClassNameOf(a);
        switch (className) {
            case FlowGraphTypes.Vector2:
            case FlowGraphTypes.Vector3:
            case FlowGraphTypes.Vector4:
            case FlowGraphTypes.Quaternion:
                // casting is needed because dot requires both to be the same type
                return (a as Vector3).dot(b as Vector3);
            default:
                throw new Error(`Cannot get dot product of ${a} and ${b}`);
        }
    }
}

/**
 * Cross product block.
 */
export class FlowGraphCrossBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (a, b) => Vector3.Cross(a, b), FlowGraphBlockNames.Cross, config);
    }
}

/**
 * 2D rotation block.
 */
export class FlowGraphRotate2DBlock extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeNumber, RichTypeVector2, (a, b) => a.rotate(b), FlowGraphBlockNames.Rotate2D, config);
    }
}

/**
 * 3D rotation block.
 */
export class FlowGraphRotate3DBlock extends FlowGraphBinaryOperationBlock<Vector3, Quaternion, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeQuaternion, RichTypeVector3, (a, b) => a.applyRotationQuaternion(b), FlowGraphBlockNames.Rotate3D, config);
    }
}

function TransformVector(a: FlowGraphVector, b: FlowGraphMatrix): FlowGraphVector {
    const className = _GetClassNameOf(a);
    switch (className) {
        case FlowGraphTypes.Vector2:
            return (b as FlowGraphMatrix2D).transformVector(a as Vector2);
        case FlowGraphTypes.Vector3:
            return (b as FlowGraphMatrix3D).transformVector(a as Vector3);
        case FlowGraphTypes.Vector4:
            a = a as Vector4;
            // transform the vector 4 with the matrix here. Vector4.TransformCoordinates transforms a 3D coordinate, not Vector4.
            // Babylon's Matrix stores its elements column-major (m[0..3] is the first column), and glTF/KHR_interactivity
            // float4x4 values are column-major as well, so M * a reads down the columns: value[i] = sum_j M[i][j] * a[j]
            // with M[i][j] = m[j * 4 + i].
            return new Vector4(
                a.x * b.m[0] + a.y * b.m[4] + a.z * b.m[8] + a.w * b.m[12],
                a.x * b.m[1] + a.y * b.m[5] + a.z * b.m[9] + a.w * b.m[13],
                a.x * b.m[2] + a.y * b.m[6] + a.z * b.m[10] + a.w * b.m[14],
                a.x * b.m[3] + a.y * b.m[7] + a.z * b.m[11] + a.w * b.m[15]
            );
        default:
            throw new Error(`Cannot transform value ${a}`);
    }
}

/**
 * Configuration for the transform block.
 */
export interface IFlowGraphTransformBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The vector type
     */
    vectorType: FlowGraphTypes;
}

/**
 * Transform a vector3 by a matrix.
 */
export class FlowGraphTransformBlock extends FlowGraphBinaryOperationBlock<FlowGraphVector, FlowGraphMatrix, FlowGraphVector> {
    constructor(config?: IFlowGraphTransformBlockConfiguration) {
        const vectorType = config?.vectorType || FlowGraphTypes.Vector3;
        const matrixType =
            vectorType === FlowGraphTypes.Vector2 ? FlowGraphTypes.Matrix2D : vectorType === FlowGraphTypes.Vector3 ? FlowGraphTypes.Matrix3D : FlowGraphTypes.Matrix;
        super(
            getRichTypeByFlowGraphType(vectorType),
            getRichTypeByFlowGraphType(matrixType),
            getRichTypeByFlowGraphType(vectorType),
            TransformVector,
            FlowGraphBlockNames.TransformVector,
            config
        );
    }
}

/**
 * Transform a vector3 by a matrix.
 */
export class FlowGraphTransformCoordinatesBlock extends FlowGraphBinaryOperationBlock<Vector3, Matrix, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeMatrix, RichTypeVector3, (a, b) => Vector3.TransformCoordinates(a, b), FlowGraphBlockNames.TransformCoordinates, config);
    }
}

/**
 * Conjugate the quaternion.
 */
export class FlowGraphConjugateBlock extends FlowGraphUnaryOperationBlock<Quaternion, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeQuaternion, RichTypeQuaternion, (a) => a.conjugate(), FlowGraphBlockNames.Conjugate, config);
    }
}

/**
 * Get the angle between two quaternions.
 */
export class FlowGraphAngleBetweenBlock extends FlowGraphBinaryOperationBlock<Quaternion, Quaternion, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeQuaternion, RichTypeQuaternion, RichTypeNumber, (a, b) => GetAngleBetweenQuaternions(a, b), FlowGraphBlockNames.AngleBetween, config);
    }
}

/**
 * Get the quaternion from an axis and an angle.
 */
export class FlowGraphQuaternionFromAxisAngleBlock extends FlowGraphBinaryOperationBlock<Vector3, number, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeNumber, RichTypeQuaternion, (a, b) => Quaternion.RotationAxis(a, b), FlowGraphBlockNames.QuaternionFromAxisAngle, config);
    }
}

/**
 * Get the axis and angle from a quaternion.
 */
export class FlowGraphAxisAngleFromQuaternionBlock extends FlowGraphBlock {
    /**
     * The input of this block.
     */
    public readonly a: FlowGraphDataConnection<Quaternion>;

    /**
     * The output axis of rotation.
     */
    public readonly axis: FlowGraphDataConnection<Vector3>;

    /**
     * The output angle of rotation.
     */
    public readonly angle: FlowGraphDataConnection<number>;

    /**
     * Output connection: Whether the value is valid.
     */
    public readonly isValid: FlowGraphDataConnection<boolean>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.a = this.registerDataInput("a", RichTypeQuaternion);

        this.axis = this.registerDataOutput("axis", RichTypeVector3);
        this.angle = this.registerDataOutput("angle", RichTypeNumber);

        this.isValid = this.registerDataOutput("isValid", RichTypeBoolean);
    }

    /** @override */
    public override _updateOutputs(context: FlowGraphContext) {
        const cachedExecutionId = context._getExecutionVariable(this, CacheExecIdName, -1);
        const cachedAxis = context._getExecutionVariable<Nullable<Vector3>>(this, AxisCacheName, null);
        const cachedAngle = context._getExecutionVariable<Nullable<number>>(this, AngleCacheName, null);
        if (cachedAxis !== undefined && cachedAxis !== null && cachedAngle !== undefined && cachedAngle !== null && cachedExecutionId === context.executionId) {
            this.axis.setValue(cachedAxis, context);
            this.angle.setValue(cachedAngle, context);
        } else {
            try {
                const { axis, angle } = this.a.getValue(context).toAxisAngle();
                context._setExecutionVariable(this, AxisCacheName, axis);
                context._setExecutionVariable(this, AngleCacheName, angle);
                context._setExecutionVariable(this, CacheExecIdName, context.executionId);
                this.axis.setValue(axis, context);
                this.angle.setValue(angle, context);
                this.isValid.setValue(true, context);
            } catch (e) {
                this.isValid.setValue(false, context);
            }
        }
    }

    /**
     * Gets the class name
     * @override
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.AxisAngleFromQuaternion;
    }
}

/**
 * Get the quaternion from two direction vectors.
 */
export class FlowGraphQuaternionFromDirectionsBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeQuaternion, (a, b) => GetQuaternionFromDirections(a, b), FlowGraphBlockNames.QuaternionFromDirections, config);
    }
}

/**
 * Get a rotation quaternion from the specified up and forward directions (KHR_interactivity `math/quatFromUpForward`).
 */
export class FlowGraphQuaternionFromUpForwardBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeQuaternion, (up, forward) => GetQuaternionFromUpForward(up, forward), FlowGraphBlockNames.QuaternionFromUpForward, config);
    }
}

/**
 * Spherical linear interpolation between two vectors (KHR_interactivity `math/slerp`).
 * Supports float2 and float3 vectors; the interpolation coefficient is a number.
 */
export class FlowGraphVectorSlerpBlock extends FlowGraphTernaryOperationBlock<FlowGraphVector, FlowGraphVector, number, FlowGraphVector> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, RichTypeNumber, RichTypeAny, (a, b, c) => this._polymorphicSlerp(a, b, c), FlowGraphBlockNames.VectorSlerp, config);
    }

    private _polymorphicSlerp(a: FlowGraphVector, b: FlowGraphVector, c: number): FlowGraphVector {
        const className = _GetClassNameOf(a);
        switch (className) {
            case FlowGraphTypes.Vector2:
                return GetVector2Slerp(a as Vector2, b as Vector2, c);
            case FlowGraphTypes.Vector3:
                return GetVector3Slerp(a as Vector3, b as Vector3, c);
            default:
                throw new Error(`Cannot slerp value ${a}`);
        }
    }
}

/**
 * The configuration of the FlowGraphQuaternionFromAnglesBlock.
 */
export interface IFlowGraphQuaternionFromAnglesBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The intrinsic Tait–Bryan rotation order, one of `xyz`, `xzy`, `yxz`, `yzx`, `zxy`, `zyx`.
     * Any other (or missing) value falls back to the spec default `yxz`.
     */
    order?: string;
}

/**
 * Creates a rotation quaternion from three Tait–Bryan intrinsic Euler angles applied in a
 * configurable order (KHR_interactivity `math/quatFromAngles`).
 *
 * Inputs `a`, `b`, `c` are the rotations (in radians) around the X, Y and Z axes respectively.
 * The `order` configuration selects the intrinsic rotation order; NaN and infinite inputs
 * propagate into the resulting quaternion components.
 */
export class FlowGraphQuaternionFromAnglesBlock extends FlowGraphTernaryOperationBlock<number, number, number, Quaternion> {
    /**
     * The validated intrinsic rotation order used to compose the quaternion.
     */
    private readonly _order: string;

    constructor(config?: IFlowGraphQuaternionFromAnglesBlockConfiguration) {
        super(
            RichTypeNumber,
            RichTypeNumber,
            RichTypeNumber,
            RichTypeQuaternion,
            (a, b, c) => GetQuaternionFromEulerAngles(this._order, a, b, c),
            FlowGraphBlockNames.QuaternionFromAngles,
            config
        );
        const order = config?.order;
        // Per the spec, a missing, non-string or unrecognized order MUST use the default `yxz`.
        this._order = typeof order === "string" && (QuaternionEulerAngleOrders as readonly string[]).indexOf(order) !== -1 ? order : "yxz";
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphVectorMathBlocks.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphVectorMathBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.Length, FlowGraphLengthBlock);
    RegisterClass(FlowGraphBlockNames.Normalize, FlowGraphNormalizeBlock);
    RegisterClass(FlowGraphBlockNames.Dot, FlowGraphDotBlock);
    RegisterClass(FlowGraphBlockNames.Cross, FlowGraphCrossBlock);
    RegisterClass(FlowGraphBlockNames.Rotate2D, FlowGraphRotate2DBlock);
    RegisterClass(FlowGraphBlockNames.Rotate3D, FlowGraphRotate3DBlock);
    RegisterClass(FlowGraphBlockNames.TransformVector, FlowGraphTransformBlock);
    RegisterClass(FlowGraphBlockNames.TransformCoordinates, FlowGraphTransformCoordinatesBlock);
    RegisterClass(FlowGraphBlockNames.Conjugate, FlowGraphConjugateBlock);
    RegisterClass(FlowGraphBlockNames.AngleBetween, FlowGraphAngleBetweenBlock);
    RegisterClass(FlowGraphBlockNames.QuaternionFromAxisAngle, FlowGraphQuaternionFromAxisAngleBlock);
    RegisterClass(FlowGraphBlockNames.AxisAngleFromQuaternion, FlowGraphAxisAngleFromQuaternionBlock);
    RegisterClass(FlowGraphBlockNames.QuaternionFromDirections, FlowGraphQuaternionFromDirectionsBlock);
    RegisterClass(FlowGraphBlockNames.QuaternionFromUpForward, FlowGraphQuaternionFromUpForwardBlock);
    RegisterClass(FlowGraphBlockNames.QuaternionFromAngles, FlowGraphQuaternionFromAnglesBlock);
    RegisterClass(FlowGraphBlockNames.VectorSlerp, FlowGraphVectorSlerpBlock);
}
