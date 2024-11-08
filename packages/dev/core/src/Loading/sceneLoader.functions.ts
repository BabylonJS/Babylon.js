import type { AssetContainer } from "core/assetContainer";
import { EngineStore } from "core/Engines/engineStore";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";
import {
    ISceneLoaderAsyncResult,
    ISceneLoaderPlugin,
    ISceneLoaderPluginAsync,
    ISceneLoaderPluginFactory,
    ISceneLoaderProgressEvent,
    LoadOptions,
    SceneLoaderAnimationGroupLoadingMode,
    SceneLoaderPluginOptions,
    SceneLoaderSuccessCallback,
} from "./sceneLoader";
import { Observable } from "core/Misc/observable";
import { Tools } from "core/Misc/tools";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { RandomGUID } from "core/Misc/guid";
import { ErrorCodes, RuntimeError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";
import type { WebRequest } from "core/Misc/webRequest";
import type { LoadFileError } from "core/Misc/fileTools";
import { IsBase64DataUrl } from "core/Misc/fileTools";
import type { IFileRequest } from "core/Misc/fileRequest";
import { _FetchAsync } from "core/Misc/webRequest.fetch";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { IParticleSystem } from "core/Particles/IParticleSystem";
import { Skeleton } from "core/Bones/skeleton";
import { SceneLoaderFlags } from "./sceneLoaderFlags";

/**
 * Defines internal only plugin members.
 */
interface ISceneLoaderPluginInternal {
    /**
     * An optional observable to notify when the plugin is disposed
     */
    readonly onDisposeObservable: Observable<void>;
}

/**
 * Defines a plugin registered by the SceneLoader
 */
interface IRegisteredPlugin {
    /**
     * Defines the plugin to use
     */
    plugin: ((ISceneLoaderPlugin | ISceneLoaderPluginAsync) & Partial<ISceneLoaderPluginInternal>) | ISceneLoaderPluginFactory;
    /**
     * Defines if the plugin supports binary data
     */
    isBinary: boolean;
    mimeType?: string;
}

function isFactory(pluginOrFactory: IRegisteredPlugin["plugin"]): pluginOrFactory is ISceneLoaderPluginFactory {
    return !!(pluginOrFactory as ISceneLoaderPluginFactory).createPlugin;
}

/**
 * Defines file information
 */
interface IFileInfo {
    /**
     * Gets the file url
     */
    url: string;
    /**
     * Gets the root url
     */
    rootUrl: string;
    /**
     * Gets filename
     */
    name: string;
    /**
     * Gets the file
     */
    file: Nullable<File>;

    /**
     * Gets raw binary data.
     */
    rawData: Nullable<ArrayBufferView>;
}

/**
 * Adds default/implicit options to plugin specific options.
 */
type DefaultPluginOptions<BasePluginOptions> = {
    /**
     * Defines if the plugin is enabled
     */
    enabled?: boolean;
} & BasePluginOptions;

// This captures the type defined inline for the pluginOptions property, which is just SceneLoaderPluginOptions wrapped with DefaultPluginOptions.
// We do it this way rather than explicitly defining the type here and then using it in SceneLoaderOptions because we want the full expanded type
// to show up in the user's intellisense to make it easier to understand what options are available.
type PluginOptions = SceneLoaderOptions["pluginOptions"];

export type SceneSource = string | File | ArrayBufferView;

/**
 * Defines common options for loading operations performed by SceneLoader.
 */
export interface SceneLoaderOptions {
    /**
     * A string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     */
    rootUrl?: string;

    /**
     * A callback with a progress event for each file being loaded
     */
    onProgress?: (event: ISceneLoaderProgressEvent) => void;

    /**
     * The extension used to determine the plugin
     */
    pluginExtension?: string;

    /**
     * Defines the filename, if the data is binary
     */
    name?: string;

    /**
     * Defines options for the registered plugins
     */
    pluginOptions?: {
        // NOTE: This type is doing two things:
        // 1. Adding an implicit 'enabled' property to the options for each plugin.
        // 2. Creating a mapped type of all the options of all the plugins to make it just look like a consolidated plain object in intellisense for the user.
        [Plugin in keyof SceneLoaderPluginOptions]?: {
            [Option in keyof DefaultPluginOptions<SceneLoaderPluginOptions[Plugin]>]: DefaultPluginOptions<SceneLoaderPluginOptions[Plugin]>[Option];
        };
    };
}

function isFile(value: unknown): value is File {
    return !!(value as File).name;
}

const onPluginActivatedObservable = new Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>();
/** @internal */
export const registeredPlugins: { [extension: string]: IRegisteredPlugin } = {};

function getDefaultPlugin(): IRegisteredPlugin | undefined {
    return registeredPlugins[".babylon"];
}

function getPluginForMimeType(mimeType: string): IRegisteredPlugin | undefined {
    for (const registeredPluginKey in registeredPlugins) {
        const registeredPlugin = registeredPlugins[registeredPluginKey];
        if (registeredPlugin.mimeType === mimeType) {
            return registeredPlugin;
        }
    }
    return undefined;
}

function getPluginForExtension(extension: string, returnDefault: boolean): IRegisteredPlugin | undefined {
    const registeredPlugin = registeredPlugins[extension];
    if (registeredPlugin) {
        return registeredPlugin;
    }
    Logger.Warn(
        "Unable to find a plugin to load " +
            extension +
            " files. Trying to use .babylon default plugin. To load from a specific filetype (eg. gltf) see: https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes"
    );
    return returnDefault ? getDefaultPlugin() : undefined;
}

function isPluginForExtensionAvailable(extension: string): boolean {
    return !!registeredPlugins[extension];
}

function getPluginForDirectLoad(data: string): IRegisteredPlugin | undefined {
    for (const extension in registeredPlugins) {
        const plugin = registeredPlugins[extension].plugin;

        if (plugin.canDirectLoad && plugin.canDirectLoad(data)) {
            return registeredPlugins[extension];
        }
    }

    return getDefaultPlugin();
}

function getFilenameExtension(sceneFilename: string): string {
    const queryStringPosition = sceneFilename.indexOf("?");

    if (queryStringPosition !== -1) {
        sceneFilename = sceneFilename.substring(0, queryStringPosition);
    }

    const dotPosition = sceneFilename.lastIndexOf(".");

    return sceneFilename.substring(dotPosition, sceneFilename.length).toLowerCase();
}

function getDirectLoad(sceneFilename: string): Nullable<string> {
    if (sceneFilename.substring(0, 5) === "data:") {
        return sceneFilename.substring(5);
    }

    return null;
}

/** @internal */
export function _formatErrorMessage(fileInfo: IFileInfo, message?: string, exception?: any): string {
    const fromLoad = fileInfo.rawData ? "binary data" : fileInfo.url;
    let errorMessage = "Unable to load from " + fromLoad;

    if (message) {
        errorMessage += `: ${message}`;
    } else if (exception) {
        errorMessage += `: ${exception}`;
    }

    return errorMessage;
}

async function loadDataAsync(
    fileInfo: IFileInfo,
    scene: Scene,
    onSuccess: (plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync, data: unknown, responseURL?: string) => void,
    onProgress: ((event: ISceneLoaderProgressEvent) => void) | undefined,
    onError: (message?: string, exception?: any) => void,
    onDispose: () => void,
    pluginExtension: Nullable<string>,
    name: string,
    pluginOptions: PluginOptions
): Promise<Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>> {
    const directLoad = getDirectLoad(fileInfo.url);

    if (fileInfo.rawData && !pluginExtension) {
        // eslint-disable-next-line no-throw-literal
        throw "When using ArrayBufferView to load data the file extension must be provided.";
    }

    let registeredPlugin: IRegisteredPlugin | undefined;
    const fileExtension = !directLoad && !pluginExtension ? getFilenameExtension(fileInfo.url) : "";

    if (!registeredPlugin) {
        registeredPlugin = pluginExtension
            ? getPluginForExtension(pluginExtension, true)
            : directLoad
              ? getPluginForDirectLoad(fileInfo.url)
              : getPluginForExtension(fileExtension, false);
    }

    if (!registeredPlugin && fileExtension) {
        // Fetching head content to get the mime type
        const response = await _FetchAsync(fileInfo.url, { method: "HEAD", responseHeaders: ["Content-Type"] });
        const mimeType = response.headerValues ? response.headerValues["Content-Type"] : "";
        if (mimeType) {
            registeredPlugin = getPluginForMimeType(mimeType);
        }
    }

    if (!registeredPlugin) {
        throw new Error(`No plugin or fallback for ${pluginExtension ?? fileInfo.url}`);
    }

    if (pluginOptions?.[registeredPlugin.plugin.name]?.enabled === false) {
        throw new Error(`The '${registeredPlugin.plugin.name}' plugin is disabled via the loader options passed to the loading operation.`);
    }

    if (fileInfo.rawData && !registeredPlugin.isBinary) {
        // eslint-disable-next-line no-throw-literal
        throw "Loading from ArrayBufferView can not be used with plugins that don't support binary loading.";
    }

    const getPluginInstance = (callback: (plugin: (ISceneLoaderPlugin | ISceneLoaderPluginAsync) & Partial<ISceneLoaderPluginInternal>) => void) => {
        // For plugin factories, the plugin is instantiated on each SceneLoader operation. This makes options handling
        // much simpler as we can just pass the options to the factory, rather than passing options through to every possible
        // plugin call. Given this, options are only supported for plugins that provide a factory function.
        if (isFactory(registeredPlugin!.plugin)) {
            const pluginFactory = registeredPlugin!.plugin;
            const partialPlugin = pluginFactory.createPlugin(pluginOptions ?? {});
            if (partialPlugin instanceof Promise) {
                partialPlugin.then(callback).catch((error) => {
                    onError("Error instantiating plugin.", error);
                });
                // When async factories are used, the plugin instance cannot be returned synchronously.
                // In this case, the legacy loader functions will return null.
                return null;
            } else {
                callback(partialPlugin);
                return partialPlugin;
            }
        } else {
            callback(registeredPlugin!.plugin);
            return registeredPlugin!.plugin;
        }
    };

    return getPluginInstance((plugin) => {
        if (!plugin) {
            // eslint-disable-next-line no-throw-literal
            throw `The loader plugin corresponding to the '${pluginExtension}' file type has not been found. If using es6, please import the plugin you wish to use before.`;
        }

        onPluginActivatedObservable.notifyObservers(plugin);

        // Check if we have a direct load url. If the plugin is registered to handle
        // it or it's not a base64 data url, then pass it through the direct load path.
        if (directLoad && ((plugin.canDirectLoad && plugin.canDirectLoad(fileInfo.url)) || !IsBase64DataUrl(fileInfo.url))) {
            if (plugin.directLoad) {
                const result = plugin.directLoad(scene, directLoad);
                if (result instanceof Promise) {
                    result
                        .then((data: unknown) => {
                            onSuccess(plugin, data);
                        })
                        .catch((error: any) => {
                            onError("Error in directLoad of _loadData: " + error, error);
                        });
                } else {
                    onSuccess(plugin, result);
                }
            } else {
                onSuccess(plugin, directLoad);
            }
            return;
        }

        const useArrayBuffer = registeredPlugin!.isBinary;

        const dataCallback = (data: unknown, responseURL?: string) => {
            if (scene.isDisposed) {
                onError("Scene has been disposed");
                return;
            }

            onSuccess(plugin, data, responseURL);
        };

        let request: Nullable<IFileRequest> = null;
        let pluginDisposed = false;
        plugin.onDisposeObservable?.add(() => {
            pluginDisposed = true;

            if (request) {
                request.abort();
                request = null;
            }

            onDispose();
        });

        const manifestChecked = () => {
            if (pluginDisposed) {
                return;
            }

            const errorCallback = (request?: WebRequest, exception?: LoadFileError) => {
                onError(request?.statusText, exception);
            };

            if (!plugin.loadFile && fileInfo.rawData) {
                // eslint-disable-next-line no-throw-literal
                throw "Plugin does not support loading ArrayBufferView.";
            }

            request = plugin.loadFile
                ? plugin.loadFile(scene, fileInfo.rawData || fileInfo.file || fileInfo.url, fileInfo.rootUrl, dataCallback, onProgress, useArrayBuffer, errorCallback, name)
                : scene._loadFile(fileInfo.file || fileInfo.url, dataCallback, onProgress, true, useArrayBuffer, errorCallback);
        };

        const engine = scene.getEngine();
        let canUseOfflineSupport = engine.enableOfflineSupport;
        if (canUseOfflineSupport) {
            // Also check for exceptions
            let exceptionFound = false;
            for (const regex of scene.disableOfflineSupportExceptionRules) {
                if (regex.test(fileInfo.url)) {
                    exceptionFound = true;
                    break;
                }
            }

            canUseOfflineSupport = !exceptionFound;
        }

        if (canUseOfflineSupport && AbstractEngine.OfflineProviderFactory) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            scene.offlineProvider = AbstractEngine.OfflineProviderFactory(fileInfo.url, manifestChecked, engine.disableManifestCheck);
        } else {
            manifestChecked();
        }
    });
}

