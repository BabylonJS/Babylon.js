// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

export const MeshAdvancedProperties: FunctionComponent<{ context: AbstractMesh }> = ({ context: mesh }) => {
    // There is no observable for computeBonesUsingShaders, so we use an interceptor to listen for changes.
    const computeBonesUsingShaders = useObservableState(() => mesh.computeBonesUsingShaders, useInterceptObservable("property", mesh, "computeBonesUsingShaders"));

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="ComputeBonesUsingShaders">Compute bones using shaders: {computeBonesUsingShaders.toString()}</div>
        </>
    );
};
