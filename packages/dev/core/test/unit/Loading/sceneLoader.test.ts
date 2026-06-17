import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { Scene } from "core/scene";
import { Mesh } from "core/Meshes/mesh";
import { AssetContainer } from "core/assetContainer";
import { Observable } from "core/Misc/observable";

import {
    AppendSceneAsync,
    GetRegisteredSceneLoaderPluginMetadata,
    ImportAnimationsAsync,
    ImportMeshAsync,
    LoadAssetContainerAsync,
    LoadSceneAsync,
    RegisterSceneLoaderPlugin,
    SceneLoader,
    type ISceneLoaderAsyncResult,
    type ISceneLoaderPlugin,
    type ISceneLoaderPluginAsync,
    type ISceneLoaderPluginFactory,
    type ISceneLoaderProgressEvent,
    type SceneLoaderPluginOptions,
} from "core/Loading/sceneLoader";
import { type IFileRequest } from "core/Misc/fileRequest";

// A monotonically increasing counter so each test can register a plugin with a
// unique extension/name. The SceneLoader keeps a module level registry that is
// never cleared, so using unique identifiers keeps tests isolated from one another.
let pluginCounter = 0;

type TestPluginIdentity = {
    name: string;
    extension: string;
};

function nextPluginIdentity(prefix: string): TestPluginIdentity {
    pluginCounter++;
    return {
        name: `${prefix}_${pluginCounter}`,
        extension: `.${prefix}_${pluginCounter}`,
    };
}

function createFileRequest(): IFileRequest {
    return {
        abort: () => {},
        onCompleteObservable: new Observable<IFileRequest>(),
    };
}

function createEmptyAsyncResult(overrides: Partial<ISceneLoaderAsyncResult> = {}): ISceneLoaderAsyncResult {
    return {
        meshes: [],
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: [],
        geometries: [],
        lights: [],
        spriteManagers: [],
        ...overrides,
    };
}

// Classifies how a promise settles within a short window. Used to detect when a loading
// operation hangs (never resolves nor rejects) instead of failing slowly via the test timeout.
async function classifySettlement(promise: Promise<unknown>, timeoutMs = 250): Promise<"resolved" | "rejected" | "pending"> {
    let timer: ReturnType<typeof setTimeout>;
    const pending = new Promise<"pending">((resolve) => {
        timer = setTimeout(() => resolve("pending"), timeoutMs);
    });
    const settled = promise.then(
        () => "resolved" as const,
        () => "rejected" as const
    );
    const result = await Promise.race([settled, pending]);
    clearTimeout(timer!);
    return result;
}

