/** This file must only contain pure code and pure imports */
/* eslint-disable @typescript-eslint/naming-convention */

import { RegisterInstancedMesh } from "core/Meshes/instancedMesh.pure";
import { RegisterPbrMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { Tools } from "core/Misc/tools.pure";
import { type AbstractAssetContainer, AssetContainer } from "core/assetContainer";
import {
    type ISceneLoaderAsyncResult,
    type ISceneLoaderPluginAsync,
    type ISceneLoaderPluginFactory,
    type ISceneLoaderProgressEvent,
    type SceneLoaderPluginOptions,
    RegisterSceneLoaderPlugin,
} from "core/Loading/sceneLoader";
import { type Scene } from "core/scene.pure";

import { USDFileLoaderMetadata } from "./usdFileLoader.metadata";
import {
    type USDBinaryInput,
    type USDFileLoaderOptions,
    type USDImportDiagnostics,
    type USDImportStatistics,
    type USDImportTimings,
    type USDLoadProgress,
    type USDVirtualFiles,
} from "./usdLoadingOptions";
import { materializeCommandBuffers } from "./usdSceneMaterializer";
import { PROTOCOL_VERSION } from "./usdCommandProtocol";
import { type ExtractRequest, type WorkerResponse } from "./usdWorkerMessages";

interface PendingRequest {
    resolve: (response: Extract<WorkerResponse, { type: "result" }>) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: USDLoadProgress) => void;
    onLog?: USDFileLoaderOptions["onLog"];
}

interface USDLoadResult {
    container: AbstractAssetContainer;
    timings: USDImportTimings;
    statistics: USDImportStatistics;
    missingAssets: string[];
}

const _DefaultAssetRootUrl = `${Tools._DefaultCdnUrl}/babylonUsdImporter/${PROTOCOL_VERSION}/`;
const _SupportedExtension = /\.(?:usd|usda|usdc|usdz)$/i;

function _toBytes(input: USDBinaryInput): Uint8Array {
    if (input instanceof Uint8Array) {
        return input.slice();
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input.slice(0));
    }
    return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
}

function _normalizeFiles(files?: USDVirtualFiles): Record<string, Uint8Array> | undefined {
    if (!files) {
        return undefined;
    }
    const normalized: Record<string, Uint8Array> = {};
    for (const [path, input] of Object.entries(files)) {
        normalized[path] = _toBytes(input);
    }
    return normalized;
}

function _stagedFileName(fileName: string | undefined, bytes: Uint8Array): string {
    const cleanFileName = fileName?.replace(/\\/g, "/").replace(/^\.\/+/, "");
    const pathParts = cleanFileName?.split("/").filter(Boolean);
    if (cleanFileName && !cleanFileName.startsWith("/") && pathParts?.length && !pathParts.includes("..") && _SupportedExtension.test(cleanFileName)) {
        return pathParts.join("/");
    }
    const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
    return isZip ? "scene.usdz" : "scene.usd";
}

function _toAsyncResult(container: AbstractAssetContainer): ISceneLoaderAsyncResult {
    return {
        meshes: container.meshes,
        particleSystems: container.particleSystems,
        skeletons: container.skeletons,
        animationGroups: container.animationGroups,
        transformNodes: container.transformNodes,
        geometries: container.geometries,
        lights: container.lights,
        spriteManagers: container.spriteManagers,
    };
}

/**
 * OpenUSD scene loader backed by a WebAssembly command-buffer extractor.
 */
