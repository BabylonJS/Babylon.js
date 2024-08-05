import { Tools } from "../Misc/tools";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import { Scene } from "../scene";
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
import type { ISpriteManager } from "../Sprites/spriteManager";
import { RandomGUID } from "../Misc/guid";
import { Engine } from "../Engines/engine";
import type { AbstractEngine } from "../Engines/abstractEngine";

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
    lights: Light[],
    spriteManagers: ISpriteManager[]
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

    /**
     * The array of loaded sprite managers
     */
    readonly spriteManagers: ISpriteManager[];
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
    readonly [extension: string]: {
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
    readonly name: string;

    /**
     * Function called to create a new plugin
     * @param options plugin options that were passed to the SceneLoader operation
     * @returns the new plugin
     */
    createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPlugin | ISceneLoaderPluginAsync;

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
    readonly name: string;

    /**
     * The file extensions supported by this plugin.
     */
    readonly extensions: string | ISceneLoaderPluginExtensions;

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
        onSuccess: (data: unknown, responseURL?: string) => void,
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
    directLoad?(scene: Scene, data: string): unknown | Promise<unknown>;

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
        meshesNames: string | readonly string[] | null | undefined,
        scene: Scene,
        data: unknown,
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
    load(scene: Scene, data: unknown, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean;

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onError The callback when import fails
     * @returns The loaded asset container
     */
    loadAssetContainer(scene: Scene, data: unknown, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer;
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
        meshesNames: string | readonly string[] | null | undefined,
        scene: Scene,
        data: unknown,
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
    loadAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void>;

    /**
     * Load into an asset container.
     * @param scene The scene to load into
     * @param data The data to import
     * @param rootUrl The root url for scene and resources
     * @param onProgress The callback when the load progresses
     * @param fileName Defines the name of the file to load
     * @returns The loaded asset container
     */
    loadAssetContainerAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<AssetContainer>;
}

/**
 * Mode that determines how to handle old animation groups before loading new ones.
 */
export const enum SceneLoaderAnimationGroupLoadingMode {
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
    plugin: (ISceneLoaderPlugin | ISceneLoaderPluginAsync) & Partial<ISceneLoaderPluginFactory> & Partial<ISceneLoaderPluginInternal>;
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
 * Defines options for SceneLoader plugins. This interface is extended by specific plugins.
 */
export interface SceneLoaderPluginOptions extends Record<string, Record<string, unknown> | undefined> {}

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

type SceneSource = string | File | ArrayBufferView;

/**
 * Defines common options for loading operations performed by SceneLoader.
 */
interface SceneLoaderOptions {
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
        [Plugin in keyof SceneLoaderPluginOptions]: {
            [Option in keyof DefaultPluginOptions<SceneLoaderPluginOptions[Plugin]>]: DefaultPluginOptions<SceneLoaderPluginOptions[Plugin]>[Option];
        };
    };
}

/**
 * Defines options for ImportMeshAsync.
 */
export interface ImportMeshOptions extends SceneLoaderOptions {
    /**
     * An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     */
    meshNames?: string | readonly string[] | null | undefined;

    /**
     * The instance of BABYLON.Scene to append to
     */
    scene?: Scene;
}

/**
 * Defines options for LoadAsync.
 */
export interface LoadOptions extends SceneLoaderOptions {
    /**
     * The instance of BABYLON.Engine to use to create the scene
     */
    engine?: AbstractEngine;
}

/**
 * Defines options for AppendAsync.
 */
export interface AppendOptions extends SceneLoaderOptions {
    /**
     * The instance of BABYLON.Scene to append to
     */
    scene?: Scene;
}

/**
 * Defines options for LoadAssetContainerAsync.
 */
export interface LoadAssetContainerOptions extends SceneLoaderOptions {
    /**
     * The instance of BABYLON.Scene to append to
     */
    scene?: Scene;
}

/**
 * Defines options for ImportAnimationsAsync.
 */
export interface ImportAnimationsOptions extends SceneLoaderOptions {
    /**
     * The instance of BABYLON.Scene to append to
     */
    scene?: Scene;

    /**
     * When true, animations are cleaned before importing new ones. Animations are appended otherwise
     */
    overwriteAnimations?: boolean;

    /**
     * Defines how to handle old animations groups before importing new ones
     */
    animationGroupLoadingMode?: SceneLoaderAnimationGroupLoadingMode;

    /**
     * defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
     */
    targetConverter?: Nullable<(target: unknown) => unknown>;
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
        onSuccess: (plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync, data: unknown, responseURL?: string) => void,
        onProgress: ((event: ISceneLoaderProgressEvent) => void) | undefined,
        onError: (message?: string, exception?: any) => void,
        onDispose: () => void,
        pluginExtension: Nullable<string>,
        name: string,
        pluginOptions: PluginOptions
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

        if (pluginOptions?.[registeredPlugin.plugin.name]?.enabled === false) {
            throw new Error(`The '${registeredPlugin.plugin.name}' plugin is disabled via the loader options passed to the loading operation.`);
        }

        if (fileInfo.rawData && !registeredPlugin.isBinary) {
            // eslint-disable-next-line no-throw-literal
            throw "Loading from ArrayBufferView can not be used with plugins that don't support binary loading.";
        }

        // For plugin factories, the plugin is instantiated on each SceneLoader operation. This makes options handling
        // much simpler as we can just pass the options to the factory, rather than passing options through to every possible
        // plugin call. Given this, options are only supported for plugins that provide a factory function.
        const plugin: IRegisteredPlugin["plugin"] = registeredPlugin.plugin.createPlugin?.(pluginOptions ?? {}) ?? registeredPlugin.plugin;
        if (!plugin) {
            // eslint-disable-next-line no-throw-literal
            throw `The loader plugin corresponding to the '${pluginExtension}' file type has not been found. If using es6, please import the plugin you wish to use before.`;
        }

        SceneLoader.OnPluginActivatedObservable.notifyObservers(plugin);

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
            return plugin;
        }

        const useArrayBuffer = registeredPlugin.isBinary;

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

        if (canUseOfflineSupport && Engine.OfflineProviderFactory) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            scene.offlineProvider = Engine.OfflineProviderFactory(fileInfo.url, manifestChecked, engine.disableManifestCheck);
        } else {
            manifestChecked();
        }

        return plugin;
    }

    private static _GetFileInfo(rootUrl: string, sceneFilename: SceneSource): Nullable<IFileInfo> {
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
            name = RandomGUID();
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
            const extension = plugin.extensions;
            SceneLoader._RegisteredPlugins[extension.toLowerCase()] = {
                plugin: plugin,
                isBinary: false,
            };
        } else {
            const extensions = plugin.extensions;
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
        meshNames: string | readonly string[] | null | undefined,
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onSuccess?: Nullable<SceneLoaderSuccessCallback>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        return SceneLoader._ImportMesh(meshNames, rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name);
    }

    private static _ImportMesh(
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

        return SceneLoader._LoadData(
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

    /**
     * Import meshes into a scene
     * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
     * @param options an object that configures aspects of how the scene is loaded
     * @returns The loaded list of imported meshes, particle systems, skeletons, and animation groups
     */
    public static ImportMeshAsync(source: SceneSource, options?: ImportMeshOptions): Promise<ISceneLoaderAsyncResult>;

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
        meshNames: string | readonly string[] | null | undefined,
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<ISceneLoaderAsyncResult>;

    public static ImportMeshAsync(
        ...args:
            | [
                  meshNames: string | readonly string[] | null | undefined,
                  rootUrl: string,
                  sceneFilename?: SceneSource,
                  scene?: Nullable<Scene>,
                  onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
                  pluginExtension?: Nullable<string>,
                  name?: string,
              ]
            | [source: SceneSource, options?: ImportMeshOptions]
    ): Promise<ISceneLoaderAsyncResult> {
        let meshNames: string | readonly string[] | null | undefined;
        let rootUrl: string;
        let sceneFilename: SceneSource | undefined;
        let scene: Nullable<Scene> | undefined;
        let onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> | undefined;
        let pluginExtension: Nullable<string> | undefined;
        let name: string | undefined;
        let pluginOptions: PluginOptions;

        // This is a user-defined type guard: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
        // This is the most type safe way to distinguish between the two possible argument arrays.
        const isOptionsArgs = (maybeOptionsArgs: typeof args): maybeOptionsArgs is [source: SceneSource, options?: ImportMeshOptions] => {
            // If there is only a single argument, then it must be the options overload.
            // If the second argument is an object, then it must be the options overload.
            return maybeOptionsArgs.length === 1 || typeof maybeOptionsArgs[1] === "object";
        };

        if (isOptionsArgs(args)) {
            // Source is mapped to sceneFileName
            sceneFilename = args[0];
            // Options determine the rest of the arguments
            ({ meshNames, rootUrl = "", scene, onProgress, pluginExtension, name, pluginOptions } = args[1] ?? {});
        } else {
            // For the legacy signature, we just directly map each argument
            [meshNames, rootUrl, sceneFilename, scene, onProgress, pluginExtension, name] = args;
        }

        return new Promise((resolve, reject) => {
            SceneLoader._ImportMesh(
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
        sceneFilename?: SceneSource,
        engine?: Nullable<AbstractEngine>,
        onSuccess?: Nullable<(scene: Scene) => void>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        return SceneLoader._Load(rootUrl, sceneFilename, engine, onSuccess, onProgress, onError, pluginExtension, name);
    }

    private static _Load(
        rootUrl: string,
        sceneFilename: SceneSource = "",
        engine: Nullable<AbstractEngine> = EngineStore.LastCreatedEngine,
        onSuccess: Nullable<(scene: Scene) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name = "",
        pluginOptions: PluginOptions = {}
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        if (!engine) {
            Tools.Error("No engine available");
            return null;
        }

        return SceneLoader._Append(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension, name, pluginOptions);
    }

    /**
     * Load a scene
     * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
     * @param options an object that configures aspects of how the scene is loaded
     * @returns The loaded scene
     */
    public static LoadAsync(source: SceneSource, options?: LoadOptions): Promise<Scene>;

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
        sceneFilename?: SceneSource,
        engine?: Nullable<AbstractEngine>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene>;

    public static LoadAsync(
        ...args:
            | [
                  rootUrl: string,
                  sceneFilename?: SceneSource,
                  engine?: Nullable<AbstractEngine>,
                  onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
                  pluginExtension?: Nullable<string>,
                  name?: string,
              ]
            | [source: SceneSource, options?: LoadOptions]
    ): Promise<Scene> {
        let rootUrl: string;
        let sceneFilename: SceneSource | undefined;
        let engine: Nullable<AbstractEngine> | undefined;
        let onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> | undefined;
        let pluginExtension: Nullable<string> | undefined;
        let name: string | undefined;
        let pluginOptions: PluginOptions;

        // This is a user-defined type guard: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
        // This is the most type safe way to distinguish between the two possible argument arrays.
        const isOptionsArgs = (maybeOptionsArgs: typeof args): maybeOptionsArgs is [source: SceneSource, options?: LoadOptions] => {
            // If the first argument is not a string, then it must be the options overload.
            // If there is only a single string argument, then we should use the legacy overload for back compat.
            // If there are more than one arguments, and the second argument is a object but not a File or an ArrayBuffer, then it must be the options overload.
            return (
                !(typeof maybeOptionsArgs[0] === "string") ||
                (maybeOptionsArgs.length > 1 && typeof maybeOptionsArgs[1] === "object" && !(maybeOptionsArgs[1] instanceof File) && !ArrayBuffer.isView(maybeOptionsArgs[1]))
            );
        };

        if (isOptionsArgs(args)) {
            // Source is mapped to sceneFileName
            sceneFilename = args[0];
            // Options determine the rest of the arguments
            ({ rootUrl = "", engine, onProgress, pluginExtension, name, pluginOptions } = args[1] ?? {});
        } else {
            // For the legacy signature, we just directly map each argument
            [rootUrl, sceneFilename, engine, onProgress, pluginExtension, name] = args;
        }

        return new Promise((resolve, reject) => {
            SceneLoader._Load(
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
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onSuccess?: Nullable<(scene: Scene) => void>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        return SceneLoader._Append(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name);
    }

    private static _Append(
        rootUrl: string,
        sceneFilename: SceneSource = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onSuccess: Nullable<(scene: Scene) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name = "",
        pluginOptions: PluginOptions = {}
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

    /**
     * Append a scene
     * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
     * @param options an object that configures aspects of how the scene is loaded
     * @returns The given scene
     */
    public static AppendAsync(source: SceneSource, options?: LoadAssetContainerOptions): Promise<Scene>;

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
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene>;

    public static AppendAsync(
        ...args:
            | [
                  rootUrl: string,
                  sceneFilename?: SceneSource,
                  scene?: Nullable<Scene>,
                  onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
                  pluginExtension?: Nullable<string>,
                  name?: string,
              ]
            | [source: SceneSource, options?: AppendOptions]
    ): Promise<Scene> {
        let rootUrl: string;
        let sceneFilename: SceneSource | undefined;
        let scene: Nullable<Scene> | undefined;
        let onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> | undefined;
        let pluginExtension: Nullable<string> | undefined;
        let name: string | undefined;
        let pluginOptions: PluginOptions;

        // This is a user-defined type guard: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
        // This is the most type safe way to distinguish between the two possible argument arrays.
        const isOptionsArgs = (maybeOptionsArgs: typeof args): maybeOptionsArgs is [source: SceneSource, options?: AppendOptions] => {
            // If the first argument is a File or an ArrayBufferView, then it must be the options overload.
            // If there is only a single string argument, then we should use the legacy overload for back compat.
            // If there are more than one arguments, and the second argument is a object but not a File, then it must be the options overload.
            return (
                maybeOptionsArgs[0] instanceof File ||
                ArrayBuffer.isView(args[0]) ||
                (maybeOptionsArgs.length > 1 && typeof maybeOptionsArgs[1] === "object" && !(maybeOptionsArgs[1] instanceof File))
            );
        };

        if (isOptionsArgs(args)) {
            // Source is mapped to sceneFileName
            sceneFilename = args[0];
            // Options determine the rest of the arguments
            ({ rootUrl = "", scene, onProgress, pluginExtension, name, pluginOptions } = args[1] ?? {});
        } else {
            // For the legacy signature, we just directly map each argument
            [rootUrl, sceneFilename, scene, onProgress, pluginExtension, name] = args;
        }

        return new Promise((resolve, reject) => {
            SceneLoader._Append(
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
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onSuccess?: Nullable<(assets: AssetContainer) => void>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Nullable<ISceneLoaderPlugin | ISceneLoaderPluginAsync> {
        return SceneLoader._LoadAssetContainer(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name);
    }

    private static _LoadAssetContainer(
        rootUrl: string,
        sceneFilename: SceneSource = "",
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        onSuccess: Nullable<(assets: AssetContainer) => void> = null,
        onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
        onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
        pluginExtension: Nullable<string> = null,
        name = "",
        pluginOptions: PluginOptions = {}
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

    /**
     * Load a scene into an asset container
     * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
     * @param options an object that configures aspects of how the scene is loaded
     * @returns The loaded asset container
     */
    public static LoadAssetContainerAsync(source: SceneSource, options?: LoadAssetContainerOptions): Promise<AssetContainer>;

    /**
     * Load a scene into an asset container
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene (default: empty string)
     * @param scene is the instance of Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the filename, if the data is binary
     * @returns The loaded asset container
     */
    public static LoadAssetContainerAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<AssetContainer>;

    // This is the single implementation that handles both the legacy many-parameters overload and the
    // new source + config overload. Using a parameters array union is the most type safe way to handle this.
    public static LoadAssetContainerAsync(
        ...args:
            | [
                  rootUrl: string,
                  sceneFilename?: SceneSource,
                  scene?: Nullable<Scene>,
                  onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
                  pluginExtension?: Nullable<string>,
                  name?: string,
              ]
            | [source: SceneSource, options?: LoadAssetContainerOptions]
    ): Promise<AssetContainer> {
        let rootUrl: string;
        let sceneFilename: SceneSource | undefined;
        let scene: Nullable<Scene> | undefined;
        let onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> | undefined;
        let pluginExtension: Nullable<string> | undefined;
        let name: string | undefined;
        let pluginOptions: PluginOptions;

        // This is a user-defined type guard: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
        // This is the most type safe way to distinguish between the two possible argument arrays.
        const isOptionsArgs = (maybeOptionsArgs: typeof args): maybeOptionsArgs is [source: SceneSource, options?: LoadAssetContainerOptions] => {
            // If the first argument is not a string, then it must be the options overload.
            // If there is only a single string argument, then we should use the legacy overload for back compat.
            // If there are more than one arguments, and the second argument is a object but not a File or an ArrayBufferView, then it must be the options overload.
            return (
                !(typeof maybeOptionsArgs[0] === "string") ||
                (maybeOptionsArgs.length > 1 && typeof maybeOptionsArgs[1] === "object" && !(maybeOptionsArgs[1] instanceof File) && !ArrayBuffer.isView(maybeOptionsArgs[1]))
            );
        };

        if (isOptionsArgs(args)) {
            // Source is mapped to sceneFileName
            sceneFilename = args[0];
            // Options determine the rest of the arguments
            ({ rootUrl = "", scene, onProgress, pluginExtension, name, pluginOptions } = args[1] ?? {});
        } else {
            // For the legacy signature, we just directly map each argument
            [rootUrl, sceneFilename, scene, onProgress, pluginExtension, name] = args;
        }

        return new Promise((resolve, reject) => {
            SceneLoader._LoadAssetContainer(
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
                pluginExtension,
                name,
                pluginOptions
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
     * @param name defines the filename, if the data is binary
     */
    public static ImportAnimations(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        overwriteAnimations?: boolean,
        animationGroupLoadingMode?: SceneLoaderAnimationGroupLoadingMode,
        targetConverter?: Nullable<(target: any) => any>,
        onSuccess?: Nullable<(scene: Scene) => void>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): void {
        SceneLoader._ImportAnimations(
            rootUrl,
            sceneFilename,
            scene,
            overwriteAnimations,
            animationGroupLoadingMode,
            targetConverter,
            onSuccess,
            onProgress,
            onError,
            pluginExtension,
            name
        );
    }

    private static _ImportAnimations(
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

        this._LoadAssetContainer(rootUrl, sceneFilename, scene, onAssetContainerLoaded, onProgress, onError, pluginExtension, name, pluginOptions);
    }

    /**
     * Import animations from a file into a scene
     * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
     * @param options an object that configures aspects of how the scene is loaded
     * @returns The loaded asset container
     */
    public static ImportAnimationsAsync(source: SceneSource, options?: ImportAnimationsOptions): Promise<Scene>;

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
     * @param name defines the filename, if the data is binary
     * @returns the updated scene with imported animations
     */
    public static ImportAnimationsAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        overwriteAnimations?: boolean,
        animationGroupLoadingMode?: SceneLoaderAnimationGroupLoadingMode,
        targetConverter?: Nullable<(target: any) => any>,
        onSuccess?: Nullable<(scene: Scene) => void>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene>;

    public static ImportAnimationsAsync(
        ...args:
            | [
                  rootUrl: string,
                  sceneFilename?: SceneSource,
                  scene?: Nullable<Scene>,
                  overwriteAnimations?: boolean,
                  animationGroupLoadingMode?: SceneLoaderAnimationGroupLoadingMode,
                  targetConverter?: Nullable<(target: any) => any>,
                  onSuccess?: Nullable<(scene: Scene) => void>,
                  onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
                  onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
                  pluginExtension?: Nullable<string>,
                  name?: string,
              ]
            | [source: SceneSource, options?: ImportAnimationsOptions]
    ): Promise<Scene> {
        let rootUrl: string;
        let sceneFilename: SceneSource | undefined;
        let scene: Nullable<Scene> | undefined;
        let overwriteAnimations: boolean | undefined;
        let animationGroupLoadingMode: SceneLoaderAnimationGroupLoadingMode | undefined;
        let targetConverter: Nullable<(target: any) => any> | undefined;
        let onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> | undefined;
        let pluginExtension: Nullable<string> | undefined;
        let name: string | undefined;
        let pluginOptions: PluginOptions;

        // This is a user-defined type guard: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
        // This is the most type safe way to distinguish between the two possible argument arrays.
        const isOptionsArgs = (maybeOptionsArgs: typeof args): maybeOptionsArgs is [source: SceneSource, options?: ImportAnimationsOptions] => {
            // If the first argument is not a string, then it must be the options overload.
            // If there is only a single string argument, then we should use the legacy overload for back compat.
            // If there are more than one arguments, and the second argument is a object but not a File or an ArrayBufferView, then it must be the options overload.
            return (
                !(typeof maybeOptionsArgs[0] === "string") ||
                (maybeOptionsArgs.length > 1 && typeof maybeOptionsArgs[1] === "object" && !(maybeOptionsArgs[1] instanceof File) && !ArrayBuffer.isView(maybeOptionsArgs[1]))
            );
        };

        if (isOptionsArgs(args)) {
            // Source is mapped to sceneFileName
            sceneFilename = args[0];
            // Options determine the rest of the arguments
            ({ rootUrl = "", scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name, pluginOptions } = args[1] ?? {});
        } else {
            // For the legacy signature, we just directly map each argument
            [rootUrl, sceneFilename, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, , onProgress, , pluginExtension, name] = args;
        }

        return new Promise((resolve, reject) => {
            SceneLoader._ImportAnimations(
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
                pluginExtension,
                name,
                pluginOptions
            );
        });
    }
}
