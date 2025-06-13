// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { useInterceptObservable } from "../../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../../hooks/observableHooks";

export const MeshAdvancedProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    // There is no observable for computeBonesUsingShaders, so we use an interceptor to listen for changes.
    const computeBonesUsingShadersObservable = useInterceptObservable("property", mesh, "computeBonesUsingShaders");
    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const computeBonesUsingShaders = useObservableState(() => mesh.computeBonesUsingShaders, computeBonesUsingShadersObservable);

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="ComputeBonesUsingShaders">Compute bones using shaders: {computeBonesUsingShaders.toString()}</div>
        </>
    );
};
