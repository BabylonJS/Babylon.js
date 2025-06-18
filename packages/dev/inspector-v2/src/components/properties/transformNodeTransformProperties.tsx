// eslint-disable-next-line import/no-internal-modules
import type { TransformNode } from "core/index";

import type { FunctionComponent } from "react";

import { VectorPropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

export const TransformNodeTransformProperties: FunctionComponent<{ context: TransformNode }> = ({ context: transformNode }) => {
    const position = useObservableState(() => transformNode.position, useInterceptObservable("property", transformNode, "position"));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));

    return (
        <>
            <VectorPropertyLine key="PositionTransform" label="Position" description="The position of the transform node." vector={position} />
        </>
    );
};
