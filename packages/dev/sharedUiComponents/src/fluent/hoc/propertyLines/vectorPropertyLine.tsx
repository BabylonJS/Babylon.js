import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";

import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { PrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";

import { SyncedSliderPropertyLine } from "./syncedSliderPropertyLine";
import type { Vector3 } from "core/Maths/math.vector";
import { Quaternion, Vector2, Vector4 } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";
import { CalculatePrecision } from "../../primitives/utils";

export type TensorPropertyLineProps<V extends Vector2 | Vector3 | Vector4 | Quaternion> = PropertyLineProps<V> &
    PrimitiveProps<V> & {
        /**
         * If passed, all sliders will use this for the min value
         */
        min?: number;
        /**
         * If passed, all sliders will use this for the max value
         */
        max?: number;
        /**
         * Will be displayed in the input UI to indicate the unit of measurement
         */
        unit?: string;

        /**
         * Internal spinbutton's step
         */
        step?: number;
        /**
         * If passed, the UX will use the conversion functions to display/update values
         */
        valueConverter?: {
            /**
             * Will call from(val) before displaying in the UX
             */
            from: (val: number) => number;
            /**
             * Will call to(val) before calling onChange
             */
            to: (val: number) => number;
        };
    };

const HasZ = (vector: Vector2 | Vector3 | Vector4 | Quaternion): vector is Vector3 => !(vector instanceof Vector2);
const HasW = (vector: Vector2 | Vector3 | Vector4 | Quaternion): vector is Vector4 => vector instanceof Vector4 || vector instanceof Quaternion;

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 * @param props
 * @returns
 */
const TensorPropertyLine: FunctionComponent<TensorPropertyLineProps<Vector2 | Vector3 | Vector4 | Quaternion>> = (props) => {
    TensorPropertyLine.displayName = "TensorPropertyLine";
    const converted = (val: number) => (props.valueConverter ? props.valueConverter.from(val) : val);
    const formatted = (val: number) => converted(val).toFixed(props.step !== undefined ? Math.max(0, CalculatePrecision(props.step)) : 2);

    const [vector, setVector] = useState(props.value);
    const { min, max } = props;

    const onChange = (val: number, key: "x" | "y" | "z" | "w") => {
        const value = props.valueConverter ? props.valueConverter.to(val) : val;
        const newVector = vector.clone();
        (newVector as Vector4)[key] = value; // The syncedSlider for 'w' is only rendered when vector is a Vector4, so this is safe

        setVector(newVector);
        props.onChange(newVector);
    };

    useEffect(() => {
        setVector(props.value);
    }, [props.value, props.expandedContent]);

    return (
        <PropertyLine
            {...props}
            expandedContent={
                vector ? <VectorSliders vector={vector} min={min} max={max} unit={props.unit} step={props.step} converted={converted} onChange={onChange} /> : undefined
            }
        >
            <Body1>{`[${formatted(props.value.x)}, ${formatted(props.value.y)}${HasZ(props.value) ? `, ${formatted(props.value.z)}` : ""}${HasW(props.value) ? `, ${formatted(props.value.w)}` : ""}]`}</Body1>
        </PropertyLine>
    );
};

type VectorSlidersProps<V extends Vector2 | Vector3 | Vector4 | Quaternion> = {
    vector: V;
    min?: number;
    max?: number;
    unit?: string;
    step?: number;
    converted: (val: number) => number;
    onChange: (val: number, key: "x" | "y" | "z" | "w") => void;
};

const VectorSliders = <V extends Vector2 | Vector3 | Vector4 | Quaternion>({ vector, min, max, unit, step, converted, onChange }: VectorSlidersProps<V>) => (
    <>
        <SyncedSliderPropertyLine label="X" value={converted(vector.x)} min={min} max={max} onChange={(val) => onChange(val, "x")} unit={unit} step={step} />
        <SyncedSliderPropertyLine label="Y" value={converted(vector.y)} min={min} max={max} onChange={(val) => onChange(val, "y")} unit={unit} step={step} />
        {HasZ(vector) && <SyncedSliderPropertyLine label="Z" value={converted(vector.z)} min={min} max={max} onChange={(val) => onChange(val, "z")} unit={unit} step={step} />}
        {HasW(vector) && <SyncedSliderPropertyLine label="W" value={converted(vector.w)} min={min} max={max} onChange={(val) => onChange(val, "w")} unit={unit} step={step} />}
    </>
);

type RotationVectorPropertyLineProps = TensorPropertyLineProps<Vector3> & {
    /**
     * Display angles as degrees instead of radians
     */
    useDegrees?: boolean;
};

const ToDegreesConverter = { from: Tools.ToDegrees, to: Tools.ToRadians };
export const RotationVectorPropertyLine: FunctionComponent<RotationVectorPropertyLineProps> = (props) => {
    RotationVectorPropertyLine.displayName = "RotationVectorPropertyLine";
    const min = props.useDegrees ? 0 : undefined;
    const max = props.useDegrees ? 360 : undefined;
    return (
        <Vector3PropertyLine
            {...props}
            unit={props.useDegrees ? "deg" : "rad"}
            valueConverter={props.useDegrees ? ToDegreesConverter : undefined}
            min={min}
            max={max}
            step={0.001}
        />
    );
};

type QuaternionPropertyLineProps = TensorPropertyLineProps<Quaternion> & {
    /**
     * Display angles as degrees instead of radians
     */
    useDegrees?: boolean;
    /**
     * Display angles as Euler angles instead of quaternions
     */
    useEuler?: boolean;
};
const QuaternionPropertyLineInternal = TensorPropertyLine as FunctionComponent<TensorPropertyLineProps<Quaternion>>;
export const QuaternionPropertyLine: FunctionComponent<QuaternionPropertyLineProps> = (props) => {
    QuaternionPropertyLine.displayName = "QuaternionPropertyLine";
    const min = props.useDegrees ? 0 : undefined;
    const max = props.useDegrees ? 360 : undefined;
    const [quat, setQuat] = useState(props.value);

    useEffect(() => {
        setQuat(props.value);
    }, [props.value]);

    // Extract only the properties that exist on QuaternionPropertyLineProps
    const { useEuler, ...restProps } = props;

    const onQuatChange = (val: Quaternion) => {
        setQuat(val);
        props.onChange(val);
    };

    const onEulerChange = (val: Vector3) => {
        const quat = Quaternion.FromEulerAngles(val.x, val.y, val.z);
        onQuatChange(quat);
    };

    return useEuler ? (
        <Vector3PropertyLine
            {...restProps}
            nullable={false}
            ignoreNullable={false}
            value={quat.toEulerAngles()}
            valueConverter={ToDegreesConverter}
            min={min}
            max={max}
            onChange={onEulerChange}
            unit={props.useDegrees ? "deg" : "rad"}
        />
    ) : (
        <QuaternionPropertyLineInternal {...props} nullable={false} value={quat} min={min} max={max} onChange={onQuatChange} unit={props.useDegrees ? "deg" : "rad"} />
    );
};
export const Vector2PropertyLine = TensorPropertyLine as FunctionComponent<TensorPropertyLineProps<Vector2>>;
export const Vector3PropertyLine = TensorPropertyLine as FunctionComponent<TensorPropertyLineProps<Vector3>>;
export const Vector4PropertyLine = TensorPropertyLine as FunctionComponent<TensorPropertyLineProps<Vector4>>;
