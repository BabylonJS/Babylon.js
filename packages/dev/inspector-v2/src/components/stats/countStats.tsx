// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { useObservableState } from "../../hooks/observableHooks";

export const CountStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const totalMeshes = useObservableState(() => scene.meshes.length, scene.onNewMeshAddedObservable, scene.onMeshRemovedObservable);

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="TotalMeshes">TotalMeshes: {totalMeshes}</div>
        </>
    );
};
