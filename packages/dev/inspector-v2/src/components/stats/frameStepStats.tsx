// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import type { FunctionComponent } from "react";
import { useEffect, useRef } from "react";
import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";
import "core/Engines/AbstractEngine/abstractEngine.timeQuery";
import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";

// TODO: Dynamically import the right engine.query module based on the type of engine?
import "core/Engines/Extensions/engine.query";

export const FrameStepsStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(500);
    const sceneInstrumentationRef = useRef<SceneInstrumentation>(new SceneInstrumentation(scene));
    const engineInstrumentationRef = useRef<EngineInstrumentation>(new EngineInstrumentation(scene.getEngine()));

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

    useEffect(() => {
        let engineInstrumentation = engineInstrumentationRef.current;
        const engine = scene.getEngine();
        if (engineInstrumentation.engine !== engine) {
            engineInstrumentation.dispose();
            engineInstrumentation = new EngineInstrumentation(engine);
            engineInstrumentationRef.current = engineInstrumentation;
        }
        engineInstrumentation.captureGPUFrameTime = true;

        return () => {
            engineInstrumentation.dispose();
        };
    }, [scene]);

    const absoluteFPS = useObservableState(() => Math.floor(1000.0 / sceneInstrumentationRef.current.frameTimeCounter.lastSecAverage), pollingObservable);
    const meshesSelection = useObservableState(() => sceneInstrumentationRef.current.activeMeshesEvaluationTimeCounter.lastSecAverage, pollingObservable);
    const renderTargets = useObservableState(() => sceneInstrumentationRef.current.renderTargetsRenderTimeCounter.lastSecAverage, pollingObservable);
    const particles = useObservableState(() => sceneInstrumentationRef.current.particlesRenderTimeCounter.lastSecAverage, pollingObservable);
    const sprites = useObservableState(() => sceneInstrumentationRef.current.spritesRenderTimeCounter.lastSecAverage, pollingObservable);
    const animations = useObservableState(() => sceneInstrumentationRef.current.animationsTimeCounter.lastSecAverage, pollingObservable);
    const physics = useObservableState(() => sceneInstrumentationRef.current.physicsTimeCounter.lastSecAverage, pollingObservable);
    const interFrameTime = useObservableState(() => sceneInstrumentationRef.current.interFrameTimeCounter.lastSecAverage, pollingObservable);
    const gpuFrameTime = useObservableState(() => engineInstrumentationRef.current.gpuFrameTimeCounter.lastSecAverage * 0.000001, pollingObservable);
    const gpuFrameTimeAverage = useObservableState(() => engineInstrumentationRef.current.gpuFrameTimeCounter.average * 0.000001, pollingObservable);

    return (
        <>
            <TextPropertyLine key="AbsoluteFPS" label="Absolute FPS" value={absoluteFPS.toLocaleString()} />
            <TextPropertyLine key="MeshesSelection" label="Meshes selection" value={meshesSelection.toFixed(2) + " ms"} />
            <TextPropertyLine key="RenderTargets" label="Render targets" value={renderTargets.toFixed(2) + " ms"} />
            <TextPropertyLine key="Particles" label="Particles" value={particles.toFixed(2) + " ms"} />
            <TextPropertyLine key="Sprites" label="Sprites" value={sprites.toFixed(2) + " ms"} />
            <TextPropertyLine key="Animations" label="Animations" value={animations.toFixed(2) + " ms"} />
            <TextPropertyLine key="Physics" label="Physics" value={physics.toFixed(2) + " ms"} />
            <TextPropertyLine key="InterFrameTime" label="Inter-frame time" value={interFrameTime.toFixed(2) + " ms"} />
            <TextPropertyLine key="GPUFrameTime" label="GPU frame time" value={gpuFrameTime.toFixed(2) + " ms"} />
            <TextPropertyLine key="GPUFrameTimeAverage" label="GPU frame time (average)" value={gpuFrameTimeAverage.toFixed(2) + " ms"} />
        </>
    );
};
