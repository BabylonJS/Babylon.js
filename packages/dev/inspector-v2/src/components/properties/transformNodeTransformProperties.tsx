// eslint-disable-next-line import/no-internal-modules
import type { TransformNode } from "core/index";

import type { FunctionComponent } from "react";

import { RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useVector3Property } from "./observableUtils";

import { useObservableState } from "../../hooks/observableHooks";
import type { ISettingsContext } from "../../services/settingsContext";

export const TransformNodeTransformProperties: FunctionComponent<{ node: TransformNode; settings: ISettingsContext }> = (props) => {
    const { node, settings } = props;

    const position = useVector3Property(node, "position");
    const rotation = useVector3Property(node, "rotation");
    const scaling = useVector3Property(node, "scaling");

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (node.position = val)} />
            <RotationVectorPropertyLine key="RotationTransform" label="Rotation" value={rotation} onChange={(val) => (node.rotation = val)} useDegrees={useDegrees} />
            <Vector3PropertyLine key="ScalingTransform" label="Scaling" value={scaling} onChange={(val) => (node.scaling = val)} />
        </>
    );
};
