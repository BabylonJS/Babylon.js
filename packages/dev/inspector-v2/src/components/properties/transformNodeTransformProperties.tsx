// eslint-disable-next-line import/no-internal-modules
import type { TransformNode, Vector3 } from "core/index";

import type { FunctionComponent } from "react";

import { VectorPropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const position = useObservableState(() => target[propertyKey] as Vector3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));
    return position;
}

export const TransformNodeTransformProperties: FunctionComponent<{ node: TransformNode }> = (props) => {
    const { node } = props;

    const position = useVector3Property(node, "position");
    const rotation = useVector3Property(node, "rotation");
    const scaling = useVector3Property(node, "scaling");

    return (
        <>
            <VectorPropertyLine key="PositionTransform" label="Position" description="The position of the transform node." vector={position} />
            <VectorPropertyLine key="RotationTransform" label="Rotation" description="The rotation of the transform node." vector={rotation} />
            <VectorPropertyLine key="ScalingTransform" label="Scaling" description="The scaling of the transform node." vector={scaling} />
        </>
    );
};
