/* eslint-disable jsdoc/require-returns */
/* eslint-disable @typescript-eslint/naming-convention */
import { forwardRef, useState, useEffect, useCallback, useContext } from "react";
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

    const handleColorPickerChange: FluentColorPickerProps["onColorChange"] = (_, data) => {
        let color: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
        if (value instanceof Color4) {
            color = Color4.FromColor3(color, data.color.a ?? 1);
        }
        handleChange(color);
    };

    const handleChange = (newColor: Color3 | Color4) => {
        setColor(newColor);
        onChange(newColor); // Ensures the parent is notified when color changes from within colorPicker
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
                    color={color.toHexString()}
                    value={color.toHexString().slice(1)}
                />
            }
        >
            <div className={classes.container}>
                <FluentColorPicker className={classes.colorPicker} color={rgbaToHsv(color)} onColorChange={handleColorPickerChange}>
                    <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
                    <ColorSlider aria-label="Hue" />
                    {color instanceof Color4 && <AlphaSlider aria-label="Alpha" />}
                </FluentColorPicker>
                {/* Top Row: Preview, Gamma Hex, Linear Hex */}
                <div className={classes.row}>
                    <div className={classes.previewColor} style={{ backgroundColor: color.toHexString() }} />
                    <NumberDropdown
                        className={classes.inputField}
                        infoLabel={{
                            label: "Color Space",
                            info: <Body1>Today this is not mutable as the color space is determined by the entity. Soon we will allow swapping</Body1>,
                        }}
                        options={[
                            { label: "Gamma", value: 0 },
                            { label: "Linear", value: 1 },
                        ]}
                        disabled={true}
                        value={isLinear ? 1 : 0}
                        onChange={(val: number) => setIsLinear(val === 1)}
                    />
                    <NumberDropdown
                        className={classes.inputField}
                        infoLabel={{
                            label: "Data Type",
                            info: <Body1>We will introduce this functionality soon!</Body1>,
                        }}
                        options={[
                            { label: "Int", value: 0 },
                            { label: "Float", value: 1 },
                        ]}
                        disabled={true}
                        value={isFloat ? 1 : 0}
                        onChange={(val: number) => setFloat(val === 1)}
                    />
                </div>

                {/* Middle Row: Red, Green, Blue, Alpha */}
                <div className={classes.inputRow}>
                    <InputRgbField title="Red" value={color} rgbKey="r" onChange={handleChange} />
                    <InputRgbField title="Green" value={color} rgbKey="g" onChange={handleChange} />
                    <InputRgbField title="Blue" value={color} rgbKey="b" onChange={handleChange} />
                    <InputAlphaField color={color} onChange={handleChange} />
                </div>

                {/* Bottom Row: Hue, Saturation, Value */}
                <div className={classes.inputRow}>
                    <InputHsvField title="Hue" value={color} hsvKey="h" max={360} onChange={handleChange} />
                    <InputHsvField title="Saturation" value={color} hsvKey="s" max={100} scale={100} onChange={handleChange} />
                    <InputHsvField title="Value" value={color} hsvKey="v" max={100} scale={100} onChange={handleChange} />
                </div>

                <div className={classes.inputRow}>
                    <InputHexField title="Hexadecimal" linearHex={isLinear} isLinearMode={isLinear} value={color} onChange={handleChange} />
                </div>
            </div>
        </Popover>
    );
});

export type InputHexProps = PrimitiveProps<Color3 | Color4> & {
    linearHex?: boolean;
    isLinearMode?: boolean;
};
/**
 * Component which displays the passed in color's HEX value, either in linearSpace (if linearHex is true) or in gamma space
 * When the hex color is changed by user, component calculates the new Color3/4 value and calls onChange
 *
 * Component uses the isLinearMode boolean to display an informative label regarding linear / gamma space
 * @param props - The properties for the InputHexField component.
 * @returns
 */
