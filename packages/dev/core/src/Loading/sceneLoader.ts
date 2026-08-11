/* eslint-disable @typescript-eslint/naming-convention */
import { Tools } from "../Misc/tools.pure";
import { Observable } from "../Misc/observable";
import { type DeepImmutable, type Nullable } from "../types";
import { Scene } from "../scene.pure";
import { EngineStore } from "../Engines/engineStore";
import { type AbstractMesh } from "../Meshes/abstractMesh";
import { type AnimationGroup } from "../Animations/animationGroup";
import { type AssetContainer } from "../assetContainer";
import { type IParticleSystem } from "../Particles/IParticleSystem";
import { type Skeleton } from "../Bones/skeleton";
import { Logger } from "../Misc/logger";
import { Constants } from "../Engines/constants";
import { SceneLoaderFlags } from "./sceneLoaderFlags";
import { type IFileRequest } from "../Misc/fileRequest";
import { type WebRequest } from "../Misc/webRequest";
import { type LoadFileError, IsBase64DataUrl } from "../Misc/fileTools.pure";
import { type TransformNode } from "../Meshes/transformNode";
import { type Geometry } from "../Meshes/geometry";
import { type Light } from "../Lights/light";
import { RuntimeError, ErrorCodes } from "../Misc/error";
import { type ISpriteManager } from "../Sprites/spriteManager";
import { RandomGUID } from "../Misc/guid";
import { AbstractEngine } from "../Engines/abstractEngine";
import { _FetchAsync } from "core/Misc/webRequest.fetch";

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
        readonly isBinary: boolean;
        readonly mimeType?: string;
    };
}

/**
 * Metadata for a SceneLoader plugin that must also be provided by a plugin factory
 */
export interface ISceneLoaderPluginMetadata {
    /**
     * The friendly name of the plugin.
     */
    readonly name: string;

    /**
     * The file extensions supported by the plugin.
     */
    readonly extensions: string | ISceneLoaderPluginExtensions;

    /**
     * The callback that returns true if the data can be directly loaded.
     * @param data string containing the file data
     * @returns if the data can be loaded directly
     */
    canDirectLoad?(data: string): boolean;
}

/**
 * Interface used by SceneLoader plugin factory
 */
export interface ISceneLoaderPluginFactory extends ISceneLoaderPluginMetadata {
    /**
     * Function called to create a new plugin
     * @param options plugin options that were passed to the SceneLoader operation
     * @returns the new plugin
     */
    createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPlugin | ISceneLoaderPluginAsync | Promise<ISceneLoaderPlugin | ISceneLoaderPluginAsync>;
}

/**
 * Interface used to define the base of ISceneLoaderPlugin and ISceneLoaderPluginAsync
 */
