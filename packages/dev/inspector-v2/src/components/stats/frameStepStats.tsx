import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { useCallback } from "react";

import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";

import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";
import { useResource } from "../../hooks/resourceHooks";

// TODO: Dynamically import the right engine.query module based on the type of engine?
import "core/Engines/AbstractEngine/abstractEngine.timeQuery";
import "core/Engines/Extensions/engine.query";
import "core/Engines/WebGPU/Extensions/engine.query";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";

export const FrameStepsStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(1000);

    const sceneInstrumentation = useResource(
        useCallback(() => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
            sceneInstrumentation.captureRenderTargetsRenderTime = true;
            sceneInstrumentation.captureFrameTime = true;
            sceneInstrumentation.captureRenderTime = true;
            sceneInstrumentation.captureInterFrameTime = true;
            sceneInstrumentation.captureParticlesRenderTime = true;
            sceneInstrumentation.captureSpritesRenderTime = true;
            sceneInstrumentation.capturePhysicsTime = true;
            sceneInstrumentation.captureAnimationsTime = true;
            return sceneInstrumentation;
        }, [scene])
    );

    const engineInstrumentation = useResource(
        useCallback(() => {
            const engineInstrumentation = new EngineInstrumentation(scene.getEngine());
            engineInstrumentation.captureGPUFrameTime = true;
            return engineInstrumentation;
        }, [scene.getEngine()])
    );

    const absoluteFPS = useObservableState(() => Math.floor(1000.0 / sceneInstrumentation.frameTimeCounter.lastSecAverage), pollingObservable);
    const meshesSelection = useObservableState(() => sceneInstrumentation.activeMeshesEvaluationTimeCounter.lastSecAverage, pollingObservable);
    const renderTargets = useObservableState(() => sceneInstrumentation.renderTargetsRenderTimeCounter.lastSecAverage, pollingObservable);
    const particles = useObservableState(() => sceneInstrumentation.particlesRenderTimeCounter.lastSecAverage, pollingObservable);
    const sprites = useObservableState(() => sceneInstrumentation.spritesRenderTimeCounter.lastSecAverage, pollingObservable);
    const animations = useObservableState(() => sceneInstrumentation.animationsTimeCounter.lastSecAverage, pollingObservable);
    const physics = useObservableState(() => sceneInstrumentation.physicsTimeCounter.lastSecAverage, pollingObservable);
    const interFrameTime = useObservableState(() => sceneInstrumentation.interFrameTimeCounter.lastSecAverage, pollingObservable);
    const gpuFrameTime = useObservableState(() => engineInstrumentation.gpuFrameTimeCounter.lastSecAverage * 0.000001, pollingObservable);
    const gpuFrameTimeAverage = useObservableState(() => engineInstrumentation.gpuFrameTimeCounter.average * 0.000001, pollingObservable);

    return (
        <>
            <StringifiedPropertyLine key="AbsoluteFPS" label="Absolute FPS" value={absoluteFPS} />
            <StringifiedPropertyLine key="MeshesSelection" label="Meshes Selection" value={meshesSelection} precision={2} units="ms" />
            <StringifiedPropertyLine key="RenderTargets" label="Render Targets" value={renderTargets} precision={2} units="ms" />
            <StringifiedPropertyLine key="Particles" label="Particles" value={particles} precision={2} units="ms" />
            <StringifiedPropertyLine key="Sprites" label="Sprites" value={sprites} precision={2} units="ms" />
            <StringifiedPropertyLine key="Animations" label="Animations" value={animations} precision={2} units="ms" />
            <StringifiedPropertyLine key="Physics" label="Physics" value={physics} precision={2} units="ms" />
            <StringifiedPropertyLine key="InterFrameTime" label="Inter-Frame Time" value={interFrameTime} precision={2} units="ms" />
            <StringifiedPropertyLine key="GPUFrameTime" label="GPU Frame Time" value={gpuFrameTime} precision={2} units="ms" />
            <StringifiedPropertyLine key="GPUFrameTimeAverage" label="GPU Frame Time (Average)" value={gpuFrameTimeAverage} precision={2} units="ms" />
        </>
    );
};
