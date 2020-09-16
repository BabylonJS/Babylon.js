import { Tools } from "../Misc/tools";
import { Observable } from "../Misc/observable";
import { FilesInputStore } from "../Misc/filesInputStore";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { EngineStore } from "../Engines/engineStore";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { AnimationGroup } from "../Animations/animationGroup";
import { AssetContainer } from "../assetContainer";
import { IParticleSystem } from "../Particles/IParticleSystem";
import { Skeleton } from "../Bones/skeleton";
import { Logger } from "../Misc/logger";
import { Constants } from "../Engines/constants";
import { SceneLoaderFlags } from "./sceneLoaderFlags";
import { IFileRequest } from "../Misc/fileRequest";
import { WebRequest } from "../Misc/webRequest";
import { RequestFileError, ReadFileError } from '../Misc/fileTools';

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
     * @return the new plugin
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
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     */
    requestFile?(scene: Scene, url: string, onSuccess: (data: any, request?: WebRequest) => void, onProgress?: (ev: ISceneLoaderProgressEvent) => void, useArrayBuffer?: boolean, onError?: (error: any) => void): IFileRequest;

    /**
     * The callback called when loading from a file object.
     * @param scene scene loading this file
     * @param file defines the file to load
     * @param onSuccess defines the callback to call when data is loaded
     * @param onProgress defines the callback to call during loading process
     * @param useArrayBuffer defines a boolean indicating that data must be returned as an ArrayBuffer
     * @param onError defines the callback to call when an error occurs
     * @returns a file request object
     */
    readFile?(scene: Scene, file: File, onSuccess: (data: any) => void, onProgress?: (ev: ISceneLoaderProgressEvent) => any, useArrayBuffer?: boolean, onError?: (error: any) => void): IFileRequest;

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
    importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], onError?: (message: string, exception?: any) => void): boolean;

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
     * @returns The loaded meshes, particle systems, skeletons, and animation groups
     */
    importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<{ meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }>;

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
    NoSync = 3
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
}

