import { Vector2, Vector3, Vector4, Matrix, Quaternion } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import { FlowGraphInteger } from "./CustomTypes/flowGraphInteger";
import { Constants } from "core/Engines/constants";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "./CustomTypes/flowGraphMatrix";

/**
 * The types supported by the flow graph.
 */
export const enum FlowGraphTypes {
    Any = "any",
    String = "string",
    Number = "number",
    Boolean = "boolean",
    Object = "object",
    Integer = "FlowGraphInteger",
    Vector2 = "Vector2",
    Vector3 = "Vector3",
    Vector4 = "Vector4",
    Quaternion = "Quaternion",
    Matrix = "Matrix",
    Matrix2D = "Matrix2D",
    Matrix3D = "Matrix3D",
    Color3 = "Color3",
    Color4 = "Color4",
}

/**
 * A rich type represents extra information about a type,
 * such as its name and a default value constructor.
 */
export class RichType<T> {
    /**
     * A function that can be used to transform a value of any type into a value of this rich type.
     * This can be used, for example, between vector4 and quaternion.
     */
    public typeTransformer: (value: any) => T;

    constructor(
        /**
         * The name given to the type.
         */
        public typeName: string,
        /**
         * The default value of the type.
         */
        public defaultValue: T,

        /**
         * [-1] The ANIMATIONTYPE of the type, if available
         */
        public animationType: number = -1
    ) {}

