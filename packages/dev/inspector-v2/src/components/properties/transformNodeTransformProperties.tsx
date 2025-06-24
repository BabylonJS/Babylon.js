// eslint-disable-next-line import/no-internal-modules
import type { TransformNode } from "core/index";

import { type FunctionComponent } from "react";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useObservableState } from "../../hooks/observableHooks";
import { UseVector3Property } from "../../hooks/useVectorProperty";
import type { ISettingsContext } from "../../services/settingsContext";

export const TransformNodeTransformProperties: FunctionComponent<{ node: TransformNode; settings: ISettingsContext }> = (props) => {
    const { node, settings } = props;

    const position = UseVector3Property(node, "position");
    const rotation = UseVector3Property(node, "rotation");
    const scaling = UseVector3Property(node, "scaling");

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (node.position = val)} />
            <Vector3PropertyLine key="RotationTransform" label="Rotation" value={rotation} onChange={(val) => (node.rotation = val)} useDegrees={useDegrees} />
            <Vector3PropertyLine key="ScalingTransform" label="Scaling" value={scaling} onChange={(val) => (node.scaling = val)} />
        </>
    );
};
