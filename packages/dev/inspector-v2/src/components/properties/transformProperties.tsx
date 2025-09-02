import type { FunctionComponent } from "react";

import type { Nullable, Quaternion, Vector3 } from "core/index";
import type { ISettingsContext } from "../../services/settingsContext";

import { QuaternionPropertyLine, RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useQuaternionProperty } from "../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../hooks/observableHooks";
import { BoundProperty } from "./boundProperty";

export type Transform = { position: Vector3; rotation: Vector3; rotationQuaternion: Nullable<Quaternion>; scaling: Vector3 };

export const TransformProperties: FunctionComponent<{ transform: Transform; settings: ISettingsContext }> = (props) => {
    const { transform, settings } = props;

    const quatRotation = useQuaternionProperty(transform, "rotationQuaternion");

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Position" target={transform} propertyKey="position" />
            {quatRotation ? (
                <QuaternionPropertyLine
                    key="QuaternionRotationTransform"
                    label="Rotation (Quaternion)"
                    value={quatRotation}
                    onChange={(val) => (transform.rotationQuaternion = val)}
                    useDegrees={useDegrees}
                />
            ) : (
                <BoundProperty component={RotationVectorPropertyLine} label="Rotation" target={transform} propertyKey="rotation" useDegrees={useDegrees} />
            )}
            <BoundProperty component={Vector3PropertyLine} label="Scaling" target={transform} propertyKey="scaling" />
        </>
    );
};
