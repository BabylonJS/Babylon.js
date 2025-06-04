// eslint-disable-next-line import/no-internal-modules
import { type Vector3, Vector4 } from "core/index";

import { type PropertyLineProps, PropertyLine, SplitPropertyLineProps } from "./propertyLine";
import { SyncedSliderLine } from "./syncedSliderLine";
import { type FunctionComponent } from "react";
import { Body1 } from "@fluentui/react-components";

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
            <SyncedSliderLine label="X" validKey="x" obj={vector} {...sliderProps} />
            <SyncedSliderLine label="Y" validKey="y" obj={vector} {...sliderProps} />
            <SyncedSliderLine label="Z" validKey="z" obj={vector} {...sliderProps} />
            {vector instanceof Vector4 && <SyncedSliderLine label="W" validKey="w" obj={vector} {...sliderProps} />}
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
    const [property, vector] = SplitPropertyLineProps(props);
    return (
        <PropertyLine {...property} expandedContent={<VectorSliders {...vector} />}>
            <Body1>{vector.vector.toString()}</Body1>
        </PropertyLine>
    );
};
