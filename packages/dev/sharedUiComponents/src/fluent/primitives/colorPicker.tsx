/* eslint-disable jsdoc/require-returns */
/* eslint-disable @typescript-eslint/naming-convention */
import { forwardRef, useState, useEffect, useCallback, useContext, useMemo } from "react";
import type { FunctionComponent } from "react";
import { ColorPicker as FluentColorPicker, ColorSlider, ColorArea, AlphaSlider, makeStyles, tokens, Body1Strong, ColorSwatch, Body1 } from "@fluentui/react-components";
import type { ColorPickerProps as FluentColorPickerProps } from "@fluentui/react-components";
import { Color3, Color4 } from "core/Maths/math.color";
import type { PrimitiveProps } from "./primitive";
import { SpinButton } from "./spinButton";
import { TextInput } from "./textInput";
import { NumberDropdown } from "./dropdown";
import { ValidateColorHex } from "./utils";
import { Link } from "./link";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { Popover } from "./popover";

const useColorPickerStyles = makeStyles({
    container: {
        width: "350px",
        display: "flex", // becomes a flexbox
        flexDirection: "column", // with children in a column
        alignItems: "center", // centers children horizontally
        justifyContent: "center", // centers children vertically (if height is set)
        gap: tokens.spacingVerticalM,
        overflow: "visible",
    },
    row: {
        flex: 1, // is a row in the container's flex column
        display: "flex", // becomes its own flexbox
        flexDirection: "row", // with children in a row
        gap: tokens.spacingHorizontalXL,
        alignItems: "center", // align items vertically
        width: "100%",
    },
    colorPicker: {
        flex: 1,
        width: "350px",
        height: "350px",
    },
    previewColor: {
        width: "60px",
        height: "60px",
        borderRadius: tokens.borderRadiusMedium, // 4px?
        border: `${tokens.spacingVerticalXXS} solid ${tokens.colorNeutralShadowKeyLighter}`,
        "@media (forced-colors: active)": {
            forcedColorAdjust: "none", // ensures elmement maintains color in high constrast mode
        },
    },
    inputRow: {
        display: "flex",
        flexDirection: "row",
        flex: 1, // grow and fill available space
        justifyContent: "center",
        gap: "10px",
        width: "100%",
    },
    inputField: {
        flex: 1, // grow and fill available space
        width: "auto",
        minWidth: 0,
        gap: tokens.spacingVerticalSNudge, // 6px
    },
    trigger: {
        display: "flex",
        alignItems: "center",
    },
});

export type ColorPickerProps<C extends Color3 | Color4> = {
    isLinearMode?: boolean;
} & PrimitiveProps<C>;

