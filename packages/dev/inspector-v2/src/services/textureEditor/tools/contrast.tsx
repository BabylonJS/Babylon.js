import type { TextureEditorToolProvider } from "../../../components/textureEditor/textureEditor";

import { Label, makeStyles, Slider, tokens } from "@fluentui/react-components";
import { CircleHalfFillRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { useCallback } from "react";
import { useObservableState } from "../../../hooks/observableHooks";

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
    icon: {
        rotate: "-90deg",
    },
});

export const Contrast: TextureEditorToolProvider = {
    name: "Contrast/Exposure",
    order: 500,
    icon: () => {
        const classes = useStyles();
        return <CircleHalfFillRegular className={classes.icon} />;
    },
    is3D: true,
    getTool: (context) => {
        let _contrast = 0;
        let _exposure = 0;
        const stateChangedObservable = new Observable<void>();

        /**
         * Maps slider values to post processing values using an exponential regression
         * @param sliderValue - The slider value
         * @returns exposure value
         */
        function computeExposure(sliderValue: number) {
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
        function computeContrast(sliderValue: number) {
            if (sliderValue <= 0) {
                return 1 - -sliderValue / 100;
            } else {
                return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
            }
        }

        function setExposure(exposure: number) {
            _exposure = exposure;
            stateChangedObservable.notifyObservers();
            const { scene3D, updateTexture } = context.getParameters();
            scene3D.imageProcessingConfiguration.isEnabled = true;
            scene3D.imageProcessingConfiguration.exposure = computeExposure(_exposure);
            updateTexture();
        }

        function setContrast(contrast: number) {
            _contrast = contrast;
            stateChangedObservable.notifyObservers();
            const { scene3D, updateTexture } = context.getParameters();
            scene3D.imageProcessingConfiguration.isEnabled = true;
            scene3D.imageProcessingConfiguration.contrast = computeContrast(_contrast);
            updateTexture();
        }

        return {
            activate: () => {
                _contrast = 0;
                _exposure = 0;
                setExposure(_exposure);
                setContrast(_contrast);
            },
            deactivate: () => {
                // No cleanup needed
            },
            reset: () => {
                setExposure(0);
                setContrast(0);
            },
            settingsComponent: () => {
                const classes = useStyles();
                const [contrast, exposure] = useObservableState(
                    useCallback(() => [_contrast, _exposure] as const, []),
                    stateChangedObservable
                );

                const handleContrastChange = (_: unknown, data: { value: number }) => {
                    setContrast(data.value);
                };

                const handleExposureChange = (_: unknown, data: { value: number }) => {
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
            },
        };
    },
};
