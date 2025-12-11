/* eslint-disable babylonjs/available */
import type { FunctionComponent } from "react";
import { useState } from "react";

import { makeStyles, tokens, Label, Slider } from "@fluentui/react-components";

import type { IToolData, IToolParameters, IToolType, IToolGUIProps } from "../textureEditor";

import { CircleHalfFillRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    settingsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
        minWidth: "150px",
    },
    sliderRow: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
});

class ContrastTool implements IToolType {
    getParameters: () => IToolParameters;
    contrast: number = 0;
    exposure: number = 0;

    constructor(getParameters: () => IToolParameters) {
        this.getParameters = getParameters;
    }

    setExposure(exposure: number) {
        this.exposure = exposure;
        const { scene3D, updateTexture } = this.getParameters();
        scene3D.imageProcessingConfiguration.isEnabled = true;
        scene3D.imageProcessingConfiguration.exposure = this.computeExposure(this.exposure);
        updateTexture();
    }

    setContrast(contrast: number) {
        this.contrast = contrast;
        const { scene3D, updateTexture } = this.getParameters();
        scene3D.imageProcessingConfiguration.isEnabled = true;
        scene3D.imageProcessingConfiguration.contrast = this.computeContrast(contrast);
        updateTexture();
    }

    /**
     * Maps slider values to post processing values using an exponential regression
     * @param sliderValue - The slider value
     * @returns exposure value
     */
    computeExposure(sliderValue: number) {
        if (sliderValue <= 0) {
            return 1 - -sliderValue / 100;
        } else {
            return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
        }
    }

    /**
     * Maps slider values to post processing values using an exponential regression
     * @param sliderValue - The slider value
     * @returns contrast value
     */
    computeContrast(sliderValue: number) {
        if (sliderValue <= 0) {
            return 1 - -sliderValue / 100;
        } else {
            return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
        }
    }

    setup() {
        this.contrast = 0;
        this.exposure = 0;
        this.setExposure(this.exposure);
        this.setContrast(this.contrast);
    }

    cleanup() {
        // No cleanup needed
    }

    onReset() {
        this.setExposure(0);
        this.setContrast(0);
    }
}

/**
 * Settings component for the contrast/exposure tool
 * @param props - The tool GUI props
 * @returns The settings component
 */
const Settings: FunctionComponent<IToolGUIProps> = (props) => {
    const instance = props.instance as ContrastTool;
    const classes = useStyles();
    const [contrast, setContrast] = useState(instance.contrast);
    const [exposure, setExposure] = useState(instance.exposure);

    const handleContrastChange = (_: unknown, data: { value: number }) => {
        instance.setContrast(data.value);
        setContrast(data.value);
    };

    const handleExposureChange = (_: unknown, data: { value: number }) => {
        instance.setExposure(data.value);
        setExposure(data.value);
    };

    return (
        <div className={classes.settingsContainer}>
            <div className={classes.sliderRow}>
                <Label>Contrast: {contrast}</Label>
                <Slider min={-100} max={100} value={contrast} onChange={handleContrastChange} />
            </div>
            <div className={classes.sliderRow}>
                <Label>Exposure: {exposure}</Label>
                <Slider min={-100} max={100} value={exposure} onChange={handleExposureChange} />
            </div>
        </div>
    );
};

/**
 * Contrast/Exposure adjustment tool
 */
export const Contrast: IToolData = {
    name: "Contrast/Exposure",
    type: ContrastTool,
    is3D: true,
    settingsComponent: Settings,
    icon: () => <CircleHalfFillRegular />,
};
