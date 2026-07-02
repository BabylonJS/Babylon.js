import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Vector3 } from "core/Maths/math.vector";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingMeshBase, GaussianSplattingGpuSortMode } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
// Register the .splat file loader (side-effect).
import "loaders/SPLAT/splatFileLoader";

const SplatUrl = "https://raw.githubusercontent.com/CedricGuillemet/dump/master/Halo_Believe.splat";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const createScene = async function (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera("camera1", 0.6, 1.3, 8, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.01;
    new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

    // Force the WebGPU GPU sort + cull path (bypasses the CPU worker fallback).
    GaussianSplattingMeshBase.GpuSortMode = GaussianSplattingGpuSortMode.Gpu;

    const gs = new GaussianSplattingMesh("gs", null, scene);
    await gs.loadFileAsync(SplatUrl);

    gs.computeWorldMatrix(true);
    const bounds = gs.getBoundingInfo().boundingSphere;
    camera.setTarget(bounds.centerWorld.clone());
    camera.radius = bounds.radiusWorld * 2.5 + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__gsScene = scene;
    scene.onBeforeRenderObservable.add(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        const anyGs = gs as unknown as { _useGpuSort: boolean; _worker: unknown; _gpuSorter: unknown };
        win.__gsVerify = {
            found: true,
            useGpuSort: anyGs._useGpuSort,
            hasWorker: !!anyGs._worker,
            hasGpuSorter: !!anyGs._gpuSorter,
            renderedSplatCount: gs.renderedSplatCount,
        };
    });

    return scene;
};
