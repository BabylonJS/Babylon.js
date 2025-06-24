import type { FunctionComponent } from "react";

import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { BaseComponentProps, PropertyLineProps } from "./propertyLine";

import { SyncedSliderLine } from "./syncedSliderLine";

import type { Vector2 } from "core/Maths/math.vector";
import { Vector3, Vector4 } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";

export type DegreesLineProps = {
    /**
     * Do we want to use angles with degrees instead of radians?
     */
    useDegrees?: boolean;
};

/**
 * Alternative names for the components of the vector
 */
export type AlternativeComponentNamesProps = {
    /**
     * Alternative name for the x component
     */
    xName?: string;
    /**
     * Alternative name for the y component
     */
    yName?: string;
    /**
     * alternative name for the z component
     */
    zName?: string;
    /**
     * Alternative name for the w component
     */
    wName?: string;
};

export type VectorPropertyLineProps<V extends Vector2 | Vector3 | Vector4> = BaseComponentProps<V> & PropertyLineProps & DegreesLineProps & AlternativeComponentNamesProps;

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 * @param props
 * @returns
 */
const VectorPropertyLine: FunctionComponent<VectorPropertyLineProps<Vector2 | Vector3 | Vector4>> = (props) => {
    let converter = (v: number) => v.toFixed(2);
    const xName = props.xName || "X";
    const yName = props.yName || "Y";
    const zName = props.zName || "Z";
    const wName = props.wName || "W";

    if (props.useDegrees) {
        converter = (v: number) => Tools.ToDegrees(v).toFixed(2);
    }

    return (
        <PropertyLine {...props} expandedContent={<VectorSliders {...props} />}>
            <Body1>{`${xName}: ${converter(props.value.x)} | ${yName}: ${converter(props.value.y)} ${props.value instanceof Vector3 ? ` | ${zName}: ${converter(props.value.z)}` : ""}${props.value instanceof Vector4 ? ` | ${wName}: ${converter(props.value.w)}` : ""}`}</Body1>
        </PropertyLine>
    );
};

const VectorSliders: FunctionComponent<{ value: Vector2 | Vector3 | Vector4; useDegrees?: boolean; xName?: string; yName?: string; zName?: string; wName?: string }> = (props) => {
    const { value: vector } = props;
    const xName = props.xName || "X";
    const yName = props.yName || "Y";
    const zName = props.zName || "Z";
    const wName = props.wName || "W";

    return (
        <>
            <SyncedSliderLine label={xName} useDegrees={props.useDegrees} value={vector.x} onChange={(value) => (vector.x = value)} />
            <SyncedSliderLine label={yName} useDegrees={props.useDegrees} value={vector.y} onChange={(value) => (vector.y = value)} />
            {vector instanceof Vector3 && <SyncedSliderLine label={zName} useDegrees={props.useDegrees} value={vector.z} onChange={(value) => (vector.z = value)} />}
            {vector instanceof Vector4 && <SyncedSliderLine label={wName} useDegrees={props.useDegrees} value={vector.w} onChange={(value) => (vector.w = value)} />}
        </>
    );
};

export const Vector2PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector2>>;
export const Vector3PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector3>>;
export const Vector4PropertyLine = VectorPropertyLine as FunctionComponent<VectorPropertyLineProps<Vector4>>;