/** @internal */
export function _getFileInfo(rootUrl: string, sceneSource: SceneSource): Nullable<IFileInfo> {
    let url: string;
    let name: string;
    let file: Nullable<File> = null;
    let rawData: Nullable<ArrayBufferView> = null;

    if (!sceneSource) {
        url = rootUrl;
        name = Tools.GetFilename(rootUrl);
        rootUrl = Tools.GetFolderPath(rootUrl);
    } else if (isFile(sceneSource)) {
        url = `file:${sceneSource.name}`;
        name = sceneSource.name;
        file = sceneSource;
    } else if (ArrayBuffer.isView(sceneSource)) {
        url = "";
        name = RandomGUID();
        rawData = sceneSource;
    } else if (sceneSource.startsWith("data:")) {
        url = sceneSource;
        name = "";
    } else if (rootUrl) {
        const filename = sceneSource;
        if (filename.substring(0, 1) === "/") {
            Tools.Error("Wrong sceneFilename parameter");
            return null;
        }

        url = rootUrl + filename;
        name = filename;
    } else {
        url = sceneSource;
        name = Tools.GetFilename(sceneSource);
        rootUrl = Tools.GetFolderPath(sceneSource);
    }

    return {
        url: url,
        rootUrl: rootUrl,
        name: name,
        file: file,
        rawData,
    };
}

