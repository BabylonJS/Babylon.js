import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { useCallback, useEffect, useRef } from "react";

import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";
import { usePollingObservable } from "../../hooks/pollingHooks";

// TODO: Dynamically import the right engine.query module based on the type of engine?
import "core/Engines/AbstractEngine/abstractEngine.timeQuery";
import "core/Engines/Extensions/engine.query";
import "core/Engines/WebGPU/Extensions/engine.query";

export const FrameStepsStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const pollingObservable = usePollingObservable(1000);
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

    const absoluteFPS = useObservableState(
        useCallback(() => Math.floor(1000.0 / sceneInstrumentationRef.current.frameTimeCounter.lastSecAverage), [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const meshesSelection = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.activeMeshesEvaluationTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const renderTargets = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.renderTargetsRenderTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const particles = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.particlesRenderTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const sprites = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.spritesRenderTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const animations = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.animationsTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const physics = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.physicsTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const interFrameTime = useObservableState(
        useCallback(() => sceneInstrumentationRef.current.interFrameTimeCounter.lastSecAverage, [sceneInstrumentationRef.current]),
        pollingObservable
    );
    const gpuFrameTime = useObservableState(
        useCallback(() => engineInstrumentationRef.current.gpuFrameTimeCounter.lastSecAverage * 0.000001, [engineInstrumentationRef.current]),
        pollingObservable
    );
    const gpuFrameTimeAverage = useObservableState(
        useCallback(() => engineInstrumentationRef.current.gpuFrameTimeCounter.average * 0.000001, [engineInstrumentationRef.current]),
        pollingObservable
    );

    return (
        <>
            <TextPropertyLine key="AbsoluteFPS" label="Absolute FPS" value={absoluteFPS.toLocaleString()} />
            <TextPropertyLine key="MeshesSelection" label="Meshes Selection" value={meshesSelection.toFixed(2) + " ms"} />
            <TextPropertyLine key="RenderTargets" label="Render Targets" value={renderTargets.toFixed(2) + " ms"} />
            <TextPropertyLine key="Particles" label="Particles" value={particles.toFixed(2) + " ms"} />
            <TextPropertyLine key="Sprites" label="Sprites" value={sprites.toFixed(2) + " ms"} />
            <TextPropertyLine key="Animations" label="Animations" value={animations.toFixed(2) + " ms"} />
            <TextPropertyLine key="Physics" label="Physics" value={physics.toFixed(2) + " ms"} />
            <TextPropertyLine key="InterFrameTime" label="Inter-Frame Time" value={interFrameTime.toFixed(2) + " ms"} />
            <TextPropertyLine key="GPUFrameTime" label="GPU Frame Time" value={gpuFrameTime.toFixed(2) + " ms"} />
            <TextPropertyLine key="GPUFrameTimeAverage" label="GPU Frame Time (Average)" value={gpuFrameTimeAverage.toFixed(2) + " ms"} />
        </>
    );
};
