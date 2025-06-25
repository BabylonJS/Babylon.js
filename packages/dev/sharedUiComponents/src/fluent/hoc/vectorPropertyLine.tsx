import { useState } from "react";
import type { FunctionComponent } from "react";

import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { BaseComponentProps, PropertyLineProps } from "./propertyLine";

import { SyncedSliderLine } from "./syncedSliderLine";

import { Vector4 } from "core/Maths/math.vector";
import type { Vector3 } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";

export type VectorPropertyLineProps<V extends Vector3 | Vector4> = BaseComponentProps<V> &
    PropertyLineProps & {
        /**
         * If passed, all sliders will use this for the min value
         */
        min?: number;
        /**
         * If passed, all sliders will use this for the max value
         */
        max?: number;
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

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 * @param props
 * @returns
 */
const VectorPropertyLine: FunctionComponent<VectorPropertyLineProps<Vector3 | Vector4>> = (props) => {
    const converted = (val: number) => (props.valueConverter ? props.valueConverter.from(val) : val);
    const formatted = (val: number) => converted(val).toFixed(2);

    const [vector, setVector] = useState(props.value);
    const { min, max } = props;

    const onChange = (val: number, key: "x" | "y" | "z" | "w") => {
        const value = props.valueConverter ? props.valueConverter.to(val) : val;
        const newVector = vector.clone();
        (newVector as Vector4)[key] = value; // The syncedSlider for 'w' is only rendered when vector is a Vector4, so this is safe

        setVector(newVector);
        props.onChange(newVector);
    };

    return (
        <PropertyLine
            {...props}
            expandedContent={
                <>
                    <SyncedSliderLine label="X" value={converted(vector.x)} min={min} max={max} onChange={(val) => onChange(val, "x")} />
                    <SyncedSliderLine label="Y" value={converted(vector.y)} min={min} max={max} onChange={(val) => onChange(val, "y")} />
                    <SyncedSliderLine label="Z" value={converted(vector.z)} min={min} max={max} onChange={(val) => onChange(val, "z")} />
                    {vector instanceof Vector4 && <SyncedSliderLine label="W" value={vector.w} min={min} max={max} onChange={(val) => onChange(val, "w")} />}
                </>
            }
        >
            <Body1>{`X: ${formatted(props.value.x)} | Y: ${formatted(props.value.y)} | Z: ${formatted(props.value.z)}${props.value instanceof Vector4 ? ` | W: ${formatted(props.value.w)}` : ""}`}</Body1>
        </PropertyLine>
    );
};

type RotationVectorPropertyLineProps = VectorPropertyLineProps<Vector3> & {
    /**
     * Display angles as degrees instead of radians
     */
    useDegrees?: boolean;
};

const ToDegreesConverter = { from: Tools.ToDegrees, to: Tools.ToRadians };
export const RotationVectorPropertyLine: FunctionComponent<RotationVectorPropertyLineProps> = (props) => {
    const min = props.useDegrees ? 0 : undefined;
    const max = props.useDegrees ? 360 : undefined;
    return <Vector3PropertyLine {...props} valueConverter={props.useDegrees ? ToDegreesConverter : undefined} min={min} max={max} />;
};

export const Vector3PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector3>>;
export const Vector4PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector4>>;
