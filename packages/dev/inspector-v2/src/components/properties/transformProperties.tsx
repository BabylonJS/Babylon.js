import type { FunctionComponent } from "react";

import type { Nullable, Quaternion, Vector3 } from "core/index";

import { QuaternionPropertyLine, RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useQuaternionProperty } from "../../hooks/compoundPropertyHooks";
import { useSetting } from "../../hooks/settingsHooks";
import { UseDegreesSettingDescriptor, UseEulerSettingDescriptor } from "../../services/globalSettings";
import { BoundProperty, Property } from "./boundProperty";

export type Transform = { position: Vector3; rotation: Vector3; rotationQuaternion: Nullable<Quaternion>; scaling: Vector3 };

export const TransformProperties: FunctionComponent<{ transform: Transform }> = (props) => {
    const { transform } = props;

    const quatRotation = useQuaternionProperty(transform, "rotationQuaternion");

    const [useDegrees] = useSetting(UseDegreesSettingDescriptor);
    const [useEuler] = useSetting(UseEulerSettingDescriptor);

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Position" target={transform} propertyKey="position" />
            {quatRotation ? (
                <Property
                    component={QuaternionPropertyLine}
                    label="Rotation"
                    propertyPath="rotationQuaternion"
                    value={quatRotation}
                    onChange={(val) => (transform.rotationQuaternion = val)}
                    useDegrees={useDegrees}
                    useEuler={useEuler}
                />
            ) : (
                <BoundProperty component={RotationVectorPropertyLine} label="Rotation" target={transform} propertyKey="rotation" useDegrees={useDegrees} />
            )}
            <BoundProperty component={Vector3PropertyLine} label="Scaling" target={transform} propertyKey="scaling" step={0.1} />
        </>
    );
};
