import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { GetRegisteredSceneLoaderPluginMetadata, SceneLoader } from "core/Loading/sceneLoader";
import { Scene } from "core/scene";
import { AssetContainer } from "core/assetContainer";
import { Command, readCommands } from "loaders/USD/usdCommandProtocol";
import { USDFileLoader, _RegisterUSDLoaderDependencies } from "loaders/USD/usdFileLoader.pure";
import { USDFileLoaderMetadata } from "loaders/USD/usdFileLoader.metadata";
import { materializeCommandBuffers } from "loaders/USD/usdSceneMaterializer";
import { type WorkerResponse } from "loaders/USD/usdWorkerMessages";

import { createUSDMeshTestBuffers, createUSDTestBuffers } from "./usdTestUtils";
import { deferUSDTextureLoads } from "./usdTextureTestUtils";
import { GetEnvironmentBRDFTexture } from "core/Misc/brdfTextureTools";

class MockWorker {
    public static readonly Instances: MockWorker[] = [];
    public static CreateBuffers = createUSDTestBuffers;

    public readonly messages: Array<{ requestId: number; asset?: { fileName?: string; files?: Record<string, Uint8Array> } }> = [];
    public terminated = false;

    private readonly _listeners = new Map<string, Set<(event: MessageEvent<WorkerResponse>) => void>>();

    public constructor() {
        MockWorker.Instances.push(this);
    }

    public addEventListener(type: string, listener: (event: MessageEvent<WorkerResponse>) => void): void {
        const listeners = this._listeners.get(type) ?? new Set();
        listeners.add(listener);
        this._listeners.set(type, listeners);
    }

    public postMessage(message: { requestId: number }): void {
        this.messages.push(message);
        const buffers = MockWorker.CreateBuffers();
        queueMicrotask(() => {
            this._emit({
                type: "progress",
                requestId: message.requestId,
                progress: { phase: "extracting", message: "Extracting test stage" },
            });
            this._emit({
                type: "result",
                requestId: message.requestId,
                commands: buffers.commands,
                data: buffers.data,
                timings: {
                    totalMs: 2,
                    stageOpenMs: 1,
                    stageReadMs: 0.5,
                    preparationMs: 0.25,
                    packingMs: 0.1,
                    heapCopyMs: 0.15,
                },
                statistics: {
                    nodes: 5,
                    meshes: 0,
                    analyticPrimitives: 4,
                    instances: 1,
                    materials: 1,
                    vertices: 0,
                    triangles: 0,
                    commandBytes: buffers.commands.byteLength,
                    dataBytes: buffers.data.byteLength,
                },
                missingAssets: [],
            });
        });
    }

    public terminate(): void {
        this.terminated = true;
    }

    private _emit(response: WorkerResponse): void {
        for (const listener of this._listeners.get("message") ?? []) {
            listener({ data: response } as MessageEvent<WorkerResponse>);
        }
    }
}

