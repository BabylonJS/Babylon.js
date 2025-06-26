// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";

export const CountStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(1000);

    const totalMeshes = useObservableState(() => scene.meshes.length, scene.onNewMeshAddedObservable, scene.onMeshRemovedObservable);
    const activeMeshes = useObservableState(() => scene.getActiveMeshes().length, pollingObservable);
    const activeIndices = useObservableState(() => scene.getActiveIndices(), pollingObservable);
    const activeBones = useObservableState(() => scene.getActiveBones(), pollingObservable);
    const activeParticles = useObservableState(() => scene.getActiveParticles(), pollingObservable);
    const drawCalls = useObservableState(() => scene.getEngine()._drawCalls.current, pollingObservable);
    const totalLights = useObservableState(() => scene.lights.length, pollingObservable);
    const totalVertices = useObservableState(() => scene.getTotalVertices(), pollingObservable);
    const totalMaterials = useObservableState(() => scene.materials.length, pollingObservable);
    const totalTextures = useObservableState(() => scene.textures.length, pollingObservable);

    return (
        <>
            <TextPropertyLine key="TotalMeshes" label="Total Meshes" value={totalMeshes.toLocaleString()} />
            <TextPropertyLine key="ActiveMeshes" label="Active Meshes" value={activeMeshes.toLocaleString()} />
            <TextPropertyLine key="ActiveIndices" label="Active Indeces" value={activeIndices.toLocaleString()} />
            <TextPropertyLine key="ActiveFaces" label="Active Faces" value={(activeIndices / 3).toLocaleString()} />
            <TextPropertyLine key="ActiveBones" label="Active Bones" value={activeBones.toLocaleString()} />
            <TextPropertyLine key="ActiveParticles" label="Active Particles" value={activeParticles.toLocaleString()} />
            <TextPropertyLine key="DrawCalls" label="Draw Calls" value={drawCalls.toLocaleString()} />
            <TextPropertyLine key="TotalLights" label="Total Lights" value={totalLights.toLocaleString()} />
            <TextPropertyLine key="TotalVertices" label="Total Vertices" value={totalVertices.toLocaleString()} />
            <TextPropertyLine key="TotalMaterials" label="Total Materials" value={totalMaterials.toLocaleString()} />
            <TextPropertyLine key="TotalTextures" label="Total Textures" value={totalTextures.toLocaleString()} />
        </>
    );
};