describe("SceneLoader", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    describe("Plugin registration", () => {
        it("registers a plugin and reports availability by extension", () => {
            const { name, extension } = nextPluginIdentity("reg");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };

            RegisterSceneLoaderPlugin(plugin);

            expect(SceneLoader.IsPluginForExtensionAvailable(extension)).toBe(true);
            expect(SceneLoader.IsPluginForExtensionAvailable(".does-not-exist")).toBe(false);
            expect(SceneLoader.GetPluginForExtension(extension)).toBe(plugin);
        });

        it("exposes registered plugin metadata", () => {
            const { name, extension } = nextPluginIdentity("meta");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: { [extension]: { isBinary: false } },
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };

            RegisterSceneLoaderPlugin(plugin);

            const metadata = GetRegisteredSceneLoaderPluginMetadata();
            const entry = metadata.find((m) => m.name === name);
            expect(entry).toBeDefined();
            expect(entry!.extensions).toEqual([{ extension, isBinary: false, mimeType: undefined }]);
        });
    });

    describe("ImportMeshAsync", () => {
        it("resolves with the results of an async plugin", async () => {
            const { name, extension } = nextPluginIdentity("importasync");
            const mesh = new Mesh("imported", scene);
            const result = createEmptyAsyncResult({ meshes: [mesh] });

            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(result),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const loaded = await ImportMeshAsync("data:dummy", scene, { pluginExtension: extension });

            expect(loaded.meshes).toEqual([mesh]);
            expect(scene.loadingPluginName).toBe(name);
            expect(scene.importedMeshesFiles).toContain("data:dummy");
        });

        it("resolves with the results of a sync plugin", async () => {
            const { name, extension } = nextPluginIdentity("importsync");

            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: (_meshNames, s, _data, _rootUrl, meshes) => {
                    meshes.push(new Mesh("syncImported", s));
                    return true;
                },
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const loaded = await ImportMeshAsync("data:dummy", scene, { pluginExtension: extension });

            expect(loaded.meshes).toHaveLength(1);
            expect(loaded.meshes[0].name).toBe("syncImported");
            // The sync importMesh path supplies empty arrays for the remaining result fields.
            expect(loaded.animationGroups).toEqual([]);
        });

        it("forwards progress events from the plugin to the caller", async () => {
            const { name, extension } = nextPluginIdentity("importprogress");
            const progressEvent: ISceneLoaderProgressEvent = { lengthComputable: true, loaded: 1, total: 2 };

            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: (_meshNames, _s, _data, _rootUrl, onProgress) => {
                    onProgress?.(progressEvent);
                    return Promise.resolve(createEmptyAsyncResult());
                },
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const onProgress = vi.fn();
            await ImportMeshAsync("data:dummy", scene, { pluginExtension: extension, onProgress });

            expect(onProgress).toHaveBeenCalledWith(progressEvent);
        });

        it("rejects when an async plugin rejects", async () => {
            const { name, extension } = nextPluginIdentity("importreject");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.reject(new Error("boom")),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(ImportMeshAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("boom");
        });

        it("rejects when a sync plugin reports an error", async () => {
            const { name, extension } = nextPluginIdentity("importsyncerror");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: (_meshNames, _s, _data, _rootUrl, _meshes, _ps, _sk, onError) => {
                    onError?.("sync import failed");
                    return false;
                },
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(ImportMeshAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow(/sync import failed/);
        });

        it("rejects when an async plugin throws synchronously", async () => {
            // The plugin method is declared to return a Promise but throws before returning one.
            const { name, extension } = nextPluginIdentity("importsyncthrow");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => {
                    throw new Error("sync throw from importMeshAsync");
                },
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(ImportMeshAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("sync throw from importMeshAsync");
        });

        it("rejects when a sync plugin throws instead of calling onError", async () => {
            const { name, extension } = nextPluginIdentity("importsyncpluginthrow");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => {
                    throw new Error("sync throw from importMesh");
                },
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(ImportMeshAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("sync throw from importMesh");
        });
    });

    describe("AppendSceneAsync", () => {
        it("appends using an async plugin", async () => {
            const { name, extension } = nextPluginIdentity("appendasync");
            const loadAsync = vi.fn(() => Promise.resolve());
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync,
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            await AppendSceneAsync("data:dummy", scene, { pluginExtension: extension });

            expect(loadAsync).toHaveBeenCalledTimes(1);
            expect(scene.loadingPluginName).toBe(name);
        });

        it("appends using a sync plugin", async () => {
            const { name, extension } = nextPluginIdentity("appendsync");
            const load = vi.fn(() => true);
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await AppendSceneAsync("data:dummy", scene, { pluginExtension: extension });

            expect(load).toHaveBeenCalledTimes(1);
            expect(scene.loadingPluginName).toBe(name);
        });

        it("rejects when the async plugin rejects", async () => {
            const { name, extension } = nextPluginIdentity("appendreject");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.reject(new Error("append boom")),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(AppendSceneAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("append boom");
        });

        it("rejects when the async plugin throws synchronously", async () => {
            const { name, extension } = nextPluginIdentity("appendsyncthrow");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => {
                    throw new Error("sync throw from loadAsync");
                },
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(AppendSceneAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("sync throw from loadAsync");
        });

        it("rejects when a sync plugin throws instead of calling onError", async () => {
            const { name, extension } = nextPluginIdentity("appendpluginthrow");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => {
                    throw new Error("sync throw from load");
                },
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(AppendSceneAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("sync throw from load");
        });

        it("rejects when the matched plugin is disabled", async () => {
            // Guard for the asymmetry fixed in PR #18584: unlike LoadSceneAsync, the Append shared wrapper
            // already rejects (rather than hangs) when loadDataAsync throws for a disabled plugin.
            const { name, extension } = nextPluginIdentity("appenddisabled");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = AppendSceneAsync("data:dummy", scene, {
                pluginExtension: extension,
                pluginOptions: { [name]: { enabled: false } } as SceneLoaderPluginOptions,
            });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("rejects with 'Scene has been disposed' when the scene is disposed mid load", async () => {
            const { name, extension } = nextPluginIdentity("appenddisposed");
            let deliverData: (() => void) | undefined;

            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                loadFile: (_s, _fileOrUrl, _rootUrl, onSuccess) => {
                    deliverData = () => onSuccess("dummy");
                    return createFileRequest();
                },
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            // Use a non data: url so the loadFile path (which checks for disposal) is exercised.
            const promise = AppendSceneAsync("scene.bin", scene, { pluginExtension: extension });
            expect(deliverData).toBeDefined();

            scene.dispose();
            deliverData!();

            await expect(promise).rejects.toThrow(/Scene has been disposed/);
        });
    });

    describe("LoadSceneAsync", () => {
        it("creates and resolves a new scene", async () => {
            const { name, extension } = nextPluginIdentity("loadscene");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const loadedScene = await LoadSceneAsync("data:dummy", engine, { pluginExtension: extension });

            expect(loadedScene).toBeInstanceOf(Scene);
            expect(loadedScene).not.toBe(scene);
            expect(loadedScene.loadingPluginName).toBe(name);

            loadedScene.dispose();
        });

        // General coverage: LoadSceneAsync should reject when an async plugin rejects. This path already
        // works today because the rejection flows through the loader's error handler.
        it("rejects when the underlying load rejects", async () => {
            const { name, extension } = nextPluginIdentity("loadscenereject");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.reject(new Error("load scene boom")),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = LoadSceneAsync("data:dummy", engine, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        // Regression for https://github.com/BabylonJS/Babylon.js/pull/18584:
        // a disabled plugin causes loadDataAsync to throw, which loadSceneImplAsync rejects with.
        // loadSceneSharedAsync used a floating promise without a catch, so that rejection was swallowed
        // and the operation hung. It should propagate the rejection instead.
        it("rejects when the matched plugin is disabled", async () => {
            const { name, extension } = nextPluginIdentity("loadscenedisabled");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = LoadSceneAsync("data:dummy", engine, {
                pluginExtension: extension,
                pluginOptions: { [name]: { enabled: false } } as SceneLoaderPluginOptions,
            });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });
    });

    // Regression for https://github.com/BabylonJS/Babylon.js/pull/18584:
    // File and raw-data sources are already in-memory and must not be routed through the offline
    // provider. With the bug present, the offline provider factory is invoked for these sources
    // (and here, since the factory throws, the load also rejects).
    describe("Offline provider bypass for in-memory sources", () => {
        let previousFactory: typeof AbstractEngine.OfflineProviderFactory;

        beforeEach(() => {
            previousFactory = AbstractEngine.OfflineProviderFactory;
            engine.enableOfflineSupport = true;
        });

        afterEach(() => {
            AbstractEngine.OfflineProviderFactory = previousFactory;
        });

        it("does not invoke the offline provider factory for raw ArrayBufferView data", async () => {
            const { name, extension } = nextPluginIdentity("offlinebypass");
            const data = new Uint8Array([1, 2, 3, 4]);

            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: { [extension]: { isBinary: true } },
                loadFile: (_s, fileOrUrl, _rootUrl, onSuccess: (data: unknown) => void) => {
                    onSuccess(fileOrUrl);
                    return createFileRequest();
                },
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const offlineProviderFactory = vi.fn(() => {
                throw new Error("Offline provider should not be used for in-memory sources.");
            });
            AbstractEngine.OfflineProviderFactory = offlineProviderFactory as unknown as typeof AbstractEngine.OfflineProviderFactory;

            const promise = AppendSceneAsync(data, scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("resolved");
            expect(offlineProviderFactory).not.toHaveBeenCalled();

            await promise.catch(() => {});
        });

        it("does not invoke the offline provider factory for a File source", async () => {
            const { name, extension } = nextPluginIdentity("offlinebypassfile");
            // A minimal File-like object: GetFileInfo only checks for a truthy `name`.
            const file = { name: `scene${extension}` } as unknown as File;

            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                loadFile: (_s, fileOrUrl, _rootUrl, onSuccess: (data: unknown) => void) => {
                    onSuccess(fileOrUrl);
                    return createFileRequest();
                },
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const offlineProviderFactory = vi.fn(() => {
                throw new Error("Offline provider should not be used for File sources.");
            });
            AbstractEngine.OfflineProviderFactory = offlineProviderFactory as unknown as typeof AbstractEngine.OfflineProviderFactory;

            const promise = AppendSceneAsync(file, scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("resolved");
            expect(offlineProviderFactory).not.toHaveBeenCalled();

            await promise.catch(() => {});
        });

        it("still invokes the offline provider factory for URL string sources", async () => {
            // Positive guard: the bypass must apply only to in-memory sources, not URL-backed loads.
            const { name, extension } = nextPluginIdentity("offlineurl");

            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                loadFile: (_s, fileOrUrl, _rootUrl, onSuccess: (data: unknown) => void) => {
                    onSuccess(fileOrUrl);
                    return createFileRequest();
                },
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const offlineProviderFactory = vi.fn((_url: string, manifestChecked: () => void) => {
                // Invoke the manifest-checked callback so the load proceeds to the plugin.
                manifestChecked();
                return {} as ReturnType<NonNullable<typeof AbstractEngine.OfflineProviderFactory>>;
            });
            AbstractEngine.OfflineProviderFactory = offlineProviderFactory as unknown as typeof AbstractEngine.OfflineProviderFactory;

            const promise = AppendSceneAsync(`http://example.com/scene${extension}`, scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("resolved");
            expect(offlineProviderFactory).toHaveBeenCalledTimes(1);

            await promise.catch(() => {});
        });
    });

    describe("LoadAssetContainerAsync", () => {
        it("loads an asset container with an async plugin and populates root nodes", async () => {
            const { name, extension } = nextPluginIdentity("containerasync");
            const container = new AssetContainer(scene);
            container.meshes.push(new Mesh("rootMesh", scene));

            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: () => Promise.resolve(container),
            };
            RegisterSceneLoaderPlugin(plugin);

            const loaded = await LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension });

            expect(loaded).toBe(container);
            expect(loaded.rootNodes).toHaveLength(1);
            expect(scene.loadingPluginName).toBe(name);
        });

        it("loads an asset container with a sync plugin", async () => {
            const { name, extension } = nextPluginIdentity("containersync");
            const container = new AssetContainer(scene);

            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: () => container,
            };
            RegisterSceneLoaderPlugin(plugin);

            const loaded = await LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension });

            expect(loaded).toBe(container);
        });

        it("rejects when the plugin does not support loading an asset container", async () => {
            const { name, extension } = nextPluginIdentity("containerunsupported");
            // A plugin that only supports importing meshes, not asset containers.
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
            } as unknown as ISceneLoaderPluginAsync;
            RegisterSceneLoaderPlugin(plugin);

            await expect(LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow(/LoadAssetContainer is not supported/);
        });

        it("rejects when the matched plugin is disabled", async () => {
            // Guard for the asymmetry fixed in PR #18584: the LoadAssetContainer shared wrapper already
            // rejects (rather than hangs) when loadDataAsync throws for a disabled plugin.
            const { name, extension } = nextPluginIdentity("containerdisabled");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = LoadAssetContainerAsync("data:dummy", scene, {
                pluginExtension: extension,
                pluginOptions: { [name]: { enabled: false } } as SceneLoaderPluginOptions,
            });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("rejects when the async plugin rejects", async () => {
            const { name, extension } = nextPluginIdentity("containerreject");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: () => Promise.reject(new Error("container boom")),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("container boom");
        });

        it("rejects when the async plugin throws synchronously", async () => {
            const { name, extension } = nextPluginIdentity("containersyncthrow");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: () => {
                    throw new Error("sync throw from loadAssetContainerAsync");
                },
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("sync throw from loadAssetContainerAsync");
        });

        it("rejects when a sync plugin throws instead of calling onError", async () => {
            const { name, extension } = nextPluginIdentity("containerpluginthrow");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: () => {
                    throw new Error("sync throw from loadAssetContainer");
                },
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension })).rejects.toThrow("sync throw from loadAssetContainer");
        });
    });

    // A synchronous plugin can signal failure either by calling its onError argument or by returning false.
    // When it returns false WITHOUT calling onError, the loading operation should still settle (reject) and
    // must not leak pending data on the scene. These tests currently fail because the operation hangs forever
    // and the pending data is never removed; they should pass once the loader is reworked.
    describe("Sync plugin returns false without calling onError", () => {
        it("ImportMeshAsync rejects and clears pending data", async () => {
            const { name, extension } = nextPluginIdentity("importsilentfalse");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => false,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = ImportMeshAsync("data:dummy", scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("rejected");
            expect(scene.getWaitingItemsCount()).toBe(0);

            // Avoid an unhandled rejection if the assertion above already failed.
            await promise.catch(() => {});
        });

        it("AppendSceneAsync rejects and clears pending data", async () => {
            const { name, extension } = nextPluginIdentity("appendsilentfalse");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => false,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = AppendSceneAsync("data:dummy", scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("rejected");
            expect(scene.getWaitingItemsCount()).toBe(0);

            await promise.catch(() => {});
        });

        it("LoadAssetContainerAsync rejects and clears pending data", async () => {
            const { name, extension } = nextPluginIdentity("containersilentfalse");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                // The loader treats a falsy asset container as a silent failure.
                loadAssetContainer: () => null as unknown as AssetContainer,
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = LoadAssetContainerAsync("data:dummy", scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("rejected");
            expect(scene.getWaitingItemsCount()).toBe(0);

            await promise.catch(() => {});
        });
    });

    // When GetFileInfo returns null (for example, a rootUrl is set and the filename starts with "/"),
    // the internal loader functions return early without ever invoking the success callback, so the
    // promise-based public APIs never settle. They should reject on invalid input. These tests currently
    // fail because the operation hangs forever; they should pass once the loader is reworked. Note that
    // Tools.Error logs an error in this path, so it is silenced to keep the test output clean.
    describe("Invalid input (GetFileInfo returns null)", () => {
        beforeEach(() => {
            vi.spyOn(console, "error").mockImplementation(() => {});
        });

        it("ImportMeshAsync rejects when the filename is invalid", async () => {
            const promise = ImportMeshAsync("/invalid.babylon", scene, { rootUrl: "http://example.com/" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("AppendSceneAsync rejects when the filename is invalid", async () => {
            const promise = AppendSceneAsync("/invalid.babylon", scene, { rootUrl: "http://example.com/" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("LoadAssetContainerAsync rejects when the filename is invalid", async () => {
            const promise = LoadAssetContainerAsync("/invalid.babylon", scene, { rootUrl: "http://example.com/" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("LoadSceneAsync rejects when the filename is invalid", async () => {
            const promise = LoadSceneAsync("/invalid.babylon", engine, { rootUrl: "http://example.com/" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });
    });

    // When a plugin is disposed mid-load (via its onDisposeObservable), the in-flight request is aborted and
    // pending data is removed, but the loading promise is never settled. It should reject so callers are not
    // left awaiting forever. This test currently fails because the operation hangs; it should pass once reworked.
    describe("Plugin disposed mid-load", () => {
        it("AppendSceneAsync rejects and clears pending data when the plugin is disposed", async () => {
            const { name, extension } = nextPluginIdentity("appenddispose");
            const onDisposeObservable = new Observable<void>();

            const plugin: ISceneLoaderPlugin & { onDisposeObservable: Observable<void> } = {
                name,
                extensions: extension,
                onDisposeObservable,
                // Never call onSuccess so the load stays in-flight until the plugin is disposed.
                loadFile: () => createFileRequest(),
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = AppendSceneAsync("scene.bin", scene, { pluginExtension: extension });

            // Allow the loader to register its dispose handler and start the request.
            await Promise.resolve();
            onDisposeObservable.notifyObservers();

            expect(await classifySettlement(promise)).toBe("rejected");
            expect(scene.getWaitingItemsCount()).toBe(0);

            await promise.catch(() => {});
        });
    });

    // An exception thrown by a user-supplied onProgress callback should not abort the whole load. Today the
    // loader routes the exception to its error handler, which rejects the operation. The load should instead
    // still succeed. This test currently fails (the operation rejects); it should pass once reworked.
    describe("Throwing onProgress callback", () => {
        it("ImportMeshAsync still resolves when onProgress throws", async () => {
            const { name, extension } = nextPluginIdentity("importprogressthrow");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: (_meshNames, _s, _data, _rootUrl, onProgress) => {
                    onProgress?.({ lengthComputable: true, loaded: 1, total: 2 });
                    return Promise.resolve(createEmptyAsyncResult());
                },
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const onProgress = vi.fn(() => {
                throw new Error("progress callback boom");
            });

            const promise = ImportMeshAsync("data:dummy", scene, { pluginExtension: extension, onProgress });

            expect(await classifySettlement(promise)).toBe("resolved");
            expect(onProgress).toHaveBeenCalledTimes(1);

            await promise.catch(() => {});
        });
    });

    describe("ImportAnimationsAsync", () => {
        it("imports animations and notifies the scene observable", async () => {
            const { name, extension } = nextPluginIdentity("animations");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const onImported = vi.fn();
            scene.onAnimationFileImportedObservable.add(onImported);

            await ImportAnimationsAsync("data:dummy", scene, { pluginExtension: extension });

            expect(onImported).toHaveBeenCalledTimes(1);
            expect(onImported).toHaveBeenCalledWith(scene, expect.anything());
        });

        // importAnimationsImplAsync returns early on an unrecognized animationGroupLoadingMode without ever
        // calling onSuccess or onError, so the promise never settles. It should reject instead. This test
        // currently fails (the operation hangs); it should pass once the loader is reworked.
        it("rejects on an unknown animationGroupLoadingMode", async () => {
            vi.spyOn(console, "error").mockImplementation(() => {});
            const { name, extension } = nextPluginIdentity("animationsbadmode");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = ImportAnimationsAsync("data:dummy", scene, {
                pluginExtension: extension,
                overwriteAnimations: false,
                // 999 is not a valid SceneLoaderAnimationGroupLoadingMode value.
                animationGroupLoadingMode: 999 as never,
            });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });
    });

    // Every internal loader function returns early (without settling) when no scene is available. Since scene
    // defaults to EngineStore.LastCreatedScene, a null scene is a real runtime possibility. The operation
    // should reject rather than hang. These tests currently fail (the operations hang); they should pass once
    // the loader is reworked.
    describe("No scene available", () => {
        beforeEach(() => {
            vi.spyOn(console, "error").mockImplementation(() => {});
        });

        it("ImportMeshAsync rejects when the scene is null", async () => {
            const promise = ImportMeshAsync("data:dummy", null as unknown as Scene, { pluginExtension: ".null" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("AppendSceneAsync rejects when the scene is null", async () => {
            const promise = AppendSceneAsync("data:dummy", null as unknown as Scene, { pluginExtension: ".null" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });

        it("LoadAssetContainerAsync rejects when the scene is null", async () => {
            const promise = LoadAssetContainerAsync("data:dummy", null as unknown as Scene, { pluginExtension: ".null" });
            expect(await classifySettlement(promise)).toBe("rejected");
            await promise.catch(() => {});
        });
    });

    describe("Plugin options", () => {
        it("rejects when the matched plugin is disabled via plugin options", async () => {
            const { name, extension } = nextPluginIdentity("disabled");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            await expect(
                ImportMeshAsync("data:dummy", scene, {
                    pluginExtension: extension,
                    pluginOptions: { [name]: { enabled: false } } as SceneLoaderPluginOptions,
                })
            ).rejects.toThrow(/is disabled/);
        });
    });

    describe("Plugin factories", () => {
        it("instantiates a plugin from a synchronous factory", async () => {
            const { name, extension } = nextPluginIdentity("factorysync");
            const importMeshAsync = vi.fn(() => Promise.resolve(createEmptyAsyncResult()));
            const createPlugin = vi.fn(
                (): ISceneLoaderPluginAsync => ({
                    name,
                    extensions: extension,
                    importMeshAsync,
                    loadAsync: () => Promise.resolve(),
                    loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
                })
            );
            const factory: ISceneLoaderPluginFactory = { name, extensions: extension, createPlugin };
            RegisterSceneLoaderPlugin(factory);

            await ImportMeshAsync("data:dummy", scene, { pluginExtension: extension });

            expect(createPlugin).toHaveBeenCalledTimes(1);
            expect(importMeshAsync).toHaveBeenCalledTimes(1);
        });

        it("instantiates a plugin from an asynchronous factory", async () => {
            const { name, extension } = nextPluginIdentity("factoryasync");
            const importMeshAsync = vi.fn(() => Promise.resolve(createEmptyAsyncResult()));
            const createPlugin = vi.fn(
                (): Promise<ISceneLoaderPluginAsync> =>
                    Promise.resolve({
                        name,
                        extensions: extension,
                        importMeshAsync,
                        loadAsync: () => Promise.resolve(),
                        loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
                    })
            );
            const factory: ISceneLoaderPluginFactory = { name, extensions: extension, createPlugin };
            RegisterSceneLoaderPlugin(factory);

            await ImportMeshAsync("data:dummy", scene, { pluginExtension: extension });

            expect(createPlugin).toHaveBeenCalledTimes(1);
            expect(importMeshAsync).toHaveBeenCalledTimes(1);
        });
    });

    describe("OnPluginActivatedObservable", () => {
        it("notifies observers with the activated plugin", async () => {
            const { name, extension } = nextPluginIdentity("activated");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult()),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const observer = vi.fn();
            const registration = SceneLoader.OnPluginActivatedObservable.add(observer);

            await ImportMeshAsync("data:dummy", scene, { pluginExtension: extension });

            expect(observer).toHaveBeenCalledWith(plugin, expect.anything());
            SceneLoader.OnPluginActivatedObservable.remove(registration);
        });
    });

    describe("Loading paths", () => {
        it("loads via the plugin loadFile callback for non-direct sources", async () => {
            const { name, extension } = nextPluginIdentity("loadfile");
            const loadFile = vi.fn((_s, _fileOrUrl, _rootUrl, onSuccess: (data: unknown) => void) => {
                onSuccess("file-data");
                return createFileRequest();
            });
            const load = vi.fn(() => true);
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                loadFile,
                importMesh: () => true,
                load,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await AppendSceneAsync("scene.data", scene, { pluginExtension: extension });

            expect(loadFile).toHaveBeenCalledTimes(1);
            expect(load).toHaveBeenCalledWith(scene, "file-data", expect.any(String), expect.any(Function));
        });

        it("resolves a promise returned from the plugin directLoad", async () => {
            const { name, extension } = nextPluginIdentity("directload");
            const directLoad = vi.fn(() => Promise.resolve("resolved-data"));
            const load = vi.fn(() => true);
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                canDirectLoad: () => true,
                directLoad,
                importMesh: () => true,
                load,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await AppendSceneAsync("data:payload", scene, { pluginExtension: extension });

            expect(directLoad).toHaveBeenCalledTimes(1);
            expect(load).toHaveBeenCalledWith(scene, "resolved-data", expect.any(String), expect.any(Function));
        });

        it("loads binary data from an ArrayBufferView via loadFile", async () => {
            const { name, extension } = nextPluginIdentity("binary");
            const data = new Uint8Array([1, 2, 3, 4]);
            const loadFile = vi.fn((_s, fileOrUrl, _rootUrl, onSuccess: (data: unknown) => void) => {
                onSuccess(fileOrUrl);
                return createFileRequest();
            });
            const load = vi.fn(() => true);
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: { [extension]: { isBinary: true } },
                loadFile,
                importMesh: () => true,
                load,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            await AppendSceneAsync(data, scene, { pluginExtension: extension });

            expect(loadFile).toHaveBeenCalledTimes(1);
            expect(load).toHaveBeenCalledWith(scene, data, expect.any(String), expect.any(Function));
        });
    });

    // The directLoad path can fail either by returning a rejected Promise or by throwing synchronously.
    // Both should reject the operation AND clear pending data. Today the async rejection is routed through
    // the loader's error handler (cleans up), but a synchronous throw propagates out of loadDataAsync
    // bypassing the error handler, so pending data leaks. These two tests document that asymmetry: the
    // async case passes today, the sync case fails until the loader is reworked.
    describe("directLoad error timing", () => {
        it("rejects and clears pending data when directLoad rejects asynchronously", async () => {
            const { name, extension } = nextPluginIdentity("directloadasyncreject");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                canDirectLoad: () => true,
                directLoad: () => Promise.reject(new Error("async directLoad boom")),
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = AppendSceneAsync("data:payload", scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("rejected");
            expect(scene.getWaitingItemsCount()).toBe(0);

            await promise.catch(() => {});
        });

        it("rejects and clears pending data when directLoad throws synchronously", async () => {
            const { name, extension } = nextPluginIdentity("directloadsyncthrow");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                canDirectLoad: () => true,
                directLoad: () => {
                    throw new Error("sync directLoad boom");
                },
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const promise = AppendSceneAsync("data:payload", scene, { pluginExtension: extension });
            expect(await classifySettlement(promise)).toBe("rejected");
            // Currently fails: the synchronous throw bypasses the error handler so pending data is leaked.
            expect(scene.getWaitingItemsCount()).toBe(0);

            await promise.catch(() => {});
        });
    });

    describe("Deprecated callback APIs", () => {
        it("SceneLoader.ImportMesh invokes the success callback", async () => {
            const { name, extension } = nextPluginIdentity("legacyimport");
            const mesh = new Mesh("legacy", scene);
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult({ meshes: [mesh] })),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const meshes = await new Promise<ReadonlyArray<Mesh>>((resolve, reject) => {
                SceneLoader.ImportMesh(
                    "",
                    "",
                    "data:dummy",
                    scene,
                    (loadedMeshes) => resolve(loadedMeshes as Mesh[]),
                    null,
                    (_s, message) => reject(new Error(message)),
                    extension
                );
            });

            expect(meshes).toEqual([mesh]);
        });

        it("SceneLoader.ImportMesh invokes the error callback on failure", async () => {
            const { name, extension } = nextPluginIdentity("legacyimporterror");
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.reject(new Error("legacy boom")),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const message = await new Promise<string>((resolve, reject) => {
                SceneLoader.ImportMesh(
                    "",
                    "",
                    "data:dummy",
                    scene,
                    () => reject(new Error("expected failure")),
                    null,
                    (_s, errorMessage) => resolve(errorMessage),
                    extension
                );
            });

            expect(message).toMatch(/legacy boom/);
        });

        it("SceneLoader.Append invokes the success callback", async () => {
            const { name, extension } = nextPluginIdentity("legacyappend");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const appendedScene = await new Promise<Scene>((resolve, reject) => {
                SceneLoader.Append(
                    "",
                    "data:dummy",
                    scene,
                    (s) => resolve(s),
                    null,
                    (_s, message) => reject(new Error(message)),
                    extension
                );
            });

            expect(appendedScene).toBe(scene);
        });

        it("SceneLoader.Load invokes the success callback", async () => {
            const { name, extension } = nextPluginIdentity("legacyload");
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: (s) => new AssetContainer(s),
            };
            RegisterSceneLoaderPlugin(plugin);

            const loadedScene = await new Promise<Scene>((resolve, reject) => {
                SceneLoader.Load(
                    "",
                    "data:dummy",
                    engine,
                    (s) => resolve(s),
                    null,
                    (_s, message) => reject(new Error(message)),
                    extension
                );
            });

            expect(loadedScene).toBeInstanceOf(Scene);
            loadedScene.dispose();
        });

        it("SceneLoader.LoadAssetContainer invokes the success callback", async () => {
            const { name, extension } = nextPluginIdentity("legacycontainer");
            const container = new AssetContainer(scene);
            const plugin: ISceneLoaderPlugin = {
                name,
                extensions: extension,
                importMesh: () => true,
                load: () => true,
                loadAssetContainer: () => container,
            };
            RegisterSceneLoaderPlugin(plugin);

            const loaded = await new Promise<AssetContainer>((resolve, reject) => {
                SceneLoader.LoadAssetContainer(
                    "",
                    "data:dummy",
                    scene,
                    (assets) => resolve(assets),
                    null,
                    (_s, message) => reject(new Error(message)),
                    extension
                );
            });

            expect(loaded).toBe(container);
        });

        it("SceneLoader.ImportMeshAsync resolves with the imported results", async () => {
            const { name, extension } = nextPluginIdentity("legacyimportasync");
            const mesh = new Mesh("legacyAsync", scene);
            const plugin: ISceneLoaderPluginAsync = {
                name,
                extensions: extension,
                importMeshAsync: () => Promise.resolve(createEmptyAsyncResult({ meshes: [mesh] })),
                loadAsync: () => Promise.resolve(),
                loadAssetContainerAsync: (s) => Promise.resolve(new AssetContainer(s)),
            };
            RegisterSceneLoaderPlugin(plugin);

            const loaded = await SceneLoader.ImportMeshAsync("", "", "data:dummy", scene, null, extension);

            expect(loaded.meshes).toEqual([mesh]);
        });
    });
});