describe("USDFileLoader", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        MockWorker.Instances.length = 0;
        MockWorker.CreateBuffers = createUSDTestBuffers;
        _RegisterUSDLoaderDependencies();
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("registers all USD extensions for binary loading", async () => {
        await import("loaders/USD");
        const plugin = SceneLoader.GetPluginForExtension(".usdz");
        const metadata = GetRegisteredSceneLoaderPluginMetadata().find((entry) => entry?.name === USDFileLoaderMetadata.name);

        expect(plugin?.name).toBe("usd");
        expect(metadata?.extensions).toEqual([
            { extension: ".usd", isBinary: true },
            { extension: ".usda", isBinary: true },
            { extension: ".usdc", isBinary: true },
            { extension: ".usdz", isBinary: true },
        ]);
    });

    it("keeps default runtime URLs when an option is explicitly undefined", () => {
        const loader = new USDFileLoader({
            glueUrl: undefined,
            wasmUrl: undefined,
            dataUrl: undefined,
            workerUrl: undefined,
        });
        const options = (loader as unknown as { _options: { glueUrl?: string; wasmUrl?: string; dataUrl?: string; workerUrl?: string | URL } })._options;

        expect(options).toMatchObject(USDFileLoader.DefaultConfiguration);

        loader.dispose();
    });

    it("materializes analytic primitives, full affine transforms, and instances", async () => {
        const buffers = createUSDTestBuffers();
        const result = await materializeCommandBuffers(scene, buffers.commands, buffers.data, false);
        const cubeNode = result.container.transformNodes.find((node) => node.name === "CubeNode");

        expect(result.container.meshes).toHaveLength(5);
        expect(result.container.meshes.filter((mesh) => mesh.getClassName() === "InstancedMesh")).toHaveLength(1);
        expect(cubeNode?.getPivotMatrix().m[1]).toBeCloseTo(0.25);
        expect(result.container.meshes.find((mesh) => mesh.name === "Cube")?.getBoundingInfo().boundingBox.extendSizeWorld.x).toBeCloseTo(1);
        expect(result.container.meshes.find((mesh) => mesh.name === "Sphere")?.getBoundingInfo().boundingBox.extendSizeWorld.x).toBeCloseTo(1.5);
        expect(result.container.meshes[0]._parentContainer).toBe(result.container);
        expect(result.container.materials[0]._parentContainer).toBe(result.container);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);

        result.container.dispose();
    });

    it("uses a lightweight asset collection for direct scene materialization", async () => {
        const buffers = createUSDTestBuffers();

        const result = await materializeCommandBuffers(scene, buffers.commands, buffers.data, true);

        expect(result.container).not.toBeInstanceOf(AssetContainer);

        result.container.dispose();
    });

    it("rolls back scene objects when materialization fails", async () => {
        const buffers = createUSDTestBuffers();
        const commands = buffers.commands.slice(0);
        const transform = readCommands(commands).find((command) => command.opcode === Command.TransformNode);
        if (!transform) {
            throw new Error("USD test buffer does not contain a transform node.");
        }
        new DataView(commands).setUint32(transform.payloadOffset + 16, 0xfffffffc, true);
        const transformNodeCount = scene.transformNodes.length;
        const materialCount = scene.materials.length;

        await expect(materializeCommandBuffers(scene, commands, buffers.data, true)).rejects.toThrow("Invalid matrix range");

        expect(scene.transformNodes).toHaveLength(transformNodeCount);
        expect(scene.materials).toHaveLength(materialCount);
    });

    it("rejects invalid command buffers before creating an AssetContainer", async () => {
        const observerCount = engine.onContextRestoredObservable.observers.length;

        await expect(materializeCommandBuffers(scene, new ArrayBuffer(16), new ArrayBuffer(0), false)).rejects.toThrow("Invalid OpenUSD Babylon command buffer");

        expect(engine.onContextRestoredObservable.observers).toHaveLength(observerCount);
    });

    it("loads through the async SceneLoader plugin worker contract", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const phases: string[] = [];
        const onComplete = vi.fn();
        const loader = new USDFileLoader({
            workerUrl: "mock-worker.js",
            onProgress: ({ phase }) => phases.push(phase),
            onComplete,
        });

        const container = await loader.loadAssetContainerAsync(scene, new Uint8Array([1, 2, 3]).buffer, "", undefined, "raw-buffer-guid");

        expect(container.meshes).toHaveLength(5);
        expect(phases).toContain("extracting");
        expect(phases).toContain("materializing");
        expect(onComplete).toHaveBeenCalledWith(
            expect.objectContaining({
                statistics: expect.objectContaining({ analyticPrimitives: 4, instances: 1 }),
                missingAssets: [],
            })
        );
        expect(MockWorker.Instances[0].messages[0].asset?.fileName).toBe("scene.usd");
        expect(MockWorker.Instances[0].terminated).toBe(true);

        container.dispose();
        loader.dispose();
    });

    it("rolls back imported scene assets when onComplete throws", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const loader = new USDFileLoader({
            workerUrl: "mock-worker.js",
            onComplete: () => {
                throw new Error("completion callback failed");
            },
        });
        const meshCount = scene.meshes.length;
        const materialCount = scene.materials.length;

        await expect(loader.loadAsync(scene, new Uint8Array([1, 2, 3]).buffer, "", undefined, "scene.usda")).rejects.toThrow("completion callback failed");

        expect(scene.meshes).toHaveLength(meshCount);
        expect(scene.materials).toHaveLength(materialCount);
    });

    it("stages extensionless ZIP input as USDZ", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const loader = new USDFileLoader({ workerUrl: "mock-worker.js" });
        const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

        const container = await loader.loadAssetContainerAsync(scene, zipHeader.buffer, "", undefined, "raw-buffer-guid");

        expect(MockWorker.Instances[0].messages[0].asset?.fileName).toBe("scene.usdz");

        container.dispose();
        loader.dispose();
    });

    it("preserves a virtual root path shared with supporting files", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const loader = new USDFileLoader({
            workerUrl: "mock-worker.js",
            rootFileName: "Package/Scenes/Main.usda",
            files: {
                "Package/Layers/Geometry.usdc": new Uint8Array([4, 5, 6]),
                "Package/Textures/Albedo.PNG": new Uint8Array([7, 8, 9]),
            },
        });

        const container = await loader.loadAssetContainerAsync(scene, new Uint8Array([1, 2, 3]).buffer, "", undefined, "Main.usda");
        const request = MockWorker.Instances[0].messages[0];

        expect(request.asset?.fileName).toBe("Package/Scenes/Main.usda");
        expect(Object.keys(request.asset?.files ?? {})).toEqual(["Package/Layers/Geometry.usdc", "Package/Textures/Albedo.PNG"]);

        container.dispose();
        loader.dispose();
    });

    it("preserves URL-significant characters in an explicit virtual root path", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const loader = new USDFileLoader({
            workerUrl: "mock-worker.js",
            rootFileName: "Package#1/Scene?Variant.usda",
        });

        const container = await loader.loadAssetContainerAsync(scene, new Uint8Array([1, 2, 3]).buffer, "", undefined, "Scene.usda");

        expect(MockWorker.Instances[0].messages[0].asset?.fileName).toBe("Package#1/Scene?Variant.usda");

        container.dispose();
        loader.dispose();
    });

    it.each([true, false])("cancels and rolls back texture materialization (addToScene=%s)", async (addToScene) => {
        vi.stubGlobal("Worker", MockWorker);
        MockWorker.CreateBuffers = () => createUSDMeshTestBuffers(true);
        const existingTexture = GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const revokeUrl = vi.spyOn(URL, "revokeObjectURL");
        const onComplete = vi.fn();
        const loader = new USDFileLoader({ workerUrl: "mock-worker.js", onComplete });
        const data = new Uint8Array([1, 2, 3]).buffer;
        const loading = addToScene ? loader.loadAsync(scene, data, "") : loader.loadAssetContainerAsync(scene, data, "");
        await vi.waitFor(() => expect(loads).toHaveLength(3));

        const rejected = expect(loading).rejects.toThrow("USDFileLoader was disposed.");
        loader.dispose();
        await rejected;
        expect(onComplete).not.toHaveBeenCalled();
        expect(MockWorker.Instances[0].terminated).toBe(true);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.transformNodes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
        expect(scene.multiMaterials).toHaveLength(0);
        expect(scene.geometries).toHaveLength(0);
        expect(scene.skeletons).toHaveLength(0);
        expect(scene.animationGroups).toHaveLength(0);
        expect(scene.textures).toEqual([existingTexture]);
        expect(new Set(revokeUrl.mock.calls.map(([url]) => url)).size).toBe(3);

        // Neither late decode completion nor a late error can resurrect disposed assets.
        loads[0].succeed();
        loads[1].fail();
        loads[2].succeed();
        await Promise.resolve();
        expect(onComplete).not.toHaveBeenCalled();
        expect(scene.meshes).toHaveLength(0);
    });

    it("cancels before creating assets when disposed in materializing progress", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const onComplete = vi.fn();
        const loader = new USDFileLoader({
            workerUrl: "mock-worker.js",
            onComplete,
            onProgress: ({ phase }) => {
                if (phase === "materializing") {
                    loader.dispose();
                }
            },
        });

        await expect(loader.loadAsync(scene, new Uint8Array([1]).buffer, "")).rejects.toThrow("USDFileLoader was disposed.");
        expect(onComplete).not.toHaveBeenCalled();
        expect(scene.meshes).toHaveLength(0);
    });

    it("still rejects an extraction canceled before the worker returns", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const loader = new USDFileLoader({ workerUrl: "mock-worker.js" });
        const loading = loader.loadAsync(scene, new Uint8Array([1]).buffer, "");
        const rejected = expect(loading).rejects.toThrow("USDFileLoader was disposed.");
        loader.dispose();
        await rejected;
        expect(scene.meshes).toHaveLength(0);
    });

    it("rolls back when disposed by the completion callback", async () => {
        vi.stubGlobal("Worker", MockWorker);
        const loader = new USDFileLoader({ workerUrl: "mock-worker.js", onComplete: () => loader.dispose() });
        await expect(loader.loadAsync(scene, new Uint8Array([1]).buffer, "")).rejects.toThrow("USDFileLoader was disposed.");
        expect(scene.meshes).toHaveLength(0);
        expect(scene.transformNodes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
    });

    it("disposes all concurrent materializations but permits a fresh load afterwards", async () => {
        vi.stubGlobal("Worker", MockWorker);
        MockWorker.CreateBuffers = () => createUSDMeshTestBuffers(true);
        const existingTexture = GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const loader = new USDFileLoader({ workerUrl: "mock-worker.js" });
        const first = loader.loadAsync(scene, new Uint8Array([1]).buffer, "");
        const second = loader.loadAssetContainerAsync(scene, new Uint8Array([2]).buffer, "");
        await vi.waitFor(() => expect(loads).toHaveLength(6));
        const rejected = Promise.all([expect(first).rejects.toThrow("disposed"), expect(second).rejects.toThrow("disposed")]);
        loader.dispose();
        await rejected;
        expect(scene.meshes).toHaveLength(0);
        expect(scene.textures).toEqual([existingTexture]);

        MockWorker.CreateBuffers = createUSDTestBuffers;
        const container = await loader.loadAssetContainerAsync(scene, new Uint8Array([3]).buffer, "");
        expect(container.meshes).toHaveLength(5);
        container.dispose();
        loader.dispose();
    });
});
