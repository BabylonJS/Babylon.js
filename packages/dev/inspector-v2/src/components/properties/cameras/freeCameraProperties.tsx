import type { FunctionComponent } from "react";

import type { FreeCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { QuaternionPropertyLine, RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useSetting } from "../../../hooks/settingsHooks";
import { UseDegreesSettingDescriptor, UseEulerSettingDescriptor } from "../../../services/globalSettings";
import { BoundProperty, Property } from "../boundProperty";

export const FreeCameraTransformProperties: FunctionComponent<{ camera: FreeCamera }> = (props) => {
    const { camera } = props;

    const [useDegrees] = useSetting(UseDegreesSettingDescriptor);
    const [useEuler] = useSetting(UseEulerSettingDescriptor);

    const quatRotation = useProperty(camera, "rotationQuaternion");

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Position" target={camera} propertyKey="position" />
            {quatRotation ? (
                <Property
                    component={QuaternionPropertyLine}
                    propertyPath="rotationQuaternion"
                    label="Rotation Quaternion"
                    value={quatRotation}
                    onChange={(val) => (camera.rotationQuaternion = val)}
                    useDegrees={useDegrees}
                    useEuler={useEuler}
                />
            ) : (
                <BoundProperty component={RotationVectorPropertyLine} label="Rotation" target={camera} propertyKey="rotation" useDegrees={useDegrees} />
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

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" target={camera} propertyKey="checkCollisions" />
            <BoundProperty component={SwitchPropertyLine} label="Apply Gravity" target={camera} propertyKey="applyGravity" />
            <BoundProperty component={Vector3PropertyLine} label="Ellipsoid" target={camera} propertyKey="ellipsoid" />
            <BoundProperty component={Vector3PropertyLine} label="Ellipsoid Offset" target={camera} propertyKey="ellipsoidOffset" />
        </>
    );
};
