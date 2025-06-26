// eslint-disable-next-line import/no-internal-modules
import type { Quaternion, TransformNode, Vector3 } from "core/index";

import type { FunctionComponent } from "react";

import { QuaternionPropertyLine, RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useQuaternionProperty, useVector3Property } from "../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ISettingsContext } from "../../services/settingsContext";

export type Transform = { position: Vector3; rotation: Vector3; rotationQuaternion: Quaternion; scaling: Vector3 };

export const TransformProperties: FunctionComponent<{ transform: Transform; settings: ISettingsContext }> = (props) => {
    const { transform, settings } = props;

    const position = useVector3Property(transform, "position");
    const rotation = useVector3Property(transform, "rotation");
    const quatRotation = useQuaternionProperty(transform, "rotationQuaternion");
    const scaling = useVector3Property(transform, "scaling");

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (transform.position = val)} />
            {transform.rotationQuaternion ? (
                <QuaternionPropertyLine
                    key="QuaternionRotationTransform"
                    label="Rotation (Quaternion)"
                    value={quatRotation}
                    onChange={(val) => (transform.rotationQuaternion = val)}
                    useDegrees={useDegrees}
                />
            ) : (
                <RotationVectorPropertyLine key="RotationTransform" label="Rotation" value={rotation} onChange={(val) => (transform.rotation = val)} useDegrees={useDegrees} />
            )}
            <Vector3PropertyLine key="ScalingTransform" label="Scaling" value={scaling} onChange={(val) => (transform.scaling = val)} />
        </>
    );
};