export class USDFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Default URLs for the prebuilt OpenUSD importer assets.
     */
    public static DefaultConfiguration = {
        glueUrl: `${_DefaultAssetRootUrl}babylon-usd-importer.js`,
        wasmUrl: `${_DefaultAssetRootUrl}babylon-usd-importer.wasm`,
        dataUrl: `${_DefaultAssetRootUrl}babylon-usd-importer.data`,
        workerUrl: `${_DefaultAssetRootUrl}babylon-usd-importer.worker.js`,
    };

    /**
     * Defines the name of the plugin.
     */
    public readonly name = USDFileLoaderMetadata.name;

    /**
     * Defines the extensions the plugin can load.
     */
    public readonly extensions = USDFileLoaderMetadata.extensions;

    private readonly _options: USDFileLoaderOptions;
    private _worker: Worker | undefined;
    private _workerUrl: string | undefined;
    private _workerBlobUrl: string | undefined;
    private _nextRequestId = 1;
    private readonly _pending = new Map<number, PendingRequest>();

    /**
     * Creates a USD loader.
     * @param options Options controlling worker assets, supporting files, and diagnostics.
     */
    public constructor(options: Partial<USDFileLoaderOptions> = {}) {
        this._options = {
            resolveByFileName: true,
            glueUrl: USDFileLoader.DefaultConfiguration.glueUrl,
            wasmUrl: USDFileLoader.DefaultConfiguration.wasmUrl,
            dataUrl: USDFileLoader.DefaultConfiguration.dataUrl,
            workerUrl: USDFileLoader.DefaultConfiguration.workerUrl,
            ...options,
        };
    }

    /**
     * Creates a configured plugin instance for a SceneLoader operation.
     * @param options SceneLoader plugin options.
     * @returns The configured USD loader.
     */
    public createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPluginAsync {
        _RegisterUSDLoaderDependencies();
        return new USDFileLoader(options[USDFileLoaderMetadata.name]);
    }

    /**
     * Imports all objects from a USD stage into a scene.
     * @param _meshesNames Mesh name filtering is not currently supported.
     * @param scene The scene receiving the imported objects.
     * @param data The USD, USDA, USDC, or USDZ bytes.
     * @param rootUrl The source root URL.
     * @param onProgress SceneLoader progress callback.
     * @param fileName Name of the root USD layer.
     * @returns The imported Babylon.js objects.
     */
    public async importMeshAsync(
        _meshesNames: string | readonly string[] | null | undefined,
        scene: Scene,
        data: unknown,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        const result = await this._loadAsync(scene, data, rootUrl, onProgress, fileName, true);
        return _toAsyncResult(result.container);
    }

    /**
     * Loads a USD stage into a scene.
     * @param scene The scene receiving the imported objects.
     * @param data The USD, USDA, USDC, or USDZ bytes.
     * @param rootUrl The source root URL.
     * @param onProgress SceneLoader progress callback.
     * @param fileName Name of the root USD layer.
     */
    public async loadAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void> {
        await this._loadAsync(scene, data, rootUrl, onProgress, fileName, true);
    }

    /**
     * Loads a USD stage into an asset container.
     * @param scene The scene used to create imported objects.
     * @param data The USD, USDA, USDC, or USDZ bytes.
     * @param rootUrl The source root URL.
     * @param onProgress SceneLoader progress callback.
     * @param fileName Name of the root USD layer.
     * @returns The populated asset container.
     */
    public async loadAssetContainerAsync(
        scene: Scene,
        data: unknown,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<AssetContainer> {
        const container = (await this._loadAsync(scene, data, rootUrl, onProgress, fileName, false)).container;
        if (!(container instanceof AssetContainer)) {
            throw new Error("USDFileLoader failed to create an asset container.");
        }
        return container;
    }

    /**
     * Releases the worker and rejects pending loads.
     */
    public dispose(): void {
        this._terminateWorker();
        const error = new Error("USDFileLoader was disposed.");
        for (const request of this._pending.values()) {
            request.reject(error);
        }
        this._pending.clear();
    }

    private async _loadAsync(
        scene: Scene,
        data: unknown,
        _rootUrl: string,
        onProgress: ((event: ISceneLoaderProgressEvent) => void) | undefined,
        fileName: string | undefined,
        addToScene: boolean
    ): Promise<USDLoadResult> {
        if (!(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) {
            throw new Error("USDFileLoader expects binary USD data.");
        }
        const bytes = _toBytes(data);
        const files = _normalizeFiles(this._options.files);
        const requestId = this._nextRequestId++;
        const request: ExtractRequest = {
            type: "extract",
            requestId,
            asset: {
                bytes,
                files,
                fileName: _stagedFileName(this._options.rootFileName ?? fileName, bytes),
                resolveByFileName: this._options.resolveByFileName ?? true,
                glueUrl: this._options.glueUrl,
                wasmUrl: this._options.wasmUrl,
                dataUrl: this._options.dataUrl,
            },
        };
        const transfer = [...new Set([bytes.buffer, ...Object.values(files ?? {}).map((file) => file.buffer)])];
        try {
            const worker = this._getWorker(this._options.workerUrl);
            const response = await new Promise<Extract<WorkerResponse, { type: "result" }>>((resolve, reject) => {
                this._pending.set(requestId, {
                    resolve,
                    reject,
                    onProgress: (progress) => {
                        this._options.onProgress?.(progress);
                        onProgress?.({
                            lengthComputable: false,
                            loaded: _ProgressPhaseIndex[progress.phase],
                            total: 4,
                        });
                    },
                    onLog: this._options.onLog,
                });
                try {
                    worker.postMessage(request, transfer);
                } catch (error) {
                    this._pending.delete(requestId);
                    reject(error instanceof Error ? error : new Error(String(error)));
                }
            });

            const materializingProgress = {
                phase: "materializing",
                message: "Creating Babylon.js objects...",
            } as const;
            this._options.onProgress?.(materializingProgress);
            onProgress?.({ lengthComputable: false, loaded: 4, total: 4 });
            const materialized = await materializeCommandBuffers(scene, response.commands, response.data, addToScene);
            const result = {
                container: materialized.container,
                timings: {
                    ...response.timings,
                    materializeMs: materialized.materializeMs,
                },
                statistics: response.statistics,
                missingAssets: response.missingAssets,
            };
            try {
                this._options.onComplete?.({
                    timings: result.timings,
                    statistics: result.statistics,
                    missingAssets: result.missingAssets,
                } satisfies USDImportDiagnostics);
            } catch (error) {
                materialized.container.dispose();
                throw error;
            }
            return result;
        } finally {
            if (this._pending.size === 0) {
                this._terminateWorker();
            }
        }
    }

    private _getWorker(workerUrl?: string | URL): Worker {
        if (!workerUrl) {
            throw new Error("The USD worker URL was not configured.");
        }
        const currentLocation = globalThis.location;
        const resolvedUrl = new URL(String(workerUrl), currentLocation?.href ?? "http://localhost/").href;
        if (this._worker && this._workerUrl !== resolvedUrl) {
            if (this._pending.size > 0) {
                throw new Error("Cannot change the USD worker URL while requests are pending.");
            }
            this._terminateWorker();
        }
        if (this._worker) {
            return this._worker;
        }
        this._workerUrl = resolvedUrl;
        if (!currentLocation || new URL(resolvedUrl).origin === currentLocation.origin) {
            this._worker = new Worker(resolvedUrl, { type: "module" });
        } else {
            this._workerBlobUrl = URL.createObjectURL(new Blob([`import ${JSON.stringify(resolvedUrl)};`], { type: "application/javascript" }));
            this._worker = new Worker(this._workerBlobUrl, { type: "module" });
        }
        this._worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;
            const pending = this._pending.get(response.requestId);
            if (!pending) {
                return;
            }
            if (response.type === "progress") {
                pending.onProgress?.(response.progress);
                return;
            }
            if (response.type === "log") {
                pending.onLog?.(response.level >= 2 ? "error" : response.level === 1 ? "warning" : "info", response.message);
                return;
            }
            this._pending.delete(response.requestId);
            if (response.type === "error") {
                const error = new Error(response.message);
                error.stack = response.stack;
                pending.reject(error);
            } else {
                pending.resolve(response);
            }
        });
        const fail = (error: Error) => {
            this._terminateWorker();
            for (const request of this._pending.values()) {
                request.reject(error);
            }
            this._pending.clear();
        };
        this._worker.addEventListener("error", (event) => {
            fail(event.error ?? new Error(event.message || `Could not load the USD worker from '${resolvedUrl}'.`));
        });
        this._worker.addEventListener("messageerror", () => {
            fail(new Error("The USD worker returned a message that could not be deserialized."));
        });
        return this._worker;
    }

    private _terminateWorker(): void {
        this._worker?.terminate();
        this._worker = undefined;
        this._workerUrl = undefined;
        if (this._workerBlobUrl) {
            URL.revokeObjectURL(this._workerBlobUrl);
            this._workerBlobUrl = undefined;
        }
    }
}

const _ProgressPhaseIndex: Record<USDLoadProgress["phase"], number> = {
    initializing: 1,
    staging: 2,
    extracting: 3,
    materializing: 4,
};

let _Registered = false;

/** @internal */
export function _RegisterUSDLoaderDependencies(): void {
    RegisterPbrMaterial();
    RegisterInstancedMesh();
}

/**
 * Registers the USD scene loader plugin and its Babylon.js runtime dependencies.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterUSDFileLoader(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;
    _RegisterUSDLoaderDependencies();
    RegisterSceneLoaderPlugin(new USDFileLoader());
}
