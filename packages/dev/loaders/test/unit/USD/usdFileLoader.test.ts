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

import { createUSDTestBuffers } from "./usdTestUtils";

class MockWorker {
    public static readonly Instances: MockWorker[] = [];

    public readonly messages: Array<{ requestId: number; asset?: { fileName?: string } }> = [];
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
        const buffers = createUSDTestBuffers();
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
        _RegisterUSDLoaderDependencies();
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        scene.dispose();
        engine.dispose();
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
});
