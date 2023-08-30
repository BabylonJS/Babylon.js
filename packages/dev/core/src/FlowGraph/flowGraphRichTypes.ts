import { Vector2, Vector3, Vector4, Matrix } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";

/**
 * @experimental
 */
export interface RichType<T> {
    typeName: string;
    defaultValueBuilder: () => T;
}

const RichTypeAny: RichType<any> = {
    typeName: "any",
    defaultValueBuilder: () => undefined,
};

export const RichTypes = {
    String: {
        typeName: "string",
        defaultValueBuilder: () => "",
    },
    Number: {
        typeName: "number",
        defaultValueBuilder: () => 0,
    },
    Boolean: {
        typeName: "boolean",
        defaultValueBuilder: () => false,
    },
    Vector2: {
        typeName: "Vector2",
        defaultValueBuilder: () => Vector2.Zero(),
    },
    Vector3: {
        typeName: "Vector3",
        defaultValueBuilder: () => Vector3.Zero(),
    },
    Vector4: {
        typeName: "Vector4",
        defaultValueBuilder: () => Vector4.Zero(),
    },
    Matrix: {
        typeName: "Matrix",
        defaultValueBuilder: () => Matrix.Identity(),
    },
    Color3: {
        typeName: "Color3",
        defaultValueBuilder: () => Color3.Black(),
    },
    Color4: {
        typeName: "Color4",
        defaultValueBuilder: () => new Color4(0, 0, 0, 0),
    },
    Any: RichTypeAny,
};
