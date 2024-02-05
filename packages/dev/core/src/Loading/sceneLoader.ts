import { Tools } from "../Misc/tools";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { EngineStore } from "../Engines/engineStore";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { AnimationGroup } from "../Animations/animationGroup";
import type { AssetContainer } from "../assetContainer";
import type { IParticleSystem } from "../Particles/IParticleSystem";
import type { Skeleton } from "../Bones/skeleton";
import { Logger } from "../Misc/logger";
import { Constants } from "../Engines/constants";
import { SceneLoaderFlags } from "./sceneLoaderFlags";
import type { IFileRequest } from "../Misc/fileRequest";
import type { WebRequest } from "../Misc/webRequest";
import type { LoadFileError } from "../Misc/fileTools";
import { IsBase64DataUrl } from "../Misc/fileTools";
import type { TransformNode } from "../Meshes/transformNode";
import type { Geometry } from "../Meshes/geometry";
import type { Light } from "../Lights/light";
import { RuntimeError, ErrorCodes } from "../Misc/error";

/**
 * Type used for the success callback of ImportMesh
 */
export type SceneLoaderSuccessCallback = (
    meshes: AbstractMesh[],
    particleSystems: IParticleSystem[],
    skeletons: Skeleton[],
    animationGroups: AnimationGroup[],
    transformNodes: TransformNode[],
    geometries: Geometry[],
    lights: Light[]
) => void;

/**
 * Interface used for the result of ImportMeshAsync
 */
export interface ISceneLoaderAsyncResult {
    /**
     * The array of loaded meshes
     */
    readonly meshes: AbstractMesh[];

    /**
     * The array of loaded particle systems
     */
    readonly particleSystems: IParticleSystem[];

    /**
     * The array of loaded skeletons
     */
    readonly skeletons: Skeleton[];

    /**
     * The array of loaded animation groups
     */
    readonly animationGroups: AnimationGroup[];

    /**
     * The array of loaded transform nodes
     */
    readonly transformNodes: TransformNode[];

    /**
     * The array of loaded geometries
     */
    readonly geometries: Geometry[];

    /**
     * The array of loaded lights
     */
    readonly lights: Light[];
}

/**
 * Interface used to represent data loading progression
 */
export interface ISceneLoaderProgressEvent {
    /**
     * Defines if data length to load can be evaluated
     */
    readonly lengthComputable: boolean;

    /**
     * Defines the loaded data length
     */
    readonly loaded: number;

    /**
     * Defines the data length to load
     */
    readonly total: number;
}

/**
 * Interface used by SceneLoader plugins to define supported file extensions
 */
export interface ISceneLoaderPluginExtensions {
    /**
     * Defines the list of supported extensions
     */
    [extension: string]: {
        isBinary: boolean;
    };
}

/**
 * Interface used by SceneLoader plugin factory
 */
export interface ISceneLoaderPluginFactory {
    /**
     * Defines the name of the factory
     */
    name: string;

    /**
     * Function called to create a new plugin
     * @returns the new plugin
     */
    createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync;

    /**
     * The callback that returns true if the data can be directly loaded.
     * @param data string containing the file data
     * @returns if the data can be loaded directly
     */
    canDirectLoad?(data: string): boolean;
}

/**
 * Interface used to define the base of ISceneLoaderPlugin and ISceneLoaderPluginAsync
 */
export interface ISceneLoaderPluginBase {
    /**
     * The friendly name of this plugin.
     */
    name: string;

    /**
     * The file extensions supported by this plugin.
     */
    extensions: string | ISceneLoaderPluginExtensions;

    /**
     * The callback called when loading from a url.
     * @param scene scene loading this url
     * @param fileOrUrl file or url to load
     * @param rootUrl root url to use to load assets
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @param name defines the name of the file when loading a binary file
     * @returns a file request object
     */
    loadFile?(
        scene: Scene,
        fileOrUrl: File | string | ArrayBufferView,
        rootUrl: string,
        onSuccess: (data: any, responseURL?: string) => void,
        onProgress?: (ev: ISceneLoaderProgressEvent) => void,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void,
        name?: string
    ): Nullable<IFileRequest>;