export const InputHexField: FunctionComponent<InputHexProps> = (props) => {
    const classes = useColorPickerStyles();
    const { title, value, onChange, linearHex, isLinearMode } = props;

    return (
        <TextInput
            disabled={linearHex ? !isLinearMode : false}
            className={classes.inputField}
            value={linearHex ? value.toLinearSpace().toHexString() : value.toHexString()}
            validator={ValidateColorHex}
            onChange={(val) => (linearHex ? onChange(Color3.FromHexString(val).toGammaSpace()) : onChange(Color3.FromHexString(val)))}
            infoLabel={
                title
                    ? {
                          label: title,
                          // If not representing a linearHex, no info is needed.
                          info: !props.linearHex ? undefined : !isLinearMode ? ( // If representing a linear hex but we are in gammaMode, simple message explaining why linearHex is disabled
                              <> This color picker is attached to an entity whose color is stored in gamma space, so we are showing linear hex in disabled view </>
                          ) : (
                              // If representing a linear hex and we are in linearMode, give information about how to use these hex values
                              <>
                                  This color picker is attached to an entity whose color is stored in linear space (ex: PBR Material), and Babylon converts the color to gamma space
                                  before rendering on screen because the human eye is best at processing colors in gamma space. We thus also want to display the color picker in
                                  gamma space so that the color chosen here will match the color seen in your entity.
                                  <br />
                                  If you want to copy/paste the HEX into your code, you can either use
                                  <Body1Strong>Color3.FromHexString(LINEAR_HEX)</Body1Strong>
                                  <br />
                                  or
                                  <br />
                                  <Body1Strong>Color3.FromHexString(GAMMA_HEX).toLinearSpace()</Body1Strong>
                                  <br />
                                  <br />
                                  <Link url="https://doc.babylonjs.com/preparingArtForBabylon/controllingColorSpace/" value="Read more in our docs!" />
                              </>
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
};

const InputRgbField: FunctionComponent<InputRgbFieldProps> = (props) => {
    const { value, onChange, title, rgbKey } = props;
    const classes = useColorPickerStyles();

    const handleChange = useCallback(
        (val: number) => {
            const newColor = value.clone();
            newColor[rgbKey] = val / 255.0; // Convert to 0-1 range
            onChange(newColor);
        },
        [value, onChange, rgbKey]
    );

    return (
        <SpinButton
            infoLabel={title ? { label: title } : undefined}
            className={classes.inputField}
            min={0}
            max={255}
            value={Math.round(value[rgbKey] * 255)}
            forceInt
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
    max: number;
    scale?: number;
};

/**
 * In the HSV (Hue, Saturation, Value) color model, Hue (H) ranges from 0 to 360 degrees, representing the color's position on the color wheel.
 * Saturation (S) ranges from 0 to 100%, indicating the intensity or purity of the color, with 0 being shades of gray and 100 being a fully saturated color.
 * Value (V) ranges from 0 to 100%, representing the brightness of the color, with 0 being black and 100 being the brightest.
 * @param props - The properties for the InputHsvField component.
 */
export const InputHsvField: FunctionComponent<InputHsvFieldProps> = (props) => {
    const { value, title, hsvKey, max, onChange, scale = 1 } = props;

    const classes = useColorPickerStyles();

    const handleChange = useCallback(
        (val: number) => {
            // Convert current color to HSV, update the new hsv value, then call onChange prop
            const hsv = rgbaToHsv(value);
            hsv[hsvKey] = val / scale;
            let newColor: Color3 | Color4 = Color3.FromHSV(hsv.h, hsv.s, hsv.v);
            if (value instanceof Color4) {
                newColor = Color4.FromColor3(newColor, value.a ?? 1);
            }
            props.onChange(newColor);
        },
        [value, onChange, hsvKey, scale]
    );

    return (
        <SpinButton
            infoLabel={title ? { label: title } : undefined}
            className={classes.inputField}
            min={0}
            max={max}
            value={Math.round(rgbaToHsv(value)[hsvKey] * scale)}
            forceInt
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
                return newColor;
            } else {
                return Color4.FromColor3(color, value);
            }
        },
        [onChange]
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
                        <>
                            Because this color picker is representing a Color3, we do not permit modifying alpha from the color picker. You can however modify the entity's alpha
                            property directly, either in code via entity.alpha OR via inspector's transparency section.
                        </>
                    ) : undefined,
            }}
        />
    );
};
