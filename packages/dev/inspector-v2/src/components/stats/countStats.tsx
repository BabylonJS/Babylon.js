import type { FunctionComponent } from "react";

import type { Scene } from "core/index";

import { useCallback, useEffect } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";

export const CountStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(1000);

    const totalMeshes = useObservableState(
        useCallback(() => scene.meshes.length, [scene]),
        scene.onNewMeshAddedObservable,
        scene.onMeshRemovedObservable
    );
    const activeMeshes = useObservableState(
        useCallback(() => scene.getActiveMeshes().length, [scene]),
        pollingObservable
    );
    const activeIndices = useObservableState(
        useCallback(() => scene.getActiveIndices(), [scene]),
        pollingObservable
    );
    const activeBones = useObservableState(
        useCallback(() => scene.getActiveBones(), [scene]),
        pollingObservable
    );
    const activeParticles = useObservableState(
        useCallback(() => scene.getActiveParticles(), [scene]),
        pollingObservable
    );
    const drawCalls = useObservableState(
        useCallback(() => scene.getEngine()._drawCalls.current, [scene]),
        pollingObservable
    );
    const totalLights = useObservableState(
        useCallback(() => scene.lights.length, [scene]),
        pollingObservable
    );
    const totalVertices = useObservableState(
        useCallback(() => scene.getTotalVertices(), [scene]),
        pollingObservable
    );
    const totalMaterials = useObservableState(
        useCallback(() => scene.materials.length, [scene]),
        pollingObservable
    );
    const totalTextures = useObservableState(
        useCallback(() => scene.textures.length, [scene]),
        pollingObservable
    );

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