    /**
     * The callback that returns true if the data can be directly loaded.
     * @param data string containing the file data
     * @returns if the data can be loaded directly
     */
    canDirectLoad?(data: string): boolean;

    /**
     * The callback that returns the data to pass to the plugin if the data can be directly loaded.
     * @param scene scene loading this data
     * @param data string containing the data
     * @returns data to pass to the plugin
     */
    directLoad?(scene: Scene, data: string): any;

    /**
     * The callback that allows custom handling of the root url based on the response url.
     * @param rootUrl the original root url
     * @param responseURL the response url if available
     * @returns the new root url
     */
    rewriteRootURL?(rootUrl: string, responseURL?: string): string;
}

/**
 * Interface used to define a SceneLoader plugin
 */
export interface ISceneLoaderPlugin extends ISceneLoaderPluginBase {
    /**
     * Import meshes into a scene.
     * @param meshesNames An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param scene The scene to import into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param meshes The meshes array to import into
     * @param particleSystems The particle systems array to import into
     * @param skeletons The skeletons array to import into
     * @param onError The callback when import fails
     * @returns True if successful or false otherwise
     */
    importMesh(
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        meshes: AbstractMesh[],
        particleSystems: IParticleSystem[],
        skeletons: Skeleton[],
        onError?: (message: string, exception?: any) => void
    ): boolean;

