import type { FunctionComponent } from "react";

import type { FreeCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { QuaternionPropertyLine, RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

export const FreeCameraTransformProperties: FunctionComponent<{ camera: FreeCamera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    const position = useProperty(camera, "position");
    const rotation = useProperty(camera, "rotation");
    const quatRotation = useProperty(camera, "rotationQuaternion");

    return (
        <>
            <Vector3PropertyLine label="Position" value={position} onChange={(value) => (camera.position = value)} />
            {quatRotation ? (
                <QuaternionPropertyLine
                    key="QuaternionRotationTransform"
                    label="Rotation (Quat)"
                    value={quatRotation}
                    onChange={(val) => (camera.rotationQuaternion = val)}
                    useDegrees={useDegrees}
                />
            ) : (
                <RotationVectorPropertyLine key="RotationTransform" label="Rotation" value={rotation} onChange={(val) => (camera.rotation = val)} useDegrees={useDegrees} />
            )}
        </>
    );
};

export const FreeCameraControlProperties: FunctionComponent<{ camera: FreeCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Angular Sensitivity " target={camera} propertyKey="angularSensibility" />
        </>
    );
};

export const FreeCameraCollisionProperties: FunctionComponent<{ camera: FreeCamera }> = (props) => {
    const { camera } = props;

    const ellipsoid = useProperty(camera, "ellipsoid");
    const ellipsoidOffset = useProperty(camera, "ellipsoidOffset");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" target={camera} propertyKey="checkCollisions" />
            <Vector3PropertyLine label="Ellipsoid" value={ellipsoid} onChange={(val) => (camera.ellipsoid = val)} />
            <Vector3PropertyLine label="Ellipsoid Offset" value={ellipsoidOffset} onChange={(val) => (camera.ellipsoidOffset = val)} />
        </>
    );
};