export const ColorPickerPopup = forwardRef<HTMLButtonElement, ColorPickerProps<Color3 | Color4>>((props, ref) => {
    ColorPickerPopup.displayName = "ColorPickerPopup";
    const { value, onChange, isLinearMode, ...rest } = props;
    const classes = useColorPickerStyles();
    const [color, setColor] = useState(value);
    const [isLinear, setIsLinear] = useState(isLinearMode ?? false);
    const [isFloat, setFloat] = useState(false);
    const { size } = useContext(ToolContext);
    useEffect(() => {
        setColor(value); // Ensures the trigger color updates when props.value changes
    }, [value]);

    const isPropertyLinear = isLinearMode ?? false;

    /** Color in gamma space — used for visual elements (picker, preview, trigger) */
    const gammaColor = useMemo(() => (isPropertyLinear ? color.toGammaSpace() : color), [color, isPropertyLinear]);

    /** Color in the user-selected display space — used for numeric inputs (RGB, HSV, Hex) */
    const displayColor = useMemo(() => {
        if (isLinear === isPropertyLinear) {
            return color;
        }
        return isLinear ? color.toLinearSpace() : color.toGammaSpace();
    }, [color, isLinear, isPropertyLinear]);

    const handleColorPickerChange: FluentColorPickerProps["onColorChange"] = (_, data) => {
        // The visual picker always operates in gamma space, convert back to property space
        let gammaResult: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
        if (value instanceof Color4) {
            gammaResult = Color4.FromColor3(gammaResult, data.color.a ?? 1);
        }
        handleChange(isPropertyLinear ? gammaResult.toLinearSpace() : gammaResult);
    };

    const handleChange = (newColor: Color3 | Color4) => {
        setColor(newColor);
        onChange(newColor); // Ensures the parent is notified when color changes from within colorPicker
    };

    const handleDisplayChange = (newDisplayColor: Color3 | Color4) => {
        const propertyColor = isLinear === isPropertyLinear ? newDisplayColor : isLinear ? newDisplayColor.toGammaSpace() : newDisplayColor.toLinearSpace();
        handleChange(propertyColor);
    };

    return (
        <Popover
            trigger={
                <ColorSwatch
                    className={classes.trigger}
                    ref={ref}
                    {...rest}
                    borderColor={tokens.colorNeutralShadowKeyDarker}
                    size={size === "small" ? "extra-small" : "small"}
                    shape="rounded"
                    color={gammaColor.toHexString()}
                    value={gammaColor.toHexString().slice(1)}
                />
            }
        >
            <div className={classes.container}>
                <FluentColorPicker className={classes.colorPicker} color={rgbaToHsv(gammaColor)} onColorChange={handleColorPickerChange}>
                    <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
                    <ColorSlider aria-label="Hue" />
                    {color instanceof Color4 && <AlphaSlider aria-label="Alpha" />}
                </FluentColorPicker>
                {/* Top Row: Preview, Color Space, Data Type */}
                <div className={classes.row}>
                    <div className={classes.previewColor} style={{ backgroundColor: gammaColor.toHexString() }} />
                    <NumberDropdown
                        className={classes.inputField}
                        infoLabel={{
                            label: "Color Space",
                            info: (
                                <Body1>
                                    Choose which color space to display numeric values in. This property stores its color in{" "}
                                    <Body1Strong>{isPropertyLinear ? "linear" : "gamma"}</Body1Strong> space. The visual picker always shows gamma (screen-accurate) colors.
                                </Body1>
                            ),
                        }}
                        options={[
                            { label: "Gamma", value: 0 },
                            { label: "Linear", value: 1 },
                        ]}
                        value={isLinear ? 1 : 0}
                        onChange={(val: number) => setIsLinear(val === 1)}
                    />
                    <NumberDropdown
                        className={classes.inputField}
                        infoLabel={{
                            label: "Data Type",
                            info: (
                                <Body1>
                                    <Body1Strong>Int</Body1Strong> displays RGB channels as integers in the 0–255 range. <Body1Strong>Float</Body1Strong> displays them as decimals
                                    in the 0–1 range. This is display-only and does not affect the stored color.
                                </Body1>
                            ),
                        }}
                        options={[
                            { label: "Int", value: 0 },
                            { label: "Float", value: 1 },
                        ]}
                        value={isFloat ? 1 : 0}
                        onChange={(val: number) => setFloat(val === 1)}
                    />
                </div>

                {/* Middle Row: Red, Green, Blue, Alpha */}
                <div className={classes.inputRow}>
                    <InputRgbField title="Red" value={displayColor} rgbKey="r" isFloat={isFloat} onChange={handleDisplayChange} />
                    <InputRgbField title="Green" value={displayColor} rgbKey="g" isFloat={isFloat} onChange={handleDisplayChange} />
                    <InputRgbField title="Blue" value={displayColor} rgbKey="b" isFloat={isFloat} onChange={handleDisplayChange} />
                    <InputAlphaField color={color} onChange={handleChange} />
                </div>

                {/* Bottom Row: Hue, Saturation, Value */}
                <div className={classes.inputRow}>
                    <InputHsvField title="Hue" value={displayColor} hsvKey="h" isFloat={isFloat} onChange={handleDisplayChange} />
                    <InputHsvField title="Saturation" value={displayColor} hsvKey="s" isFloat={isFloat} onChange={handleDisplayChange} />
                    <InputHsvField title="Value" value={displayColor} hsvKey="v" isFloat={isFloat} onChange={handleDisplayChange} />
                </div>

                <div className={classes.inputRow}>
                    <InputHexField title="Hexadecimal" value={displayColor} isLinear={isLinear} isPropertyLinear={isPropertyLinear} onChange={handleDisplayChange} />
                </div>
            </div>
        </Popover>
    );
});

export type InputHexProps = PrimitiveProps<Color3 | Color4> & {
    isLinear?: boolean;
    isPropertyLinear?: boolean;
};

/**
 * Converts a hex string to the same Color type as the original.
 * Supports "#RGB", "#RRGGBB", and "#RRGGBBAA" formats.
 * For Color4, honors alpha from "#RRGGBBAA" input or preserves the original alpha otherwise.
 * @param hex - The hex string to convert, in one of the supported formats.
 * @param original - The original color, used to determine whether to return a Color3 or Color4 and to preserve alpha if not specified in hex.
 * @returns A new Color3 or Color4 instance representing the hex color
 */
