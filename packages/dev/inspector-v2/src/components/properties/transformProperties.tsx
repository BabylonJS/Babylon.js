import { type FunctionComponent } from "react";

import { type Nullable, type Quaternion, type Vector3 } from "core/index";

import { QuaternionPropertyLine, RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";
import { UseDegreesSettingDescriptor, UseEulerSettingDescriptor } from "../../services/globalSettings";
import { BoundProperty } from "./boundProperty";

export type Transform = { position: Vector3; rotation: Vector3; rotationQuaternion: Nullable<Quaternion>; scaling: Vector3 };

export const TransformProperties: FunctionComponent<{ transform: Transform }> = (props) => {
    const { transform } = props;

    const quatRotation = useProperty(transform, "rotationQuaternion");

    const [useDegrees] = useSetting(UseDegreesSettingDescriptor);
    const [useEuler] = useSetting(UseEulerSettingDescriptor);

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Position" target={transform} propertyKey="position" />
            {quatRotation ? (
                <BoundProperty
                    component={QuaternionPropertyLine}
                    label="Rotation"
                    target={transform}
                    propertyKey="rotationQuaternion"
                    propertyPath="rotationQuaternion"
                    defaultValue={null}
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
