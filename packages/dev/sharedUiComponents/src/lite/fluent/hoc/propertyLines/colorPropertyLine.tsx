import { type Color3, type Color4 } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { ControlledColorPropertyLine, type ColorPropertyLineAdapter } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLineCore";
import { type PropertyLineProps } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { StructuralColorPickerPopup, type StructuralColorPickerProps, type StructuralColor } from "shared-ui-components/fluent/primitives/structuralColorPicker";

export type Color3Value = Color3 | readonly [number, number, number];
export type Color4Value = Color4 | readonly [number, number, number, number];

export type ColorPickerProps<ValueT extends Color3Value | Color4Value> = Omit<StructuralColorPickerProps<ValueT>, "adapter">;
export type ColorPropertyLineProps<ValueT extends Color3Value | Color4Value> = ColorPickerProps<ValueT> & PropertyLineProps<ValueT>;

function IsColor4Value(value: Color3Value | Color4Value): value is Color4Value {
    return "r" in value ? "a" in value : value.length === 4;
}

function GetStructuralColor(value: Color3Value | Color4Value): StructuralColor {
    if (!("r" in value)) {
        return {
            r: value[0],
            g: value[1],
            b: value[2],
            ...(value.length === 4 ? { a: value[3] } : {}),
        };
    }
    return value;
}

function CreateColor3Value(color: StructuralColor, source: Color3Value): Color3Value {
    if (!("r" in source)) {
        return [color.r, color.g, color.b];
    }
    return {
        r: color.r,
        g: color.g,
        b: color.b,
    };
}

function CreateColor4Value(color: StructuralColor, source: Color4Value): Color4Value {
    if (!("r" in source)) {
        return [color.r, color.g, color.b, color.a ?? source[3]];
    }
    return {
        r: color.r,
        g: color.g,
        b: color.b,
        a: color.a ?? source.a,
    };
}

const Picker: FunctionComponent<ColorPickerProps<Color3Value | Color4Value>> = (props) => (
    <StructuralColorPickerPopup
        {...props}
        adapter={{
            getColor: GetStructuralColor,
            createColor: (color, source) => (IsColor4Value(source) ? CreateColor4Value(color, source) : CreateColor3Value(color, source)),
        }}
    />
);

const Adapter: ColorPropertyLineAdapter<Color3Value | Color4Value> = {
    picker: Picker,
    getColor: GetStructuralColor,
    createColor: (color, source) => (IsColor4Value(source) ? CreateColor4Value(color, source) : CreateColor3Value(color, source)),
};

export const Color3PropertyLine: FunctionComponent<ColorPropertyLineProps<Color3Value>> = (props) => (
    <ControlledColorPropertyLine {...props} adapter={Adapter as ColorPropertyLineAdapter<Color3Value>} />
);
export const Color4PropertyLine: FunctionComponent<ColorPropertyLineProps<Color4Value>> = (props) => (
    <ControlledColorPropertyLine {...props} adapter={Adapter as ColorPropertyLineAdapter<Color4Value>} />
);
