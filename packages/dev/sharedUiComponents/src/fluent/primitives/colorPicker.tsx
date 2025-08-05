/* eslint-disable jsdoc/require-returns */
/* eslint-disable @typescript-eslint/naming-convention */
import { useState, useEffect, useCallback } from "react";
import type { FunctionComponent, ChangeEvent } from "react";
import {
    Input,
    Label,
    SpinButton,
    useId,
    ColorPicker,
    ColorSlider,
    ColorArea,
    AlphaSlider,
    InfoLabel,
    Link,
    makeStyles,
    Popover,
    PopoverSurface,
    PopoverTrigger,
    tokens,
    Body1Strong,
    ColorSwatch,
} from "@fluentui/react-components";
import type { SpinButtonChangeEvent, SpinButtonOnChangeData, ColorPickerProps as FluentColorPickerProps, InputOnChangeData } from "@fluentui/react-components";
import { Color3, Color4 } from "core/Maths/math.color";
import type { PrimitiveProps } from "./primitive";

const useColorPickerStyles = makeStyles({
    colorPickerContainer: {
        width: "325px",
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalMNudge, // 10px
        overflow: "visible",
    },
    previewColor: {
        width: "50px",
        height: "50px",
        borderRadius: tokens.borderRadiusMedium,
        border: `${tokens.spacingVerticalXXS} solid ${tokens.colorNeutralShadowKeyLighter}`,
        "@media (forced-colors: active)": {
            forcedColorAdjust: "none", // ensures elmement maintains color in high constrast mode
        },
    },
    row: {
        display: "flex",
        flexDirection: "row",
        gap: tokens.spacingVerticalM, // 12px
        alignItems: "center",
    },
    colorFieldWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalSNudge, // 6px
    },
    input: {
        width: "80px",
    },
    spinButton: {
        minWidth: "60px",
    },
    container: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalL, // 16px
    },
});

export type ColorPickerProps<C extends Color3 | Color4> = {
    isLinearMode?: boolean;
} & PrimitiveProps<C>;

export const ColorPickerPopup: FunctionComponent<ColorPickerProps<Color3 | Color4>> = (props) => {
    const classes = useColorPickerStyles();
    const [color, setColor] = useState(props.value);

    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        setColor(props.value); // Ensures the trigger color updates when props.value changes
    }, [props.value]);

    const handleColorPickerChange: FluentColorPickerProps["onColorChange"] = (_, data) => {
        let color: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
        if (props.value instanceof Color4) {
            color = Color4.FromColor3(color, data.color.a ?? 1);
        }
        handleChange(color);
    };

    const handleChange = (newColor: Color3 | Color4) => {
        setColor(newColor);
        props.onChange(newColor); // Ensures the parent is notified when color changes from within colorPicker
    };

    return (
        <Popover
            positioning={{
                align: "start",
                overflowBoundary: document.body,
                autoSize: true,
            }}
            open={popoverOpen}
            trapFocus
            onOpenChange={(_, data) => setPopoverOpen(data.open)}
        >
            <PopoverTrigger disableButtonEnhancement>
                <ColorSwatch borderColor={tokens.colorNeutralShadowKeyDarker} size="small" color={color.toHexString()} value={color.toHexString().slice(1)} />
            </PopoverTrigger>

            <PopoverSurface>
                <div className={classes.colorPickerContainer}>
                    <ColorPicker color={rgbaToHsv(color)} onColorChange={handleColorPickerChange}>
                        <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
                        <ColorSlider aria-label="Hue" />
                        {color instanceof Color4 && <AlphaSlider aria-label="Alpha" />}
                    </ColorPicker>
                    <div className={classes.container}>
                        {/* Top Row: Preview, Gamma Hex, Linear Hex */}
                        <div className={classes.row}>
                            <div className={classes.previewColor} style={{ backgroundColor: color.toHexString() }} />
                            <InputHexField label="Gamma Hex" value={color} isLinearMode={props.isLinearMode} onChange={handleChange} />
                            <InputHexField label="Linear Hex" linearHex={true} isLinearMode={props.isLinearMode} value={color} onChange={handleChange} />
                        </div>

                        {/* Middle Row: Red, Green, Blue, Alpha */}
                        <div className={classes.row}>
                            <InputRgbField label="Red" color={color} rgbKey="r" onChange={handleChange} />
                            <InputRgbField label="Green" color={color} rgbKey="g" onChange={handleChange} />
                            <InputRgbField label="Blue" color={color} rgbKey="b" onChange={handleChange} />
                            <InputAlphaField color={color} onChange={handleChange} />
                        </div>

                        {/* Bottom Row: Hue, Saturation, Value */}
                        <div className={classes.row}>
                            <InputHsvField label="Hue" color={color} hsvKey="h" max={360} onChange={handleChange} />
                            <InputHsvField label="Saturation" color={color} hsvKey="s" max={100} scale={100} onChange={handleChange} />
                            <InputHsvField label="Value" color={color} hsvKey="v" max={100} scale={100} onChange={handleChange} />
                        </div>
                    </div>
                </div>
            </PopoverSurface>
        </Popover>
    );
};

