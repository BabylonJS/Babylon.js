import { type FunctionComponent, forwardRef } from "react";

import { type PropertyLineProps } from "./propertyLine";

import { type Color3, Color4 } from "core/Maths/math.color";
import { ColorPickerPopup, type ColorPickerProps } from "../../primitives/colorPicker";
import { ControlledColorPropertyLine, type ColorPropertyLineAdapter } from "./colorPropertyLineCore";

export type ColorPropertyLineProps = ColorPickerProps<Color3 | Color4> & PropertyLineProps<Color3 | Color4>;

const Picker: FunctionComponent<ColorPickerProps<Color3 | Color4>> = (props) => <ColorPickerPopup {...props} />;
const Adapter: ColorPropertyLineAdapter<Color3 | Color4> = {
    picker: Picker,
    getColor: (value) => value,
    createColor: (color, source) => {
        if (source instanceof Color4) {
            return new Color4(color.r, color.g, color.b, color.a ?? source.a);
        }
        return source.clone().set(color.r, color.g, color.b);
    },
};

const ColorPropertyLine = forwardRef<HTMLDivElement, ColorPropertyLineProps>((props, ref) => <ControlledColorPropertyLine {...props} adapter={Adapter} propertyLineRef={ref} />);
ColorPropertyLine.displayName = "ColorPropertyLine";

/**
 * Edits a Babylon.js Color3 value.
 * @param props The controlled color and property-line presentation.
 * @returns The Color3 property line.
 */
export const Color3PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color3> & PropertyLineProps<Color3>>;
/**
 * Edits a Babylon.js Color4 value.
 * @param props The controlled color and property-line presentation.
 * @returns The Color4 property line.
 */
export const Color4PropertyLine = ColorPropertyLine as FunctionComponent<ColorPickerProps<Color4> & PropertyLineProps<Color4>>;
