// eslint-disable-next-line import/no-internal-modules
import { Vector3, Vector4 } from "core/index";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { SyncedSliderLine } from "./syncedSliderLine";
import { FunctionComponent } from "react";
import { Body1 } from "@fluentui/react-components";

type IVectorPropertyLineProps = {
    vector: Vector3 | Vector4;
    label: string;
    min?: number;
    max?: number;
};

/**
 * Reusable component which renders a vector property line containing a label, vector value, and expandable XYZW values
 * The expanded section contains a slider/input box for each component of the vector (x, y, z, w)
 */
export const VectorPropertyLine: FunctionComponent<IVectorPropertyLineProps> = ({ vector, label, min, max }) => {
    const renderXYZExpand = (vector: Vector3 | Vector4) => {
        return (
            <>
                <SyncedSliderLine label="X" validKey="x" obj={vector} min={min} max={max} />
                <SyncedSliderLine label="Y" validKey="y" obj={vector} min={min} max={max} />
                <SyncedSliderLine label="Z" validKey="z" obj={vector} min={min} max={max} />
                {vector instanceof Vector4 && <SyncedSliderLine label="W" validKey="w" obj={vector} min={min} max={max} />}
            </>
        );
    };
    return (
        <PropertyLine label={label} renderExpandedContent={() => renderXYZExpand(vector)}>
            <Body1>{vector.toString()}</Body1>
        </PropertyLine>
    );
};
