/* eslint-disable jsdoc/require-returns */
/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import { ColorPicker, ColorSlider, ColorArea, AlphaSlider, InfoLabel, Link, makeStyles, Popover, PopoverSurface, PopoverTrigger, tokens } from "@fluentui/react-components";
import type { ColorPickerProps as FluentColorPickerProps } from "@fluentui/react-components";

import { Input, type InputProps, Label, SpinButton, type SpinButtonChangeEvent, type SpinButtonOnChangeData, type SpinButtonProps, useId } from "@fluentui/react-components";
import { Color3, Color4 } from "core/Maths";
import type { BaseComponentProps } from "../hoc/propertyLine";

export type ColorPickerProps<C extends Color3 | Color4> = {
    linearHint?: boolean;
} & BaseComponentProps<C>;

const useColorPickerStyles = makeStyles({
    colorPickerContainer: {
        width: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflow: "visible",
    },
    triggerColor: {
        width: "50px",
        height: tokens.lineHeightBase100,
        borderRadius: tokens.borderRadiusSmall,
        border: "1px solid #ccc",
        "@media (forced-colors: active)": {
            forcedColorAdjust: "none",
        },
    },
    previewColor: {
        width: "50px",
        height: "50px",
        borderRadius: tokens.borderRadiusSmall,
        border: "1px solid #ccc",
        "@media (forced-colors: active)": {
            forcedColorAdjust: "none",
        },
    },
    inputFields: {
        display: "flex",
        alignItems: "flex-end",
        flexDirection: "row",
        gap: "10px",
    },
    colorFieldWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
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
        gap: "16px",
    },
    row: {
        display: "flex",
        flexDirection: "row",
        gap: "12px",
        alignItems: "center",
    },
});

