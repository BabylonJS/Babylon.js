import { Vector2, Vector3, Vector4, Matrix } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";

/**
 * A rich type represents extra information about a type,
 * such as its name and a default value constructor.
 * @experimental
 */
export interface RichType<T> {
    /**
     * Name of the type
     */
    typeName: string;
    /**
     * Constructor for the default value
     * @returns the default value
     */
    defaultValueBuilder: () => T;
}

export const RichTypeAny: RichType<any> = {
    typeName: "any",
    defaultValueBuilder: () => undefined,
};

export const RichTypeString: RichType<string> = {
    typeName: "string",
    defaultValueBuilder: () => "",
};

export const RichTypeNumber: RichType<number> = {
    typeName: "number",
    defaultValueBuilder: () => 0,
};

export const RichTypeBoolean: RichType<boolean> = {
    typeName: "boolean",
    defaultValueBuilder: () => false,
};

export const RichTypeVector2: RichType<Vector2> = {
    typeName: "Vector2",
    defaultValueBuilder: () => Vector2.Zero(),
};

export const RichTypeVector3: RichType<Vector3> = {
    typeName: "Vector3",
    defaultValueBuilder: () => Vector3.Zero(),
};

export const RichTypeVector4: RichType<Vector4> = {
    typeName: "Vector4",
    defaultValueBuilder: () => Vector4.Zero(),
};

export const RichTypeMatrix: RichType<Matrix> = {
    typeName: "Matrix",
    defaultValueBuilder: () => Matrix.Identity(),
};

export const RichTypeColor3: RichType<Color3> = {
    typeName: "Color3",
    defaultValueBuilder: () => Color3.Black(),
};

export const RichTypeColor4: RichType<Color4> = {
    typeName: "Color4",
    defaultValueBuilder: () => new Color4(0, 0, 0, 0),
};

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
            } else {
                return RichTypeAny as RichType<T>;
            }
        default:
            return RichTypeAny as RichType<T>;
    }
}
