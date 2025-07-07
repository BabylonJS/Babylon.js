import type { FunctionComponent, PropsWithChildren } from "react";
import { useState } from "react";
import { SyncedSliderInput } from "../primitives/syncedSlider";
import type { Color3, Color4 } from "core/Maths";
import { ColorPickerPopup } from "../primitives/colorPicker";
import type { BaseComponentProps } from "./propertyLine";
import { makeStyles } from "@fluentui/react-components";

type GradientProps = {
    step: number;
    color: Color3 | Color4;
};

const useGradientStyles = makeStyles({
    container: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
    },
});

/**
 * Gradient component that displays a color picker and slider side by side
 * @param props - Component props containing gradient value and change handlers
 * @returns A React component with color picker and step slider
 */
export const Gradient: FunctionComponent<PropsWithChildren<BaseComponentProps<GradientProps>>> = (props) => {
    const [gradient, setGradient] = useState(props.value);
    const classes = useGradientStyles();

    const colorChange = (color: Color3 | Color4) => {
        const newGradient = { ...gradient, color };
        setGradient(newGradient);
        props.onChange(newGradient);
    };
    const valueChange = (step: number) => {
        const newGradient = { ...gradient, step };
        setGradient(newGradient);
        props.onChange(newGradient);
    };
    return (
        <div id="gradientContainer" className={classes.container}>
            <ColorPickerPopup value={gradient.color} onChange={colorChange} />
            <SyncedSliderInput min={0} max={1} step={0.1} value={gradient.step} onChange={valueChange} />
        </div>
    );
};