function colorFromHex(hex: string, original: Color3 | Color4): Color3 | Color4 {
    const digits = hex.startsWith("#") ? hex.slice(1) : hex;

    // Normalize short hex (RGB => RRGGBB)
    if (digits.length === 3) {
        hex = `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`;
    }

    // 8 hex digits = RRGGBBAA — use Color4.FromHexString which natively handles this
    if (digits.length === 8) {
        if (original instanceof Color4) {
            return Color4.FromHexString(hex);
        }
        return Color3.FromHexString(hex.slice(0, 7));
    }

    // 6 hex digits = RRGGBB (or normalized from 3)
    if (original instanceof Color4) {
        return Color4.FromColor3(Color3.FromHexString(hex), original.a);
    }
    return Color3.FromHexString(hex);
}

/**
 * Component which displays the passed in color's HEX value in the currently selected color space.
 * When the hex color is changed by user, component calculates the new Color3/4 value and calls onChange.
 * @param props - The properties for the InputHexField component.
 * @returns
 */
export const InputHexField: FunctionComponent<InputHexProps> = (props) => {
    const classes = useColorPickerStyles();
    const { title, value, onChange, isLinear, isPropertyLinear } = props;

    const displayMismatchesProperty = (isLinear ?? false) !== (isPropertyLinear ?? false);
    const displaySpace = isLinear ? "linear" : "gamma";
    const propertySpace = isPropertyLinear ? "linear" : "gamma";
    const isColor4 = value instanceof Color4;
    const colorClass = isColor4 ? "Color4" : "Color3";

    return (
        <TextInput
            className={classes.inputField}
            value={value.toHexString()}
            validator={ValidateColorHex}
            validateOnlyOnBlur
            onChange={(val) => onChange(colorFromHex(val, value))}
            infoLabel={
                title
                    ? {
                          label: title,
                          info: (
                              <Body1>
                                  This hex value is in <Body1Strong>{displaySpace}</Body1Strong> space
                                  {displayMismatchesProperty ? (
                                      <Body1>
                                          , but the property stores its color in <Body1Strong>{propertySpace}</Body1Strong> space.
                                          <br />
                                          <br />
                                          The color picker converts automatically, but if you copy this hex into code you will need to convert it:
                                          <br />
                                          <Body1Strong>
                                              {colorClass}.FromHexString("{value.toHexString()}").{isLinear ? "toGammaSpace()" : "toLinearSpace()"}
                                          </Body1Strong>
                                      </Body1>
                                  ) : (
                                      <Body1>
                                          , which matches the property's stored color space.
                                          <br />
                                          <br />
                                          To copy this hex into code, use
                                          <br />
                                          <Body1Strong>
                                              {colorClass}.FromHexString("{value.toHexString()}")
                                          </Body1Strong>
                                      </Body1>
                                  )}
                                  <br />
                                  <br />
                                  <Link url="https://doc.babylonjs.com/preparingArtForBabylon/controllingColorSpace/" value="Read more in our docs!" />
                              </Body1>
                          ),
                      }
                    : undefined
            }
        />
    );
};

type RgbKey = "r" | "g" | "b";
type InputRgbFieldProps = PrimitiveProps<Color3 | Color4> & {
    rgbKey: RgbKey;
    isFloat: boolean;
};

const InputRgbField: FunctionComponent<InputRgbFieldProps> = (props) => {
    const { value, onChange, title, rgbKey, isFloat } = props;
    const classes = useColorPickerStyles();

    const handleChange = useCallback(
        (val: number) => {
            const newColor = value.clone();
            newColor[rgbKey] = isFloat ? val : val / 255.0;
            onChange(newColor);
        },
        [value, onChange, rgbKey, isFloat]
    );

    return (
        <SpinButton
            key={`${rgbKey}-${isFloat ? "float" : "int"}`} // ensures remount when swapping between int/float, preserving min/max validation
            infoLabel={title ? { label: title } : undefined}
            className={classes.inputField}
            min={0}
            max={isFloat ? 1 : 255}
            value={isFloat ? value[rgbKey] : Math.round(value[rgbKey] * 255)}
            step={isFloat ? 0.01 : 1}
            forceInt={!isFloat}
            precision={isFloat ? 4 : undefined}
            onChange={handleChange}
        />
    );
};