export interface ISceneLoaderPluginBase extends ISceneLoaderPluginMetadata {
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
     * The callback that returns the data to pass to the plugin if the data can be directly loaded.
     * @param scene scene loading this data
     * @param data string containing the data
     * @returns data to pass to the plugin
     */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
 * A concrete (non-factory) SceneLoader plugin, which may be synchronous or asynchronous and may expose internal members.
 */
type SceneLoaderPlugin = (ISceneLoaderPlugin | ISceneLoaderPluginAsync) & Partial<ISceneLoaderPluginInternal>;

/**
 * Defines a plugin registered by the SceneLoader
 */
interface IRegisteredPlugin {
    /**
     * Defines the plugin to use
     */
    plugin: SceneLoaderPlugin | ISceneLoaderPluginFactory;
    /**
     * Defines if the plugin supports binary data
     */
    isBinary: boolean;
    mimeType?: string;
}

function IsFactory(pluginOrFactory: IRegisteredPlugin["plugin"]): pluginOrFactory is ISceneLoaderPluginFactory {
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
 * Defines options for SceneLoader plugins. This interface is extended by specific plugins.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/naming-convention
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
export type PluginOptions = ISceneLoaderOptions["pluginOptions"];

type SceneSource = string | File | ArrayBufferView;

/**
 * Defines common options for loading operations performed by SceneLoader.
 */
interface ISceneLoaderOptions {
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

/**
 * Defines options for ImportMeshAsync.
 */
export interface ImportMeshOptions extends ISceneLoaderOptions {
    /**
     * An array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
     */
    meshNames?: string | readonly string[] | null | undefined;
}

/**
 * Defines options for LoadAsync.
 */
export interface LoadOptions extends ISceneLoaderOptions {}

/**
 * Defines options for AppendAsync.
 */
export interface AppendOptions extends ISceneLoaderOptions {}

/**
 * Defines options for LoadAssetContainerAsync.
 */
export interface LoadAssetContainerOptions extends ISceneLoaderOptions {}

/**
 * Defines options for ImportAnimationsAsync.
 */
export interface ImportAnimationsOptions extends ISceneLoaderOptions {
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

function isFile(value: unknown): value is File {
    return !!(value as File).name;
}

const onPluginActivatedObservable = new Observable<ISceneLoaderPlugin | ISceneLoaderPluginAsync>();
const registeredPlugins: { [extension: string]: IRegisteredPlugin } = {};
let showingLoadingScreen = false;

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

function formatErrorMessage(fileInfo: IFileInfo, message?: string, exception?: any): string {
    const fromLoad = fileInfo.rawData ? "binary data" : fileInfo.url;
    let errorMessage = "Unable to load from " + fromLoad;

    if (message) {
        errorMessage += `: ${message}`;
    } else if (exception) {
        errorMessage += `: ${exception}`;
    }

    return errorMessage;
}

/**
 * The plugin instance and the loaded data produced by loadDataAsync.
 */
type LoadedPluginData = {
    plugin: SceneLoaderPlugin;
    data: unknown;
    responseURL?: string;
};

function createLoadError(fileInfo: IFileInfo, message?: string, exception?: any): RuntimeError {
    const errorMessage = formatErrorMessage(fileInfo, message, exception);
    return new RuntimeError(errorMessage, ErrorCodes.SceneLoaderError, exception);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// Converts an error into a SceneLoader RuntimeError, leaving an already-wrapped SceneLoader error untouched
// so that it is not double-wrapped (which would duplicate the "Unable to load from ..." prefix).
function toLoadError(fileInfo: IFileInfo, error: unknown): RuntimeError {
    return error instanceof RuntimeError && error.errorCode === ErrorCodes.SceneLoaderError ? error : createLoadError(fileInfo, getErrorMessage(error), error);
}

const loadAssetContainerNotSupportedMessage = "LoadAssetContainer is not supported by this plugin. Plugin did not provide a loadAssetContainer or loadAssetContainerAsync method.";

// A synchronous plugin exposes the synchronous import/load methods; an asynchronous plugin exposes the *Async methods.
function isSyncPlugin(plugin: SceneLoaderPlugin): plugin is ISceneLoaderPlugin & Partial<ISceneLoaderPluginInternal> {
    const candidate = plugin as Partial<ISceneLoaderPlugin>;
    return !!candidate.importMesh || !!candidate.load || !!candidate.loadAssetContainer;
}

// Adapts a synchronous ISceneLoaderPlugin into an ISceneLoaderPluginAsync so that callers can use a single
// promise-based code path regardless of whether the underlying plugin is synchronous or asynchronous.
// Asynchronous plugins are returned unchanged. The synchronous plugin reports failure via an onError callback
// and/or a falsy return value; both are translated into a rejected promise.
function toAsyncPlugin(plugin: SceneLoaderPlugin, fileInfo: IFileInfo): ISceneLoaderPluginAsync {
    if (!isSyncPlugin(plugin)) {
        return plugin;
    }

    const runSync = <T>(invoke: (onError: (message?: string, exception?: any) => void) => T): NonNullable<T> => {
        let pluginError: { message?: string; exception?: any } | undefined;
        const result = invoke((message, exception) => {
            pluginError = { message, exception };
        });
        if (!result) {
            throw createLoadError(fileInfo, pluginError?.message, pluginError?.exception);
        }
        return result;
    };

    return {
        name: plugin.name,
        extensions: plugin.extensions,
        importMeshAsync: async (meshesNames, scene, data, rootUrl) => {
            const meshes: AbstractMesh[] = [];
            const particleSystems: IParticleSystem[] = [];
            const skeletons: Skeleton[] = [];
            runSync((onError) => plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons, onError));
            return { meshes, particleSystems, skeletons, animationGroups: [], transformNodes: [], geometries: [], lights: [], spriteManagers: [] };
        },
        loadAsync: async (scene, data, rootUrl) => {
            runSync((onError) => plugin.load(scene, data, rootUrl, onError));
        },
        loadAssetContainerAsync: async (scene, data, rootUrl) => {
            return runSync((onError) => plugin.loadAssetContainer(scene, data, rootUrl, onError));
        },
    };
}

// Reports a load failure to the legacy onError callback. The onError signature requires a Scene, but a scene
// may not be available (e.g. the error occurred before any scene was created). In that case, fall back to
// logging so the error handler does not throw a secondary error and mask the original failure.
function reportLegacyLoadError(onError: Nullable<(scene: Scene, message: string, exception?: any) => void> | undefined, reportScene: Nullable<Scene>, error: unknown): void {
    const message = getErrorMessage(error);
    if (onError && reportScene) {
        onError(reportScene, message, error);
    } else {
        Logger.Error(message);
    }
}

// Wraps a user supplied progress callback so that an exception thrown by it is logged rather than
// aborting the entire loading operation.
function wrapProgress(onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> | undefined): ((event: ISceneLoaderProgressEvent) => void) | undefined {
    if (!onProgress) {
        return undefined;
    }

    return (event: ISceneLoaderProgressEvent) => {
        try {
            onProgress(event);
        } catch (error) {
            Logger.Warn("Error in onProgress callback: " + getErrorMessage(error));
        }
    };
}

async function loadDataAsync(
    fileInfo: IFileInfo,
    scene: Scene,
    onProgress: ((event: ISceneLoaderProgressEvent) => void) | undefined,
    pluginExtension: Nullable<string>,
    name: string,
    pluginOptions: PluginOptions
): Promise<LoadedPluginData> {
    const directLoad = getDirectLoad(fileInfo.url);

    if (fileInfo.rawData && !pluginExtension) {
        throw new Error("When using ArrayBufferView to load data the file extension must be provided.");
    }

    const fileExtension = !directLoad && !pluginExtension ? getFilenameExtension(fileInfo.url) : "";

    let registeredPlugin = pluginExtension
        ? getPluginForExtension(pluginExtension, true)
        : directLoad
          ? getPluginForDirectLoad(fileInfo.url)
          : getPluginForExtension(fileExtension, false);

    if (!registeredPlugin && fileExtension) {
        if (fileInfo.url && !fileInfo.url.startsWith("blob:")) {
            // Fetching head content to get the mime type
            const response = await _FetchAsync(fileInfo.url, { method: "HEAD", responseHeaders: ["Content-Type"] });
            const mimeType = response.headerValues ? response.headerValues["Content-Type"] : "";
            if (mimeType) {
                registeredPlugin = getPluginForMimeType(mimeType);
            }
        }

        if (!registeredPlugin) {
            registeredPlugin = getDefaultPlugin();
        }
    }

    if (!registeredPlugin) {
        throw new Error(`No plugin or fallback for ${pluginExtension ?? fileInfo.url}`);
    }

    if (pluginOptions?.[registeredPlugin.plugin.name]?.enabled === false) {
        throw new Error(`The '${registeredPlugin.plugin.name}' plugin is disabled via the loader options passed to the loading operation.`);
    }

    if (fileInfo.rawData && !registeredPlugin.isBinary) {
        throw new Error("Loading from ArrayBufferView can not be used with plugins that don't support binary loading.");
    }

    // For plugin factories, the plugin is instantiated on each SceneLoader operation. This makes options handling
    // much simpler as we can just pass the options to the factory, rather than passing options through to every possible
    // plugin call. Given this, options are only supported for plugins that provide a factory function.
    let plugin: SceneLoaderPlugin;
    if (IsFactory(registeredPlugin.plugin)) {
        const pluginFactory = registeredPlugin.plugin;
        try {
            // Only await when the factory is actually asynchronous, so that for synchronous factories the plugin is
            // instantiated (and onPluginActivatedObservable is notified) synchronously within the calling load operation.
            const createdPlugin = pluginFactory.createPlugin((pluginOptions ?? {}) as SceneLoaderPluginOptions);
            plugin = createdPlugin instanceof Promise ? await createdPlugin : createdPlugin;
        } catch (error) {
            throw createLoadError(fileInfo, "Error instantiating plugin.", error);
        }
    } else {
        plugin = registeredPlugin.plugin;
    }

    if (!plugin) {
        throw new Error(`The loader plugin corresponding to the '${pluginExtension}' file type has not been found. If using es6, please import the plugin you wish to use before.`);
    }

    onPluginActivatedObservable.notifyObservers(plugin);

    // Check if we have a direct load url. If the plugin is registered to handle
    // it or it's not a base64 data url, then pass it through the direct load path.
    if (directLoad && ((plugin.canDirectLoad && plugin.canDirectLoad(fileInfo.url)) || !IsBase64DataUrl(fileInfo.url))) {
        if (plugin.directLoad) {
            let data: unknown;
            try {
                data = await plugin.directLoad(scene, directLoad);
            } catch (error) {
                throw createLoadError(fileInfo, "Error in directLoad of _loadData: " + error, error);
            }
            return { plugin, data };
        }
        return { plugin, data: directLoad };
    }

    const useArrayBuffer = registeredPlugin.isBinary;

    return await new Promise<LoadedPluginData>((resolve, reject) => {
        let request: Nullable<IFileRequest> = null;
        let pluginDisposed = false;

        const onDisposeObserver = plugin.onDisposeObservable?.add(() => {
            pluginDisposed = true;

            if (request) {
                request.abort();
                request = null;
            }

            rejectAndCleanup(createLoadError(fileInfo, "Loading was aborted because the plugin was disposed."));
        });

        // Ensure the onDispose observer is removed once the promise settles, so observers do not accumulate across loads.
        const cleanup = () => {
            if (onDisposeObserver) {
                plugin.onDisposeObservable?.remove(onDisposeObserver);
            }
        };
        const resolveAndCleanup = (value: LoadedPluginData) => {
            cleanup();
            resolve(value);
        };
        const rejectAndCleanup = (error: Error) => {
            cleanup();
            reject(error);
        };

        const dataCallback = (data: unknown, responseURL?: string) => {
            if (scene.isDisposed) {
                rejectAndCleanup(createLoadError(fileInfo, "Scene has been disposed"));
                return;
            }

            resolveAndCleanup({ plugin, data, responseURL });
        };

        const manifestChecked = () => {
            if (pluginDisposed) {
                return;
            }

            const errorCallback = (request?: WebRequest, exception?: LoadFileError) => {
                rejectAndCleanup(createLoadError(fileInfo, request?.statusText, exception));
            };

            if (!plugin.loadFile && fileInfo.rawData) {
                rejectAndCleanup(createLoadError(fileInfo, "Plugin does not support loading ArrayBufferView."));
                return;
            }

            try {
                request = plugin.loadFile
                    ? plugin.loadFile(scene, fileInfo.rawData || fileInfo.file || fileInfo.url, fileInfo.rootUrl, dataCallback, onProgress, useArrayBuffer, errorCallback, name)
                    : scene._loadFile(fileInfo.file || fileInfo.url, dataCallback, onProgress, true, useArrayBuffer, errorCallback);
            } catch (error) {
                rejectAndCleanup(createLoadError(fileInfo, undefined, error));
            }
        };

        const engine = scene.getEngine();
        // File objects and raw data buffers are already in-memory and are not URL-backed requests, so they must
        // not be routed through the offline (manifest/cache) provider.
        let canUseOfflineSupport = !fileInfo.file && !fileInfo.rawData && engine.enableOfflineSupport;
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
            try {
                scene.offlineProvider = AbstractEngine.OfflineProviderFactory(fileInfo.url, manifestChecked, engine.disableManifestCheck);
            } catch (error) {
                rejectAndCleanup(createLoadError(fileInfo, undefined, error));
            }
        } else {
            manifestChecked();
        }
    });
}

function GetFileInfo(rootUrl: string, sceneSource: SceneSource): Nullable<IFileInfo> {
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

/**
 * Adds a new plugin to the list of registered plugins
 * @param plugin defines the plugin to add
 */
export function RegisterSceneLoaderPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory): void {
    if (typeof plugin.extensions === "string") {
        const extension = plugin.extensions;
        registeredPlugins[extension.toLowerCase()] = {
            plugin: plugin,
            isBinary: false,
        };
    } else {
        const extensions = plugin.extensions;
        const keys = Object.keys(extensions);
        for (const extension of keys) {
            registeredPlugins[extension.toLowerCase()] = {
                plugin: plugin,
                isBinary: extensions[extension].isBinary,
                mimeType: extensions[extension].mimeType,
            };
        }
    }
}

/**
 * Adds a new plugin to the list of registered plugins
 * @deprecated Please use {@link RegisterSceneLoaderPlugin} instead.
 * @param plugin defines the plugin to add
 */
export function registerSceneLoaderPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory): void {
    RegisterSceneLoaderPlugin(plugin);
}

/**
 * Gets metadata for all currently registered scene loader plugins.
 * @returns An array where each entry has metadata for a single scene loader plugin.
 */
export function GetRegisteredSceneLoaderPluginMetadata(): DeepImmutable<
    Array<
        Pick<ISceneLoaderPluginMetadata, "name"> & {
            /**
             * The extensions supported by the plugin.
             */
            extensions: ({
                /**
                 * The file extension.
                 */
                extension: string;
            } & ISceneLoaderPluginExtensions[string])[];
        }
    >
> {
    return Array.from(
        Object.entries(registeredPlugins).reduce((pluginMap, [extension, extensionRegistration]) => {
            let pluginMetadata = pluginMap.get(extensionRegistration.plugin.name);
            if (!pluginMetadata) {
                pluginMap.set(extensionRegistration.plugin.name, (pluginMetadata = []));
            }
            pluginMetadata.push({ extension, isBinary: extensionRegistration.isBinary, mimeType: extensionRegistration.mimeType });
            return pluginMap;
        }, new Map<string, ({ extension: string } & ISceneLoaderPluginExtensions[string])[]>())
    ).map(([name, extensions]) => ({ name, extensions }));
}

/**
 * Import meshes into a scene
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded list of imported meshes, particle systems, skeletons, and animation groups
 */
export async function ImportMeshAsync(source: SceneSource, scene: Scene, options?: ImportMeshOptions): Promise<ISceneLoaderAsyncResult> {
    const { meshNames, rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return await importMeshCoreAsync(meshNames, rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

async function importMeshCoreAsync(
    meshNames: string | readonly string[] | null | undefined,
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<ISceneLoaderAsyncResult> {
    if (!scene) {
        throw new Error("No scene available to import mesh to");
    }

    const fileInfo = GetFileInfo(rootUrl, sceneFilename);
    if (!fileInfo) {
        throw new Error("Cannot load file: a valid scene filename or root url was not provided.");
    }

    const loadingToken = {};
    scene.addPendingData(loadingToken);

    const progressHandler = wrapProgress(onProgress);

    try {
        const { plugin, data, responseURL } = await loadDataAsync(fileInfo, scene, progressHandler, pluginExtension ?? null, name, pluginOptions);

        if (plugin.rewriteRootURL) {
            fileInfo.rootUrl = plugin.rewriteRootURL(fileInfo.rootUrl, responseURL);
        }

        let result: ISceneLoaderAsyncResult;
        try {
            result = await toAsyncPlugin(plugin, fileInfo).importMeshAsync(meshNames, scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name);
        } catch (error) {
            throw toLoadError(fileInfo, error);
        }

        // eslint-disable-next-line require-atomic-updates
        scene.loadingPluginName = plugin.name;
        scene.importedMeshesFiles.push(fileInfo.url);

        return result;
    } finally {
        scene.removePendingData(loadingToken);
    }
}

// This is the core implementation of load scene
async function loadSceneCoreAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    engine: Nullable<AbstractEngine> = EngineStore.LastCreatedEngine,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<Scene> {
    if (!engine) {
        throw new Error("No engine available");
    }

    const scene = new Scene(engine);
    try {
        await appendSceneCoreAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name, pluginOptions);
    } catch (error) {
        // The scene was created here, so dispose it on failure to avoid leaking the partially loaded scene.
        scene.dispose();
        throw error;
    }
    return scene;
}

/**
 * Load a scene
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param engine is the instance of BABYLON.Engine to use to create the scene
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded scene
 */
export async function LoadSceneAsync(source: SceneSource, engine: AbstractEngine, options?: LoadOptions): Promise<Scene> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return await loadSceneCoreAsync(rootUrl, source, engine, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene
 * @deprecated Please use {@link LoadSceneAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param engine is the instance of BABYLON.Engine to use to create the scene
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded scene
 */
export async function loadSceneAsync(source: SceneSource, engine: AbstractEngine, options?: LoadOptions): Promise<Scene> {
    return await LoadSceneAsync(source, engine, options);
}

// This is the core implementation of append scene
async function appendSceneCoreAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<Scene> {
    if (!scene) {
        throw new Error("No scene available to append to");
    }

    const fileInfo = GetFileInfo(rootUrl, sceneFilename);
    if (!fileInfo) {
        throw new Error("Cannot load file: a valid scene filename or root url was not provided.");
    }

    const loadingToken = {};
    scene.addPendingData(loadingToken);

    if (SceneLoaderFlags.ShowLoadingScreen && !showingLoadingScreen) {
        showingLoadingScreen = true;
        scene.getEngine().displayLoadingUI();
        scene.executeWhenReady(() => {
            scene.getEngine().hideLoadingUI();
            showingLoadingScreen = false;
        });
    }

    const progressHandler = wrapProgress(onProgress);

    try {
        const { plugin, data } = await loadDataAsync(fileInfo, scene, progressHandler, pluginExtension ?? null, name, pluginOptions);

        try {
            await toAsyncPlugin(plugin, fileInfo).loadAsync(scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name);
        } catch (error) {
            throw toLoadError(fileInfo, error);
        }

        // eslint-disable-next-line require-atomic-updates
        scene.loadingPluginName = plugin.name;
        return scene;
    } finally {
        scene.removePendingData(loadingToken);
    }
}

/**
 * Append a scene
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the scene is appended
 */
export async function AppendSceneAsync(source: SceneSource, scene: Scene, options?: AppendOptions): Promise<void> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    await appendSceneCoreAsync(rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Append a scene
 * @deprecated Please use {@link AppendSceneAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the scene is appended
 */
export async function appendSceneAsync(source: SceneSource, scene: Scene, options?: AppendOptions): Promise<void> {
    return await AppendSceneAsync(source, scene, options);
}

// This is the core implementation of load asset container
async function loadAssetContainerCoreAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<AssetContainer> {
    if (!scene) {
        throw new Error("No scene available to load asset container to");
    }

    const fileInfo = GetFileInfo(rootUrl, sceneFilename);
    if (!fileInfo) {
        throw new Error("Cannot load file: a valid scene filename or root url was not provided.");
    }

    const loadingToken = {};
    scene.addPendingData(loadingToken);

    const progressHandler = wrapProgress(onProgress);

    try {
        const { plugin, data } = await loadDataAsync(fileInfo, scene, progressHandler, pluginExtension ?? null, name, pluginOptions);

        const asyncPlugin = toAsyncPlugin(plugin, fileInfo);
        if (!asyncPlugin.loadAssetContainerAsync) {
            throw createLoadError(fileInfo, loadAssetContainerNotSupportedMessage);
        }

        let assetContainer: AssetContainer;
        try {
            assetContainer = await asyncPlugin.loadAssetContainerAsync(scene, data, fileInfo.rootUrl, progressHandler, fileInfo.name);
        } catch (error) {
            throw toLoadError(fileInfo, error);
        }

        assetContainer.populateRootNodes();
        // eslint-disable-next-line require-atomic-updates
        scene.loadingPluginName = plugin.name;

        return assetContainer;
    } finally {
        scene.removePendingData(loadingToken);
    }
}

/**
 * Load a scene into an asset container
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded asset container
 */
export async function LoadAssetContainerAsync(source: SceneSource, scene: Scene, options?: LoadAssetContainerOptions): Promise<AssetContainer> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return await loadAssetContainerCoreAsync(rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene into an asset container
 * @deprecated Please use {@link LoadAssetContainerAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded asset container
 */
export async function loadAssetContainerAsync(source: SceneSource, scene: Scene, options?: LoadAssetContainerOptions): Promise<AssetContainer> {
    return await LoadAssetContainerAsync(source, scene, options);
}

// This is the core implementation of import animations
async function importAnimationsCoreAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    scene: Nullable<Scene> = EngineStore.LastCreatedScene,
    overwriteAnimations = true,
    animationGroupLoadingMode = SceneLoaderAnimationGroupLoadingMode.Clean,
    targetConverter: Nullable<(target: any) => any> = null,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<void> {
    if (!scene) {
        throw new Error("No scene available to load animations to");
    }

    if (overwriteAnimations) {
        // Reset, stop and dispose all animations before loading new ones
        for (const animatable of scene.animatables) {
            animatable.reset();
        }
        scene.stopAllAnimations();
        const animationGroups = scene.animationGroups.slice();
        for (const animationGroup of animationGroups) {
            animationGroup.dispose();
        }
        const nodes = scene.getNodes();
        for (const node of nodes) {
            if (node.animations) {
                node.animations = [];
            }
        }
    } else {
        switch (animationGroupLoadingMode as number) {
            case SceneLoaderAnimationGroupLoadingMode.Clean:
                const animationGroups = scene.animationGroups.slice();
                for (const animationGroup of animationGroups) {
                    animationGroup.dispose();
                }
                break;
            case SceneLoaderAnimationGroupLoadingMode.Stop:
                for (const animationGroup of scene.animationGroups) {
                    animationGroup.stop();
                }
                break;
            case SceneLoaderAnimationGroupLoadingMode.Sync:
                for (const animationGroup of scene.animationGroups) {
                    animationGroup.reset();
                    animationGroup.restart();
                }
                break;
            case SceneLoaderAnimationGroupLoadingMode.NoSync:
                // nothing to do
                break;
            default:
                throw new Error("Unknown animation group loading mode value '" + animationGroupLoadingMode + "'");
        }
    }

    const startingIndexForNewAnimatables = scene.animatables.length;

    const container = await loadAssetContainerCoreAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name, pluginOptions);

    container.mergeAnimationsTo(scene, scene.animatables.slice(startingIndexForNewAnimatables), targetConverter);
    container.dispose();
    scene.onAnimationFileImportedObservable.notifyObservers(scene);
}

/**
 * Import animations from a file into a scene
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the animations are imported
 */
export async function ImportAnimationsAsync(source: SceneSource, scene: Scene, options?: ImportAnimationsOptions): Promise<void> {
    const { rootUrl = "", overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    await importAnimationsCoreAsync(rootUrl, source, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Import animations from a file into a scene
 * @deprecated Please use {@link ImportAnimationsAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the animations are imported
 */
export async function importAnimationsAsync(source: SceneSource, scene: Scene, options?: ImportAnimationsOptions): Promise<void> {
    return await ImportAnimationsAsync(source, scene, options);
}

/**
 * Class used to load scene from various file formats using registered plugins
 * @see https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes
 * @deprecated The module level functions are more efficient for bundler tree shaking and allow plugin options to be passed through. Future improvements to scene loading will primarily be in the module level functions. The SceneLoader class will remain available, but it will be beneficial to prefer the module level functions.
 * @see {@link ImportMeshAsync}, {@link LoadSceneAsync}, {@link AppendSceneAsync}, {@link ImportAnimationsAsync}, {@link LoadAssetContainerAsync}
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
    public static readonly OnPluginActivatedObservable = onPluginActivatedObservable;

    /**
     * Gets the default plugin (used to load Babylon files)
     * @returns the .babylon plugin
     */
    public static GetDefaultPlugin(): IRegisteredPlugin | undefined {
        return getDefaultPlugin();
    }

    // Public functions

    /**
     * Gets a plugin that can load the given extension
     * @param extension defines the extension to load
     * @returns a plugin or null if none works
     */
    public static GetPluginForExtension(extension: string): ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory | undefined {
        return getPluginForExtension(extension, true)?.plugin;
    }

    /**
     * Gets a boolean indicating that the given extension can be loaded
     * @param extension defines the extension to load
     * @returns true if the extension is supported
     */
    public static IsPluginForExtensionAvailable(extension: string): boolean {
        return isPluginForExtensionAvailable(extension);
    }

    /**
     * Adds a new plugin to the list of registered plugins
     * @param plugin defines the plugin to add
     */
    public static RegisterPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory): void {
        RegisterSceneLoaderPlugin(plugin);
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
     * @param pluginOptions defines the options to use with the plugin
     * @deprecated Please use the module level {@link ImportMeshAsync} instead
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
        name?: string,
        pluginOptions?: PluginOptions
    ): void {
        const reportScene = scene ?? EngineStore.LastCreatedScene;
        void (async () => {
            try {
                const result = await importMeshCoreAsync(meshNames, rootUrl, sceneFilename, scene, onProgress, pluginExtension, name, pluginOptions);
                onSuccess?.(
                    result.meshes,
                    result.particleSystems,
                    result.skeletons,
                    result.animationGroups,
                    result.transformNodes,
                    result.geometries,
                    result.lights,
                    result.spriteManagers
                );
            } catch (error) {
                reportLegacyLoadError(onError, reportScene, error);
            }
        })();
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
     * @deprecated Please use the module level {@link ImportMeshAsync} instead
     */
    public static async ImportMeshAsync(
        meshNames: string | readonly string[] | null | undefined,
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<ISceneLoaderAsyncResult> {
        return await importMeshCoreAsync(meshNames, rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
     * @deprecated Please use the module level {@link LoadSceneAsync} instead
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
    ) {
        void (async () => {
            try {
                const scene = await loadSceneCoreAsync(rootUrl, sceneFilename, engine, onProgress, pluginExtension, name);
                onSuccess?.(scene);
            } catch (error) {
                reportLegacyLoadError(onError, EngineStore.LastCreatedScene, error);
            }
        })();
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
     * @deprecated Please use the module level {@link LoadSceneAsync} instead
     */
    public static async LoadAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        engine?: Nullable<AbstractEngine>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        return await loadSceneCoreAsync(rootUrl, sceneFilename, engine, onProgress, pluginExtension, name);
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
     * @deprecated Please use the module level {@link AppendSceneAsync} instead
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
    ) {
        const reportScene = scene ?? EngineStore.LastCreatedScene;
        void (async () => {
            try {
                const appendedScene = await appendSceneCoreAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
                onSuccess?.(appendedScene);
            } catch (error) {
                reportLegacyLoadError(onError, reportScene, error);
            }
        })();
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
     * @deprecated Please use the module level {@link AppendSceneAsync} instead
     */
    public static async AppendAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        return await appendSceneCoreAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
     * @deprecated Please use the module level {@link LoadAssetContainerAsync} instead
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
    ) {
        const reportScene = scene ?? EngineStore.LastCreatedScene;
        void (async () => {
            try {
                const assets = await loadAssetContainerCoreAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
                onSuccess?.(assets);
            } catch (error) {
                reportLegacyLoadError(onError, reportScene, error);
            }
        })();
    }

    /**
     * Load a scene into an asset container
     * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
     * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene (default: empty string)
     * @param scene is the instance of Scene to append to
     * @param onProgress a callback with a progress event for each file being loaded
     * @param pluginExtension the extension used to determine the plugin
     * @param name defines the filename, if the data is binary
     * @returns The loaded asset container
     * @deprecated Please use the module level {@link LoadAssetContainerAsync} instead
     */
    public static async LoadAssetContainerAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<AssetContainer> {
        return await loadAssetContainerCoreAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
     * @deprecated Please use the module level {@link ImportAnimationsAsync} instead
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
        const reportScene = scene ?? EngineStore.LastCreatedScene;
        void (async () => {
            try {
                await importAnimationsCoreAsync(rootUrl, sceneFilename, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name);
                onSuccess?.(reportScene!);
            } catch (error) {
                reportLegacyLoadError(onError, reportScene, error);
            }
        })();
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
     * @returns the updated scene with imported animations
     * @deprecated Please use the module level {@link ImportAnimationsAsync} instead
     */
    public static async ImportAnimationsAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        overwriteAnimations?: boolean,
        animationGroupLoadingMode?: SceneLoaderAnimationGroupLoadingMode,
        targetConverter?: Nullable<(target: any) => any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onSuccess?: Nullable<(scene: Scene) => void>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onError?: Nullable<(scene: Scene, message: string, exception?: any) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        const targetScene = scene ?? EngineStore.LastCreatedScene;
        await importAnimationsCoreAsync(rootUrl, sceneFilename, targetScene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name);
        return targetScene!;
    }
}
