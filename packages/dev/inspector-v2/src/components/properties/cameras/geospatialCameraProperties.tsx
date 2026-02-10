import type { FunctionComponent } from "react";

import type { GeospatialCamera } from "core/Cameras/geospatialCamera";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const GeospatialCameraTransformProperties: FunctionComponent<{ camera: GeospatialCamera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters(settings);

    const limits = useProperty(camera, "limits");
    const yawMin = limits?.yawMin ?? -Math.PI;
    const yawMax = limits?.yawMax ?? Math.PI;
    const pitchMin = limits?.pitchMin ?? 0;
    const pitchMax = limits?.pitchMax ?? Math.PI / 2;
    const radiusMin = limits?.radiusMin ?? 0;
    const radiusMax = limits?.radiusMax ?? Infinity;

    return (
        <>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Yaw"
                description={`Horizontal rotation in ${useDegrees ? "degrees" : "radians"} (0 = north)`}
                target={camera}
                propertyKey="yaw"
                min={toDisplayAngle(yawMin)}
                max={toDisplayAngle(yawMax)}
                step={toDisplayAngle(0.01)}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Pitch"
                description={`Vertical angle in ${useDegrees ? "degrees" : "radians"} (0 = looking down, π/2 = horizon)`}
                target={camera}
                propertyKey="pitch"
                min={toDisplayAngle(pitchMin)}
                max={toDisplayAngle(pitchMax)}
                step={toDisplayAngle(0.01)}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            {radiusMax !== Infinity ? (
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Radius"
                    description="Distance from the center point."
                    target={camera}
                    propertyKey="radius"
                    min={radiusMin}
                    max={radiusMax}
                    step={0.01}
                />
            ) : (
                <BoundProperty
                    component={NumberInputPropertyLine}
                    label="Radius"
                    description="Distance from the center point."
                    target={camera}
                    propertyKey="radius"
                    min={0}
                    step={0.01}
                />
            )}
            <BoundProperty component={Vector3PropertyLine} label="Center" description="The point on the globe the camera orbits around." target={camera} propertyKey="center" />
            <BoundProperty component={Vector3PropertyLine} label="Position" description="The camera's position." target={camera} propertyKey="position" />
        </>
    );
};

export const GeospatialCameraCollisionProperties: FunctionComponent<{ camera: GeospatialCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" target={camera} propertyKey="checkCollisions" />
            <BoundProperty component={Vector3PropertyLine} label="Collision Offset" target={camera} propertyKey="perFrameCollisionOffset" />
        </>
    );
};

export const GeospatialCameraLimitsProperties: FunctionComponent<{ camera: GeospatialCamera }> = (props) => {
    const { camera } = props;

    const limits = useProperty(camera, "limits");

    if (!limits) {
        return null;
    }

    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Pitch Min"
                description="Minimum pitch angle (0 = looking straight down)"
                target={limits}
                propertyKey="pitchMin"
                propertyPath="limits.pitchMin"
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Pitch Max"
                description="Maximum pitch angle (π/2 = horizon)"
                target={limits}
                propertyKey="pitchMax"
                propertyPath="limits.pitchMax"
            />
            <BoundProperty component={NumberInputPropertyLine} label="Yaw Min" description="Minimum yaw angle" target={limits} propertyKey="yawMin" propertyPath="limits.yawMin" />
            <BoundProperty component={NumberInputPropertyLine} label="Yaw Max" description="Maximum yaw angle" target={limits} propertyKey="yawMax" propertyPath="limits.yawMax" />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Radius Min"
                description="Minimum distance from center"
                target={limits}
                propertyKey="radiusMin"
                propertyPath="limits.radiusMin"
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Radius Max"
                description="Maximum distance from center"
                target={limits}
                propertyKey="radiusMax"
                propertyPath="limits.radiusMax"
            />
        </>
    );
};
