import type { FunctionComponent } from "react";
import { forwardRef, useState } from "react";

import type { BaseComponentProps, PropertyLineProps } from "./propertyLine";
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
const ColorPropertyLine = forwardRef<HTMLDivElement, ColorPropertyLineProps>((props, ref) => {
    const [color, setColor] = useState(props.value);
    const onChange = (value: Color3 | Color4) => {
        setColor(value);
        props.onChange(value);
    };
    return (
        <PropertyLine ref={ref} {...props} expandedContent={<ColorSliders {...props} value={color} onChange={onChange} />}>
            <ColorPickerPopup {...props} value={color} />
        </PropertyLine>
    );
});

const ColorSliders: FunctionComponent<BaseComponentProps<Color3 | Color4>> = (props) => {
    const [color, setColor] = useState(props.value);
    const onChange = (value: number, key: "r" | "g" | "b" | "a") => {
        let newColor;
        if (key === "a") {
            newColor = Color4.FromColor3(color, value);
        } else {
            newColor = color.clone();
            newColor[key] = value / 255.0;
        }

        setColor(newColor); // Create a new object to trigger re-render
        props.onChange(newColor);
    };

    return (
        <>
            <SyncedSliderLine label="R" value={color.r * 255.0} min={0} max={255} step={1} onChange={(value) => onChange(value, "r")} />
            <SyncedSliderLine label="G" value={color.g * 255.0} min={0} max={255} step={1} onChange={(value) => onChange(value, "g")} />
            <SyncedSliderLine label="B" value={color.b * 255.0} min={0} max={255} step={1} onChange={(value) => onChange(value, "b")} />
            {color instanceof Color4 && <SyncedSliderLine label="A" value={color.a} min={0} max={1} step={0.01} onChange={(value) => onChange(value, "a")} />}
        </>
    );
};

export const Color3PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color3> & PropertyLineProps>;
export const Color4PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color4> & PropertyLineProps>;
