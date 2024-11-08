import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { AnimationGroup } from "../Animations/animationGroup";
import type { AssetContainer } from "../assetContainer";
import type { IParticleSystem } from "../Particles/IParticleSystem";
import type { Skeleton } from "../Bones/skeleton";
import { Constants } from "../Engines/constants";
import { SceneLoaderFlags } from "./sceneLoaderFlags";
import type { IFileRequest } from "../Misc/fileRequest";
import type { WebRequest } from "../Misc/webRequest";
import type { LoadFileError } from "../Misc/fileTools";
import type { TransformNode } from "../Meshes/transformNode";
import type { Geometry } from "../Meshes/geometry";
import type { Light } from "../Lights/light";
import type { ISpriteManager } from "../Sprites/spriteManager";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { SceneLoaderOptions, SceneSource } from "./sceneLoader.functions";
import { LoadAssetContainerAsync, LoadSceneAsync, registeredPlugins } from "./sceneLoader.functions";

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
 * Defines options for SceneLoader plugins. This interface is extended by specific plugins.
 */
export interface SceneLoaderPluginOptions extends Record<string, Record<string, unknown> | undefined> {}

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

/**
 * Adds a new plugin to the list of registered plugins
 * @param plugin defines the plugin to add
 */
export function registerSceneLoaderPlugin(plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync | ISceneLoaderPluginFactory): void {
    if (typeof plugin.extensions === "string") {
        const extension = plugin.extensions;
        registeredPlugins[extension.toLowerCase()] = {
            plugin: plugin,
            isBinary: false,
        };
    } else {
        const extensions = plugin.extensions;
        Object.keys(extensions).forEach((extension) => {
            registeredPlugins[extension.toLowerCase()] = {
                plugin: plugin,
                isBinary: extensions[extension].isBinary,
                mimeType: extensions[extension].mimeType,
            };
        });
    }
}

/**
 * Append a scene
 * @experimental
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 */
export async function appendSceneAsync(source: SceneSource, scene: Scene, options?: LoadAssetContainerOptions): Promise<void> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    await appendSceneAsyncCore(rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Load a scene into an asset container
 * @experimental
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 * @returns The loaded asset container
 */
export function loadAssetContainerAsync(source: SceneSource, scene: Scene, options?: LoadAssetContainerOptions): Promise<AssetContainer> {
    const { rootUrl = "", onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    return internalLoadAssetContainerAsync(rootUrl, source, scene, onProgress, pluginExtension, name, pluginOptions);
}

/**
 * Import animations from a file into a scene
 * @experimental
 * @param source a string that defines the name of the scene file, or starts with "data:" following by the stringified version of the scene, or a File object, or an ArrayBufferView
 * @param scene is the instance of BABYLON.Scene to append to
 * @param options an object that configures aspects of how the scene is loaded
 */
export async function importAnimationsAsync(source: SceneSource, scene: Scene, options?: ImportAnimationsOptions): Promise<void> {
    const { rootUrl = "", overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name, pluginOptions } = options ?? {};
    await importAnimationsAsyncCore(rootUrl, source, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name, pluginOptions);
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
        registerSceneLoaderPlugin(plugin);
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
     * @deprecated Please use ImportMeshAsync instead
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
        importMeshAsync(meshNames, rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name);
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
     * @deprecated Please use LoadAsync instead
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
        loadScene(rootUrl, sceneFilename, engine, onSuccess, onProgress, onError, pluginExtension, name);
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
        sceneFilename?: SceneSource,
        engine?: Nullable<AbstractEngine>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        return loadSceneAsyncCore(rootUrl, sceneFilename, engine, onProgress, pluginExtension, name);
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
     * @deprecated Please use AppendAsync instead
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
        appendAsync(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name);
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
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<Scene> {
        return appendSceneAsyncCore(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
     * @deprecated Please use LoadAssetContainerAsync instead
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
        LoadAssetContainerAsync(rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension, name);
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
     */
    public static LoadAssetContainerAsync(
        rootUrl: string,
        sceneFilename?: SceneSource,
        scene?: Nullable<Scene>,
        onProgress?: Nullable<(event: ISceneLoaderProgressEvent) => void>,
        pluginExtension?: Nullable<string>,
        name?: string
    ): Promise<AssetContainer> {
        return internalLoadAssetContainerAsync(rootUrl, sceneFilename, scene, onProgress, pluginExtension, name);
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
     * @deprecated Please use ImportAnimationsAsync instead
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
        importAnimations(rootUrl, sceneFilename, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onSuccess, onProgress, onError, pluginExtension, name);
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
        return importAnimationsAsyncCore(rootUrl, sceneFilename, scene, overwriteAnimations, animationGroupLoadingMode, targetConverter, onProgress, pluginExtension, name);
    }
}
