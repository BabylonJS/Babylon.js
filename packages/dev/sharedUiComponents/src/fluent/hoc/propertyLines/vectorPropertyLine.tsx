import { type FunctionComponent } from "react";

import { Quaternion, type Vector2, type Vector3, type Vector4 } from "core/Maths/math.vector";
import {
    ControlledQuaternionPropertyLine,
    ControlledRotationVectorPropertyLine,
    ControlledTensorPropertyLine,
    type QuaternionValueAdapter,
    type TensorComponent,
    type TensorPropertyLineProps as RuntimeNeutralTensorPropertyLineProps,
    type TensorValueAdapter,
} from "./vectorPropertyLineCore";

export type TensorPropertyLineProps<ValueT extends Vector2 | Vector3 | Vector4 | Quaternion> = RuntimeNeutralTensorPropertyLineProps<ValueT>;

function CreateCoreTensorAdapter<ValueT extends Vector2 | Vector3 | Vector4 | Quaternion>(components: readonly TensorComponent[]): TensorValueAdapter<ValueT> {
    return {
        components,
        getComponent: (value, component) => {
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
        },
        withComponent: (value, component, componentValue) => {
            const result = value.clone() as ValueT;
            switch (component) {
                case "x":
                    result.x = componentValue;
                    break;
                case "y":
                    result.y = componentValue;
                    break;
                case "z":
                    if ("z" in result) {
                        result.z = componentValue;
                    }
                    break;
                case "w":
                    if ("w" in result) {
                        result.w = componentValue;
                    }
                    break;
            }
            return result;
        },
    };
}

const Vector2Adapter = CreateCoreTensorAdapter<Vector2>(["x", "y"]);
const Vector3Adapter = CreateCoreTensorAdapter<Vector3>(["x", "y", "z"]);
const Vector4Adapter = CreateCoreTensorAdapter<Vector4>(["x", "y", "z", "w"]);
const QuaternionTensorAdapter = CreateCoreTensorAdapter<Quaternion>(["x", "y", "z", "w"]);
const QuaternionAdapter: QuaternionValueAdapter<Quaternion, Vector3> = {
    quaternion: QuaternionTensorAdapter,
    euler: Vector3Adapter,
    fromEuler: (value) => Quaternion.FromEulerAngles(value.x, value.y, value.z),
    toEuler: (value) => value.toEulerAngles(),
};

type RotationVectorPropertyLineProps = TensorPropertyLineProps<Vector3> & {
    useDegrees?: boolean;
};

type QuaternionPropertyLineProps = TensorPropertyLineProps<Quaternion> & {
    useDegrees?: boolean;
    useEuler?: boolean;
};

/**
 * Edits a Babylon.js Vector2 value.
 * @param props The controlled vector and property-line presentation.
 * @returns The Vector2 property line.
 */
export const Vector2PropertyLine: FunctionComponent<TensorPropertyLineProps<Vector2>> = (props) => <ControlledTensorPropertyLine {...props} adapter={Vector2Adapter} />;
/**
 * Edits a Babylon.js Vector3 value.
 * @param props The controlled vector and property-line presentation.
 * @returns The Vector3 property line.
 */
export const Vector3PropertyLine: FunctionComponent<TensorPropertyLineProps<Vector3>> = (props) => <ControlledTensorPropertyLine {...props} adapter={Vector3Adapter} />;
/**
 * Edits a Babylon.js Vector4 value.
 * @param props The controlled vector and property-line presentation.
 * @returns The Vector4 property line.
 */
export const Vector4PropertyLine: FunctionComponent<TensorPropertyLineProps<Vector4>> = (props) => <ControlledTensorPropertyLine {...props} adapter={Vector4Adapter} />;
/**
 * Edits a Babylon.js Euler rotation value.
 * @param props The controlled rotation and property-line presentation.
 * @returns The Euler rotation property line.
 */
export const RotationVectorPropertyLine: FunctionComponent<RotationVectorPropertyLineProps> = (props) => (
    <ControlledRotationVectorPropertyLine {...props} adapter={Vector3Adapter} />
);
/**
 * Edits a Babylon.js Quaternion value with optional Euler presentation.
 * @param props The controlled quaternion and property-line presentation.
 * @returns The quaternion property line.
 */
export const QuaternionPropertyLine: FunctionComponent<QuaternionPropertyLineProps> = (props) => <ControlledQuaternionPropertyLine {...props} adapter={QuaternionAdapter} />;
