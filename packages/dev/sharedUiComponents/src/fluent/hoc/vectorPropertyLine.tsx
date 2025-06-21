import type { FunctionComponent } from "react";

import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { BaseComponentProps, PropertyLineProps } from "./propertyLine";

import { SyncedSliderLine } from "./syncedSliderLine";

import { Vector4 } from "core/Maths/math.vector";
import type { Vector3 } from "core/Maths/math.vector";

export type VectorPropertyLineProps<V extends Vector3 | Vector4> = BaseComponentProps<V> & PropertyLineProps;

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 * @param props
 * @returns
 */
const VectorPropertyLine: FunctionComponent<VectorPropertyLineProps<Vector3 | Vector4>> = (props) => {
    return (
        <PropertyLine {...props} expandedContent={<VectorSliders {...props} />}>
            <Body1>{`X: ${props.value.x.toFixed(2)} | Y: ${props.value.y.toFixed(2)} | Z: ${props.value.z.toFixed(2)}${props.value instanceof Vector4 ? ` | W: ${props.value.w.toFixed(2)}` : ""}`}</Body1>
        </PropertyLine>
    );
};

const VectorSliders: FunctionComponent<{ value: Vector3 | Vector4 }> = (props) => {
    const { value: vector } = props;
    return (
        <>
            <SyncedSliderLine label="X" propertyKey="x" target={vector} onChange={(value) => (vector.x = value)} />
            <SyncedSliderLine label="Y" propertyKey="y" target={vector} onChange={(value) => (vector.y = value)} />
            <SyncedSliderLine label="Z" propertyKey="z" target={vector} onChange={(value) => (vector.z = value)} />
            {vector instanceof Vector4 && <SyncedSliderLine label="W" propertyKey="w" target={vector} onChange={(value) => (vector.w = value)} />}
        </>
    );
};

export const Vector3PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector3>>;
export const Vector4PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector4>>;