export async function LoadAssetContainerAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    onSuccess: Nullable<(assets: AssetContainer) => void> = null,
    onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
    onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
    pluginExtension: Nullable<string> = null,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>> {
    if (!scene) {
        Logger.Error("No scene available to load asset container to");
        return null;
    }

    const fileInfo = _getFileInfo(rootUrl, sceneFilename);
    if (!fileInfo) {
        return null;
    }

    const loadingToken = {};
    scene.addPendingData(loadingToken);

    const disposeHandler = () => {
        scene.removePendingData(loadingToken);
    };

    const errorHandler = (message?: string, exception?: any) => {
        const errorMessage = _formatErrorMessage(fileInfo, message, exception);

        if (onError) {
            onError(scene, errorMessage, new RuntimeError(errorMessage, ErrorCodes.SceneLoaderError, exception));
        } else {
            Logger.Error(errorMessage);
            // should the exception be thrown?
        }

        disposeHandler();
    };

    const progressHandler = onProgress
        ? (event: ISceneLoaderProgressEvent) => {
              try {
                  onProgress(event);
              } catch (e) {
                  errorHandler("Error in onProgress callback", e);
              }
          }
        : undefined;

    const successHandler = (assets: AssetContainer) => {
        if (onSuccess) {
            try {
                onSuccess(assets);
            } catch (e) {
                errorHandler("Error in onSuccess callback", e);
            }
        }

        scene.removePendingData(loadingToken);
    };

    return await loadDataAsync(
        fileInfo,
        scene,
        (plugin, data) => {
            if ((plugin as ISceneLoaderPlugin).loadAssetContainer) {
                const syncedPlugin = <ISceneLoaderPlugin>plugin;
                const assetContainer = syncedPlugin.loadAssetContainer(scene, data, fileInfo.rootUrl, errorHandler);
                if (!assetContainer) {
                    return;
                }
                assetContainer.populateRootNodes();
                scene.loadingPluginName = plugin.name;
                successHandler(assetContainer);
            } else if ((plugin as ISceneLoaderPluginAsync).loadAssetContainerAsync) {
                const asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                asyncedPlugin
                    .loadAssetContainerAsync(scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name)
                    .then((assetContainer) => {
                        assetContainer.populateRootNodes();
                        scene.loadingPluginName = plugin.name;
                        successHandler(assetContainer);
                    })
                    .catch((error) => {
                        errorHandler(error.message, error);
                    });
            } else {
                errorHandler("LoadAssetContainer is not supported by this plugin. Plugin did not provide a loadAssetContainer or loadAssetContainerAsync method.");
            }
        },
        progressHandler,
        errorHandler,
        disposeHandler,
        pluginExtension,
        name,
        pluginOptions
    );
}

