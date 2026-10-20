import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingGpuSorter } from "core/Meshes/GaussianSplatting/gaussianSplattingGpuSorter";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingMeshBase } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createSplatData = (count: number): ArrayBuffer => {
    const data = new ArrayBuffer(count * 32);
    const floats = new Float32Array(data);
    const bytes = new Uint8Array(data);
    for (let i = 0; i < count; i++) {
        floats[i * 8 + 0] = i;
        floats[i * 8 + 3] = 0.5;
        floats[i * 8 + 4] = 0.5;
        floats[i * 8 + 5] = 0.5;
        bytes[i * 32 + 24] = 255;
        bytes[i * 32 + 25] = 255;
        bytes[i * 32 + 26] = 255;
        bytes[i * 32 + 27] = 255;
        bytes[i * 32 + 29] = 128;
        bytes[i * 32 + 30] = 128;
        bytes[i * 32 + 31] = 128;
    }
    return data;
};

describe("GaussianSplatting GPU sort selection", () => {
    let engine: NullEngine;
    let scene: Scene;
    let workerCtor: ReturnType<typeof vi.fn>;
    let originalWorker: typeof Worker | undefined;
    let originalCreateObjectURL: typeof URL.createObjectURL;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
        GaussianSplattingMeshBase.UseGpuSort = true;

        // Pretend WebGPU compute is available; the sorter itself is never constructed without a render loop.
        vi.spyOn(GaussianSplattingGpuSorter, "IsSupported").mockReturnValue(true);
        vi.spyOn(GaussianSplattingGpuSorter, "GetMaxSupportedSplatCount").mockReturnValue(1000);

        workerCtor = vi.fn();
        originalWorker = (globalThis as any).Worker;
        originalCreateObjectURL = URL.createObjectURL;
        (globalThis as any).Worker = class {
            public postMessage = vi.fn();
            public terminate = vi.fn();
            public onmessage: unknown = null;
            public constructor() {
                workerCtor();
            }
        };
        URL.createObjectURL = vi.fn(() => "blob:mock");
    });

    afterEach(() => {
        GaussianSplattingMeshBase.UseGpuSort = false;
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
        (globalThis as any).Worker = originalWorker;
        URL.createObjectURL = originalCreateObjectURL;
    });

    const createMesh = (count: number, configure?: (mesh: GaussianSplattingMesh) => void) => {
        const mesh = new GaussianSplattingMesh("gs", null, scene);
        configure?.(mesh);
        mesh.updateData(createSplatData(count));
        return mesh;
    };

    it("is disabled by default", () => {
        GaussianSplattingMeshBase.UseGpuSort = false;
        expect(new GaussianSplattingMesh("gs", null, scene).useGpuSort).toBeNull();
        const mesh = createMesh(40);
        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalledTimes(1);
    });

    it("uses the GPU sorter instead of the worker when WebGPU compute is supported", () => {
        const mesh = createMesh(40);

        expect(mesh._isGpuSortActive).toBe(true);
        expect((mesh as any)._worker).toBeNull();
        expect(workerCtor).not.toHaveBeenCalled();
        // No CPU index buffer is allocated: the sort output holds the indices.
        expect((mesh as any)._splatIndex).toBeFalsy();
        expect(mesh.forcedInstanceCount).toBe(3);
        expect(mesh.splatCount).toBe(48);
    });

    it("falls back to the worker when the engine does not support the GPU sorter", () => {
        (GaussianSplattingGpuSorter.IsSupported as any).mockReturnValue(false);
        const mesh = createMesh(40);

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalledTimes(1);
        expect((mesh as any)._splatIndex).toBeInstanceOf(Float32Array);
    });

    it("falls back to the worker when the splat count exceeds the sorter limit", () => {
        const mesh = createMesh(1001);

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalledTimes(1);
    });

    it("honors the static opt-out", () => {
        GaussianSplattingMeshBase.UseGpuSort = false;
        const mesh = createMesh(40);

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalledTimes(1);
    });

    it("lets the instance override the static setting in both directions", () => {
        const optedOut = createMesh(40, (m) => (m.useGpuSort = false));
        expect(optedOut._isGpuSortActive).toBe(false);

        GaussianSplattingMeshBase.UseGpuSort = false;
        const optedIn = createMesh(40, (m) => (m.useGpuSort = true));
        expect(optedIn._isGpuSortActive).toBe(true);
    });

    it("keeps the identity CPU path when depth sort is disabled before the data is loaded", () => {
        const mesh = createMesh(40, (m) => (m.disableDepthSort = true));

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).not.toHaveBeenCalled();
        expect((mesh as any)._splatIndex).toBeInstanceOf(Float32Array);
    });

    it("falls back to the worker when an external work buffer is used", () => {
        const mesh = createMesh(40);
        expect(mesh._isGpuSortActive).toBe(true);

        (mesh as any)._gpuSortForbidden = true;
        mesh._switchToWorkerSort();

        expect(mesh._isGpuSortActive).toBe(false);
        expect((mesh as any)._workerPending).toBe(true);
    });

    it("creates the worker lazily after leaving the GPU mode", () => {
        const mesh = createMesh(40);
        expect(workerCtor).not.toHaveBeenCalled();

        mesh._switchToWorkerSort();
        expect(workerCtor).not.toHaveBeenCalled();

        mesh._postToWorker(true);

        expect(workerCtor).toHaveBeenCalledTimes(1);
        expect((mesh as any)._workerPending).toBe(false);
        expect((mesh as any)._splatIndex).toBeInstanceOf(Float32Array);
        // Never goes back to the GPU sorter once switched.
        mesh.updateData(createSplatData(40));
        expect(mesh._isGpuSortActive).toBe(false);
    });

    it("removes its render observer on dispose", async () => {
        const before = scene.onBeforeRenderObservable.observers.length;
        const mesh = createMesh(40);
        expect(scene.onBeforeRenderObservable.observers.length).toBe(before + 1);

        mesh.dispose();
        await new Promise((resolve) => setTimeout(resolve, 0)); // Observer removal is deferred
        expect(scene.onBeforeRenderObservable.observers.length).toBe(before);
        expect((mesh as any)._gpuSorter).toBeNull();
    });

    it("copies the instance override when cloning", () => {
        const mesh = createMesh(40, (m) => (m.useGpuSort = false));
        const clone = mesh.clone("clone") as GaussianSplattingMesh;

        expect(clone.useGpuSort).toBe(false);
    });

    it("serializes and parses the instance override", () => {
        for (const value of [true, false, null]) {
            GaussianSplattingMeshBase.UseGpuSort = value === true ? false : true;
            const mesh = createMesh(40, (m) => (m.useGpuSort = value));
            const serialized = mesh.serialize({}, "binary");
            expect(serialized.useGpuSort).toBe(value);

            // Legacy files without the property parse as "not overridden".
            const parsed = GaussianSplattingMesh.Parse(JSON.parse(JSON.stringify({ ...serialized, splatsData: undefined, shData: undefined, partIndices: undefined })), scene);
            expect(parsed.useGpuSort).toBe(value);
        }

        const legacy = GaussianSplattingMesh.Parse({ name: "legacy", keepInRam: false }, scene);
        expect(legacy.useGpuSort).toBeNull();
    });

    it("applies the parsed override when the data is loaded", () => {
        GaussianSplattingMeshBase.UseGpuSort = false;
        const source = createMesh(40, (m) => (m.useGpuSort = true));
        const parsed = GaussianSplattingMesh.Parse(source.serialize({}, "binary"), scene);

        expect(parsed.useGpuSort).toBe(true);
        expect(parsed._isGpuSortActive).toBe(true);
    });

    it("falls back to the worker when the scene uses a custom render function", () => {
        scene.customRenderFunction = () => {};
        const mesh = createMesh(40);

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalledTimes(1);
    });
});
