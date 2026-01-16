import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";
import { useEffect, useState } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";

import { SyncedSliderInput } from "./syncedSlider";
import { Color3, Color4 } from "core/Maths/math.color";
import { ColorPickerPopup } from "./colorPicker";
import { Color3Gradient, ColorGradient as Color4Gradient, FactorGradient } from "core/Misc/gradients";
import { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";

const useGradientStyles = makeStyles({
    container: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS, // Reduced gap
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
    },
    // Wrapper for factor spin buttons - fixed width, doesn't grow
    valueWrapper: {
        flex: "0 0 auto", // Fixed size, no grow, no shrink
    },
    // Wrapper for color pickers - fixed size since they're just swatches
    colorWrapper: {
        flex: "0 0 auto",
        alignContent: "center",
    },
    // Wrapper for the step slider - takes remaining space and can shrink
    stepSliderWrapper: {
        flex: "1 1 0", // Grow to fill available space
        minWidth: "100px", // Minimum to fit slider + spinbutton
    },
});

type GradientProps<T extends number | Color3 | Color4> = {
    value1: T;
    value2?: T;
    step: number;
};

/**
 * Gradient component that displays 1 or 2 color or number inputs next to a slider
 * @param props - Component props containing gradient value and change handlers
 * @returns A React component
 */
const Gradient: FunctionComponent<PrimitiveProps<GradientProps<number | Color3 | Color4>>> = (props) => {
    Gradient.displayName = "Gradient";
    const [gradient, setGradient] = useState(props.value);
    const classes = useGradientStyles();

    useEffect(() => {
        setGradient(props.value); // Re-render if props.value changes
    }, [props.value]);

    const gradientChange = (newGradient: GradientProps<number | Color3 | Color4>) => {
        setGradient(newGradient);
        props.onChange(newGradient);
    };
    // Only use compact mode when there are numeric values (spinbuttons) taking up space
    const hasNumericValues =
        !(gradient.value1 instanceof Color3 || gradient.value1 instanceof Color4) ||
        (gradient.value2 !== undefined && !(gradient.value2 instanceof Color3 || gradient.value2 instanceof Color4));

    return (
        <div id="gradientContainer" className={classes.container}>
            <div className={gradient.value1 instanceof Color3 || gradient.value1 instanceof Color4 ? classes.colorWrapper : classes.valueWrapper}>
                {gradient.value1 instanceof Color3 || gradient.value1 instanceof Color4 ? (
                    <ColorPickerPopup value={gradient.value1} onChange={(color) => gradientChange({ ...gradient, value1: color })} />
                ) : (
                    <SyncedSliderInput step={0.01} value={gradient.value1} onChange={(val) => gradientChange({ ...gradient, value1: val })} compact />
                )}
            </div>
            {gradient.value2 !== undefined && (
                <div className={gradient.value2 instanceof Color3 || gradient.value2 instanceof Color4 ? classes.colorWrapper : classes.valueWrapper}>
                    {gradient.value2 instanceof Color3 || gradient.value2 instanceof Color4 ? (
                        <ColorPickerPopup value={gradient.value2} onChange={(color) => gradientChange({ ...gradient, value2: color })} />
                    ) : (
                        <SyncedSliderInput step={0.01} value={gradient.value2} onChange={(val) => gradientChange({ ...gradient, value2: val })} compact />
                    )}
                </div>
            )}

            <div className={classes.stepSliderWrapper}>
                <SyncedSliderInput
                    notifyOnlyOnRelease={true}
                    min={0}
                    max={1}
                    step={0.01}
                    value={gradient.step}
                    onChange={(val) => gradientChange({ ...gradient, step: val })}
                    compact={hasNumericValues}
                    growSlider={!hasNumericValues}
                />
            </div>
        </div>
    );
};

const FactorGradientCast = Gradient as FunctionComponent<PrimitiveProps<GradientProps<number>>>;
const Color3GradientCast = Gradient as FunctionComponent<PrimitiveProps<GradientProps<Color3>>>;
const Color4GradientCast = Gradient as FunctionComponent<PrimitiveProps<GradientProps<Color4>>>;

/**
 * Component wrapper for FactorGradient that provides slider inputs for factor1, factor2, and gradient step
 * @param props - Component props containing FactorGradient value and change handler
 * @returns A React component
 */
export const FactorGradientComponent: FunctionComponent<PrimitiveProps<FactorGradient>> = (props) => {
    return (
        <FactorGradientCast
            {...props}
            value={{ value1: props.value.factor1, value2: props.value.factor2, step: props.value.gradient }}
            onChange={(gradient) => props.onChange(new FactorGradient(gradient.step, gradient.value1, gradient.value2))}
        />
    );
};
/**
 * Component wrapper for Color3Gradient that provides color picker and gradient step slider
 * @param props - Component props containing Color3Gradient value and change handler
 * @returns A React component
 */
export const Color3GradientComponent: FunctionComponent<PrimitiveProps<Color3Gradient>> = (props) => {
    return (
        <Color3GradientCast
            {...props}
            value={{ value1: props.value.color, step: props.value.gradient }}
            onChange={(gradient) => props.onChange(new Color3Gradient(gradient.step, gradient.value1))}
        />
    );
};
/**
 * Component wrapper for Color4Gradient that provides color pickers for color1, color2, and gradient step slider
 * @param props - Component props containing Color4Gradient value and change handler
 * @returns A React component
 */
export const Color4GradientComponent: FunctionComponent<PrimitiveProps<Color4Gradient>> = (props) => {
    return (
        <Color4GradientCast
            {...props}
            value={{ value1: props.value.color1, value2: props.value.color2, step: props.value.gradient }}
            onChange={(gradient) => props.onChange(new Color4Gradient(gradient.step, gradient.value1, gradient.value2))}
        />
    );
};
/**
 * Component wrapper for GradientBlockColorStep that provides color picker and step slider
 * @param props - Component props containing GradientBlockColorStep value and change handler
 * @returns A React component
 */
export const ColorStepGradientComponent: FunctionComponent<PrimitiveProps<GradientBlockColorStep>> = (props) => {
    return (
        <Color3GradientCast
            {...props}
            value={{ value1: props.value.color, step: props.value.step }}
            onChange={(gradient) => props.onChange(new GradientBlockColorStep(gradient.step, gradient.value1))}
        />
    );
};
