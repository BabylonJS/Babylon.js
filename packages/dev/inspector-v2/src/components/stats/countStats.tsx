import type { FunctionComponent } from "react";

import type { Scene } from "core/index";

import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";

export const CountStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(1000);

    const totalMeshes = useObservableState(() => scene.meshes.length, scene.onNewMeshAddedObservable, scene.onMeshRemovedObservable);
    const activeMeshes = useObservableState(() => {
        let activeMeshesCount = scene.getActiveMeshes().length;
        for (const objectRenderer of scene.objectRenderers) {
            activeMeshesCount += objectRenderer.getActiveMeshes().length;
        }
        return activeMeshesCount;
    }, pollingObservable);
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
            <StringifiedPropertyLine key="TotalMeshes" label="Total Meshes" value={totalMeshes} />
            <StringifiedPropertyLine key="ActiveMeshes" label="Active Meshes" value={activeMeshes} />
            <StringifiedPropertyLine key="ActiveIndices" label="Active Indices" value={activeIndices} />
            <StringifiedPropertyLine key="ActiveFaces" label="Active Faces" value={activeIndices / 3} />
            <StringifiedPropertyLine key="ActiveBones" label="Active Bones" value={activeBones} />
            <StringifiedPropertyLine key="ActiveParticles" label="Active Particles" value={activeParticles} />
            <StringifiedPropertyLine key="DrawCalls" label="Draw Calls" value={drawCalls} />
            <StringifiedPropertyLine key="TotalLights" label="Total Lights" value={totalLights} />
            <StringifiedPropertyLine key="TotalVertices" label="Total Vertices" value={totalVertices} />
            <StringifiedPropertyLine key="TotalMaterials" label="Total Materials" value={totalMaterials} />
            <StringifiedPropertyLine key="TotalTextures" label="Total Textures" value={totalTextures} />
        </>
    );
};