export const ColorPickerPopup = (props: ColorPickerProps<Color3 | Color4>) => {
    const hexId = useId("hex-input");
    const alphaId = useId("alpha-input");

    const classes = useColorPickerStyles();
    const [color, setColor] = React.useState(props.value);

    const [popoverOpen, setPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        props.onChange(color);
    }, [color]);

    const handleChange: FluentColorPickerProps["onColorChange"] = (_, data) => {
        let color: Color3 | Color4 = Color3.FromHSV(data.color.h, data.color.s, data.color.v);
        if (props.value instanceof Color4) {
            color = Color4.FromColor3(color, data.color.a ?? 1);
        }
        setColor(color);
    };

    const onRgbChange: InputRgbFieldProps["onChange"] = (_, data) => {
        if (data.value) {
            const newColor = color.clone();
            newColor[data.rgbKey] = data.value;
            setColor(newColor);
        }
    };

    const onHsvChange: InputHsvFieldProps["onChange"] = (_, data) => {
        if (data.value) {
            // Convert current color to HSV, update the new hsv value, then update state
            const hsv = rgbaToHsv(color);
            hsv[data.hsvKey] = data.value;
            let newColor: Color3 | Color4 = Color3.FromHSV(hsv.h, hsv.s, hsv.v);
            if (color instanceof Color4) {
                newColor = Color4.FromColor3(newColor, color.a ?? 1);
            }
            setColor(newColor);
        }
    };

    const onAlphaChange = React.useCallback(
        (_ev: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const value = data.value ?? parseFloat(data.displayValue ?? "");

            if (Number.isNaN(value) || value < 0 || value > 1) {
                return;
            }

            let newColor = color;
            if (props.value instanceof Color4) {
                newColor = Color4.FromColor3(color, value ?? 1);
            }
            setColor(newColor);
        },
        [setColor, color]
    );

    const renderGammaLinearInfo = () => {
        return (
            <InfoLabel
                info={
                    <>
                        This color picker is attached to a material whose color is stored in linear space (ex: PBR Material), and Babylon converts the color to gamma space before
                        rendering on screen because the human eye is best at processing colors in gamma space. We thus also want to display the color picker in gamma space so that
                        the color chosen here will match the color seen in your material.
                        <br />
                        If you want to copy/paste the HEX into your code, you can either use
                        <span style={{ fontWeight: "bold" }}>Color3.FromHexString(LINEAR_HEX)</span>
                        <br />
                        or
                        <br />
                        <span style={{ fontWeight: "bold" }}>Color3.FromHexString(GAMMA_HEX).toLinearSpace()</span>
                        <br />
                        Both will send the linear value to the PBR material, and the conversion to gamma will occur within Babylon engine.
                        <br />
                        <Link href="https://doc.babylonjs.com/preparingArtForBabylon/controllingColorSpace/"> Read more in our docs! </Link>
                    </>
                }
            >
                <span style={{ fontWeight: "bold" }}> NOTE: The attached material expects color inputs in linear space </span>
            </InfoLabel>
        );
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
                <div className={classes.triggerColor} style={{ backgroundColor: color.toHexString() }} />
            </PopoverTrigger>

            <PopoverSurface>
                <div className={classes.colorPickerContainer}>
                    <ColorPicker color={rgbaToHsv(color)} onColorChange={handleChange}>
                        <ColorArea inputX={{ "aria-label": "Saturation" }} inputY={{ "aria-label": "Brightness" }} />
                        <ColorSlider aria-label="Hue" />
                        {color instanceof Color4 && <AlphaSlider aria-label="Alpha" />}
                    </ColorPicker>
                    <div className={classes.container}>
                        {/* Top Row: Preview, Gamma Hex, Linear Hex */}
                        <div className={classes.row}>
                            <div className={classes.previewColor} style={{ backgroundColor: color.toHexString() }} />
                            <InputHexField
                                label={"Gamma Hex"}
                                id={hexId}
                                color={color}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    HEX_COLOR_REGEX.test(value) && setColor(Color3.FromHexString(value));
                                }}
                            />

                            <InputHexField
                                label={"Linear Hex"}
                                id={hexId}
                                disabled={!props.linearHint}
                                isLinear={true}
                                color={color}
                                onChange={(e) => {
                                    // If linearHint (aka PBR material, ensure the other values are displayed in gamma even if linear hex changes)
                                    const value = e.target.value;
                                    HEX_COLOR_REGEX.test(value) && setColor(Color3.FromHexString(value).toGammaSpace());
                                }}
                            />
                            {props.linearHint && renderGammaLinearInfo()}
                        </div>

                        {/* Middle Row: Red, Green, Blue, Alpha */}
                        <div className={classes.row}>
                            <InputRgbField label="Red" color={color} rgbKey="r" onChange={onRgbChange} />
                            <InputRgbField label="Green" color={color} rgbKey="g" onChange={onRgbChange} />
                            <InputRgbField label="Blue" color={color} rgbKey="b" onChange={onRgbChange} />
                            <InputAlphaField id={alphaId} color={color} onChange={onAlphaChange} />
                        </div>

                        {/* Bottom Row: Hue, Saturation, Value */}
                        <div className={classes.row}>
                            <InputHsvField label="Hue" color={color} hsvKey="h" max={360} onChange={onHsvChange} />
                            <InputHsvField label="Saturation" color={color} hsvKey="s" max={100} scale={100} onChange={onHsvChange} />
                            <InputHsvField label="Value" color={color} hsvKey="v" max={100} scale={100} onChange={onHsvChange} />
                        </div>
                    </div>
                </div>
            </PopoverSurface>
        </Popover>
    );
};

interface InputHexProps {
    label?: string;
    id: string;
    color: Color3 | Color4;
    onChange: InputProps["onChange"];
    isLinear?: boolean;
    disabled?: boolean;
}
const InputHexField = ({ label = "Hex", id, color, onChange, isLinear = false, disabled = false }: InputHexProps) => {
    const styles = useColorPickerStyles();
    return (
        <div className={styles.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <Input disabled={disabled} className={styles.input} value={isLinear ? color.toLinearSpace().toHexString() : color.toHexString()} id={id} onChange={onChange} />
        </div>
    );
};

interface InputRgbFieldProps {
    color: Color3 | Color4;
    label: string;
    rgbKey: RgbKey;
    onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData & { rgbKey: RgbKey }) => void;
}

