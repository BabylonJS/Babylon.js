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
} from "core/FlowGraph/flowGraphRichTypes";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock";
import { Quaternion, Vector3, Vector4 } from "core/Maths/math.vector";
import type { Matrix, Vector2 } from "core/Maths/math.vector";
import type { FlowGraphMatrix2D, FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes";
import type { FlowGraphMatrix, FlowGraphVector } from "core/FlowGraph/utils";
import { _GetClassNameOf } from "core/FlowGraph/utils";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { GetAngleBetweenQuaternions, GetQuaternionFromDirections } from "../../../../Maths/math.vector.functions";
import type { Nullable } from "../../../../types";

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
RegisterClass(FlowGraphBlockNames.Length, FlowGraphLengthBlock);

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
export class FlowGraphNormalizeBlock extends FlowGraphUnaryOperationBlock<FlowGraphVector, FlowGraphVector> {
    constructor(config?: IFlowGraphNormalizeBlockConfiguration) {
        super(RichTypeAny, RichTypeAny, (a) => this._polymorphicNormalize(a), FlowGraphBlockNames.Normalize, config);
    }

    private _polymorphicNormalize(a: FlowGraphVector) {
        const aClassName = _GetClassNameOf(a);
        let normalized: FlowGraphVector;
        switch (aClassName) {
            case FlowGraphTypes.Vector2:
            case FlowGraphTypes.Vector3:
            case FlowGraphTypes.Vector4:
            case FlowGraphTypes.Quaternion:
                normalized = a.normalizeToNew();
                if (this.config?.nanOnZeroLength) {
                    const length = a.length();
                    if (length === 0) {
                        normalized.setAll(NaN);
                    }
                }
                return normalized;
            default:
                throw new Error(`Cannot normalize value ${a}`);
        }
    }
}
RegisterClass(FlowGraphBlockNames.Normalize, FlowGraphNormalizeBlock);

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
RegisterClass(FlowGraphBlockNames.Dot, FlowGraphDotBlock);

/**
 * Cross product block.
 */
export class FlowGraphCrossBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeVector3, (a, b) => Vector3.Cross(a, b), FlowGraphBlockNames.Cross, config);
    }
}
RegisterClass(FlowGraphBlockNames.Cross, FlowGraphCrossBlock);

/**
 * 2D rotation block.
 */
export class FlowGraphRotate2DBlock extends FlowGraphBinaryOperationBlock<Vector2, number, Vector2> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector2, RichTypeNumber, RichTypeVector2, (a, b) => a.rotate(b), FlowGraphBlockNames.Rotate2D, config);
    }
}
RegisterClass(FlowGraphBlockNames.Rotate2D, FlowGraphRotate2DBlock);

/**
 * 3D rotation block.
 */
export class FlowGraphRotate3DBlock extends FlowGraphBinaryOperationBlock<Vector3, Quaternion, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeQuaternion, RichTypeVector3, (a, b) => a.applyRotationQuaternion(b), FlowGraphBlockNames.Rotate3D, config);
    }
}
RegisterClass(FlowGraphBlockNames.Rotate3D, FlowGraphRotate3DBlock);

function TransformVector(a: FlowGraphVector, b: FlowGraphMatrix): FlowGraphVector {
    const className = _GetClassNameOf(a);
    switch (className) {
        case FlowGraphTypes.Vector2:
            return (b as FlowGraphMatrix2D).transformVector(a as Vector2);
        case FlowGraphTypes.Vector3:
            return (b as FlowGraphMatrix3D).transformVector(a as Vector3);
        case FlowGraphTypes.Vector4:
            a = a as Vector4;
            // transform the vector 4 with the matrix here. Vector4.TransformCoordinates transforms a 3D coordinate, not Vector4
            return new Vector4(
                a.x * b.m[0] + a.y * b.m[1] + a.z * b.m[2] + a.w * b.m[3],
                a.x * b.m[4] + a.y * b.m[5] + a.z * b.m[6] + a.w * b.m[7],
                a.x * b.m[8] + a.y * b.m[9] + a.z * b.m[10] + a.w * b.m[11],
                a.x * b.m[12] + a.y * b.m[13] + a.z * b.m[14] + a.w * b.m[15]
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

RegisterClass(FlowGraphBlockNames.TransformVector, FlowGraphTransformBlock);

/**
 * Transform a vector3 by a matrix.
 */
export class FlowGraphTransformCoordinatesBlock extends FlowGraphBinaryOperationBlock<Vector3, Matrix, Vector3> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeMatrix, RichTypeVector3, (a, b) => Vector3.TransformCoordinates(a, b), FlowGraphBlockNames.TransformCoordinates, config);
    }
}

RegisterClass(FlowGraphBlockNames.TransformCoordinates, FlowGraphTransformCoordinatesBlock);

/**
 * Conjugate the quaternion.
 */
export class FlowGraphConjugateBlock extends FlowGraphUnaryOperationBlock<Quaternion, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeQuaternion, RichTypeQuaternion, (a) => a.conjugate(), FlowGraphBlockNames.Conjugate, config);
    }
}

RegisterClass(FlowGraphBlockNames.Conjugate, FlowGraphConjugateBlock);

/**
 * Get the angle between two quaternions.
 */
export class FlowGraphAngleBetweenBlock extends FlowGraphBinaryOperationBlock<Quaternion, Quaternion, number> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeQuaternion, RichTypeQuaternion, RichTypeNumber, (a, b) => GetAngleBetweenQuaternions(a, b), FlowGraphBlockNames.AngleBetween, config);
    }
}

RegisterClass(FlowGraphBlockNames.AngleBetween, FlowGraphAngleBetweenBlock);

/**
 * Get the quaternion from an axis and an angle.
 */
export class FlowGraphQuaternionFromAxisAngleBlock extends FlowGraphBinaryOperationBlock<Vector3, number, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeNumber, RichTypeQuaternion, (a, b) => Quaternion.RotationAxis(a, b), FlowGraphBlockNames.QuaternionFromAxisAngle, config);
    }
}

RegisterClass(FlowGraphBlockNames.QuaternionFromAxisAngle, FlowGraphQuaternionFromAxisAngleBlock);

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

    /** @override */
    public override getClassName(): string {
        return FlowGraphBlockNames.AxisAngleFromQuaternion;
    }
}

RegisterClass(FlowGraphBlockNames.AxisAngleFromQuaternion, FlowGraphAxisAngleFromQuaternionBlock);

/**
 * Get the quaternion from two direction vectors.
 */
export class FlowGraphQuaternionFromDirectionsBlock extends FlowGraphBinaryOperationBlock<Vector3, Vector3, Quaternion> {
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, RichTypeVector3, RichTypeQuaternion, (a, b) => GetQuaternionFromDirections(a, b), FlowGraphBlockNames.QuaternionFromDirections, config);
    }
}
