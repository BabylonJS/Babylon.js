import { Vector2, Vector3, Vector4, Matrix, Quaternion } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import { FlowGraphInteger } from "./flowGraphInteger";

/**
 * A rich type represents extra information about a type,
 * such as its name and a default value constructor.
 * @experimental
 */
export class RichType<T> {
    constructor(
        /**
         * The name given to the type.
         */
        public typeName: string,
        /**
         * The default value of the type.
         */
        public defaultValue: T
    ) {}

    /**
     * Serializes this rich type into a serialization object.
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject: any) {
        serializationObject.typeName = this.typeName;
        serializationObject.defaultValue = this.defaultValue;
    }

    /**
     * Parses a rich type from a serialization object.
     * @param serializationObject a serialization object
     * @returns the parsed rich type
     */
    static Parse(serializationObject: any): RichType<any> {
        return new RichType(serializationObject.typeName, serializationObject.defaultValue);
    }
}

export const RichTypeAny: RichType<any> = new RichType("any", undefined);

export const RichTypeString: RichType<string> = new RichType("string", "");

export const RichTypeNumber: RichType<number> = new RichType("number", 0);

export const RichTypeBoolean: RichType<boolean> = new RichType("boolean", false);

export const RichTypeVector2: RichType<Vector2> = new RichType("Vector2", Vector2.Zero());

export const RichTypeVector3: RichType<Vector3> = new RichType("Vector3", Vector3.Zero());

export const RichTypeVector4: RichType<Vector4> = new RichType("Vector4", Vector4.Zero());

export const RichTypeMatrix: RichType<Matrix> = new RichType("Matrix", Matrix.Identity());

export const RichTypeColor3: RichType<Color3> = new RichType("Color3", Color3.Black());

export const RichTypeColor4: RichType<Color4> = new RichType("Color4", new Color4(0, 0, 0, 0));

export const RichTypeQuaternion: RichType<Quaternion> = new RichType("Quaternion", Quaternion.Identity());

export const RichTypeFlowGraphInteger: RichType<FlowGraphInteger> = new RichType("FlowGraphInteger", new FlowGraphInteger(0));

/**
 * Given a value, try to deduce its rich type.
 * @param value the value to deduce the rich type from
 * @returns the value's rich type, or RichTypeAny if the type could not be deduced.
 */
export function getRichTypeFromValue<T>(value: T): RichType<T> {
    switch (typeof value) {
        case "string":
            return RichTypeString as RichType<T>;
        case "number":
            return RichTypeNumber as RichType<T>;
        case "boolean":
            return RichTypeBoolean as RichType<T>;
        case "object":
            if (value instanceof Vector2) {
                return RichTypeVector2 as RichType<T>;
            } else if (value instanceof Vector3) {
                return RichTypeVector3 as RichType<T>;
            } else if (value instanceof Vector4) {
                return RichTypeVector4 as RichType<T>;
            } else if (value instanceof Color3) {
                return RichTypeColor3 as RichType<T>;
            } else if (value instanceof Color4) {
                return RichTypeColor4 as RichType<T>;
            } else if (value instanceof Quaternion) {
                return RichTypeQuaternion as RichType<T>;
            } else if (value instanceof FlowGraphInteger) {
                return RichTypeFlowGraphInteger as RichType<T>;
            } else {
                return RichTypeAny as RichType<T>;
            }
        default:
            return RichTypeAny as RichType<T>;
    }
}
