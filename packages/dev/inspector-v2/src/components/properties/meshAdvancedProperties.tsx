// eslint-disable-next-line import/no-internal-modules
import type { AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

export const MeshAdvancedProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    // There is no observable for computeBonesUsingShaders, so we use an interceptor to listen for changes.
    const computeBonesUsingShaders = useObservableState(() => mesh.computeBonesUsingShaders, useInterceptObservable("property", mesh, "computeBonesUsingShaders"));

    return (
        <>
            <SwitchPropertyLine
                label="Compute bones using shaders"
                description="Whether to compute bones using shaders."
                checked={computeBonesUsingShaders}
                onChange={(_, data) => (mesh.computeBonesUsingShaders = data.checked)}
            />
        </>
    );
};