function rgbaToHsv(color: { r: number; g: number; b: number; a?: number }): { h: number; s: number; v: number; a?: number } {
    const c = new Color3(color.r, color.g, color.b);
    const hsv = c.toHSV();
    return { h: hsv.r, s: hsv.g, v: hsv.b, a: color.a };
}

type HsvKey = "h" | "s" | "v";
type InputHsvFieldProps = PrimitiveProps<Color3 | Color4> & {
    hsvKey: HsvKey;
    isFloat: boolean;
};

// Internal HSV ranges: H ∈ [0,360], S ∈ [0,1], V ∈ [0,1]
// Int mode display:   H → 0-360, S → 0-100, V → 0-100
// Float mode display: H → 0-1,   S → 0-1,   V → 0-1
function getHsvDisplayParams(hsvKey: HsvKey, isFloat: boolean) {
    if (isFloat) {
        // All channels displayed as 0-1
        const internalMax = hsvKey === "h" ? 360 : 1;
        return { max: 1, toDisplay: (v: number) => v / internalMax, toInternal: (v: number) => v * internalMax, step: 0.01, forceInt: false, precision: 4 };
    }
    // Int mode
    const scale = hsvKey === "h" ? 1 : 100;
    const max = hsvKey === "h" ? 360 : 100;
    return { max, toDisplay: (v: number) => Math.round(v * scale), toInternal: (v: number) => v / scale, step: 1, forceInt: true, precision: undefined };
}

/**
 * In the HSV (Hue, Saturation, Value) color model, Hue (H) ranges from 0 to 360 degrees, representing the color's position on the color wheel.
 * Saturation (S) ranges from 0 to 100%, indicating the intensity or purity of the color, with 0 being shades of gray and 100 being a fully saturated color.
 * Value (V) ranges from 0 to 100%, representing the brightness of the color, with 0 being black and 100 being the brightest.
 * @param props - The properties for the InputHsvField component.
 */
export const InputHsvField: FunctionComponent<InputHsvFieldProps> = (props) => {
    const { value, title, hsvKey, isFloat, onChange } = props;

    const classes = useColorPickerStyles();
    const { max, toDisplay, toInternal, step, forceInt, precision } = getHsvDisplayParams(hsvKey, isFloat);

    const handleChange = useCallback(
        (val: number) => {
            const hsv = rgbaToHsv(value);
            hsv[hsvKey] = toInternal(val);
            let newColor: Color3 | Color4 = Color3.FromHSV(hsv.h, hsv.s, hsv.v);
            if (value instanceof Color4) {
                newColor = Color4.FromColor3(newColor, value.a ?? 1);
            }
            props.onChange(newColor);
        },
        [value, onChange, hsvKey, toInternal]
    );

    return (
        <SpinButton
            key={`${hsvKey}-${isFloat ? "float" : "int"}`} // ensures remount when swapping between int/float, preserving min/max validation
            infoLabel={title ? { label: title } : undefined}
            className={classes.inputField}
            min={0}
            max={max}
            value={toDisplay(rgbaToHsv(value)[hsvKey])}
            step={step}
            forceInt={forceInt}
            precision={precision}
            onChange={handleChange}
        />
    );
};

type InputAlphaProps = {
    color: Color3 | Color4;
    onChange: (color: Color4) => void;
};

/**
 * Displays the alpha value of a color, either in the disabled state (if color is Color3) or as a spin button (if color is Color4).
 * @param props
 * @returns
 */
const InputAlphaField: FunctionComponent<InputAlphaProps> = (props) => {
    const classes = useColorPickerStyles();
    const { color, onChange } = props;

    const handleChange = useCallback(
        (value: number) => {
            if (Number.isNaN(value) || value < 0 || value > 1) {
                return;
            }

            if (color instanceof Color4) {
                const newColor = color.clone();
                newColor.a = value;
                onChange(newColor);
            } else {
                onChange(Color4.FromColor3(color, value));
            }
        },
        [color, onChange]
    );

    return (
        <SpinButton
            disabled={color instanceof Color3}
            min={0}
            max={1}
            className={classes.inputField}
            value={color instanceof Color3 ? 1 : color.a}
            step={0.01}
            onChange={handleChange}
            infoLabel={{
                label: "Alpha",
                info:
                    color instanceof Color3 ? (
                        <Body1>
                            Because this color picker is representing a Color3, we do not permit modifying alpha from the color picker. You can however modify the property's alpha
                            property directly, either in code via property.alpha OR via inspector's transparency section.
                        </Body1>
                    ) : undefined,
            }}
        />
    );
};
