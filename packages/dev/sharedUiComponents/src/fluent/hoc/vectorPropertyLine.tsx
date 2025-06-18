import type { FunctionComponent } from "react";

import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";

import { SyncedSliderLine } from "./syncedSliderLine";

import { Vector4 } from "core/Maths/math.vector";
import type { Vector3 } from "core/Maths/math.vector";

type VectorSliderProps = {
    vector: Vector3 | Vector4;
    min?: number;
    max?: number;
    step?: number;
};

const VectorSliders: FunctionComponent<VectorSliderProps> = (props) => {
    const { vector, ...sliderProps } = props;
    return (
        <>
            <SyncedSliderLine {...sliderProps} label="X" description={undefined} propertyKey="x" target={vector} />
            <SyncedSliderLine {...sliderProps} label="Y" description={undefined} propertyKey="y" target={vector} />
            <SyncedSliderLine {...sliderProps} label="Z" description={undefined} propertyKey="z" target={vector} />
            {vector instanceof Vector4 && <SyncedSliderLine {...sliderProps} label="W" description={undefined} propertyKey="w" target={vector} />}
        </>
    );
};

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 * @param props
 * @returns
 */
export const VectorPropertyLine: FunctionComponent<VectorSliderProps & PropertyLineProps> = (props) => {
    return (
        <PropertyLine {...props} expandedContent={<VectorSliders {...props} />}>
            <Body1>{props.vector.toString()}</Body1>
        </PropertyLine>
    );
};