    /**
     * Load into a scene.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onError The callback when import fails
     * @returns True if successful or false otherwise
     */
    load(scene: Scene, data: any, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean;

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onError The callback when import fails
     * @returns The loaded asset container
     */
    loadAssetContainer(scene: Scene, data: any, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer;
}

/**
 * Interface used to define an async SceneLoader plugin
 */
export interface ISceneLoaderPluginAsync extends ISceneLoaderPluginBase {
    /**
     * Import meshes into a scene.
     * @param meshesNames An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param scene The scene to import into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onProgress The callback when the load progresses
     * @param fileName Defines the name of the file to load
     * @returns The loaded objects (e.g. meshes, particle systems, skeletons, animation groups, etc.)
     */
    importMeshAsync(
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        onProgress?: (event: ISceneLoaderProgressEvent) => void,
        fileName?: string
    ): Promise<ISceneLoaderAsyncResult>;

    /**
     * Load into a scene.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onProgress The callback when the load progresses
     * @param fileName Defines the name of the file to load
     * @returns Nothing
     */
    loadAsync(scene: Scene, data: any, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void>;

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onProgress The callback when the load progresses
     * @param fileName Defines the name of the file to load
     * @returns The loaded asset container
     */
    loadAssetContainerAsync(scene: Scene, data: any, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<AssetContainer>;
}

/**
 * Mode that determines how to handle old animation groups before loading new ones.
 */
export enum SceneLoaderAnimationGroupLoadingMode {
    /**
     * Reset all old animations to initial state then dispose them.
     */
    Clean = 0,

    /**
     * Stop all old animations.
     */
    Stop = 1,

    /**
     * Restart old animations from first frame.
     */
    Sync = 2,

    /**
     * Old animations remains untouched.
     */
    NoSync = 3,
}

/**
 * Defines a plugin registered by the SceneLoader
 */
interface IRegisteredPlugin {
    /**
     * Defines the plugin to use
     */
    plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory;
    /**
     * Defines if the plugin supports binary data
     */
    isBinary: boolean;
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
 * Class used to load scene from various file formats using registered plugins
 * @see https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes
 */
export class SceneLoader {
    /**
     * No logging while loading
     */
    public static readonly NO_LOGGING = Constants.SCENELOADER_NO_LOGGING;

    /**
     * Minimal logging while loading
     */
    public static readonly MINIMAL_LOGGING = Constants.SCENELOADER_MINIMAL_LOGGING;

    /**
     * Summary logging while loading
     */
    public static readonly SUMMARY_LOGGING = Constants.SCENELOADER_SUMMARY_LOGGING;

    /**
     * Detailed logging while loading
     */
    public static readonly DETAILED_LOGGING = Constants.SCENELOADER_DETAILED_LOGGING;

    /**
     * Gets or sets a boolean indicating if entire scene must be loaded even if scene contains incremental data
     */
    public static get ForceFullSceneLoadingForIncremental() {
        return SceneLoaderFlags.ForceFullSceneLoadingForIncremental;
    }

    public static set ForceFullSceneLoadingForIncremental(value: boolean) {
        SceneLoaderFlags.ForceFullSceneLoadingForIncremental = value;
    }

    /**
     * Gets or sets a boolean indicating if loading screen must be displayed while loading a scene
     */
    public static get ShowLoadingScreen(): boolean {
        return SceneLoaderFlags.ShowLoadingScreen;
    }

    public static set ShowLoadingScreen(value: boolean) {
        SceneLoaderFlags.ShowLoadingScreen = value;
    }

    /**
     * Defines the current logging level (while loading the scene)
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static get loggingLevel(): number {
        return SceneLoaderFlags.loggingLevel;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static set loggingLevel(value: number) {
        SceneLoaderFlags.loggingLevel = value;
    }

    /**
     * Gets or set a boolean indicating if matrix weights must be cleaned upon loading
     */
    public static get CleanBoneMatrixWeights(): boolean {
        return SceneLoaderFlags.CleanBoneMatrixWeights;
    }

    public static set CleanBoneMatrixWeights(value: boolean) {
        SceneLoaderFlags.CleanBoneMatrixWeights = value;
    }

    // Members

    /**
     * Event raised when a plugin is used to load a scene
     */
    public static OnPluginActivatedObservable = new Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>();

    private static _RegisteredPlugins: { [extension: string]: IRegisteredPlugin } = {};

    private static _ShowingLoadingScreen = false;

    /**
     * Gets the default plugin (used to load Babylon files)
     * @returns the .babylon plugin
     */
    public static GetDefaultPlugin(): IRegisteredPlugin {
        return SceneLoader._RegisteredPlugins[".babylon"];
    }

    private static _GetPluginForExtension(extension: string): IRegisteredPlugin {
        const registeredPlugin = SceneLoader._RegisteredPlugins[extension];
        if (registeredPlugin) {
            return registeredPlugin;
        }
        Logger.Warn(
            "Unable to find a plugin to load " +
                extension +
                " files. Trying to use .babylon default plugin. To load from a specific filetype (eg. gltf) see: https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes"
        );
        return SceneLoader.GetDefaultPlugin();
    }

    private static _GetPluginForDirectLoad(data: string): IRegisteredPlugin {
        for (const extension in SceneLoader._RegisteredPlugins) {
            const plugin = SceneLoader._RegisteredPlugins[extension].plugin;

            if (plugin.canDirectLoad && plugin.canDirectLoad(data)) {
                return SceneLoader._RegisteredPlugins[extension];
            }
        }

        return SceneLoader.GetDefaultPlugin();
    }

    private static _GetPluginForFilename(sceneFilename: string): IRegisteredPlugin {
        const queryStringPosition = sceneFilename.indexOf("?");

        if (queryStringPosition !== -1) {
            sceneFilename = sceneFilename.substring(0, queryStringPosition);
        }

        const dotPosition = sceneFilename.lastIndexOf(".");

        const extension = sceneFilename.substring(dotPosition, sceneFilename.length).toLowerCase();
        return SceneLoader._GetPluginForExtension(extension);
    }

    private static _GetDirectLoad(sceneFilename: string): Nullable<string> {
        if (sceneFilename.substr(0, 5) === "data:") {
            return sceneFilename.substr(5);
        }

        return null;
    }

    private static _FormatErrorMessage(fileInfo: IFileInfo, message?: string, exception?: any): string {
        const fromLoad = fileInfo.rawData ? "binary data" : fileInfo.url;
        let errorMessage = "Unable to load from " + fromLoad;

        if (message) {
            errorMessage += `: ${message}`;
        } else if (exception) {
            errorMessage += `: ${exception}`;
        }

        return errorMessage;
    }

    private static _LoadData(
        fileInfo: IFileInfo,
        scene: Scene,
        onSuccess: (plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync, data: any, responseURL?: string) => void,
        onProgress: ((event: ISceneLoaderProgressEvent) => void) | undefined,
        onError: (message?: string, exception?: any) => void,
        onDispose: () => void,
        pluginExtension: Nullable<string>,
        name: string
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        const directLoad = SceneLoader._GetDirectLoad(fileInfo.url);

        if (fileInfo.rawData && !pluginExtension) {
            // eslint-disable-next-line no-throw-literal
            throw "When using ArrayBufferView to load data the file extension must be provided.";
        }

        const registeredPlugin = pluginExtension
            ? SceneLoader._GetPluginForExtension(pluginExtension)
            : directLoad
              ? SceneLoader._GetPluginForDirectLoad(fileInfo.url)
              : SceneLoader._GetPluginForFilename(fileInfo.url);

        if (fileInfo.rawData && !registeredPlugin.isBinary) {
            // eslint-disable-next-line no-throw-literal
            throw "Loading from ArrayBufferView can not be used with plugins that don't support binary loading.";
        }

        let plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync;

        if ((registeredPlugin.plugin as ISceneLoaderPluginFactory).createPlugin !== undefined) {
            plugin = (registeredPlugin.plugin as ISceneLoaderPluginFactory).createPlugin();
        } else {
            plugin = <any>registeredPlugin.plugin;
        }

        if (!plugin) {
            // eslint-disable-next-line no-throw-literal
            throw "The loader plugin corresponding to the file type you are trying to load has not been found. If using es6, please import the plugin you wish to use before.";
        }

        SceneLoader.OnPluginActivatedObservable.notifyObservers(plugin);

        // Check if we have a direct load url. If the plugin is registered to handle
        // it or it's not a base64 data url, then pass it through the direct load path.
        if (directLoad && ((plugin.canDirectLoad && plugin.canDirectLoad(fileInfo.url)) || !IsBase64DataUrl(fileInfo.url))) {
            if (plugin.directLoad) {
                const result = plugin.directLoad(scene, directLoad);
                if (result.then) {
                    result
                        .then((data: any) => {
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
            return plugin;
        }

        const useArrayBuffer = registeredPlugin.isBinary;

        const dataCallback = (data: any, responseURL?: string) => {
            if (scene.isDisposed) {
                onError("Scene has been disposed");
                return;
            }

            onSuccess(plugin, data, responseURL);
        };

        let request: Nullable<IFileRequest> = null;
        let pluginDisposed = false;
        const onDisposeObservable = (plugin as any).onDisposeObservable as Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
        if (onDisposeObservable) {
            onDisposeObservable.add(() => {
                pluginDisposed = true;

                if (request) {
                    request.abort();
                    request = null;
                }

                onDispose();
            });
        }

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

        if (canUseOfflineSupport && Engine.OfflineProviderFactory) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            scene.offlineProvider = Engine.OfflineProviderFactory(fileInfo.url, manifestChecked, engine.disableManifestCheck);
        } else {
            manifestChecked();
        }

        return plugin;
    }

    private static _GetFileInfo(rootUrl: string, sceneFilename: string | File | ArrayBufferView): Nullable<IFileInfo> {
        let url: string;
        let name: string;
        let file: Nullable<File> = null;
        let rawData: Nullable<ArrayBufferView> = null;

        if (!sceneFilename) {
            url = rootUrl;
            name = Tools.GetFilename(rootUrl);
            rootUrl = Tools.GetFolderPath(rootUrl);
        } else if ((sceneFilename as File).name) {
            const sceneFile = sceneFilename as File;
            url = `file:${sceneFile.name}`;
            name = sceneFile.name;
            file = sceneFile;
        } else if (ArrayBuffer.isView(sceneFilename)) {
            url = "";
            name = "arrayBuffer";
            rawData = sceneFilename as ArrayBufferView;
        } else if (typeof sceneFilename === "string" && sceneFilename.startsWith("data:")) {
            url = sceneFilename;
            name = "";
        } else {
            const filename = sceneFilename as string;
            if (filename.substr(0, 1) === "/") {
                Tools.Error("Wrong sceneFilename parameter");
                return null;
            }

            url = rootUrl + filename;
            name = filename;
        }

        return {
            url: url,
            rootUrl: rootUrl,
            name: name,
            file: file,
            rawData,
        };
    }

    // Public functions

    /**
     * Gets a plugin that can load the given extension
     * @param extension defines the extension to load
     * @returns a plugin or null if none works
     */
    public static GetPluginForExtension(extension: string): ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory {
        return SceneLoader._GetPluginForExtension(extension).plugin;
    }

    /**
     * Gets a boolean indicating that the given extension can be loaded
     * @param extension defines the extension to load
     * @returns true if the extension is supported
     */
    public static IsPluginForExtensionAvailable(extension: string): boolean {
        return !!SceneLoader._RegisteredPlugins[extension];
    }

    /**
     * Adds a new plugin to the list of registered plugins
     * @param plugin defines the plugin to add
     */
    public static RegisterPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync): void {
        if (typeof plugin.extensions === "string") {
            const extension = <string>plugin.extensions;
            SceneLoader._RegisteredPlugins[extension.toLowerCase()] = {
                plugin: plugin,
                isBinary: false,
            };
        } else {
            const extensions = <ISceneLoaderPluginExtensions>plugin.extensions;
            Object.keys(extensions).forEach((extension) => {
                SceneLoader._RegisteredPlugins[extension.toLowerCase()] = {
                    plugin: plugin,
                    isBinary: extensions[extension].isBinary,
                };
            });
        }
    }

    /**
     * Import meshes into a scene
     * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene the instance of BABYLON.Scene to append to
     * @param onSuccess a callback with a list of imported meshes, particleSystems, skeletons, and animationGroups when import succeeds
     * @param onProgress a callback with a progress event for each file being loaded
     * @param onError a callback with the scene, a message, and possibly an exception when import fails
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the name of the file, if the data is binary
     * @returns The loaded plugin
     */
    public static ImportMesh(
        meshNames: any,
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onSuccess: Nullable<SceneLoaderSuccessCallback> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!scene) {
            Logger.Error("No scene available to import mesh to");
            return null;
        }

        const fileInfo = SceneLoader._GetFileInfo(rootUrl, sceneFilename);
        if (!fileInfo) {
            return null;
        }

        const loadingToken = {};
        scene.addPendingData(loadingToken);

        const disposeHandler = () => {
            scene.removePendingData(loadingToken);
        };

        const errorHandler = (message?: string, exception?: any) => {
            const errorMessage = SceneLoader._FormatErrorMessage(fileInfo, message, exception);

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

        const successHandler: SceneLoaderSuccessCallback = (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights) => {
            scene.importedMeshesFiles.push(fileInfo.url);

            if (onSuccess) {
                try {
                    onSuccess(meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights);
                } catch (e) {
                    errorHandler("Error in onSuccess callback: " + e, e);
                }
            }

            scene.removePendingData(loadingToken);
        };

        return SceneLoader._LoadData(
            fileInfo,
            scene,
            (plugin, data, responseURL) => {
                if (plugin.rewriteRootURL) {
                    fileInfo.rootUrl = plugin.rewriteRootURL(fileInfo.rootUrl, responseURL);
                }

                if ((<any>plugin).importMesh) {
                    const syncedPlugin = <ISceneLoaderPlugin>plugin;
                    const meshes: AbstractMesh[] = [];
                    const particleSystems: IParticleSystem[] = [];
                    const skeletons: Skeleton[] = [];

                    if (!syncedPlugin.importMesh(meshNames, scene, data, fileInfo.rootUrl, meshes, particleSystems, skeletons, errorHandler)) {
                        return;
                    }

                    scene.loadingPluginName = plugin.name;
                    successHandler(meshes, particleSystems, skeletons, [], [], [], []);
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
                                result.lights
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
            name
        );
    }

    /**
     * Import meshes into a scene
     * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene the instance of BABYLON.Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the name of the file
     * @returns The loaded list of imported meshes, particle systems, skeletons, and animation groups
     */
    public static ImportMeshAsync(
        meshNames: any,
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Promise<ISceneLoaderAsyncResult> {
        return new Promise((resolve, reject) => {
            SceneLoader.ImportMesh(
                meshNames,
                rootUrl,
                sceneFilename,
                scene,
                (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights) => {
                    resolve({
                        meshes: meshes,
                        particleSystems: particleSystems,
                        skeletons: skeletons,
                        animationGroups: animationGroups,
                        transformNodes: transformNodes,
                        geometries: geometries,
                        lights: lights,
                    });
                },
                onProgress,
                (scene, message, exception) => {
                    reject(exception || new Error(message));
                },
                pluginExtension,
                name
            );
        });
    }

    /**
     * Load a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param engine is the instance of BABYLON.Engine to use to create the scene
     * @param onSuccess a callback with the scene when import succeeds
     * @param onProgress a callback with a progress event for each file being loaded
     * @param onError a callback with the scene, a message, and possibly an exception when import fails
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the filename, if the data is binary
     * @returns The loaded plugin
     */
    public static Load(
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        engine: Nullable<Engine> = EngineStore.LastCreatedEngine,
        onSuccess: Nullable<(scene: Scene) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!engine) {
            Tools.Error("No engine available");
            return null;
        }

        return SceneLoader.Append(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension, name);
    }

    /**
     * Load a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param engine is the instance of BABYLON.Engine to use to create the scene
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the filename, if the data is binary
     * @returns The loaded scene
     */
    public static LoadAsync(
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        engine: Nullable<Engine> = EngineStore.LastCreatedEngine,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Promise<Scene> {
        return new Promise((resolve, reject) => {
            SceneLoader.Load(
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
                name
            );
        });
    }

    /**
     * Append a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene is the instance of BABYLON.Scene to append to
     * @param onSuccess a callback with the scene when import succeeds
     * @param onProgress a callback with a progress event for each file being loaded
     * @param onError a callback with the scene, a message, and possibly an exception when import fails
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the name of the file, if the data is binary
     * @returns The loaded plugin
     */
    public static Append(
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onSuccess: Nullable<(scene: Scene) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!scene) {
            Logger.Error("No scene available to append to");
            return null;
        }

        const fileInfo = SceneLoader._GetFileInfo(rootUrl, sceneFilename);
        if (!fileInfo) {
            return null;
        }

        const loadingToken = {};
        scene.addPendingData(loadingToken);

        const disposeHandler = () => {
            scene.removePendingData(loadingToken);
        };

        if (SceneLoader.ShowLoadingScreen && !this._ShowingLoadingScreen) {
            this._ShowingLoadingScreen = true;
            scene.getEngine().displayLoadingUI();
            scene.executeWhenReady(() => {
                scene.getEngine().hideLoadingUI();
                this._ShowingLoadingScreen = false;
            });
        }

        const errorHandler = (message?: string, exception?: any) => {
            const errorMessage = SceneLoader._FormatErrorMessage(fileInfo, message, exception);

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

        return SceneLoader._LoadData(
            fileInfo,
            scene,
            (plugin, data) => {
                if ((<any>plugin).load) {
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
            name
        );
    }

    /**
     * Append a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene is the instance of BABYLON.Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the name of the file, if the data is binary
     * @returns The given scene
     */
    public static AppendAsync(
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Promise<Scene> {
        return new Promise((resolve, reject) => {
            SceneLoader.Append(
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
                name
            );
        });
    }

    /**
     * Load a scene into an asset container
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
     * @param onSuccess a callback with the scene when import succeeds
     * @param onProgress a callback with a progress event for each file being loaded
     * @param onError a callback with the scene, a message, and possibly an exception when import fails
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the filename, if the data is binary
     * @returns The loaded plugin
     */
    public static LoadAssetContainer(
        rootUrl: string,
        sceneFilename: string | File | ArrayBufferView = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onSuccess: Nullable<(assets: AssetContainer) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name: string = ""
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!scene) {
            Logger.Error("No scene available to load asset container to");
            return null;
        }

        const fileInfo = SceneLoader._GetFileInfo(rootUrl, sceneFilename);
        if (!fileInfo) {
            return null;
        }

        const loadingToken = {};
        scene.addPendingData(loadingToken);

        const disposeHandler = () => {
            scene.removePendingData(loadingToken);
        };

        const errorHandler = (message?: string, exception?: any) => {
            const errorMessage = SceneLoader._FormatErrorMessage(fileInfo, message, exception);

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

        return SceneLoader._LoadData(
            fileInfo,
            scene,
            (plugin, data) => {
                if ((<any>plugin).loadAssetContainer) {
                    const syncedPlugin = <ISceneLoaderPlugin>plugin;
                    const assetContainer = syncedPlugin.loadAssetContainer(scene, data, fileInfo.rootUrl, errorHandler);
                    if (!assetContainer) {
                        return;
                    }
                    assetContainer.populateRootNodes();
                    scene.loadingPluginName = plugin.name;
                    successHandler(assetContainer);
                } else if ((<any>plugin).loadAssetContainerAsync) {
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
            name
        );
    }

    /**
     * Load a scene into an asset container
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene (default: empty string)
     * @param scene is the instance of Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @returns The loaded asset container
     */
    public static LoadAssetContainerAsync(
        rootUrl: string,
        sceneFilename: string | File = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        pluginExtension: Nullable<string> = null
    ): Promise<AssetContainer> {
        return new Promise((resolve, reject) => {
            SceneLoader.LoadAssetContainer(
                rootUrl,
                sceneFilename,
                scene,
                (assetContainer) => {
                    resolve(assetContainer);
                },
                onProgress,
                (scene, message, exception) => {
                    reject(exception || new Error(message));
                },
                pluginExtension
            );
        });
    }

    /**
     * Import animations from a file into a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
     * @param overwriteAnimations when true, animations are cleaned before importing new ones. Animations are appended otherwise
     * @param animationGroupLoadingMode defines how to handle old animations groups before importing new ones
     * @param targetConverter defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
     * @param onSuccess a callback with the scene when import succeeds
     * @param onProgress a callback with a progress event for each file being loaded
     * @param onError a callback with the scene, a message, and possibly an exception when import fails
     * @param pluginExtension the extension used to determine the plugin
     */
    public static ImportAnimations(
        rootUrl: string,
        sceneFilename: string | File = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        overwriteAnimations = true,
        animationGroupLoadingMode = SceneLoaderAnimationGroupLoadingMode.Clean,
        targetConverter: Nullable<(target: any) => any> = null,
        onSuccess: Nullable<(scene: Scene) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null
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

        this.LoadAssetContainer(rootUrl, sceneFilename, scene, onAssetContainerLoaded, onProgress, onError, pluginExtension);
    }

    /**
     * Import animations from a file into a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
     * @param overwriteAnimations when true, animations are cleaned before importing new ones. Animations are appended otherwise
     * @param animationGroupLoadingMode defines how to handle old animations groups before importing new ones
     * @param targetConverter defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
     * @param onSuccess a callback with the scene when import succeeds
     * @param onProgress a callback with a progress event for each file being loaded
     * @param onError a callback with the scene, a message, and possibly an exception when import fails
     * @param pluginExtension the extension used to determine the plugin
     * @returns the updated scene with imported animations
     */
    public static ImportAnimationsAsync(
        rootUrl: string,
        sceneFilename: string | File = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        overwriteAnimations = true,
        animationGroupLoadingMode = SceneLoaderAnimationGroupLoadingMode.Clean,
        targetConverter: Nullable<(target: any) => any> = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onSuccess: Nullable<(scene: Scene) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null
    ): Promise<Scene> {
        return new Promise((resolve, reject) => {
            SceneLoader.ImportAnimations(
                rootUrl,
                sceneFilename,
                scene,
                overwriteAnimations,
                animationGroupLoadingMode,
                targetConverter,
                (_scene: Scene) => {
                    resolve(_scene);
                },
                onProgress,
                (_scene: Scene, message: string, exception: any) => {
                    reject(exception || new Error(message));
                },
                pluginExtension
            );
        });
    }
}
