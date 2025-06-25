import { useState, type FunctionComponent } from "react";

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
         * Display angles as degrees instead of radians
         */
        useDegrees?: boolean;
    };

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 * @param props
 * @returns
 */
const VectorPropertyLine: FunctionComponent<VectorPropertyLineProps<Vector3 | Vector4>> = (props) => {
    let converter = (v: number) => v.toFixed(2);

    if (props.useDegrees) {
        converter = (v: number) => Tools.ToDegrees(v).toFixed(2);
    }

    return (
        <PropertyLine {...props} expandedContent={<VectorSliders {...props} />}>
            <Body1>{`X: ${converter(props.value.x)} | Y: ${converter(props.value.y)} | Z: ${converter(props.value.z)}${props.value instanceof Vector4 ? ` | W: ${converter(props.value.w)}` : ""}`}</Body1>
        </PropertyLine>
    );
};

const VectorSliders: FunctionComponent<VectorPropertyLineProps<Vector3 | Vector4>> = (props) => {
    const [vector, setVector] = useState(props.value);

    const min = props.useDegrees ? 0 : undefined;
    const max = props.useDegrees ? 360 : undefined;

    const onChange = (val: number, key: "x" | "y" | "z" | "w") => {
        const value = props.useDegrees ? Tools.ToRadians(val) : val;
        const newVector = vector.clone();
        (newVector as Vector4)[key] = value; // The syncedSlider for 'w' is only rendered when vector is a Vector4, so this is safe

        setVector(newVector);
        props.onChange(newVector);
    };

    const converted = (val: number) => (props.useDegrees ? Tools.ToDegrees(val) : val);

    return (
        <>
            <SyncedSliderLine label="X" value={converted(vector.x)} min={min} max={max} onChange={(val) => onChange(val, "x")} />
            <SyncedSliderLine label="Y" value={converted(vector.y)} min={min} max={max} onChange={(val) => onChange(val, "y")} />
            <SyncedSliderLine label="Z" value={converted(vector.z)} min={min} max={max} onChange={(val) => onChange(val, "z")} />
            {vector instanceof Vector4 && <SyncedSliderLine label="W" value={vector.w} min={min} max={max} onChange={(val) => onChange(val, "w")} />}
        </>
    );
};

export const Vector3PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector3>>;
export const Vector4PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector4>>;
