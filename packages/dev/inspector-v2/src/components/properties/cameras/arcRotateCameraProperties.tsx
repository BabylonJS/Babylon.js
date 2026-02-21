import type { FunctionComponent } from "react";

import type { ArcRotateCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const ArcRotateCameraTransformProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    const lowerAlphaLimit = useProperty(camera, "lowerAlphaLimit") ?? 0;
    const upperAlphaLimit = useProperty(camera, "upperAlphaLimit") ?? Math.PI * 2;
    const lowerBetaLimit = useProperty(camera, "lowerBetaLimit") ?? -Math.PI;
    const upperBetaLimit = useProperty(camera, "upperBetaLimit") ?? Math.PI;
    const lowerRadiusLimit = useProperty(camera, "lowerRadiusLimit");
    const upperRadiusLimit = useProperty(camera, "upperRadiusLimit");

    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Alpha"
                description={`Horizontal angle in ${useDegrees ? "degrees" : "radians"}`}
                target={camera}
                propertyKey="alpha"
                min={toDisplayAngle(lowerAlphaLimit)}
                max={toDisplayAngle(upperAlphaLimit)}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Beta"
                description={`Vertical angle in ${useDegrees ? "degrees" : "radians"}`}
                target={camera}
                propertyKey="beta"
                min={toDisplayAngle(lowerBetaLimit)}
                max={toDisplayAngle(upperBetaLimit)}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={(value) => toDisplayAngle(value, true)}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Radius"
                description="Distance from the target point."
                target={camera}
                propertyKey="radius"
                min={lowerRadiusLimit ?? undefined}
                max={upperRadiusLimit ?? undefined}
                step={0.01}
            />
        </>
    );
};

export const ArcRotateCameraControlProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Angular Sensitivity X" target={camera} propertyKey="angularSensibilityX" />
            <BoundProperty component={NumberInputPropertyLine} label="Angular Sensitivity Y" target={camera} propertyKey="angularSensibilityY" />
            <BoundProperty component={NumberInputPropertyLine} label="Panning Sensitivity" target={camera} propertyKey="panningSensibility" />
            <BoundProperty component={NumberInputPropertyLine} label="Pinch Delta Percentage" target={camera} propertyKey="pinchDeltaPercentage" />
            <BoundProperty component={NumberInputPropertyLine} label="Wheel Delta Percentage" target={camera} propertyKey="wheelDeltaPercentage" />
            <BoundProperty component={SwitchPropertyLine} label="Use Natural Pinch Zoom" target={camera} propertyKey="useNaturalPinchZoom" />
        </>
    );
};

export const ArcRotateCameraCollisionProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" target={camera} propertyKey="checkCollisions" />
            <BoundProperty component={Vector3PropertyLine} label="Collision Radius" target={camera} propertyKey="collisionRadius" />
        </>
    );
};

export const ArcRotateCameraLimitsProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    const minAlphaLimit = 0;
    const maxAlphaLimit = Math.PI * 2;
    const minBetaLimit = -Math.PI;
    const maxBetaLimit = Math.PI;

    const lowerAlphaLimit = useProperty(camera, "lowerAlphaLimit") ?? minAlphaLimit;
    const upperAlphaLimit = useProperty(camera, "upperAlphaLimit") ?? maxAlphaLimit;
    const lowerBetaLimit = useProperty(camera, "lowerBetaLimit") ?? minBetaLimit;
    const upperBetaLimit = useProperty(camera, "upperBetaLimit") ?? maxBetaLimit;
    const lowerRadiusLimit = useProperty(camera, "lowerRadiusLimit");
    const upperRadiusLimit = useProperty(camera, "upperRadiusLimit");

    // TODO-Iv2: Update defaultValues
    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Lower Alpha Limit"
                target={camera}
                propertyKey="lowerAlphaLimit"
                nullable
                defaultValue={toDisplayAngle(minAlphaLimit)}
                min={toDisplayAngle(minAlphaLimit)}
                max={toDisplayAngle(upperAlphaLimit)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={(value) => (value === null ? value : toDisplayAngle(value, true))}
                convertFrom={(value) => (value === null ? value : fromDisplayAngle(value))}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Upper Alpha Limit"
                target={camera}
                propertyKey="upperAlphaLimit"
                nullable
                defaultValue={toDisplayAngle(maxAlphaLimit)}
                min={toDisplayAngle(lowerAlphaLimit)}
                max={toDisplayAngle(maxAlphaLimit)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={(value) => (value === null ? value : toDisplayAngle(value, true))}
                convertFrom={(value) => (value === null ? value : fromDisplayAngle(value))}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Lower Beta Limit"
                target={camera}
                propertyKey="lowerBetaLimit"
                nullable
                defaultValue={toDisplayAngle(minBetaLimit)}
                min={toDisplayAngle(minBetaLimit)}
                max={toDisplayAngle(upperBetaLimit)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={(value) => (value === null ? value : toDisplayAngle(value, true))}
                convertFrom={(value) => (value === null ? value : fromDisplayAngle(value))}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Upper Beta Limit"
                target={camera}
                propertyKey="upperBetaLimit"
                nullable
                defaultValue={toDisplayAngle(maxBetaLimit)}
                min={toDisplayAngle(lowerBetaLimit)}
                max={toDisplayAngle(maxBetaLimit)}
                unit={useDegrees ? "°" : "rad"}
                convertTo={(value) => (value === null ? value : toDisplayAngle(value, true))}
                convertFrom={(value) => (value === null ? value : fromDisplayAngle(value))}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Lower Radius Limit"
                target={camera}
                propertyKey="lowerRadiusLimit"
                nullable
                defaultValue={0}
                min={0}
                max={upperRadiusLimit ?? undefined}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Upper Radius Limit"
                target={camera}
                propertyKey="upperRadiusLimit"
                nullable
                defaultValue={100}
                min={lowerRadiusLimit ?? undefined}
            />
            <BoundProperty component={NumberInputPropertyLine} label="Lower Target Y Limit" target={camera} propertyKey="lowerTargetYLimit" />
        </>
    );
};

export const ArcRotateCameraBehaviorsProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Auto Rotation" target={camera} propertyKey="useAutoRotationBehavior" />
            <BoundProperty component={SwitchPropertyLine} label="Bouncing" target={camera} propertyKey="useBouncingBehavior" />
            <BoundProperty component={SwitchPropertyLine} label="Framing" target={camera} propertyKey="useFramingBehavior" />
        </>
    );
};
