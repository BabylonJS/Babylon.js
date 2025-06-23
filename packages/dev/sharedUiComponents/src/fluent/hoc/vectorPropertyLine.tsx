import type { FunctionComponent } from "react";

import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { BaseComponentProps, PropertyLineProps } from "./propertyLine";

import { SyncedSliderLine } from "./syncedSliderLine";

import { Vector4 } from "core/Maths/math.vector";
import type { Vector3 } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";

export type DegreesLineProps = {
    /**
     * Do we want to use angles with degrees instead of radians?
     */
    useDegrees?: boolean;
};

export type VectorPropertyLineProps<V extends Vector3 | Vector4> = BaseComponentProps<V> & PropertyLineProps & DegreesLineProps;

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

const VectorSliders: FunctionComponent<{ value: Vector3 | Vector4; useDegrees?: boolean }> = (props) => {
    const { value: vector } = props;
    return (
        <>
            <SyncedSliderLine label="X" useDegrees={props.useDegrees} value={vector.x} onChange={(value) => (vector.x = value)} />
            <SyncedSliderLine label="Y" useDegrees={props.useDegrees} value={vector.y} onChange={(value) => (vector.y = value)} />
            <SyncedSliderLine label="Z" useDegrees={props.useDegrees} value={vector.z} onChange={(value) => (vector.z = value)} />
            {vector instanceof Vector4 && <SyncedSliderLine label="W" useDegrees={props.useDegrees} value={vector.w} onChange={(value) => (vector.w = value)} />}
        </>
    );
};

export const Vector3PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector3>>;
export const Vector4PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector4>>;
