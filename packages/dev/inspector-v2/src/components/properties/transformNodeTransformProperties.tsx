// eslint-disable-next-line import/no-internal-modules
import type { TransformNode } from "core/index";

import type { FunctionComponent } from "react";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useVector3Property } from "./observableUtils";

export const TransformNodeTransformProperties: FunctionComponent<{ node: TransformNode }> = (props) => {
    const { node } = props;

    const position = useVector3Property(node, "position");
    const rotation = useVector3Property(node, "rotation");
    const scaling = useVector3Property(node, "scaling");

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (node.position = val)} />
            <Vector3PropertyLine key="RotationTransform" label="Rotation" value={rotation} onChange={(val) => (node.rotation = val)} />
            <Vector3PropertyLine key="ScalingTransform" label="Scaling" value={scaling} onChange={(val) => (node.scaling = val)} />
        </>
    );
};
