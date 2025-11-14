import type { FunctionComponent } from "react";
import { forwardRef, useEffect, useState } from "react";

import type { PropertyLineProps } from "./propertyLine";
import { PropertyLine } from "./propertyLine";
import { SyncedSliderPropertyLine } from "./syncedSliderPropertyLine";

import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import { ColorPickerPopup } from "../../primitives/colorPicker";
import type { ColorPickerProps } from "../../primitives/colorPicker";

export type ColorPropertyLineProps = ColorPickerProps<Color3 | Color4> & PropertyLineProps<Color3 | Color4>;

/**
 * Reusable component which renders a color property line containing a label, colorPicker popout, and expandable RGBA values
 * The expandable RGBA values are synced sliders that allow the user to modify the color's RGBA values directly
 * @param props - PropertyLine props, replacing children with a color object so that we can properly display the color
 * @returns Component wrapping a colorPicker component with a property line
 */
const ColorPropertyLine = forwardRef<HTMLDivElement, ColorPropertyLineProps>((props, ref) => {
    ColorPropertyLine.displayName = "ColorPropertyLine";
    const [color, setColor] = useState(props.value);

    useEffect(() => {
        setColor(props.value);
    }, [props.value]);

    const onSliderChange = (value: number, key: "r" | "g" | "b" | "a") => {
        let newColor: Color3 | Color4;
        if (key === "a") {
            newColor = Color4.FromColor3(color, value);
        } else {
            newColor = color.clone();
            newColor[key] = value / 255;
        }

        setColor(newColor); // Create a new object to trigger re-render
        props.onChange(newColor);
    };

    const onColorPickerChange = (newColor: Color3 | Color4) => {
        setColor(newColor);
        props.onChange(newColor);
    };

    return (
        <PropertyLine
            ref={ref}
            {...props}
            expandedContent={
                <>
                    <SyncedSliderPropertyLine label="R" value={color.r * 255} min={0} max={255} onChange={(value) => onSliderChange(value, "r")} />
                    <SyncedSliderPropertyLine label="G" value={color.g * 255} min={0} max={255} onChange={(value) => onSliderChange(value, "g")} />
                    <SyncedSliderPropertyLine label="B" value={color.b * 255} min={0} max={255} onChange={(value) => onSliderChange(value, "b")} />
                    {color instanceof Color4 && <SyncedSliderPropertyLine label="A" value={color.a} min={0} max={1} step={0.01} onChange={(value) => onSliderChange(value, "a")} />}
                </>
            }
        >
            <ColorPickerPopup {...props} onChange={onColorPickerChange} value={color} />
        </PropertyLine>
    );
});

export const Color3PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color3> & PropertyLineProps<Color3>>;
export const Color4PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color4> & PropertyLineProps<Color4>>;
