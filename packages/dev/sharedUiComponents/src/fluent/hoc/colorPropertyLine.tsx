import type { FunctionComponent } from "react";

import type { PropertyLineProps } from "./propertyLine";
import { PropertyLine } from "./propertyLine";
import { SyncedSliderLine } from "./syncedSliderLine";

import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import { ColorPickerPopup } from "../primitives/colorPicker";
import type { ColorPickerProps } from "../primitives/colorPicker";

export type ColorPropertyLineProps = ColorPickerProps<Color3 | Color4> & PropertyLineProps;

/**
 * Reusable component which renders a color property line containing a label, colorPicker popout, and expandable RGBA values
 * The expandable RGBA values are synced sliders that allow the user to modify the color's RGBA values directly
 * @param props - PropertyLine props, replacing children with a color object so that we can properly display the color
 * @returns Component wrapping a colorPicker component (coming soon) with a property line
 */
const ColorPropertyLine: FunctionComponent<ColorPropertyLineProps> = (props) => {
    return (
        <PropertyLine {...props} expandedContent={<ColorSliders {...props} />}>
            <ColorPickerPopup {...props} />
        </PropertyLine>
    );
};

const ColorSliders: FunctionComponent<{ value: Color3 | Color4 }> = (props) => {
    return (
        <>
            <SyncedSliderLine label="R" propertyKey="r" target={props.value} min={0} max={255} />
            <SyncedSliderLine label="G" propertyKey="g" target={props.value} min={0} max={255} />
            <SyncedSliderLine label="B" propertyKey="b" target={props.value} min={0} max={255} />
            {props.value instanceof Color4 && <SyncedSliderLine label="A" propertyKey="a" target={props.value} min={0} max={1} />}
        </>
    );
};

export const Color3PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color3> & PropertyLineProps>;
export const Color4PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color4> & PropertyLineProps>;
