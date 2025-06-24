// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useEffect, useRef, type FunctionComponent } from "react";
import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";

export const CountStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(500);
    const sceneInstrumentationRef = useRef<SceneInstrumentation>(new SceneInstrumentation(scene));

    useEffect(() => {
        let sceneInstrumentation = sceneInstrumentationRef.current;

        if (sceneInstrumentation.scene !== scene) {
            sceneInstrumentation.dispose();
            sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentationRef.current = sceneInstrumentation;
        }
        sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
        sceneInstrumentation.captureRenderTargetsRenderTime = true;
        sceneInstrumentation.captureFrameTime = true;
        sceneInstrumentation.captureRenderTime = true;
        sceneInstrumentation.captureInterFrameTime = true;
        sceneInstrumentation.captureParticlesRenderTime = true;
        sceneInstrumentation.captureSpritesRenderTime = true;
        sceneInstrumentation.capturePhysicsTime = true;
        sceneInstrumentation.captureAnimationsTime = true;

        return () => {
            sceneInstrumentation.dispose();
        };
    }, [scene]);

    const totalMeshes = useObservableState(() => scene.meshes.length, scene.onNewMeshAddedObservable, scene.onMeshRemovedObservable);
    const activeMeshes = useObservableState(() => scene.getActiveMeshes().length, pollingObservable);
    const activeIndices = useObservableState(() => scene.getActiveIndices(), pollingObservable);
    const activeBones = useObservableState(() => scene.getActiveBones(), pollingObservable);
    const activeParticles = useObservableState(() => scene.getActiveParticles(), pollingObservable);
    const drawCalls = useObservableState(() => sceneInstrumentationRef.current.drawCallsCounter.current, pollingObservable);
    const totalLights = useObservableState(() => scene.lights.length, pollingObservable);
    const totalVertices = useObservableState(() => scene.getTotalVertices(), pollingObservable);
    const totalMaterials = useObservableState(() => scene.materials.length, pollingObservable);
    const totalTextures = useObservableState(() => scene.textures.length, pollingObservable);

    return (
        <>
            <TextPropertyLine key="TotalMeshes" label="Total meshes" value={totalMeshes.toLocaleString()} />
            <TextPropertyLine key="ActiveMeshes" label="Active meshes" value={activeMeshes.toLocaleString()} />
            <TextPropertyLine key="ActiveIndices" label="Active indeces" value={activeIndices.toLocaleString()} />
            <TextPropertyLine key="ActiveFaces" label="Active faces" value={(activeIndices / 3).toLocaleString()} />
            <TextPropertyLine key="ActiveBones" label="Active bones" value={activeBones.toLocaleString()} />
            <TextPropertyLine key="ActiveParticles" label="Active particles" value={activeParticles.toLocaleString()} />
            <TextPropertyLine key="DrawCalls" label="Draw calls" value={drawCalls.toLocaleString()} />
            <TextPropertyLine key="TotalLights" label="Total lights" value={totalLights.toLocaleString()} />
            <TextPropertyLine key="TotalVertices" label="Total vertices" value={totalVertices.toLocaleString()} />
            <TextPropertyLine key="TotalMaterials" label="Total materials" value={totalMaterials.toLocaleString()} />
            <TextPropertyLine key="TotalTextures" label="Total textures" value={totalTextures.toLocaleString()} />
        </>
    );
};