    /**
     * Serializes this rich type into a serialization object.
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject: any) {
        serializationObject.typeName = this.typeName;
        serializationObject.defaultValue = this.defaultValue;
    }
}

export const RichTypeAny: RichType<any> = new RichType(FlowGraphTypes.Any, undefined);

export const RichTypeString: RichType<string> = new RichType(FlowGraphTypes.String, "");

export const RichTypeNumber: RichType<number> = new RichType(FlowGraphTypes.Number, 0, Constants.ANIMATIONTYPE_FLOAT);

export const RichTypeBoolean: RichType<boolean> = new RichType(FlowGraphTypes.Boolean, false);

export const RichTypeVector2: RichType<Vector2> = new RichType(FlowGraphTypes.Vector2, Vector2.Zero(), Constants.ANIMATIONTYPE_VECTOR2);

export const RichTypeVector3: RichType<Vector3> = new RichType(FlowGraphTypes.Vector3, Vector3.Zero(), Constants.ANIMATIONTYPE_VECTOR3);

export const RichTypeVector4: RichType<Vector4> = new RichType(FlowGraphTypes.Vector4, Vector4.Zero());

export const RichTypeMatrix: RichType<Matrix> = new RichType(FlowGraphTypes.Matrix, Matrix.Identity(), Constants.ANIMATIONTYPE_MATRIX);

export const RichTypeMatrix2D: RichType<FlowGraphMatrix2D> = new RichType(FlowGraphTypes.Matrix2D, new FlowGraphMatrix2D());

export const RichTypeMatrix3D: RichType<FlowGraphMatrix3D> = new RichType(FlowGraphTypes.Matrix3D, new FlowGraphMatrix3D());

export const RichTypeColor3: RichType<Color3> = new RichType(FlowGraphTypes.Color3, Color3.Black(), Constants.ANIMATIONTYPE_COLOR3);

export const RichTypeColor4: RichType<Color4> = new RichType(FlowGraphTypes.Color4, new Color4(0, 0, 0, 0), Constants.ANIMATIONTYPE_COLOR4);

export const RichTypeQuaternion: RichType<Quaternion> = new RichType(FlowGraphTypes.Quaternion, Quaternion.Identity(), Constants.ANIMATIONTYPE_QUATERNION);
RichTypeQuaternion.typeTransformer = (value: any) => {
    if (value.getClassName && value.getClassName() === FlowGraphTypes.Vector4) {
        return Quaternion.FromArray(value.asArray());
    } else if (value.getClassName && value.getClassName() === FlowGraphTypes.Vector3) {
        return Quaternion.FromEulerVector(value);
    } else if (value.getClassName && value.getClassName() === FlowGraphTypes.Matrix) {
        return Quaternion.FromRotationMatrix(value);
    }
    return value;
};
export const RichTypeFlowGraphInteger: RichType<FlowGraphInteger> = new RichType(FlowGraphTypes.Integer, new FlowGraphInteger(0), Constants.ANIMATIONTYPE_FLOAT);

/**
 * Given a value, try to deduce its rich type.
 * @param value the value to deduce the rich type from
 * @returns the value's rich type, or RichTypeAny if the type could not be deduced.
 */
export function getRichTypeFromValue<T>(value: T): RichType<T> {
    const anyValue = value as any;
    switch (typeof value) {
        case FlowGraphTypes.String:
            return RichTypeString as RichType<T>;
        case FlowGraphTypes.Number:
            return RichTypeNumber as RichType<T>;
        case FlowGraphTypes.Boolean:
            return RichTypeBoolean as RichType<T>;
        case FlowGraphTypes.Object:
            if (anyValue.getClassName) {
                switch (anyValue.getClassName() as string) {
                    case FlowGraphTypes.Vector2:
                        return RichTypeVector2 as RichType<T>;
                    case FlowGraphTypes.Vector3:
                        return RichTypeVector3 as RichType<T>;
                    case FlowGraphTypes.Vector4:
                        return RichTypeVector4 as RichType<T>;
                    case FlowGraphTypes.Matrix:
                        return RichTypeMatrix as RichType<T>;
                    case FlowGraphTypes.Color3:
                        return RichTypeColor3 as RichType<T>;
                    case FlowGraphTypes.Color4:
                        return RichTypeColor4 as RichType<T>;
                    case FlowGraphTypes.Quaternion:
                        return RichTypeQuaternion as RichType<T>;
                    case FlowGraphTypes.Integer:
                        return RichTypeFlowGraphInteger as RichType<T>;
                    case FlowGraphTypes.Matrix2D:
                        return RichTypeMatrix2D as RichType<T>;
                    case FlowGraphTypes.Matrix3D:
                        return RichTypeMatrix3D as RichType<T>;
                }
            }
            return RichTypeAny as RichType<T>;
        default:
            return RichTypeAny as RichType<T>;
    }
}

/**
 * Given a flow graph type, return the rich type that corresponds to it.
 * @param flowGraphType the flow graph type
 * @returns the rich type that corresponds to the flow graph type
 */
export function getRichTypeByFlowGraphType(flowGraphType?: string): RichType<any> {
    switch (flowGraphType) {
        case FlowGraphTypes.String:
            return RichTypeString;
        case FlowGraphTypes.Number:
            return RichTypeNumber;
        case FlowGraphTypes.Boolean:
            return RichTypeBoolean;
        case FlowGraphTypes.Vector2:
            return RichTypeVector2;
        case FlowGraphTypes.Vector3:
            return RichTypeVector3;
        case FlowGraphTypes.Vector4:
            return RichTypeVector4;
        case FlowGraphTypes.Matrix:
            return RichTypeMatrix;
        case FlowGraphTypes.Color3:
            return RichTypeColor3;
        case FlowGraphTypes.Color4:
            return RichTypeColor4;
        case FlowGraphTypes.Quaternion:
            return RichTypeQuaternion;
        case FlowGraphTypes.Integer:
            return RichTypeFlowGraphInteger;
        case FlowGraphTypes.Matrix2D:
            return RichTypeMatrix2D;
        case FlowGraphTypes.Matrix3D:
            return RichTypeMatrix3D;
        default:
            return RichTypeAny;
    }
}

/**
 * get the animation type for a given flow graph type
 * @param flowGraphType the flow graph type
 * @returns the animation type for this flow graph type
 */
export function getAnimationTypeByFlowGraphType(flowGraphType: FlowGraphTypes): number {
    switch (flowGraphType) {
        case FlowGraphTypes.Number:
            return Constants.ANIMATIONTYPE_FLOAT;
        case FlowGraphTypes.Vector2:
            return Constants.ANIMATIONTYPE_VECTOR2;
        case FlowGraphTypes.Vector3:
            return Constants.ANIMATIONTYPE_VECTOR3;
        case FlowGraphTypes.Matrix:
            return Constants.ANIMATIONTYPE_MATRIX;
        case FlowGraphTypes.Color3:
            return Constants.ANIMATIONTYPE_COLOR3;
        case FlowGraphTypes.Color4:
            return Constants.ANIMATIONTYPE_COLOR4;
        case FlowGraphTypes.Quaternion:
            return Constants.ANIMATIONTYPE_QUATERNION;
        default:
            return Constants.ANIMATIONTYPE_FLOAT;
    }
}

/**
 * Given an animation type, return the rich type that corresponds to it.
 * @param animationType the animation type
 * @returns the rich type that corresponds to the animation type
 */
export function getRichTypeByAnimationType(animationType: number): RichType<any> {
    switch (animationType) {
        case Constants.ANIMATIONTYPE_FLOAT:
            return RichTypeNumber;
        case Constants.ANIMATIONTYPE_VECTOR2:
            return RichTypeVector2;
        case Constants.ANIMATIONTYPE_VECTOR3:
            return RichTypeVector3;
        case Constants.ANIMATIONTYPE_MATRIX:
            return RichTypeMatrix;
        case Constants.ANIMATIONTYPE_COLOR3:
            return RichTypeColor3;
        case Constants.ANIMATIONTYPE_COLOR4:
            return RichTypeColor4;
        case Constants.ANIMATIONTYPE_QUATERNION:
            return RichTypeQuaternion;
        default:
            return RichTypeAny;
    }
}
