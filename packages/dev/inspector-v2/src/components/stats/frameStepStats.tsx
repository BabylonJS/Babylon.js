// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { useEffect, useRef } from "react";

import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";
import "core/Engines/AbstractEngine/abstractEngine.timeQuery";

import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";

export const FrameStepsStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const engine = scene.getEngine();

    const pollingObservable = usePollingObservable(500);

    const sceneInstrumentationRef = useRef<SceneInstrumentation>(new SceneInstrumentation(scene));
    const engineInstrumentationRef = useRef<EngineInstrumentation>(new EngineInstrumentation(engine));

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
        if (engineInstrumentation.engine !== engine) {
            engineInstrumentation.dispose();
            engineInstrumentation = new EngineInstrumentation(engine);
            engineInstrumentationRef.current = engineInstrumentation;
        }
        engineInstrumentation.captureGPUFrameTime = true;

        return () => {
            engineInstrumentation.dispose();
        };
    }, [engine]);

    const absoluteFPS = useObservableState(() => (1000.0 / sceneInstrumentationRef.current.frameTimeCounter.lastSecAverage).toFixed(0), pollingObservable);
    // TODO: Dynamically import the right engine.query module based on the type of engine?
    const gpuFrameTime = useObservableState(() => (engineInstrumentationRef.current.gpuFrameTimeCounter.lastSecAverage * 0.000001).toFixed(2), pollingObservable);

    return (
        // TODO: Use the new Fluent property line shared components.
        <>
            <div key="AbsoluteFPS">AbsoluteFPS: {absoluteFPS}</div>
            <div key="GPUFrameTime">GPU Frame Time: {gpuFrameTime}ms</div>
        </>
    );
};
