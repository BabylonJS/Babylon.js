import type { FunctionComponent } from "react";

import type { ArcRotateCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";
// import { HexPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/hexPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";

export const ArcRotateCameraTransformProperties: FunctionComponent<{ camera: ArcRotateCamera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters(settings);

    const target = useProperty(camera, "target");
    const lowerAlphaLimit = useProperty(camera, "lowerAlphaLimit") ?? 0;
    const upperAlphaLimit = useProperty(camera, "upperAlphaLimit") ?? Math.PI * 2;
    const lowerBetaLimit = useProperty(camera, "lowerBetaLimit") ?? -Math.PI;
    const upperBetaLimit = useProperty(camera, "upperBetaLimit") ?? Math.PI;
    const lowerRadiusLimit = useProperty(camera, "lowerRadiusLimit");
    const upperRadiusLimit = useProperty(camera, "upperRadiusLimit");

    return (
        <>
            <Vector3PropertyLine label="Target" description="The point around which the camera rotates/orbits." value={target} onChange={(value) => (camera.target = value)} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Alpha"
                description={`Horizontal angle in ${useDegrees ? "degrees" : "radians"}`}
                target={camera}
                propertyKey="alpha"
                min={toDisplayAngle(lowerAlphaLimit)}
                max={toDisplayAngle(upperAlphaLimit)}
                step={toDisplayAngle(0.01)}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Beta"
                description={`Vertical angle in ${useDegrees ? "degrees" : "radians"}`}
                target={camera}
                propertyKey="beta"
                min={toDisplayAngle(lowerBetaLimit)}
                max={toDisplayAngle(upperBetaLimit)}
                step={toDisplayAngle(0.01)}
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
            />
            {lowerRadiusLimit != null && upperRadiusLimit != null ? (
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Radius"
                    description="Distance from the target point."
                    target={camera}
                    propertyKey="radius"
                    min={lowerRadiusLimit}
                    max={upperRadiusLimit}
                    step={0.01}
                />
            ) : (
                <BoundProperty
                    component={NumberInputPropertyLine}
                    label="Radius"
                    description="Distance from the target point."
                    target={camera}
                    propertyKey="radius"
                    min={0}
                    step={0.01}
                />
            )}
        </>
    );
};
