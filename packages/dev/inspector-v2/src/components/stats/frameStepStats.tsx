// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";

import { useEffect, useMemo, type FunctionComponent } from "react";

import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";
import "core/Engines/AbstractEngine/abstractEngine.timeQuery";

import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";

export const FrameStepsStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const engine = scene.getEngine();

    const pollingObservable = usePollingObservable(500);

    const sceneInstrumentation = useMemo(() => {
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
    }, [scene]);

    useEffect(() => {
        return () => sceneInstrumentation.dispose();
    }, [sceneInstrumentation]);

    const engineInstrumentation = useMemo(() => {
        const engineInstrumentation = new EngineInstrumentation(engine);
        engineInstrumentation.captureGPUFrameTime = true;
        return engineInstrumentation;
    }, [engine]);

    useEffect(() => {
        return () => engineInstrumentation.dispose();
    }, [engineInstrumentation]);

    const absoluteFPS = useObservableState(() => (1000.0 / sceneInstrumentation.frameTimeCounter.lastSecAverage).toFixed(0), pollingObservable);
    // TODO: Dynamically import the right engine.query module based on the type of engine?
    const gpuFrameTime = useObservableState(() => (engineInstrumentation.gpuFrameTimeCounter!.lastSecAverage * 0.000001).toFixed(2), pollingObservable);

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="AbsoluteFPS">AbsoluteFPS: {absoluteFPS}</div>
            <div key="GPUFrameTime">GPU Frame Time: {gpuFrameTime}ms</div>
        </>
    );
};