type HsvKey = "h" | "s" | "v";
export type InputHexProps = PrimitiveProps<Color3 | Color4> & {
    label?: string;
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
    const id = useId("hex-input");
    const styles = useColorPickerStyles();
    const { label, value, onChange, linearHex, isLinearMode } = props;

    const handleChange = (e: ChangeEvent<HTMLInputElement>, _: InputOnChangeData) => {
        // If linearHint (aka PBR material, ensure the other values are displayed in gamma even if linear hex changes)
        const value = e.target.value;
        if (value != "" && /^[0-9A-Fa-f]+$/g.test(value) == false) {
            return;
        }
        onChange(Color3.FromHexString(value).toGammaSpace());
    };
    return (
        <div className={styles.colorFieldWrapper}>
            {props.linearHex ? (
                <InfoLabel
                    htmlFor={id}
                    info={
                        !isLinearMode ? (
                            <> This color picker is attached to an entity whose color is stored in gamma space, so we are showing linear hex in disabled view </>
                        ) : (
                            <>
                                This color picker is attached to an entity whose color is stored in linear space (ex: PBR Material), and Babylon converts the color to gamma space
                                before rendering on screen because the human eye is best at processing colors in gamma space. We thus also want to display the color picker in gamma
                                space so that the color chosen here will match the color seen in your entity.
                                <br />
                                If you want to copy/paste the HEX into your code, you can either use
                                <Body1Strong>Color3.FromHexString(LINEAR_HEX)</Body1Strong>
                                <br />
                                or
                                <br />
                                <Body1Strong>Color3.FromHexString(GAMMA_HEX).toLinearSpace()</Body1Strong>
                                <br />
                                <br />
                                <Link href="https://doc.babylonjs.com/preparingArtForBabylon/controllingColorSpace/"> Read more in our docs! </Link>
                            </>
                        )
                    }
                >
                    {label}
                </InfoLabel>
            ) : (
                <Label htmlFor={id}>{label}</Label>
            )}
            <Input
                disabled={linearHex ? !isLinearMode : false}
                className={styles.input}
                value={linearHex ? value.toLinearSpace().toHexString() : value.toHexString()}
                id={id}
                onChange={handleChange}
            />
        </div>
    );
};

type RgbKey = "r" | "g" | "b";
type InputRgbFieldProps = {
    color: Color3 | Color4;
    label: string;
    rgbKey: RgbKey;
    onChange: (color: Color3 | Color4) => void;
};

const InputRgbField: FunctionComponent<InputRgbFieldProps> = (props) => {
    const { color, onChange, label, rgbKey } = props;
    const id = useId(`${label.toLowerCase()}-input`);
    const classes = useColorPickerStyles();

    const handleChange = useCallback(
        (_: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const val = data.value ?? parseFloat(data.displayValue ?? "");

            if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
                return;
            }

            const newColor = color.clone();
            newColor[rgbKey] = val / 255.0; // Convert to 0-1 range
            onChange(newColor);
        },
        [color]
    );

    return (
        <div className={classes.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton className={classes.spinButton} min={0} max={255} value={color[rgbKey] * 255.0} step={1} id={id} onChange={handleChange} name={rgbKey} />
        </div>
    );
};

type InputHsvFieldProps = {
    color: Color3 | Color4;
    label: string;
    hsvKey: HsvKey;
    onChange: (color: Color3 | Color4) => void;
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
    const { color, label, hsvKey, max, scale = 1 } = props;

    const id = useId(`${label.toLowerCase()}-input`);
    const classes = useColorPickerStyles();

    const handleChange = useCallback(
        (_: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const val = data.value ?? parseFloat(data.displayValue ?? "");

            if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
                return;
            }

            // Convert current color to HSV, update the new hsv value, then call onChange prop
            const hsv = rgbaToHsv(color);
            hsv[hsvKey] = val / scale;
            let newColor: Color3 | Color4 = Color3.FromHSV(hsv.h, hsv.s, hsv.v);
            if (color instanceof Color4) {
                newColor = Color4.FromColor3(newColor, color.a ?? 1);
            }
            props.onChange(newColor);
        },
        [color]
    );

    return (
        <div className={classes.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton className={classes.spinButton} min={0} max={max} value={rgbaToHsv(color)[hsvKey] * scale} step={1} id={id} onChange={handleChange} name={hsvKey} />
        </div>
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
    const id = useId("alpha-input");
    const { color } = props;

    const onChange = (_: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
        const value = data.value ?? parseFloat(data.displayValue ?? "");

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
    };

    return (
        <div className={classes.colorFieldWrapper}>
            <div className={classes.row}>
                <Label htmlFor={id}>Alpha</Label>
                {color instanceof Color3 && (
                    <InfoLabel
                        htmlFor={id}
                        info={
                            <>
                                Because this color picker is representing a Color3, we do not permit modifying alpha from the color picker. You can however modify the material's
                                alpha property directly, either in code via material.alpha OR via inspector's transparency section.
                            </>
                        }
                    ></InfoLabel>
                )}
            </div>
            <SpinButton
                disabled={color instanceof Color3}
                min={0}
                max={1}
                className={classes.spinButton}
                value={color instanceof Color3 ? 1 : color.a}
                step={0.01}
                onChange={onChange}
                id={id}
            />
        </div>
    );
};

const NUMBER_REGEX = /^\d+$/;

function rgbaToHsv(color: { r: number; g: number; b: number; a?: number }): { h: number; s: number; v: number; a?: number } {
    const c = new Color3(color.r, color.g, color.b);
    const hsv = c.toHSV();
    return { h: hsv.r, s: hsv.g, v: hsv.b, a: color.a };
}
