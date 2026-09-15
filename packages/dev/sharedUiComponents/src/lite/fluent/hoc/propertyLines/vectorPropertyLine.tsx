import { eulerToQuat, quatToEulerXYZ, type Quat, type Vec2, type Vec3, type Vec4 } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import {
    ControlledQuaternionPropertyLine,
    ControlledRotationVectorPropertyLine,
    ControlledTensorPropertyLine,
    type QuaternionValueAdapter,
    type TensorComponent,
    type TensorPropertyLineProps as RuntimeNeutralTensorPropertyLineProps,
    type TensorValueAdapter,
} from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLineCore";

export type Vector2Value = Vec2 | readonly [number, number];
export type Vector3Value = Vec3 | readonly [number, number, number];
export type Vector4Value = Vec4 | readonly [number, number, number, number];
export type QuaternionValue = Quat | readonly [number, number, number, number];

export type TensorPropertyLineProps<ValueT extends Vector2Value | Vector3Value | Vector4Value | QuaternionValue> = RuntimeNeutralTensorPropertyLineProps<ValueT>;

const ComponentIndices: Readonly<Record<TensorComponent, number>> = {
    x: 0,
    y: 1,
    z: 2,
    w: 3,
};

type TupleValue = readonly [number, number] | readonly [number, number, number] | readonly [number, number, number, number];

function IsNumberTuple(value: Vector2Value | Vector3Value | Vector4Value | QuaternionValue): value is TupleValue {
    return Array.isArray(value);
}

function GetComponent(value: Vector2Value | Vector3Value | Vector4Value | QuaternionValue, component: TensorComponent): number {
    if (IsNumberTuple(value)) {
        return value[ComponentIndices[component]];
    }
    switch (component) {
        case "x":
            return value.x;
        case "y":
            return value.y;
        case "z":
            return "z" in value ? value.z : 0;
        case "w":
            return "w" in value ? value.w : 0;
    }
}

const Vector2Adapter: TensorValueAdapter<Vector2Value> = {
    components: ["x", "y"],
    getComponent: GetComponent,
    withComponent: (value, component, componentValue) =>
        IsNumberTuple(value) ? [component === "x" ? componentValue : value[0], component === "y" ? componentValue : value[1]] : { ...value, [component]: componentValue },
};
const Vector3Adapter: TensorValueAdapter<Vector3Value> = {
    components: ["x", "y", "z"],
    getComponent: GetComponent,
    withComponent: (value, component, componentValue) =>
        IsNumberTuple(value)
            ? [component === "x" ? componentValue : value[0], component === "y" ? componentValue : value[1], component === "z" ? componentValue : value[2]]
            : { ...value, [component]: componentValue },
};
const Vector4Adapter: TensorValueAdapter<Vector4Value> = {
    components: ["x", "y", "z", "w"],
    getComponent: GetComponent,
    withComponent: (value, component, componentValue) =>
        IsNumberTuple(value)
            ? [
                  component === "x" ? componentValue : value[0],
                  component === "y" ? componentValue : value[1],
                  component === "z" ? componentValue : value[2],
                  component === "w" ? componentValue : value[3],
              ]
            : { ...value, [component]: componentValue },
};
const QuaternionTensorAdapter: TensorValueAdapter<QuaternionValue> = {
    components: ["x", "y", "z", "w"],
    getComponent: GetComponent,
    withComponent: (value, component, componentValue) =>
        IsNumberTuple(value)
            ? [
                  component === "x" ? componentValue : value[0],
                  component === "y" ? componentValue : value[1],
                  component === "z" ? componentValue : value[2],
                  component === "w" ? componentValue : value[3],
              ]
            : { ...value, [component]: componentValue },
};

/**
 * Converts a Lite Euler value to a quaternion while preserving tuple versus structural representation.
 * @param value The Euler value in radians.
 * @param source The source quaternion whose representation should be preserved.
 * @returns The converted quaternion.
 */
export function CreateQuaternionFromEuler(value: Vector3Value, source: QuaternionValue): QuaternionValue {
    const [x, y, z] = "x" in value ? [value.x, value.y, value.z] : value;
    const quaternion = eulerToQuat(x, y, z);
    return "x" in source ? { x: quaternion[0], y: quaternion[1], z: quaternion[2], w: quaternion[3] } : quaternion;
}

const QuaternionAdapter: QuaternionValueAdapter<QuaternionValue, Vector3Value> = {
    quaternion: QuaternionTensorAdapter,
    euler: Vector3Adapter,
    fromEuler: CreateQuaternionFromEuler,
    toEuler: (value) => {
        const [x, y, z, w] = "x" in value ? [value.x, value.y, value.z, value.w] : value;
        return quatToEulerXYZ(x, y, z, w);
    },
};

type RotationVectorPropertyLineProps = TensorPropertyLineProps<Vector3Value> & {
    useDegrees?: boolean;
};

type QuaternionPropertyLineProps = TensorPropertyLineProps<QuaternionValue> & {
    useDegrees?: boolean;
    useEuler?: boolean;
};

export const Vector2PropertyLine: FunctionComponent<TensorPropertyLineProps<Vector2Value>> = (props) => <ControlledTensorPropertyLine {...props} adapter={Vector2Adapter} />;
export const Vector3PropertyLine: FunctionComponent<TensorPropertyLineProps<Vector3Value>> = (props) => <ControlledTensorPropertyLine {...props} adapter={Vector3Adapter} />;
export const Vector4PropertyLine: FunctionComponent<TensorPropertyLineProps<Vector4Value>> = (props) => <ControlledTensorPropertyLine {...props} adapter={Vector4Adapter} />;
export const RotationVectorPropertyLine: FunctionComponent<RotationVectorPropertyLineProps> = (props) => (
    <ControlledRotationVectorPropertyLine {...props} adapter={Vector3Adapter} />
);
export const QuaternionPropertyLine: FunctionComponent<QuaternionPropertyLineProps> = (props) => <ControlledQuaternionPropertyLine {...props} adapter={QuaternionAdapter} />;