const InputRgbField = ({ color, onChange, label, rgbKey }: InputRgbFieldProps) => {
    const id = useId(`${label.toLowerCase()}-input`);
    const classes = useColorPickerStyles();

    const handleChange = React.useCallback(
        (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const val = data.value ?? parseFloat(data.displayValue ?? "");

            if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
                return;
            }

            if (onChange) {
                onChange(event, { ...data, value: val / 255.0, rgbKey });
            }
        },
        [rgbKey, onChange, color]
    );

    return (
        <div className={classes.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton className={classes.spinButton} min={0} max={255} value={color[rgbKey] * 255.0} step={1} id={id} onChange={handleChange} name={rgbKey} />
        </div>
    );
};

interface InputHsvFieldProps {
    color: Color3 | Color4;
    label: string;
    hsvKey: HsvKey;
    max: number;
    scale?: number;
    onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData & { hsvKey: HsvKey }) => void;
}

/**
 * In the HSV (Hue, Saturation, Value) color model, Hue (H) ranges from 0 to 360 degrees, representing the color's position on the color wheel.
 * Saturation (S) ranges from 0 to 100%, indicating the intensity or purity of the color, with 0 being shades of gray and 100 being a fully saturated color.
 * Value (V) ranges from 0 to 100%, representing the brightness of the color, with 0 being black and 100 being the brightest.
 */
export const InputHsvField = ({ color, onChange, label, hsvKey, max, scale = 1 }: InputHsvFieldProps) => {
    const id = useId(`${label.toLowerCase()}-input`);
    const classes = useColorPickerStyles();

    const handleChange = React.useCallback(
        (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            const val = data.value ?? parseFloat(data.displayValue ?? "");

            if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
                return;
            }

            if (onChange) {
                onChange(event, { ...data, value: val / scale, hsvKey });
            }
        },
        [hsvKey, onChange, color]
    );

    return (
        <div className={classes.colorFieldWrapper}>
            <Label htmlFor={id}>{label}</Label>
            <SpinButton className={classes.spinButton} min={0} max={max} value={rgbaToHsv(color)[hsvKey] * scale} step={1} id={id} onChange={handleChange} name={hsvKey} />
        </div>
    );
};

interface InputAlphaProps {
    color: Color3 | Color4;
    label?: string;
    onChange?: SpinButtonProps["onChange"];
    id: string;
}

const InputAlphaField = ({ label = "Alpha", color, onChange, id }: InputAlphaProps) => {
    const classes = useColorPickerStyles();

    return (
        <div className={classes.colorFieldWrapper}>
            <div className={classes.row}>
                <Label htmlFor={id}>{label}</Label>
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

const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{0,6})$/;
const NUMBER_REGEX = /^\d+$/;

type RgbKey = "r" | "g" | "b";
type HsvKey = "h" | "s" | "v";

// Can optimize the above code by using a more generic approach, come back to this later
// interface InputFieldProps {
//     val: number;
//     label: string;
//     key: string;
//     scale?: number;
//     max?: number;
//     onChange?: (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData & { key: string }) => void;
// }
// const InputField = ({ val, onChange, label, key,scale=1 }: InputFieldProps) => {
//     const id = useId(`${label.toLowerCase()}-input`);
//     const styles = useStyles();

//     const handleChange = React.useCallback(
//         (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
//             const val = data.value ?? parseFloat(data.displayValue ?? "");

//             if (val === null || Number.isNaN(val) || !NUMBER_REGEX.test(val.toString())) {
//                 return;
//             }

//             if (onChange) {
//                 onChange(event, { ...data, value: val / scale, key });
//             }
//         },
//         [key, onChange, color]
//     );

//     return (
//         <div className={styles.colorFieldWrapper}>
//             <Label htmlFor={id}>{label}</Label>
//             <SpinButton className={styles.spinButton} min={0} max={255} value={color[key] * scale} step={1} id={id} onChange={handleChange} name={key} />
//         </div>
//     );
// };

function rgbaToHsv(color: { r: number; g: number; b: number; a?: number }): { h: number; s: number; v: number; a?: number } {
    const c = new Color3(color.r, color.g, color.b);
    const hsv = c.toHSV();
    return { h: hsv.r, s: hsv.g, v: hsv.b, a: color.a };
}
