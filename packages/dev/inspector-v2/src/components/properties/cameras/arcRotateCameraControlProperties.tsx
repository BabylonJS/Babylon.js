import type { FunctionComponent } from "react";

import type { ArcRotateCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "../boundProperty";

export const ArcRotateCameraControlProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Angular Sensitivity X" target={camera} propertyKey="angularSensibilityX" />
            <BoundProperty component={NumberInputPropertyLine} label="Angular Sensitivity Y" target={camera} propertyKey="angularSensibilityY" />
            <BoundProperty component={NumberInputPropertyLine} label="Panning Sensitivity" target={camera} propertyKey="panningSensibility" />
            <BoundProperty component={NumberInputPropertyLine} label="Pinch Delta Percentage" target={camera} propertyKey="pinchDeltaPercentage" />
            <BoundProperty component={NumberInputPropertyLine} label="Wheel Delta Percentage" target={camera} propertyKey="wheelDeltaPercentage" />
            <BoundProperty component={NumberInputPropertyLine} label="Speed" target={camera} propertyKey="speed" />
            <BoundProperty component={SwitchPropertyLine} label="Use Natural Pinch Zoom" target={camera} propertyKey="useNaturalPinchZoom" />
        </>
    );
};
