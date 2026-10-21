import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingGpuSorter, type IGaussianSplattingGpuSortSource } from "core/Meshes/GaussianSplatting/gaussianSplattingGpuSorter";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingCompoundMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh";
import { GaussianSplattingMeshBase } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { GaussianSplattingSortWorkerCommand } from "core/Meshes/GaussianSplatting/gaussianSplattingSortWorker";
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
    let originalUseGpuSort: boolean;
    let originalProgressiveUpdateAmount: number;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
        originalUseGpuSort = GaussianSplattingMeshBase.UseGpuSort;
        originalProgressiveUpdateAmount = GaussianSplattingMeshBase.ProgressiveUpdateAmount;
        GaussianSplattingMeshBase.UseGpuSort = true;

        // Dependency loading can finish between tests: selection tests must never allocate real GPU resources on NullEngine.
        vi.spyOn(GaussianSplattingMeshBase.prototype as any, "_ensureGpuSorter").mockReturnValue(false);
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
        GaussianSplattingMeshBase.UseGpuSort = originalUseGpuSort;
        GaussianSplattingMeshBase.ProgressiveUpdateAmount = originalProgressiveUpdateAmount;
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

    it.each([true, false])("copies positions on same-size data updates only for the worker (useGpuSort=%s)", (useGpuSort) => {
        const mesh = createMesh(40, (m) => (m.useGpuSort = useGpuSort));
        const worker = mesh["_worker"];
        if (worker) {
            vi.mocked(worker.postMessage).mockClear();
        }
        const copy = vi.spyOn(Float32Array, "from");
        const invalidateSource = vi.spyOn(mesh, "_markGpuSourceDirty");

        mesh.updateData(createSplatData(40));

        expect(mesh._isGpuSortActive).toBe(useGpuSort);
        if (useGpuSort) {
            expect(copy).not.toHaveBeenCalled();
            expect(invalidateSource).toHaveBeenCalled();
            expect(workerCtor).not.toHaveBeenCalled();
        } else {
            expect(copy).toHaveBeenCalledOnce();
            const positions = copy.mock.results[0].value as Float32Array;
            expect(positions).toEqual(mesh["_splatPositions"]);
            expect(positions.buffer).not.toBe(mesh["_splatPositions"]!.buffer);
            expect(worker!.postMessage).toHaveBeenCalledWith({ command: GaussianSplattingSortWorkerCommand.POSITIONS, positions, vertexCount: 40 }, [positions.buffer]);
        }
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

    const getViews = (mesh: GaussianSplattingMesh) => Array.from<any>((mesh as any)._cameraViewInfos.values());

    const installSorter = (mesh: GaussianSplattingMesh) => {
        const output = { buffersVersion: 1, vertexBuffers: [], paddedCount: 16, instanceCount: 1, dispose: vi.fn() };
        const sorter = {
            setSource: vi.fn((_source: IGaussianSplattingGpuSortSource) => true),
            setIntervals: vi.fn((_intervals: ArrayLike<number> | null) => true),
            setPartMatrices: vi.fn(),
            createOutput: vi.fn(() => output),
            sort: vi.fn(() => true),
            dispose: vi.fn(),
        };
        (mesh as any)._gpuSorter = sorter;
        vi.spyOn(mesh as any, "_ensureGpuSorter").mockReturnValue(true);
        return sorter;
    };

    it.each([1, 2])("coalesces compound matrix edits before rendering into one sort for each of %s views", (viewCount) => {
        const cameras = Array.from({ length: viewCount }, (_, i) => new FreeCamera("cam" + i, new Vector3(i, 0, -5), scene));
        scene.activeCamera = cameras[0];
        scene.activeCameras = cameras;
        const mesh = new GaussianSplattingCompoundMesh("compound", null, scene);
        mesh.updateData(
            createSplatData(40),
            undefined,
            undefined,
            Uint8Array.from({ length: 40 }, (_, i) => (i < 20 ? 0 : 1))
        );
        mesh.setWorldMatrixForPart(0, Matrix.Identity());
        mesh.setWorldMatrixForPart(1, Matrix.Identity());
        const sorter = installSorter(mesh);
        mesh._postToWorker(true);
        expect(sorter.sort).toHaveBeenCalledTimes(viewCount);
        expect(mesh["_readyToDisplay"]).toBe(true);
        // The headless sorter has no drawable buffers; start from the state after a successful first render.
        mesh["_hasRenderedOnce"] = true;
        mesh.setEnabled(false);
        sorter.sort.mockClear();
        sorter.setPartMatrices.mockClear();
        const matricesAtDispatch: number[][][] = [];
        sorter.sort.mockImplementation(() => {
            matricesAtDispatch.push([0, 1].map((part) => Array.from(mesh.getWorldMatrixForPart(part).m)));
            expect(scene._isInRenderingMeshEvaluation()).toBe(false);
            return true;
        });
        const first = Matrix.Translation(1, 2, 3);
        const second = Matrix.Translation(4, 5, 6);

        mesh.setWorldMatrixForPart(0, Matrix.Translation(-1, 0, 0));
        mesh.setWorldMatrixForPart(1, second);
        mesh.setWorldMatrixForPart(0, first);
        mesh._postToWorker(true);

        expect(sorter.sort).not.toHaveBeenCalled();
        expect(sorter.setPartMatrices).not.toHaveBeenCalled();
        expect(mesh._isDepthSortSettled).toBe(false);

        scene.render();

        expect(sorter.sort).toHaveBeenCalledTimes(viewCount);
        expect(sorter.setPartMatrices).toHaveBeenCalledExactlyOnceWith([first, second]);
        expect(matricesAtDispatch).toEqual(Array.from({ length: viewCount }, () => [Array.from(first.m), Array.from(second.m)]));
        expect(getViews(mesh).map((view) => view.gpuLastSortFrameId)).toEqual(Array(viewCount).fill(scene.getFrameId()));
        expect(mesh._isDepthSortSettled).toBe(true);

        // A second pre-render notification without changed inputs must not enqueue another sort.
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(sorter.sort).toHaveBeenCalledTimes(viewCount);
    });

    it("keeps GPU sort bootstrap progressing without a render loop", () => {
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        const mesh = createMesh(40);
        const sorter = installSorter(mesh);
        sorter.sort.mockReturnValueOnce(false);

        mesh._postToWorker(true);
        expect(mesh["_readyToDisplay"]).toBe(false);
        mesh._postToWorker(true);
        expect(mesh["_readyToDisplay"]).toBe(true);
        expect(sorter.sort).toHaveBeenCalledTimes(2);
        expect(mesh["_hasRenderedOnce"]).toBe(false);

        // Readiness polling may request another sort if inputs change before the first draw.
        mesh.setWorldMatrixForPart(0, Matrix.Translation(1, 0, 0));
        expect(sorter.sort).toHaveBeenCalledTimes(3);
        expect(mesh._isDepthSortSettled).toBe(true);
    });

    it("keeps selection independent of shader dependency loading", async () => {
        await GaussianSplattingGpuSorter.LoadDependenciesAsync();
        createMesh(40);
        await Promise.resolve();
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        const mesh = createMesh(40);
        mesh._postToWorker(true);
        expect(mesh._isGpuSortActive).toBe(true);
        expect((mesh as any)._gpuSorter).toBeNull();
    });

    it("sorts uploaded progressive batches between coroutine yields", () => {
        GaussianSplattingMeshBase.ProgressiveUpdateAmount = 1;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        vi.spyOn(engine, "version", "get").mockReturnValue(2);
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        vi.spyOn(engine, "updateTextureData").mockImplementation(() => {});
        const mesh = new GaussianSplattingMesh("progressive", null, scene);
        const sorter = installSorter(mesh);
        const update = (mesh as any)._updateData(createSplatData(40), true);

        for (const uploaded of [16, 32, 40]) {
            expect(update.next().done).toBe(false);
            expect(mesh._splatDataPending).toBe(true);
            mesh._postToWorker(true);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(sorter.sort).toHaveBeenCalledTimes(Math.ceil(uploaded / 16));
            expect(sorter.setSource.mock.lastCall![0]).toMatchObject({ vertexCount: 40, boundsMax: [uploaded - 1, 0, 0] });
            expect(Array.from(sorter.setIntervals.mock.lastCall![0]!)).toEqual([0, uploaded]);
            expect(getViews(mesh)[0].splatIndexBufferSet).toBe(true);
            expect((mesh as any)._readyToDisplay).toBe(true);
            (scene as any)._frameId++;
        }
        expect(update.next().done).toBe(true);
        expect(mesh._splatDataPending).toBe(false);
    });

    it("switches to the worker in the same request when a custom renderer is installed after loading", () => {
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        const mesh = createMesh(40);
        expect(mesh._isGpuSortActive).toBe(true);
        scene.customRenderFunction = () => {};
        vi.spyOn(scene, "_isInRenderingMeshEvaluation").mockReturnValue(true);

        mesh._postToWorker(true);

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalledTimes(1);
        const messages = (mesh as any)._worker.postMessage.mock.calls.map(([message]: any[]) => message);
        expect(messages.some((message: any) => message.command === GaussianSplattingSortWorkerCommand.SORT)).toBe(true);
    });

    it("updates intervals and re-sorts without recomputing source bounds on range changes", () => {
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        const mesh = createMesh(40);
        const sorter = installSorter(mesh);
        mesh._postToWorker(true);
        const bounds = vi.spyOn(mesh as any, "_updateGpuBounds");
        const revision = (mesh as any)._gpuDataRevision;
        (scene as any)._frameId++;

        mesh.setSplatIndexRanges([{ offset: 3, count: 2 }]);

        expect(bounds).not.toHaveBeenCalled();
        expect(sorter.setSource).toHaveBeenCalledTimes(1);
        expect(Array.from(sorter.setIntervals.mock.lastCall![0]!)).toEqual([3, 2]);
        expect(sorter.sort).toHaveBeenCalledTimes(2);
        expect((mesh as any)._gpuDataRevision).toBeGreaterThan(revision);
    });

    it("falls back to the worker when the packed intervals exceed the sorter limits", () => {
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        const mesh = createMesh(40);
        const sorter = installSorter(mesh);
        sorter.setIntervals.mockReturnValue(false);

        mesh._postToWorker(true);
        mesh._postToWorker(true);

        expect(mesh._isGpuSortActive).toBe(false);
        expect(sorter.sort).not.toHaveBeenCalled();
        expect(sorter.dispose).toHaveBeenCalledOnce();
        expect(workerCtor).toHaveBeenCalledOnce();
    });

    it("leaves the GPU mode when depth sort is disabled after the data is loaded", () => {
        const camera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        scene.activeCamera = camera;
        const mesh = createMesh(40);
        expect(mesh._isGpuSortActive).toBe(true);

        mesh.disableDepthSort = true;
        expect(mesh._isGpuSortActive).toBe(false);

        // A data update must not request a GPU sort anymore: the identity index buffer is used.
        mesh.updateData(createSplatData(40));
        mesh._postToWorker(true);
        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).not.toHaveBeenCalled();
        expect((mesh as any)._gpuSorter).toBeNull();
        expect((mesh as any)._splatIndex).toBeInstanceOf(Float32Array);
        expect(getViews(mesh).length).toBe(1);
        expect(getViews(mesh).every((view) => view.splatIndexBufferSet)).toBe(true);
        expect((mesh as any)._readyToDisplay).toBe(true);

        // A new view gets the identity index buffer too.
        scene.activeCamera = new FreeCamera("cam2", new Vector3(0, 0, -5), scene);
        mesh._postToWorker();
        expect(getViews(mesh).length).toBe(2);
        expect(getViews(mesh).every((view) => view.splatIndexBufferSet)).toBe(true);
    });

    it("stays on the CPU path when depth sort is re-enabled after leaving the GPU mode", () => {
        scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
        const mesh = createMesh(40);
        mesh.disableDepthSort = true;
        mesh.disableDepthSort = false;
        mesh.updateData(createSplatData(40));

        expect(mesh._isGpuSortActive).toBe(false);
        expect(workerCtor).toHaveBeenCalled();
    });

    it("leaves the GPU mode when point splatting is enabled", () => {
        const controller = { colorRenderMode: false, depthRenderMode: false };
        const mesh = createMesh(40);
        vi.spyOn(mesh as any, "_ensurePointController").mockReturnValue(controller);
        expect(mesh._isGpuSortActive).toBe(true);

        mesh.pointSplattingDepthRenderMode = true;
        expect(controller.depthRenderMode).toBe(true);
        expect(mesh._isGpuSortActive).toBe(false);
        expect((mesh as any)._gpuSortForbidden).toBe(true);
    });

    it("keeps the GPU mode when the point-splatting controller does not accept the mode", () => {
        // Same as the real controller on an engine without compute support: the mode stays off.
        const controller = {
            get colorRenderMode() {
                return false;
            },
            set colorRenderMode(_value: boolean) {},
        };
        const mesh = createMesh(40);
        vi.spyOn(mesh as any, "_ensurePointController").mockReturnValue(controller);

        mesh.pointSplattingRenderMode = true;
        expect(mesh._isGpuSortActive).toBe(true);
    });

    it("copies the texture dimensions when cloning a GPU-sorted mesh", () => {
        const mesh = createMesh(40);
        const sourceSize = (mesh as any)._textureSize;
        expect(sourceSize.x).toBeGreaterThan(0);

        const clone = mesh.clone("clone") as GaussianSplattingMeshBase;
        expect(clone._isGpuSortActive).toBe(true);
        expect((clone as any)._textureSize.x).toBe(sourceSize.x);
        expect((clone as any)._textureSize.y).toBe(sourceSize.y);
        expect((clone as any)._textureSize).not.toBe(sourceSize);

        const setSource = vi.fn(() => true);
        const sorter = { setSource, setIntervals: vi.fn(() => true), setPartMatrices: vi.fn() };
        expect((clone as any)._applyGpuSource(sorter)).toBe(true);
        expect((setSource.mock.calls[0] as any)[0].textureWidth).toBe(sourceSize.x);
    });

    describe("device restoration", () => {
        it("drops the sorter and invalidates every view, then keeps sorting on the GPU", () => {
            scene.activeCamera = new FreeCamera("cam", new Vector3(0, 0, -5), scene);
            const mesh = createMesh(40);
            mesh._postToWorker(true);
            const view = getViews(mesh)[0];
            const sorter = { dispose: vi.fn() };
            (mesh as any)._gpuSorter = sorter;
            Object.assign(view, { gpuOutput: {}, gpuAppliedRevision: 5, gpuBuffersVersion: 3, splatIndexBufferSet: true, sortAppliedId: 4, sortRequestId: 4 });
            const revision = (mesh as any)._gpuDataRevision;
            (mesh as any)._gpuSourceDirty = false;

            engine.onContextRestoredObservable.notifyObservers(engine);

            expect(sorter.dispose).toHaveBeenCalledTimes(1);
            expect((mesh as any)._gpuSorter).toBeNull();
            expect(view.gpuOutput).toBeNull();
            expect(view.gpuAppliedRevision).toBe(0);
            expect(view.gpuBuffersVersion).toBe(0);
            expect(view.splatIndexBufferSet).toBe(false);
            expect(view.sortAppliedId).toBe(0);
            expect((mesh as any)._gpuSourceDirty).toBe(true);
            expect((mesh as any)._gpuDataRevision).toBeGreaterThan(revision);
            expect(mesh._isGpuSortActive).toBe(true);
        });

        it("removes the restoration observer when leaving the GPU mode and on dispose", async () => {
            const flush = () => new Promise((resolve) => setTimeout(resolve, 0)); // Observer removal is deferred
            const before = engine.onContextRestoredObservable.observers.length;
            const mesh = createMesh(40);
            expect(engine.onContextRestoredObservable.observers.length).toBe(before + 1);

            mesh._switchToWorkerSort();
            await flush();
            expect(engine.onContextRestoredObservable.observers.length).toBe(before);

            const other = createMesh(40);
            expect(engine.onContextRestoredObservable.observers.length).toBe(before + 1);
            other.dispose();
            await flush();
            expect(engine.onContextRestoredObservable.observers.length).toBe(before);
        });
    });
});
