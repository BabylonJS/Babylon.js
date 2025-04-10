import type { Matrix, Quaternion, Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import type { Node } from "../node";
import type { FlowGraphInteger } from "./CustomTypes/flowGraphInteger";
import type { FlowGraphMatrix2D, FlowGraphMatrix3D } from "./CustomTypes/flowGraphMatrix";
import { FlowGraphTypes } from "./flowGraphRichTypes";

/**
 * @internal
 * Returns if mesh1 is a descendant of mesh2
 * @param mesh1
 * @param mesh2
 * @returns
 */
export function _IsDescendantOf(mesh1: Node, mesh2: Node): boolean {
    return !!(mesh1.parent && (mesh1.parent === mesh2 || _IsDescendantOf(mesh1.parent, mesh2)));
}

export type FlowGraphNumber = number | FlowGraphInteger;
export type FlowGraphVector = Vector2 | Vector3 | Vector4 | Quaternion;
export type FlowGraphMatrix = Matrix | FlowGraphMatrix2D | FlowGraphMatrix3D;
export type FlowGraphMathOperationType = FlowGraphNumber | FlowGraphVector | FlowGraphMatrix | boolean;

/**
 * @internal
 */
export function _GetClassNameOf(v: any) {
    if (v.getClassName) {
        return v.getClassName();
    }
    return;
}

/**
 * @internal
 * Check if two classname are the same and are vector classes.
 * @param className the first class name
 * @param className2 the second class name
 * @returns whether the two class names are the same and are vector classes.
 */
export function _AreSameVectorClass(className: string, className2: string) {
    return className === className2 && (className === FlowGraphTypes.Vector2 || className === FlowGraphTypes.Vector3 || className === FlowGraphTypes.Vector4);
}

/**
 * @internal
 * Check if two classname are the same and are matrix classes.
 * @param className the first class name
 * @param className2 the second class name
 * @returns whether the two class names are the same and are matrix classes.
 */
export function _AreSameMatrixClass(className: string, className2: string) {
    return className === className2 && (className === FlowGraphTypes.Matrix || className === FlowGraphTypes.Matrix2D || className === FlowGraphTypes.Matrix3D);
}

/**
 * @internal
 * Check if two classname are the same and are integer classes.
 * @param className the first class name
 * @param className2 the second class name
 * @returns whether the two class names are the same and are integer classes.
 */
export function _AreSameIntegerClass(className: string, className2: string) {
    return className === "FlowGraphInteger" && className2 === "FlowGraphInteger";
}

/**
 * Check if an object has a numeric value.
 * @param a the object to check if it is a number.
 * @param validIfNaN whether to consider NaN as a valid number.
 * @returns whether a is a FlowGraphNumber (Integer or number).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function isNumeric(a: FlowGraphMathOperationType, validIfNaN?: boolean): a is FlowGraphNumber {
    const isNumeric = typeof a === "number" || typeof (a as FlowGraphInteger)?.value === "number";
    if (isNumeric && !validIfNaN) {
        return !isNaN(getNumericValue(a as FlowGraphNumber));
    }
    return isNumeric;
}

/**
 * Get the numeric value of a FlowGraphNumber.
 * @param a the object to get the numeric value from.
 * @returns the numeric value.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getNumericValue(a: FlowGraphNumber): number {
    return typeof a === "number" ? a : a.value;
}