async function importMeshAsync(
    meshNames: string | readonly string[] | null | undefined,
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    onSuccess: Nullable<SceneLoaderSuccessCallback> = null,
    onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
    onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
    pluginExtension: Nullable<string> = null,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>> {
    if (!scene) {
        Logger.Error("No scene available to import mesh to");
        return null;
    }

    const fileInfo = _getFileInfo(rootUrl, sceneFilename);
    if (!fileInfo) {
        return null;
    }

    const loadingToken = {};
    scene.addPendingData(loadingToken);

    const disposeHandler = () => {
        scene.removePendingData(loadingToken);
    };

    const errorHandler = (message?: string, exception?: any) => {
        const errorMessage = _formatErrorMessage(fileInfo, message, exception);

        if (onError) {
            onError(scene, errorMessage, new RuntimeError(errorMessage, ErrorCodes.SceneLoaderError, exception));
        } else {
            Logger.Error(errorMessage);
            // should the exception be thrown?
        }

        disposeHandler();
    };

    const progressHandler = onProgress
        ? (event: ISceneLoaderProgressEvent) => {
              try {
                  onProgress(event);
              } catch (e) {
                  errorHandler("Error in onProgress callback: " + e, e);
              }
          }
        : undefined;

    const successHandler: SceneLoaderSuccessCallback = (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights, spriteManagers) => {
        scene.importedMeshesFiles.push(fileInfo.url);

        if (onSuccess) {
            try {
                onSuccess(meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights, spriteManagers);
            } catch (e) {
                errorHandler("Error in onSuccess callback: " + e, e);
            }
        }

        scene.removePendingData(loadingToken);
    };

    return await loadDataAsync(
        fileInfo,
        scene,
        (plugin, data, responseURL) => {
            if (plugin.rewriteRootURL) {
                fileInfo.rootUrl = plugin.rewriteRootURL(fileInfo.rootUrl, responseURL);
            }

            if ((plugin as ISceneLoaderPlugin).importMesh) {
                const syncedPlugin = <ISceneLoaderPlugin>plugin;
                const meshes: AbstractMesh[] = [];
                const particleSystems: IParticleSystem[] = [];
                const skeletons: Skeleton[] = [];

                if (!syncedPlugin.importMesh(meshNames, scene, data, fileInfo.rootUrl, meshes, particleSystems, skeletons, errorHandler)) {
                    return;
                }

                scene.loadingPluginName = plugin.name;
                successHandler(meshes, particleSystems, skeletons, [], [], [], [], []);
            } else {
                const asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                asyncedPlugin
                    .importMeshAsync(meshNames, scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name)
                    .then((result) => {
                        scene.loadingPluginName = plugin.name;
                        successHandler(
                            result.meshes,
                            result.particleSystems,
                            result.skeletons,
                            result.animationGroups,
                            result.transformNodes,
                            result.geometries,
                            result.lights,
                            result.spriteManagers
                        );
                    })
                    .catch((error) => {
                        errorHandler(error.message, error);
                    });
            }
        },
        progressHandler,
        errorHandler,
        disposeHandler,
        pluginExtension,
        name,
        pluginOptions
    );
}

function importMeshAsyncCore(
    meshNames: string | readonly string[] | null | undefined,
    rootUrl: string,
    sceneFilename?: SceneSource,
    scene?: Nullable<Scene>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<ISceneLoaderAsyncResult> {
    return new Promise((resolve, reject) => {
        importMeshAsync(
            meshNames,
            rootUrl,
            sceneFilename,
            scene,
            (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights, spriteManagers) => {
                resolve({
                    meshes: meshes,
                    particleSystems: particleSystems,
                    skeletons: skeletons,
                    animationGroups: animationGroups,
                    transformNodes: transformNodes,
                    geometries: geometries,
                    lights: lights,
                    spriteManagers: spriteManagers,
                });
            },
            onProgress,
            (scene, message, exception) => {
                reject(exception || new Error(message));
            },
            pluginExtension,
            name,
            pluginOptions
        );
    });
}

function loadScene(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    engine: Nullable<AbstractEngine> = EngineStore.LastCreatedEngine,
    onSuccess: Nullable<(scene: Scene) => void> = null,
    onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
    onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
    pluginExtension: Nullable<string> = null,
    name = "",
    pluginOptions: PluginOptions = {}
): void {
    if (!engine) {
        Tools.Error("No engine available");
        return;
    }

    appendAsync(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene
 * @experimental
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param engine is the instance of BABYLON.Engine to use to create the scene
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded scene
 */
export function LoadSceneAsync(source: SceneSource, engine: AbstractEngine, options?: LoadOptions): Promise<Scene> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return loadSceneAsyncCore(rootUrl, source, engine, onProgress, pluginExtension, name, pluginOptions);
}

export function loadSceneAsyncCore(
    rootUrl: string,
    sceneFilename?: SceneSource,
    engine?: Nullable<AbstractEngine>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<Scene> {
    return new Promise((resolve, reject) => {
        loadScene(
            rootUrl,
            sceneFilename,
            engine,
            (scene) => {
                resolve(scene);
            },
            onProgress,
            (scene, message, exception) => {
                reject(exception || new Error(message));
            },
            pluginExtension,
            name,
            pluginOptions
        );
    });
}

let showingLoadingScreen = false;

async function appendAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    onSuccess: Nullable<(scene: Scene) => void> = null,
    onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
    onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
    pluginExtension: Nullable<string> = null,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>> {
    if (!scene) {
        Logger.Error("No scene available to append to");
        return null;
    }

    const fileInfo = _getFileInfo(rootUrl, sceneFilename);
    if (!fileInfo) {
        return null;
    }

    const loadingToken = {};
    scene.addPendingData(loadingToken);

    const disposeHandler = () => {
        scene.removePendingData(loadingToken);
    };

    if (SceneLoaderFlags.ShowLoadingScreen && !showingLoadingScreen) {
        showingLoadingScreen = true;
        scene.getEngine().displayLoadingUI();
        scene.executeWhenReady(() => {
            scene.getEngine().hideLoadingUI();
            showingLoadingScreen = false;
        });
    }

    const errorHandler = (message?: string, exception?: any) => {
        const errorMessage = _formatErrorMessage(fileInfo, message, exception);

        if (onError) {
            onError(scene, errorMessage, new RuntimeError(errorMessage, ErrorCodes.SceneLoaderError, exception));
        } else {
            Logger.Error(errorMessage);
            // should the exception be thrown?
        }

        disposeHandler();
    };

    const progressHandler = onProgress
        ? (event: ISceneLoaderProgressEvent) => {
              try {
                  onProgress(event);
              } catch (e) {
                  errorHandler("Error in onProgress callback", e);
              }
          }
        : undefined;

    const successHandler = () => {
        if (onSuccess) {
            try {
                onSuccess(scene);
            } catch (e) {
                errorHandler("Error in onSuccess callback", e);
            }
        }

        scene.removePendingData(loadingToken);
    };

    return await loadDataAsync(
        fileInfo,
        scene,
        (plugin, data) => {
            if ((plugin as ISceneLoaderPlugin).load) {
                const syncedPlugin = <ISceneLoaderPlugin>plugin;
                if (!syncedPlugin.load(scene, data, fileInfo.rootUrl, errorHandler)) {
                    return;
                }

                scene.loadingPluginName = plugin.name;
                successHandler();
            } else {
                const asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                asyncedPlugin
                    .loadAsync(scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name)
                    .then(() => {
                        scene.loadingPluginName = plugin.name;
                        successHandler();
                    })
                    .catch((error) => {
                        errorHandler(error.message, error);
                    });
            }
        },
        progressHandler,
        errorHandler,
        disposeHandler,
        pluginExtension,
        name,
        pluginOptions
    );
}

function appendSceneAsyncCore(
    rootUrl: string,
    sceneFilename?: SceneSource,
    scene?: Nullable<Scene>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<Scene> {
    return new Promise((resolve, reject) => {
        appendAsync(
            rootUrl,
            sceneFilename,
            scene,
            (scene) => {
                resolve(scene);
            },
            onProgress,
            (scene, message, exception) => {
                reject(exception || new Error(message));
            },
            pluginExtension,
            name,
            pluginOptions
        );
    });
}

function internalLoadAssetContainerAsync(
    rootUrl: string,
    sceneFilename?: SceneSource,
    scene?: Nullable<Scene>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<AssetContainer> {
    return new Promise((resolve, reject) => {
        LoadAssetContainerAsync(
            rootUrl,
            sceneFilename,
            scene,
            (assets) => {
                resolve(assets);
            },
            onProgress,
            (scene, message, exception) => {
                reject(exception || new Error(message));
            },
            pluginExtension,
            name,
            pluginOptions
        );
    });
}

function importAnimations(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    overwriteAnimations = true,
    animationGroupLoadingMode = SceneLoaderAnimationGroupLoadingMode.Clean,
    targetConverter: Nullable<(target: any) => any> = null,
    onSuccess: Nullable<(scene: Scene) => void> = null,
    onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
    onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
    pluginExtension: Nullable<string> = null,
    name = "",
    pluginOptions: PluginOptions = {}
): void {
    if (!scene) {
        Logger.Error("No scene available to load animations to");
        return;
    }

    if (overwriteAnimations) {
        // Reset, stop and dispose all animations before loading new ones
        for (const animatable of scene.animatables) {
            animatable.reset();
        }
        scene.stopAllAnimations();
        scene.animationGroups.slice().forEach((animationGroup) => {
            animationGroup.dispose();
        });
        const nodes = scene.getNodes();
        nodes.forEach((node) => {
            if (node.animations) {
                node.animations = [];
            }
        });
    } else {
        switch (animationGroupLoadingMode) {
            case SceneLoaderAnimationGroupLoadingMode.Clean:
                scene.animationGroups.slice().forEach((animationGroup) => {
                    animationGroup.dispose();
                });
                break;
            case SceneLoaderAnimationGroupLoadingMode.Stop:
                scene.animationGroups.forEach((animationGroup) => {
                    animationGroup.stop();
                });
                break;
            case SceneLoaderAnimationGroupLoadingMode.Sync:
                scene.animationGroups.forEach((animationGroup) => {
                    animationGroup.reset();
                    animationGroup.restart();
                });
                break;
            case SceneLoaderAnimationGroupLoadingMode.NoSync:
                // nothing to do
                break;
            default:
                Logger.Error("Unknown animation group loading mode value '" + animationGroupLoadingMode + "'");
                return;
        }
    }

    const startingIndexForNewAnimatables = scene.animatables.length;

    const onAssetContainerLoaded = (container: AssetContainer) => {
        container.mergeAnimationsTo(scene, scene.animatables.slice(startingIndexForNewAnimatables), targetConverter);

        container.dispose();

        scene.onAnimationFileImportedObservable.notifyObservers(scene);

        if (onSuccess) {
            onSuccess(scene);
        }
    };

    LoadAssetContainerAsync(rootUrl, sceneFilename, scene, onAssetContainerLoaded, onProgress, onError, pluginExtension, name, pluginOptions);
}

function importAnimationsAsyncCore(
    rootUrl: string,
    sceneFilename?: SceneSource,
    scene?: Nullable<Scene>,
    overwriteAnimations?: boolean,
    animationGroupLoadingMode?: SceneLoaderAnimationGroupLoadingMode,
    targetConverter?: Nullable<(target: any) => any>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<Scene> {
    return new Promise((resolve, reject) => {
        importAnimations(
            rootUrl,
            sceneFilename,
            scene,
            overwriteAnimations,
            animationGroupLoadingMode,
            targetConverter,
            (scene) => {
                resolve(scene);
            },
            onProgress,
            (scene, message, exception) => {
                reject(exception || new Error(message));
            },
            pluginExtension,
            name,
            pluginOptions
        );
    });
}
