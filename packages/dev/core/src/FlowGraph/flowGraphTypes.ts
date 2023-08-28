import { Vector2, Vector3, Vector4, Matrix } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";

/**
 * @experimental
 */
export enum FlowGraphValueType {
    Float = "Float",
    Vector2 = "Vector2",
    Vector3 = "Vector3",
    Vector4 = "Vector4",
    Color3 = "Color3",
    Color4 = "Color4",
    Matrix = "Matrix",
    String = "String",
    Boolean = "Boolean",
    Mesh = "Mesh",
    Any = "Any",
}

/**
 * @experimental
 * @param type
 * @returns
 */
export function getDefaultValueForType(type: FlowGraphValueType) {
    switch (type) {
        case FlowGraphValueType.Float:
            return 0;
        case FlowGraphValueType.Vector2:
            return Vector2.Zero();
        case FlowGraphValueType.Vector3:
            return Vector3.Zero();
        case FlowGraphValueType.Vector4:
            return Vector4.Zero();
        case FlowGraphValueType.Color3:
            return Color3.Black();
        case FlowGraphValueType.Color4:
            return new Color4(0, 0, 0, 0);
        case FlowGraphValueType.Matrix:
            return Matrix.Identity();
        case FlowGraphValueType.String:
            return "";
        case FlowGraphValueType.Boolean:
            return false;
        case FlowGraphValueType.Mesh:
            return undefined;
        case FlowGraphValueType.Any:
            return undefined;
    }
}
