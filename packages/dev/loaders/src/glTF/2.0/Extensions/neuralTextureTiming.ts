import { type Material } from "core/Materials/material";
import { type GLTFFileLoader } from "../../glTFFileLoader";

/** Opt-in wall-clock phase recorder. Durations can overlap across materials. @internal */
export type NeuralTextureTiming = (phase: string, startTime: number) => void;

/** @internal */
export function CreateNeuralTextureTiming(scope: string): NeuralTextureTiming {
    return (phase, startTime) => {
        performance.measure(`neural:${phase}`, { start: startTime, end: performance.now(), detail: { scope } });
    };
}

/**
 * Install before loadFile to include fetch, GLB unpack and JSON parse.
 * @param loader loader to instrument before loading starts
 * @internal
 */
export function EnableNeuralTextureFileTiming(loader: GLTFFileLoader): void {
    const timing = CreateNeuralTextureTiming("glTF");
    const starts = new Map<string, number>();
    const startCounter = loader._startPerformanceCounter.bind(loader);
    const endCounter = loader._endPerformanceCounter.bind(loader);
    loader._startPerformanceCounter = (name) => {
        starts.set(name, performance.now());
        startCounter(name);
    };
    loader._endPerformanceCounter = (name) => {
        const start = starts.get(name);
        if (start !== undefined) {
            timing(name, start);
            starts.delete(name);
        }
        endCounter(name);
    };
    const loadFile = loader._loadFile.bind(loader);
    loader._loadFile = (scene, file, onSuccess, ...args) => {
        const start = performance.now();
        return loadFile(
            scene,
            file,
            (data) => {
                timing("fetch", start);
                onSuccess(data);
            },
            ...args
        );
    };
}

/**
 * Includes shader processing, synchronous compile and async effect readiness.
 * @param material neural PBR material
 * @param timing phase recorder
 * @internal
 */
export function TrackNeuralTextureMaterialTiming(material: Material, timing: NeuralTextureTiming): void {
    const resolve = material.customShaderNameResolve;
    let start = 0;
    material.customShaderNameResolve = (...args) => {
        start = performance.now();
        return resolve ? resolve(...args) : args[0];
    };
    material.onEffectCreatedObservable.add(({ effect }) => {
        const compileStart = start;
        effect.executeWhenCompiled(() => timing("pbrEffectCompile", compileStart));
    });
    const scene = material.getScene();
    const materialStart = performance.now();
    const observer = scene.onAfterRenderObservable.add(() => {
        if (scene.isReady() && material.getBindedMeshes().some((mesh) => mesh.isEnabled() && mesh.isReady(true))) {
            timing("firstReadyFrame", materialStart);
            scene.onAfterRenderObservable.remove(observer);
        }
    });
    material.onDisposeObservable.addOnce(() => scene.onAfterRenderObservable.remove(observer));
}
