import type { FunctionComponent } from "react";
import { useState } from "react";
import { SyncedSliderInput } from "./syncedSlider";
import { Color3, Color4 } from "core/Maths";
import { ColorPickerPopup } from "./colorPicker";
import type { BaseComponentProps } from "../hoc/propertyLine";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Color3Gradient, ColorGradient as Color4Gradient, FactorGradient } from "core/Misc";
import { GradientBlockColorStep } from "core/Materials";

const useGradientStyles = makeStyles({
    container: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
        width: "100%",
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
const Gradient: FunctionComponent<BaseComponentProps<GradientProps<number | Color3 | Color4>>> = (props) => {
    const [gradient, setGradient] = useState(props.value);
    const classes = useGradientStyles();

    const gradientChange = (newGradient: GradientProps<number | Color3 | Color4>) => {
        setGradient(newGradient);
        props.onChange(newGradient);
    };
    return (
        <div id="gradientContainer" className={classes.container}>
            {gradient.value1 instanceof Color3 || gradient.value1 instanceof Color4 ? (
                <ColorPickerPopup value={gradient.value1} onChange={(color) => gradientChange({ ...gradient, value1: color })} />
            ) : (
                <SyncedSliderInput step={0.01} value={gradient.value1} onChange={(val) => gradientChange({ ...gradient, value1: val })} />
            )}
            {gradient.value2 instanceof Color3 || gradient.value2 instanceof Color4 ? (
                <ColorPickerPopup value={gradient.value2} onChange={(color) => gradientChange({ ...gradient, value2: color })} />
            ) : gradient.value2 ? (
                <SyncedSliderInput step={0.01} value={gradient.value2} onChange={(val) => gradientChange({ ...gradient, value2: val })} />
            ) : undefined}
            <SyncedSliderInput min={0} max={1} step={0.01} value={gradient.step} onChange={(val) => gradientChange({ ...gradient, step: val })} />
        </div>
    );
};

const FactorGradientCast = Gradient as FunctionComponent<BaseComponentProps<GradientProps<number>>>;
const Color3GradientCast = Gradient as FunctionComponent<BaseComponentProps<GradientProps<Color3>>>;
const Color4GradientCast = Gradient as FunctionComponent<BaseComponentProps<GradientProps<Color4>>>;

export const FactorGradientComponent: FunctionComponent<BaseComponentProps<FactorGradient>> = (props) => {
    return (
        <FactorGradientCast
            {...props}
            value={{ value1: props.value.factor1, value2: props.value.factor2, step: props.value.gradient }}
            onChange={(gradient) => props.onChange(new FactorGradient(gradient.step, gradient.value1, gradient.value2))}
        />
    );
};
export const Color3GradientComponent: FunctionComponent<BaseComponentProps<Color3Gradient>> = (props) => {
    return (
        <Color3GradientCast
            {...props}
            value={{ value1: props.value.color, step: props.value.gradient }}
            onChange={(gradient) => props.onChange(new Color3Gradient(gradient.step, gradient.value1))}
        />
    );
};
export const Color4GradientComponent: FunctionComponent<BaseComponentProps<Color4Gradient>> = (props) => {
    return (
        <Color4GradientCast
            {...props}
            value={{ value1: props.value.color1, value2: props.value.color2, step: props.value.gradient }}
            onChange={(gradient) => props.onChange(new Color4Gradient(gradient.step, gradient.value1, gradient.value2))}
        />
    );
};
export const ColorStepGradientComponent: FunctionComponent<BaseComponentProps<GradientBlockColorStep>> = (props) => {
    return (
        <Color3GradientCast
            {...props}
            value={{ value1: props.value.color, step: props.value.step }}
            onChange={(gradient) => props.onChange(new GradientBlockColorStep(gradient.step, gradient.value1))}
        />
    );
};
