import type { FunctionComponent } from "react";

import type { PropertyLineProps } from "./propertyLine";
import { PropertyLine } from "./propertyLine";
import { SyncedSliderLine } from "./syncedSliderLine";

import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";

type ColorSliderProps = {
    color: Color3 | Color4;
};

const ColorSliders: FunctionComponent<ColorSliderProps> = (props) => {
    return (
        <>
            <SyncedSliderLine label="R" propertyKey="r" target={props.color} min={0} max={255} />
            <SyncedSliderLine label="G" propertyKey="g" target={props.color} min={0} max={255} />
            <SyncedSliderLine label="B" propertyKey="b" target={props.color} min={0} max={255} />
            {props.color instanceof Color4 && <SyncedSliderLine label="A" propertyKey="a" target={props.color} min={0} max={1} />}
        </>
    );
};

/**
 * Reusable component which renders a color property line containing a label, colorPicker popout, and expandable RGBA values
 * The expandable RGBA values are synced sliders that allow the user to modify the color's RGBA values directly
 * @param props - PropertyLine props, replacing children with a color object so that we can properly display the color
 * @returns Component wrapping a colorPicker component (coming soon) with a property line
 */
export const ColorPropertyLine: FunctionComponent<ColorSliderProps & PropertyLineProps> = (props) => {
    return (
        <PropertyLine {...props} expandedContent={<ColorSliders {...props} />}>
            {
                props.color.toString()
                // Will replace with colorPicker in future PR
            }
        </PropertyLine>
    );
};
