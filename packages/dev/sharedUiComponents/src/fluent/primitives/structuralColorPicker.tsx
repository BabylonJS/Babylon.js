import {
    AlphaSlider,
    ColorArea,
    ColorPicker as FluentColorPicker,
    type ColorPickerProps as FluentColorPickerProps,
    ColorSlider,
    ColorSwatch,
    makeStyles,
    tokens,
} from "@fluentui/react-components";
import { useContext, useEffect, useMemo, useState } from "react";

import { ToolContext } from "../hoc/fluentToolWrapper";
import { Popover } from "./popover";
import { type PrimitiveProps } from "./primitive";

export type StructuralColor = Readonly<{ r: number; g: number; b: number; a?: number }>;

export type StructuralColorAdapter<ValueT> = Readonly<{
    getColor: (value: ValueT) => StructuralColor;
    createColor: (color: StructuralColor, source: ValueT) => ValueT;
}>;

export type StructuralColorPickerProps<ValueT> = PrimitiveProps<ValueT> &
    Readonly<{
        adapter: StructuralColorAdapter<ValueT>;
        isLinearMode?: boolean;
    }>;

const useStyles = makeStyles({
    picker: {
        width: "350px",
        height: "350px",
    },
    trigger: {
        display: "flex",
        alignItems: "center",
    },
});

function LinearChannelToGamma(value: number): number {
    return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

function GammaChannelToLinear(value: number): number {
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function ConvertColorSpace(color: StructuralColor, convertChannel: (value: number) => number): StructuralColor {
    return {
        r: convertChannel(color.r),
        g: convertChannel(color.g),
        b: convertChannel(color.b),
        ...("a" in color ? { a: color.a } : {}),
    };
}

function RgbToHsv(color: StructuralColor): { h: number; s: number; v: number; a?: number } {
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const delta = max - min;
    let hue = 0;

    if (delta !== 0) {
        if (max === color.r) {
            hue = 60 * (((color.g - color.b) / delta) % 6);
        } else if (max === color.g) {
            hue = 60 * ((color.b - color.r) / delta + 2);
        } else {
            hue = 60 * ((color.r - color.g) / delta + 4);
        }
    }

    return {
        h: hue < 0 ? hue + 360 : hue,
        s: max === 0 ? 0 : delta / max,
        v: max,
        ...("a" in color ? { a: color.a } : {}),
    };
}

function HsvToRgb(hue: number, saturation: number, value: number, alpha?: number): StructuralColor {
    const chroma = value * saturation;
    const hueSector = hue / 60;
    const intermediate = chroma * (1 - Math.abs((hueSector % 2) - 1));
    const offset = value - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (hueSector < 1) {
        red = chroma;
        green = intermediate;
    } else if (hueSector < 2) {
        red = intermediate;
        green = chroma;
    } else if (hueSector < 3) {
        green = chroma;
        blue = intermediate;
    } else if (hueSector < 4) {
        green = intermediate;
        blue = chroma;
    } else if (hueSector < 5) {
        red = intermediate;
        blue = chroma;
    } else {
        red = chroma;
        blue = intermediate;
    }

    return {
        r: red + offset,
        g: green + offset,
        b: blue + offset,
        ...(alpha !== undefined ? { a: alpha } : {}),
    };
}

function ColorToHex(color: StructuralColor): string {
    const channelToHex = (value: number) =>
        Math.round(Math.min(1, Math.max(0, value)) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}${color.a === undefined ? "" : channelToHex(color.a)}`;
}

/**
 * Runtime-neutral color picker for structural RGB and RGBA values.
 * @param props The controlled value, adapter, color-space mode, and change callback.
 * @returns A color swatch that opens the Fluent color picker.
 */
export const StructuralColorPickerPopup = <ValueT,>(props: StructuralColorPickerProps<ValueT>) => {
    const { value, onChange, adapter, isLinearMode, ...rest } = props;
    const classes = useStyles();
    const { size } = useContext(ToolContext);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const storedColor = adapter.getColor(currentValue);
    const gammaColor = useMemo(() => (isLinearMode ? ConvertColorSpace(storedColor, LinearChannelToGamma) : storedColor), [storedColor, isLinearMode]);
    const hexColor = ColorToHex(gammaColor);

    const handleColorPickerChange: FluentColorPickerProps["onColorChange"] = (_event, data) => {
        const changedGammaColor = HsvToRgb(data.color.h, data.color.s, data.color.v, storedColor.a === undefined ? undefined : (data.color.a ?? storedColor.a));
        const changedStoredColor = isLinearMode ? ConvertColorSpace(changedGammaColor, GammaChannelToLinear) : changedGammaColor;
        const changedValue = adapter.createColor(changedStoredColor, currentValue);
        setCurrentValue(changedValue);
        onChange(changedValue);
    };

    return (
        <Popover
            trigger={
                <ColorSwatch
                    {...rest}
                    className={classes.trigger}
                    borderColor={tokens.colorNeutralShadowKeyDarker}
                    size={size === "small" ? "extra-small" : "small"}
                    shape="rounded"
                    color={hexColor}
                    value={hexColor.slice(1)}
                />
            }
        >
            <FluentColorPicker className={classes.picker} color={RgbToHsv(gammaColor)} onColorChange={handleColorPickerChange}>
                {/* Fluent's API requires the native ARIA attribute spelling. */}
                {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
                <ColorSlider aria-label="Hue" />
                {storedColor.a !== undefined ? <AlphaSlider aria-label="Alpha" /> : undefined}
            </FluentColorPicker>
        </Popover>
    );
};
