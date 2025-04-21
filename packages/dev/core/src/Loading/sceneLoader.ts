import { Tools } from "../Misc/tools";
import { Observable } from "../Misc/observable";
import type { DeepImmutable, Nullable } from "../types";
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
        [Plugin in keyof SceneLoaderPluginOptions]?: {
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
}

/**
 * Defines options for LoadAsync.
 */
export interface LoadOptions extends SceneLoaderOptions {}

/**
 * Defines options for AppendAsync.
 */
export interface AppendOptions extends SceneLoaderOptions {}

/**
 * Defines options for LoadAssetContainerAsync.
 */
export interface LoadAssetContainerOptions extends SceneLoaderOptions {}

/**
 * Defines options for ImportAnimationsAsync.
 */
export interface ImportAnimationsOptions extends SceneLoaderOptions {
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

function _getFileInfo(rootUrl: string, sceneSource: SceneSource): Nullable<IFileInfo> {
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
export function ImportMeshAsync(source: SceneSource, scene: Scene, options?: ImportMeshOptions): Promise<ISceneLoaderAsyncResult> {
    const { meshNames, rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return importMeshAsyncCore(meshNames, rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
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
        const errorMessage = formatErrorMessage(fileInfo, message, exception);

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
        try {
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
            ).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

// This is the core implementation of load scene
async function loadSceneImplAsync(
    rootUrl: string,
    sceneFilename: SceneSource = "",
    engine: Nullable<AbstractEngine> = EngineStore.LastCreatedEngine,
    onSuccess: Nullable<(scene: Scene) => void> = null,
    onProgress: Nullable<(event: ISceneLoaderProgressEvent) => void> = null,
    onError: Nullable<(scene: Scene, message: string, exception?: any) => void> = null,
    pluginExtension: Nullable<string> = null,
    name = "",
    pluginOptions: PluginOptions = {}
): Promise<void> {
    if (!engine) {
        Tools.Error("No engine available");
        return;
    }

    await appendSceneImplAsync(rootUrl, sceneFilename, new Scene(engine), onSuccess, onProgress, onError, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param engine is the instance of BABYLON.Engine to use to create the scene
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded scene
 */
export function LoadSceneAsync(source: SceneSource, engine: AbstractEngine, options?: LoadOptions): Promise<Scene> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return loadSceneSharedAsync(rootUrl, source, engine, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene
 * @deprecated Please use {@link LoadSceneAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param engine is the instance of BABYLON.Engine to use to create the scene
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded scene
 */
export function loadSceneAsync(source: SceneSource, engine: AbstractEngine, options?: LoadOptions): Promise<Scene> {
    return LoadSceneAsync(source, engine, options);
}

// This function is shared between the new module level loadSceneAsync and the legacy SceneLoader.LoadAsync
function loadSceneSharedAsync(
    rootUrl: string,
    sceneFilename?: SceneSource,
    engine?: Nullable<AbstractEngine>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<Scene> {
    return new Promise((resolve, reject) => {
        loadSceneImplAsync(
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

// This is the core implementation of append scene
async function appendSceneImplAsync(
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
        const errorMessage = formatErrorMessage(fileInfo, message, exception);

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

/**
 * Append a scene
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the scene is appended
 */
export async function AppendSceneAsync(source: SceneSource, scene: Scene, options?: AppendOptions): Promise<void> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    await appendSceneSharedAsync(rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Append a scene
 * @deprecated Please use {@link AppendSceneAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the scene is appended
 */
export function appendSceneAsync(source: SceneSource, scene: Scene, options?: AppendOptions): Promise<void> {
    return AppendSceneAsync(source, scene, options);
}

// This function is shared between the new module level appendSceneAsync and the legacy SceneLoader.AppendAsync
function appendSceneSharedAsync(
    rootUrl: string,
    sceneFilename?: SceneSource,
    scene?: Nullable<Scene>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<Scene> {
    return new Promise((resolve, reject) => {
        try {
            appendSceneImplAsync(
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
            ).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

// This is the core implementation of load asset container
async function loadAssetContainerImplAsync(
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
        const errorMessage = formatErrorMessage(fileInfo, message, exception);

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

/**
 * Load a scene into an asset container
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded asset container
 */
export function LoadAssetContainerAsync(source: SceneSource, scene: Scene, options?: LoadAssetContainerOptions): Promise<AssetContainer> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return loadAssetContainerSharedAsync(rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene into an asset container
 * @deprecated Please use {@link LoadAssetContainerAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded asset container
 */
export function loadAssetContainerAsync(source: SceneSource, scene: Scene, options?: LoadAssetContainerOptions): Promise<AssetContainer> {
    return LoadAssetContainerAsync(source, scene, options);
}

// This function is shared between the new module level loadAssetContainerAsync and the legacy SceneLoader.LoadAssetContainerAsync
function loadAssetContainerSharedAsync(
    rootUrl: string,
    sceneFilename?: SceneSource,
    scene?: Nullable<Scene>,
    onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
    pluginExtension?: Nullable<string>,
    name?: string,
    pluginOptions?: PluginOptions
): Promise<AssetContainer> {
    return new Promise((resolve, reject) => {
        try {
            loadAssetContainerImplAsync(
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
            ).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

// This is the core implementation of import animations
async function importAnimationsImplAsync(
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
): Promise<void> {
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
        switch (animationGroupLoadingMode) {
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

    await loadAssetContainerImplAsync(rootUrl, sceneFilename, scene, onAssetContainerLoaded, onProgress, onError, pluginExtension, name, pluginOptions);
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
    await importAnimationsSharedAsync(rootUrl, source, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Import animations from a file into a scene
 * @deprecated Please use {@link ImportAnimationsAsync} instead.
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns A promise that resolves when the animations are imported
 */
export function importAnimationsAsync(source: SceneSource, scene: Scene, options?: ImportAnimationsOptions): Promise<void> {
    return ImportAnimationsAsync(source, scene, options);
}

// This function is shared between the new module level importAnimationsAsync and the legacy SceneLoader.ImportAnimationsAsync
function importAnimationsSharedAsync(
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
        try {
            importAnimationsImplAsync(
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
            ).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
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
        name?: string
    ): void {
        importMeshAsync(meshNames, rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name).catch((error) =>
            onError?.(EngineStore.LastCreatedScene!, error?.message, error)
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
     * @deprecated Please use the module level {@link ImportMeshAsync} instead
     */
    public static ImportMeshAsync(
        meshNames: string | readonly string[] | null | undefined,
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<ISceneLoaderAsyncResult> {
        return importMeshAsyncCore(meshNames, rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
        loadSceneImplAsync(rootUrl, sceneFilename, engine, onSuccess, onProgress, onError, pluginExtension, name).catch((error) =>
            onError?.(EngineStore.LastCreatedScene!, error?.message, error)
        );
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
    public static LoadAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        engine?: Nullable<AbstractEngine>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        return loadSceneSharedAsync(rootUrl, sceneFilename, engine, onProgress, pluginExtension, name);
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
        appendSceneImplAsync(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name).catch((error) =>
            onError?.((scene ?? EngineStore.LastCreatedScene)!, error?.message, error)
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
     * @deprecated Please use the module level {@link AppendSceneAsync} instead
     */
    public static AppendAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        return appendSceneSharedAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
        loadAssetContainerImplAsync(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name).catch((error) =>
            onError?.((scene ?? EngineStore.LastCreatedScene)!, error?.message, error)
        );
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
    public static LoadAssetContainerAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<AssetContainer> {
        return loadAssetContainerSharedAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
        importAnimationsImplAsync(
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
        ).catch((error) => onError?.((scene ?? EngineStore.LastCreatedScene)!, error?.message, error));
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
    public static ImportAnimationsAsync(
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
        return importAnimationsSharedAsync(rootUrl, sceneFilename, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name);
    }
}