/**
 * Class used to load scene from various file formats using registered plugins
 * @see https://doc.babylonjs.com/how_to/load_from_any_file_type
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
     * Detailled logging while loading
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
    public static get loggingLevel(): number {
        return SceneLoaderFlags.loggingLevel;
    }

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

    private static _registeredPlugins: { [extension: string]: IRegisteredPlugin } = {};

    private static _showingLoadingScreen = false;

    /**
     * Gets the default plugin (used to load Babylon files)
     * @returns the .babylon plugin
     */
    public static GetDefaultPlugin(): IRegisteredPlugin {
        return SceneLoader._registeredPlugins[".babylon"];
    }

    private static _GetPluginForExtension(extension: string): IRegisteredPlugin {
        var registeredPlugin = SceneLoader._registeredPlugins[extension];
        if (registeredPlugin) {
            return registeredPlugin;
        }
        Logger.Warn("Unable to find a plugin to load " + extension + " files. Trying to use .babylon default plugin. To load from a specific filetype (eg. gltf) see: https://doc.babylonjs.com/how_to/load_from_any_file_type");
        return SceneLoader.GetDefaultPlugin();
    }

    private static _GetPluginForDirectLoad(data: string): IRegisteredPlugin {
        for (var extension in SceneLoader._registeredPlugins) {
            var plugin = SceneLoader._registeredPlugins[extension].plugin;

            if (plugin.canDirectLoad && plugin.canDirectLoad(data)) {
                return SceneLoader._registeredPlugins[extension];
            }
        }

        return SceneLoader.GetDefaultPlugin();
    }

    private static _GetPluginForFilename(sceneFilename: string): IRegisteredPlugin {
        var queryStringPosition = sceneFilename.indexOf("?");

        if (queryStringPosition !== -1) {
            sceneFilename = sceneFilename.substring(0, queryStringPosition);
        }

        var dotPosition = sceneFilename.lastIndexOf(".");

        var extension = sceneFilename.substring(dotPosition, sceneFilename.length).toLowerCase();
        return SceneLoader._GetPluginForExtension(extension);
    }

    private static _GetDirectLoad(sceneFilename: string): Nullable<string> {
        if (sceneFilename.substr(0, 5) === "data:") {
            return sceneFilename.substr(5);
        }

        return null;
    }

    private static _LoadData(fileInfo: IFileInfo, scene: Scene, onSuccess: (plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync, data: any, responseURL?: string) => void, onProgress: ((event: ISceneLoaderProgressEvent) => void) | undefined, onError: (message: string, exception?: any) => void, onDispose: () => void, pluginExtension: Nullable<string>): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        const directLoad = SceneLoader._GetDirectLoad(fileInfo.name);
        const registeredPlugin = pluginExtension ? SceneLoader._GetPluginForExtension(pluginExtension) : (directLoad ? SceneLoader._GetPluginForDirectLoad(fileInfo.name) : SceneLoader._GetPluginForFilename(fileInfo.name));

        let plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync;
        if ((registeredPlugin.plugin as ISceneLoaderPluginFactory).createPlugin !== undefined) {
            plugin = (registeredPlugin.plugin as ISceneLoaderPluginFactory).createPlugin();
        }
        else {
            plugin = <any>registeredPlugin.plugin;
        }

        if (!plugin) {
            throw "The loader plugin corresponding to the file type you are trying to load has not been found. If using es6, please import the plugin you wish to use before.";
        }

        SceneLoader.OnPluginActivatedObservable.notifyObservers(plugin);

        if (directLoad) {
            if (plugin.directLoad) {
                const result = plugin.directLoad(scene, directLoad);
                if (result.then) {
                    result.then((data: any) => {
                        onSuccess(plugin, data);
                    }).catch((error: any) => {
                        onError("Error in directLoad of _loadData: " + error, error);
                    });
                }
                else {
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

            const successCallback = (data: string | ArrayBuffer, request?: WebRequest) => {
                dataCallback(data, request ? request.responseURL : undefined);
            };

            const errorCallback = (error: RequestFileError) => {
                onError(error.message, error);
            };

            request = plugin.requestFile
                ? plugin.requestFile(scene, fileInfo.url, successCallback, onProgress, useArrayBuffer, errorCallback)
                : scene._requestFile(fileInfo.url, successCallback, onProgress, true, useArrayBuffer, errorCallback);
        };

        const file = fileInfo.file || FilesInputStore.FilesToLoad[fileInfo.name.toLowerCase()];

        if (fileInfo.rootUrl.indexOf("file:") === -1 || (fileInfo.rootUrl.indexOf("file:") !== -1 && !file)) {
            const engine = scene.getEngine();
            let canUseOfflineSupport = engine.enableOfflineSupport;
            if (canUseOfflineSupport) {
                // Also check for exceptions
                let exceptionFound = false;
                for (var regex of scene.disableOfflineSupportExceptionRules) {
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
            }
            else {
                manifestChecked();
            }
        }
        // Loading file from disk via input file or drag'n'drop
        else {
            if (file) {
                const errorCallback = (error: ReadFileError) => {
                    onError(error.message, error);
                };

                request = plugin.readFile
                    ? plugin.readFile(scene, file, dataCallback, onProgress, useArrayBuffer, errorCallback)
                    : scene._readFile(file, dataCallback, onProgress, useArrayBuffer, errorCallback);
            } else {
                onError("Unable to find file named " + fileInfo.name);
            }
        }
        return plugin;
    }

    private static _GetFileInfo(rootUrl: string, sceneFilename: string | File): Nullable<IFileInfo> {
        let url: string;
        let name: string;
        let file: Nullable<File> = null;

        if (!sceneFilename) {
            url = rootUrl;
            name = Tools.GetFilename(rootUrl);
            rootUrl = Tools.GetFolderPath(rootUrl);
        }
        else if ((sceneFilename as File).name) {
            const sceneFile = sceneFilename as File;
            url = rootUrl + sceneFile.name;
            name = sceneFile.name;
            file = sceneFile;
        }
        else {
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
            file: file
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
        return !!SceneLoader._registeredPlugins[extension];
    }

    /**
     * Adds a new plugin to the list of registered plugins
     * @param plugin defines the plugin to add
     */
    public static RegisterPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync): void {
        if (typeof plugin.extensions === "string") {
            var extension = <string>plugin.extensions;
            SceneLoader._registeredPlugins[extension.toLowerCase()] = {
                plugin: plugin,
                isBinary: false
            };
        }
        else {
            var extensions = <ISceneLoaderPluginExtensions>plugin.extensions;
            Object.keys(extensions).forEach((extension) => {
                SceneLoader._registeredPlugins[extension.toLowerCase()] = {
                    plugin: plugin,
                    isBinary: extensions[extension].isBinary
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
     * @returns The loaded plugin
     */
    public static ImportMesh(meshNames: any, rootUrl: string, sceneFilename: string | File = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, onSuccess: Nullable<(meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[]) => void> = null, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!scene) {
            Logger.Error("No scene available to import mesh to");
            return null;
        }

        const fileInfo = SceneLoader._GetFileInfo(rootUrl, sceneFilename);
        if (!fileInfo) {
            return null;
        }

        var loadingToken = {};
        scene._addPendingData(loadingToken);

        var disposeHandler = () => {
            scene._removePendingData(loadingToken);
        };

        var errorHandler = (message: string, exception?: any) => {
            let errorMessage = "Unable to import meshes from " + fileInfo.url + ": " + message;

            if (onError) {
                onError(scene, errorMessage, exception);
            } else {
                Logger.Error(errorMessage);
                // should the exception be thrown?
            }

            disposeHandler();
        };

        var progressHandler = onProgress ? (event: ISceneLoaderProgressEvent) => {
            try {
                onProgress(event);
            }
            catch (e) {
                errorHandler("Error in onProgress callback: " + e, e);
            }
        } : undefined;

        var successHandler = (meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[]) => {
            scene.importedMeshesFiles.push(fileInfo.url);

            if (onSuccess) {
                try {
                    onSuccess(meshes, particleSystems, skeletons, animationGroups);
                }
                catch (e) {
                    errorHandler("Error in onSuccess callback: " + e, e);
                }
            }

            scene._removePendingData(loadingToken);
        };

        return SceneLoader._LoadData(fileInfo, scene, (plugin, data, responseURL) => {
            if (plugin.rewriteRootURL) {
                fileInfo.rootUrl = plugin.rewriteRootURL(fileInfo.rootUrl, responseURL);
            }

            if ((<any>plugin).importMesh) {
                var syncedPlugin = <ISceneLoaderPlugin>plugin;
                var meshes = new Array<AbstractMesh>();
                var particleSystems = new Array<IParticleSystem>();
                var skeletons = new Array<Skeleton>();

                if (!syncedPlugin.importMesh(meshNames, scene, data, fileInfo.rootUrl, meshes, particleSystems, skeletons, errorHandler)) {
                    return;
                }

                scene.loadingPluginName = plugin.name;
                successHandler(meshes, particleSystems, skeletons, []);
            }
            else {
                var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                asyncedPlugin.importMeshAsync(meshNames, scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name).then((result) => {
                    scene.loadingPluginName = plugin.name;
                    successHandler(result.meshes, result.particleSystems, result.skeletons, result.animationGroups);
                }).catch((error) => {
                    errorHandler(error.message, error);
                });
            }
        }, progressHandler, errorHandler, disposeHandler, pluginExtension);
    }

    /**
     * Import meshes into a scene
     * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene the instance of BABYLON.Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @returns The loaded list of imported meshes, particle systems, skeletons, and animation groups
     */
    public static ImportMeshAsync(meshNames: any, rootUrl: string, sceneFilename: string | File = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<{ meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }> {
        return new Promise((resolve, reject) => {
            SceneLoader.ImportMesh(meshNames, rootUrl, sceneFilename, scene, (meshes, particleSystems, skeletons, animationGroups) => {
                resolve({
                    meshes: meshes,
                    particleSystems: particleSystems,
                    skeletons: skeletons,
                    animationGroups: animationGroups
                });
            }, onProgress, (scene, message, exception) => {
                reject(exception || new Error(message));
            },
                pluginExtension);
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
     * @returns The loaded plugin
     */
    public static Load(rootUrl: string, sceneFilename: string | File = "", engine: Nullable<Engine> = EngineStore.LastCreatedEngine, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!engine) {
            Tools.Error("No engine available");
            return null;
        }

        return SceneLoader.Append(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension);
    }

    /**
     * Load a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param engine is the instance of BABYLON.Engine to use to create the scene
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @returns The loaded scene
     */
    public static LoadAsync(rootUrl: string, sceneFilename: string | File = "", engine: Nullable<Engine> = EngineStore.LastCreatedEngine, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<Scene> {
        return new Promise((resolve, reject) => {
            SceneLoader.Load(rootUrl, sceneFilename, engine, (scene) => {
                resolve(scene);
            }, onProgress, (scene, message, exception) => {
                reject(exception || new Error(message));
            }, pluginExtension);
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
     * @returns The loaded plugin
     */
    public static Append(rootUrl: string, sceneFilename: string | File = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!scene) {
            Logger.Error("No scene available to append to");
            return null;
        }

        const fileInfo = SceneLoader._GetFileInfo(rootUrl, sceneFilename);
        if (!fileInfo) {
            return null;
        }

        if (SceneLoader.ShowLoadingScreen && !this._showingLoadingScreen) {
            this._showingLoadingScreen = true;
            scene.getEngine().displayLoadingUI();
            scene.executeWhenReady(() => {
                scene.getEngine().hideLoadingUI();
                this._showingLoadingScreen = false;
            });
        }

        var loadingToken = {};
        scene._addPendingData(loadingToken);

        var disposeHandler = () => {
            scene._removePendingData(loadingToken);
        };

        var errorHandler = (message: Nullable<string>, exception?: any) => {
            let errorMessage = "Unable to load from " + fileInfo.url + (message ? ": " + message : "");
            if (onError) {
                onError(scene, errorMessage, exception);
            } else {
                Logger.Error(errorMessage);
                // should the exception be thrown?
            }

            disposeHandler();
        };

        var progressHandler = onProgress ? (event: ISceneLoaderProgressEvent) => {
            try {
                onProgress(event);
            }
            catch (e) {
                errorHandler("Error in onProgress callback", e);
            }
        } : undefined;

        var successHandler = () => {
            if (onSuccess) {
                try {
                    onSuccess(scene);
                }
                catch (e) {
                    errorHandler("Error in onSuccess callback", e);
                }
            }

            scene._removePendingData(loadingToken);
        };

        return SceneLoader._LoadData(fileInfo, scene, (plugin, data) => {
            if ((<any>plugin).load) {
                var syncedPlugin = <ISceneLoaderPlugin>plugin;
                if (!syncedPlugin.load(scene, data, fileInfo.rootUrl, errorHandler)) {
                    return;
                }

                scene.loadingPluginName = plugin.name;
                successHandler();
            } else {
                var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                asyncedPlugin.loadAsync(scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name).then(() => {
                    scene.loadingPluginName = plugin.name;
                    successHandler();
                }).catch((error) => {
                    errorHandler(error.message, error);
                });
            }
        }, progressHandler, errorHandler, disposeHandler, pluginExtension);
    }

    /**
     * Append a scene
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
     * @param scene is the instance of BABYLON.Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @returns The given scene
     */
    public static AppendAsync(rootUrl: string, sceneFilename: string | File = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<Scene> {
        return new Promise((resolve, reject) => {
            SceneLoader.Append(rootUrl, sceneFilename, scene, (scene) => {
                resolve(scene);
            }, onProgress, (scene, message, exception) => {
                reject(exception || new Error(message));
            }, pluginExtension);
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
     * @returns The loaded plugin
     */
    public static LoadAssetContainer(
        rootUrl: string,
        sceneFilename: string | File = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onSuccess: Nullable<(assets: AssetContainer) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!scene) {
            Logger.Error("No scene available to load asset container to");
            return null;
        }

        const fileInfo = SceneLoader._GetFileInfo(rootUrl, sceneFilename);
        if (!fileInfo) {
            return null;
        }

        var loadingToken = {};
        scene._addPendingData(loadingToken);

        var disposeHandler = () => {
            scene._removePendingData(loadingToken);
        };

        var errorHandler = (message: Nullable<string>, exception?: any) => {
            let errorMessage = "Unable to load assets from " + fileInfo.url + (message ? ": " + message : "");

            if (exception && exception.message) {
                errorMessage += ` (${exception.message})`;
            }

            if (onError) {
                onError(scene, errorMessage, exception);
            } else {
                Logger.Error(errorMessage);
                // should the exception be thrown?
            }

            disposeHandler();
        };

        var progressHandler = onProgress ? (event: ISceneLoaderProgressEvent) => {
            try {
                onProgress(event);
            }
            catch (e) {
                errorHandler("Error in onProgress callback", e);
            }
        } : undefined;

        var successHandler = (assets: AssetContainer) => {
            if (onSuccess) {
                try {
                    onSuccess(assets);
                }
                catch (e) {
                    errorHandler("Error in onSuccess callback", e);
                }
            }

            scene._removePendingData(loadingToken);
        };

        return SceneLoader._LoadData(fileInfo, scene, (plugin, data) => {
            if ((<any>plugin).loadAssetContainer) {
                var syncedPlugin = <ISceneLoaderPlugin>plugin;
                var assetContainer = syncedPlugin.loadAssetContainer(scene, data, fileInfo.rootUrl, errorHandler);
                if (!assetContainer) {
                    return;
                }

                scene.loadingPluginName = plugin.name;
                successHandler(assetContainer);
            } else if ((<any>plugin).loadAssetContainerAsync) {
                var asyncedPlugin = <ISceneLoaderPluginAsync>plugin;
                asyncedPlugin.loadAssetContainerAsync(scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name).then((assetContainer) => {
                    scene.loadingPluginName = plugin.name;
                    successHandler(assetContainer);
                }).catch((error) => {
                    errorHandler(error.message, error);
                });
            } else {
                errorHandler("LoadAssetContainer is not supported by this plugin. Plugin did not provide a loadAssetContainer or loadAssetContainerAsync method.");
            }
        }, progressHandler, errorHandler, disposeHandler, pluginExtension);
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
    public static LoadAssetContainerAsync(rootUrl: string, sceneFilename: string = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, pluginExtension: Nullable<string> = null): Promise<AssetContainer> {
        return new Promise((resolve, reject) => {
            SceneLoader.LoadAssetContainer(rootUrl, sceneFilename, scene, (assetContainer) => {
                resolve(assetContainer);
            }, onProgress, (scene, message, exception) => {
                reject(exception || new Error(message));
            }, pluginExtension);
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
    public static ImportAnimations(rootUrl: string, sceneFilename: string | File = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, overwriteAnimations = true, animationGroupLoadingMode = SceneLoaderAnimationGroupLoadingMode.Clean, targetConverter: Nullable<(target: any) => any> = null, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): void {
        if (!scene) {
            Logger.Error("No scene available to load animations to");
            return;
        }

        if (overwriteAnimations) {
            // Reset, stop and dispose all animations before loading new ones
            for (let animatable of scene.animatables) {
                animatable.reset();
            }
            scene.stopAllAnimations();
            scene.animationGroups.slice().forEach((animationGroup) => {
                animationGroup.dispose();
            });
            let nodes = scene.getNodes();
            nodes.forEach((node) => {
                if (node.animations) {
                    node.animations = [];
                }
            });
        }
        else {
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

        let startingIndexForNewAnimatables = scene.animatables.length;

        let onAssetContainerLoaded = (container: AssetContainer) => {
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
    public static ImportAnimationsAsync(rootUrl: string, sceneFilename: string | File = "", scene: Nullable<Scene> = EngineStore.LastCreatedScene, overwriteAnimations = true, animationGroupLoadingMode = SceneLoaderAnimationGroupLoadingMode.Clean, targetConverter: Nullable<(target: any) => any> = null, onSuccess: Nullable<(scene: Scene) => void> = null, onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null, onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null, pluginExtension: Nullable<string> = null): Promise<Scene> {
        return new Promise((resolve, reject) => {
            SceneLoader.ImportAnimations(rootUrl, sceneFilename, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, (_scene: Scene) => {
                resolve(_scene);
            }, onProgress, (_scene: Scene, message: string, exception: any) => {
                reject(exception || new Error(message));
            }, pluginExtension);
        });
    }
}
