// eslint-disable-next-line import/no-internal-modules
import type { TransformNode, Vector3 } from "core/index";

import type { FunctionComponent } from "react";

import { RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ISettingsContext } from "../../services/settingsContext";

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
