import { type Scene } from "../scene";
import { type AssetContainer } from "../assetContainer";
import { type Node } from "../node";
import { type Material } from "../Materials/material";
import { type BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { CubeTexture } from "../Materials/Textures/cubeTexture";
import { HDRCubeTexture } from "../Materials/Textures/hdrCubeTexture";
import { type AnimationGroup } from "../Animations/animationGroup";
import { Observable, type Observer } from "../Misc/observable";
import { Logger } from "../Misc/logger";
import { LoadAssetContainerAsync } from "../Loading/sceneLoader";
import { GetExtensionFromUrl } from "../Misc/urlTools";
import {
    type ISerializedSmartAssetEntry,
    type ISerializedSmartAssetMap,
    DeserializeSmartAssetMap,
    IsAbsoluteOrSpecialUrl,
    MakeRelative,
    ResolveAssetUrl,
    ReadJsonSourceAsync,
} from "./smartAssetSerializer";

// eslint-disable-next-line @typescript-eslint/naming-convention
const SMART_ASSET_MANAGER_KEY = Symbol.for("babylonjs:smartAssetManager");

/**
 * Stateful handle for a scene's smart asset registry.
 *
 * Smart asset behavior is exposed through module-level functions rather than
 * class methods so callers can import only the operations they need.
 */
export type SmartAssetManager = {
    /**
     * The scene this manager is attached to.
     */
    readonly scene: Scene;

    /**
     * Fires when the smart asset registry or loaded asset state changes.
     */
    readonly onChangedObservable: Observable<void>;

    /**
     * Optional callback invoked when an asset cannot be found at its registered URL.
     * Return a new URL or File to retry loading, or null to skip the asset.
     */
    onAssetNotFound: ((key: string, expectedUrl: string) => Promise<string | File | null>) | null;
};

/**
 * Optional registration data that helps select the correct loader when the URL
 * does not contain a usable file extension, such as blob-backed local files.
 */
type SmartAssetRegistrationOptions = Pick<ISerializedSmartAssetEntry, "type" | "extension" | "metadata">;

/**
 * Optional load-time configuration. Includes the persistable {@link SmartAssetRegistrationOptions}
 * fields (type, extension, metadata) plus a transient `reloadSource` callback used by
 * {@link ReloadSmartAssetAsync} to fetch fresh bytes from disk for blob-backed assets.
 */
export type SmartAssetLoadOptions = SmartAssetRegistrationOptions & {
    /**
     * Optional callback invoked by {@link ReloadSmartAssetAsync} to obtain a fresh File
     * for the asset. Use this when the registered URL is a `blob:` URL backed by a
     * `FileSystemFileHandle` so Reload can re-read the underlying file from disk.
     */
    readonly reloadSource?: () => Promise<File>;
};

type SmartAssetManagerInternals = {
    urls: Map<string, string>;
    options: Map<string, SmartAssetRegistrationOptions>;
    containers: Map<string, AssetContainer>;
    objectToKeyMap: WeakMap<object, string>;
    textureKeys: Set<string>;
    reloadSources: Map<string, () => Promise<File>>;
    blobUrls: Map<string, string>;
    sceneDisposeObserver: ReturnType<Scene["onDisposeObservable"]["add"]> | null;
};

const SmartAssetManagerInternals = new WeakMap<SmartAssetManager, SmartAssetManagerInternals>();
const OnSmartAssetManagerCreatedObservable = new Observable<SmartAssetManager>();

/**
 * Creates a new SmartAssetManager state object and attaches it to the scene.
 *
 * Internal: callers should use {@link GetSmartAssetManager} which returns the
 * existing manager when one is already attached.
 * @param scene - The scene this manager operates on.
 * @returns The created smart asset manager state.
 */
function CreateSmartAssetManager(scene: Scene): SmartAssetManager {
    const manager: SmartAssetManager = {
        scene,
        onChangedObservable: new Observable<void>(),
        onAssetNotFound: null,
    };

    const internal: SmartAssetManagerInternals = {
        urls: new Map(),
        options: new Map(),
        containers: new Map(),
        objectToKeyMap: new WeakMap(),
        textureKeys: new Set(),
        reloadSources: new Map(),
        blobUrls: new Map(),
        sceneDisposeObserver: null,
    };
    SmartAssetManagerInternals.set(manager, internal);

    if (!scene.metadata) {
        scene.metadata = {};
    }
    scene.metadata[SMART_ASSET_MANAGER_KEY] = manager;

    // Auto-dispose when the scene is disposed so the manager doesn't outlive it.
    internal.sceneDisposeObserver = scene.onDisposeObservable.add(() => DisposeSmartAssetManager(manager));

    OnSmartAssetManagerCreatedObservable.notifyObservers(manager);

    return manager;
}

/**
 * Returns the SmartAssetManager attached to the given scene, creating and
 * attaching one if none exists.
 * @param scene - The scene to look up or attach a manager to.
 * @returns The existing or newly created SmartAssetManager.
 */
export function GetSmartAssetManager(scene: Scene): SmartAssetManager {
    const existing = scene.metadata?.[SMART_ASSET_MANAGER_KEY] as SmartAssetManager | undefined;
    if (existing) {
        return existing;
    }
    return CreateSmartAssetManager(scene);
}

/**
 * Adds an observer that is notified whenever a SmartAssetManager is created.
 * @param callback - The callback to invoke with each newly created manager.
 * @returns The observer registration.
 */
export function AddSmartAssetManagerCreatedObserver(callback: (manager: SmartAssetManager) => void): Observer<SmartAssetManager> {
    // Wrap so the EventState second-arg from Observable.add isn't passed through to the caller.
    return OnSmartAssetManagerCreatedObservable.add((manager) => callback(manager));
}

/**
 * Registers a smart asset entry mapping a key to a URL.
 * @param scene - The scene whose smart asset registry to update.
 * @param key - Unique string identifier for this asset.
 * @param url - URL or path to the asset file.
 * @param options - Optional loader hints and metadata for this asset.
 */
export function RegisterSmartAsset(scene: Scene, key: string, url: string, options?: SmartAssetRegistrationOptions): void {
    const manager = GetSmartAssetManager(scene);
    const internal = GetSmartAssetInternals(manager);
    RevokeManagedBlobUrl(internal, key, url);
    internal.urls.set(key, url);
    TrackManagedBlobUrl(internal, key, url);
    if (options) {
        const existingOptions = internal.options.get(key);
        internal.options.set(key, { ...existingOptions, ...options });
        if (options.type === "texture") {
            internal.textureKeys.add(key);
        } else if (options.type !== undefined) {
            internal.textureKeys.delete(key);
        }
    }
    manager.onChangedObservable.notifyObservers();
}

/**
 * Removes a key from the registry. If the asset is loaded, it is unloaded first.
 * @param scene - The scene that owns the smart asset.
 * @param key - The key to remove.
 * @returns A promise that resolves when the asset has been unloaded and removed.
 */
export async function RemoveSmartAssetAsync(scene: Scene, key: string): Promise<void> {
    const manager = GetSmartAssetManager(scene);
    const internal = GetSmartAssetInternals(manager);
    if (internal.containers.has(key)) {
        await UnloadSmartAssetAsync(scene, key);
    }
    for (const tex of [...scene.textures]) {
        if (internal.objectToKeyMap.get(tex) === key) {
            internal.objectToKeyMap.delete(tex);
            tex.dispose();
        }
    }
    internal.urls.delete(key);
    internal.options.delete(key);
    internal.textureKeys.delete(key);
    internal.reloadSources.delete(key);
    RevokeManagedBlobUrl(internal, key);
    manager.onChangedObservable.notifyObservers();
}

/**
 * Returns all registered key-to-URL mappings.
 * @param scene - The scene whose smart asset registry to read.
 * @returns A read-only map of keys to URLs.
 */
export function GetAllSmartAssets(scene: Scene): ReadonlyMap<string, string> {
    return GetSmartAssetInternals(GetSmartAssetManager(scene)).urls;
}

/**
 * Loads a scene-file asset by key.
 * @param scene - The scene to load the asset into.
 * @param key - The key to load.
 * @param url - Optional URL. If provided, the key is registered first.
 * @param options - Optional loader hints and metadata for this asset.
 * @returns A promise resolving to the loaded AssetContainer.
 */
export async function LoadSmartAssetAsync(scene: Scene, key: string, url?: string, options?: SmartAssetLoadOptions): Promise<AssetContainer> {
    const manager = GetSmartAssetManager(scene);
    const internal = GetSmartAssetInternals(manager);
    const previousUrl = internal.urls.get(key);
    const { reloadSource, ...registrationOptions } = options ?? {};
    if (url) {
        RegisterSmartAsset(scene, key, url, registrationOptions);
    }
    if (reloadSource) {
        internal.reloadSources.set(key, reloadSource);
    }

    const resolvedUrl = internal.urls.get(key);
    if (!resolvedUrl) {
        throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
    }

    const existing = internal.containers.get(key);
    if (existing) {
        if (url && url !== previousUrl) {
            // URL changed — drop the stale container before fetching the new one
            // so callers don't get a surprise cached return for an updated URL.
            await UnloadSmartAssetAsync(scene, key);
        } else {
            return existing;
        }
    }

    return await LoadSmartAssetSceneFileAsync(manager, key, resolvedUrl, internal.options.get(key)?.extension);
}

/**
 * Loads all registered assets concurrently.
 * @param scene - The scene whose registered assets to load.
 * @returns A promise resolving to loaded scene-file containers.
 */
export async function LoadAllSmartAssetsAsync(scene: Scene): Promise<AssetContainer[]> {
    const manager = GetSmartAssetManager(scene);
    const internal = GetSmartAssetInternals(manager);
    const scenePromises: Promise<AssetContainer | null>[] = [];
    const texturePromises: Promise<void>[] = [];

    for (const [key, url] of Array.from(internal.urls)) {
        if (internal.containers.has(key)) {
            continue;
        }
        const options = internal.options.get(key);
        if (internal.textureKeys.has(key) || options?.type === "texture" || IsTextureUrl(url) || IsTextureExtension(options?.extension)) {
            const textureLoadAsync = async () => {
                try {
                    await LoadSmartAssetTextureAsync(scene, key);
                } catch {
                    Logger.Warn(`SmartAssetManager: Texture "${key}" could not be loaded — skipping.`);
                }
            };
            texturePromises.push(textureLoadAsync());
        } else {
            const sceneLoadAsync = async () => {
                try {
                    return await LoadSmartAssetAsync(scene, key);
                } catch {
                    Logger.Warn(`SmartAssetManager: Asset "${key}" could not be loaded — skipping.`);
                    return null;
                }
            };
            scenePromises.push(sceneLoadAsync());
        }
    }

    await Promise.all(texturePromises);
    const results = await Promise.all(scenePromises);
    return results.filter((r): r is AssetContainer => r !== null);
}

/**
 * Loads a standalone texture by key.
 * @param scene - The scene to load the texture into.
 * @param key - The key to load.
 * @param url - Optional URL. If provided, the key is registered first.
 * @param options - Optional loader hints and metadata for this asset.
 * @returns A promise resolving to the loaded texture.
 */
export async function LoadSmartAssetTextureAsync(scene: Scene, key: string, url?: string, options?: SmartAssetLoadOptions): Promise<BaseTexture> {
    const manager = GetSmartAssetManager(scene);
    const internal = GetSmartAssetInternals(manager);
    const previousUrl = internal.urls.get(key);
    const { reloadSource, ...registrationOptions } = options ?? {};
    if (url) {
        RegisterSmartAsset(scene, key, url, { ...registrationOptions, type: registrationOptions.type ?? "texture" });
    }
    if (reloadSource) {
        internal.reloadSources.set(key, reloadSource);
    }

    internal.textureKeys.add(key);

    // If the URL changed for an already-tracked texture, dispose the stale instance.
    // Callers that hold material references to the old texture should re-point them
    // to the returned new texture.
    if (url && previousUrl !== undefined && url !== previousUrl) {
        for (const tex of [...scene.textures]) {
            if (internal.objectToKeyMap.get(tex) === key) {
                internal.objectToKeyMap.delete(tex);
                tex.dispose();
            }
        }
    }

    const resolvedUrl = internal.urls.get(key);
    if (!resolvedUrl) {
        throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
    }

    const extensionHint = internal.options.get(key)?.extension;
    let texture: BaseTexture;
    try {
        texture = await CreateAndLoadTextureAsync(manager, resolvedUrl, extensionHint);
    } catch (error) {
        const fallback = await ResolveNotFoundAsync(manager, key, resolvedUrl);
        if (!fallback) {
            throw error;
        }
        texture = await CreateAndLoadTextureAsync(manager, fallback.url, fallback.extensionHint ?? extensionHint);
    }

    internal.objectToKeyMap.set(texture, key);
    manager.onChangedObservable.notifyObservers();
    return texture;
}

/**
 * Unloads a loaded asset while keeping the key registered.
 * @param scene - The scene whose smart asset to unload.
 * @param key - The key to unload.
 * @returns A promise that resolves once the asset has been unloaded.
 */
export async function UnloadSmartAssetAsync(scene: Scene, key: string): Promise<void> {
    const manager = GetSmartAssetManager(scene);
    const internal = GetSmartAssetInternals(manager);
    const container = internal.containers.get(key);
    if (container) {
        container.removeAllFromScene();
        container.dispose();
        internal.containers.delete(key);
        manager.onChangedObservable.notifyObservers();
        return;
    }

    for (const tex of [...scene.textures]) {
        if (internal.objectToKeyMap.get(tex) === key) {
            internal.objectToKeyMap.delete(tex);
            tex.dispose();
        }
    }
    manager.onChangedObservable.notifyObservers();
}

/**
 * Unloads and re-loads an asset.
 * @param scene - The scene whose smart asset to reload.
 * @param key - The key to reload.
 * @returns A promise resolving to the newly loaded AssetContainer or BaseTexture.
 */
export async function ReloadSmartAssetAsync(scene: Scene, key: string): Promise<AssetContainer | BaseTexture> {
    const internal = GetSmartAssetInternals(GetSmartAssetManager(scene));
    const reloadSource = internal.reloadSources.get(key);
    if (reloadSource) {
        try {
            const freshFile = await reloadSource();
            const blobUrl = URL.createObjectURL(freshFile);
            RegisterSmartAsset(scene, key, blobUrl, { extension: GetExtensionFromUrl(freshFile.name) || internal.options.get(key)?.extension });
        } catch (e) {
            Logger.Warn(`SmartAssetManager: reloadSource callback failed for "${key}": ${e}`);
        }
    }

    await UnloadSmartAssetAsync(scene, key);

    if (internal.textureKeys.has(key)) {
        return await LoadSmartAssetTextureAsync(scene, key);
    }
    return await LoadSmartAssetAsync(scene, key);
}

/**
 * Finds which smart asset key owns a scene object.
 * @param scene - The scene whose registry to search.
 * @param object - A scene object.
 * @returns The key, or undefined if the object is not tracked.
 */
export function FindSmartAssetKeyForObject(scene: Scene, object: Node | Material | BaseTexture | AnimationGroup): string | undefined {
    return GetSmartAssetInternals(GetSmartAssetManager(scene)).objectToKeyMap.get(object);
}

/**
 * Serializes the registry to a JSON-compatible document.
 * If a baseUrl is provided, asset URLs are stored relative to it for portability.
 * @param scene - The scene whose registry to serialize.
 * @param baseUrl - Optional base URL for making asset paths relative.
 * @returns A serialized asset map document.
 */
export function SerializeSmartAssetManagerMap(scene: Scene, baseUrl?: string): ISerializedSmartAssetMap {
    const internal = GetSmartAssetInternals(GetSmartAssetManager(scene));
    const assets: Record<string, ISerializedSmartAssetEntry> = {};

    for (const [key, registeredUrl] of Array.from(internal.urls)) {
        let url = registeredUrl;
        if (baseUrl && !IsAbsoluteOrSpecialUrl(url)) {
            url = MakeRelative(url, baseUrl);
        }
        const options = internal.options.get(key);
        assets[key] = { url, ...options, ...(internal.textureKeys.has(key) ? { type: "texture" } : {}) };
    }

    return { version: 1, assets };
}

/**
 * Loads an asset map from a URL, File, or pre-parsed JSON object.
 * @param scene - The scene to load assets into.
 * @param source - A URL string, File object, or pre-parsed ISerializedSmartAssetMap.
 * @param rootUrl - Optional root URL for resolving relative asset paths.
 * @returns A promise that resolves after the map has been loaded and all registered assets have been attempted.
 */
export async function LoadSmartAssetMapAsync(scene: Scene, source: string | File | ISerializedSmartAssetMap, rootUrl?: string): Promise<void> {
    let resolvedRootUrl = rootUrl ?? "";

    if (typeof source === "string" && !rootUrl) {
        const { Tools } = await import("../Misc/tools");
        resolvedRootUrl = Tools.GetFolderPath(source);
    }

    const raw = await ReadJsonSourceAsync(source);
    const doc = DeserializeSmartAssetMap(raw);

    for (const [key, entry] of Object.entries(doc.assets)) {
        const resolved = resolvedRootUrl ? ResolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
        RegisterSmartAsset(scene, key, resolved, { type: entry.type, extension: entry.extension, metadata: entry.metadata });
    }

    await LoadAllSmartAssetsAsync(scene);
}

/**
 * Registers an externally loaded AssetContainer under a key.
 * @param manager - The smart asset manager state.
 * @param key - The key to associate with the container.
 * @param container - The loaded AssetContainer.
 */
function TrackLoadedSmartAssetContainer(manager: SmartAssetManager, key: string, container: AssetContainer): void {
    const internal = GetSmartAssetInternals(manager);
    internal.containers.set(key, container);
    TrackSmartAssetContainerObjects(manager, key, container);
    manager.onChangedObservable.notifyObservers();
}

/**
 * Disposes the manager, unloading all assets and detaching it from its scene.
 * Safe to call multiple times; subsequent calls are no-ops. Automatically invoked when the
 * owning scene is disposed.
 * @param manager - The smart asset manager state.
 */
export function DisposeSmartAssetManager(manager: SmartAssetManager): void {
    const internal = SmartAssetManagerInternals.get(manager);
    if (!internal) {
        return;
    }
    SmartAssetManagerInternals.delete(manager);

    if (internal.sceneDisposeObserver) {
        manager.scene.onDisposeObservable.remove(internal.sceneDisposeObserver);
        internal.sceneDisposeObserver = null;
    }

    for (const container of Array.from(internal.containers.values())) {
        container.removeAllFromScene();
        container.dispose();
    }
    for (const tex of [...manager.scene.textures]) {
        if (internal.objectToKeyMap.get(tex) !== undefined) {
            tex.dispose();
        }
    }

    internal.urls.clear();
    internal.options.clear();
    internal.textureKeys.clear();
    internal.reloadSources.clear();
    internal.containers.clear();
    for (const blobUrl of Array.from(internal.blobUrls.values())) {
        URL.revokeObjectURL(blobUrl);
    }
    internal.blobUrls.clear();

    manager.onChangedObservable.clear();

    if (manager.scene.metadata) {
        delete manager.scene.metadata[SMART_ASSET_MANAGER_KEY];
    }
}

function GetSmartAssetInternals(manager: SmartAssetManager): SmartAssetManagerInternals {
    const internal = SmartAssetManagerInternals.get(manager);
    if (!internal) {
        throw new Error("SmartAssetManager: Unknown manager state.");
    }
    return internal;
}

function RevokeManagedBlobUrl(internal: SmartAssetManagerInternals, key: string, replacementUrl?: string): void {
    const blobUrl = internal.blobUrls.get(key);
    if (!blobUrl || blobUrl === replacementUrl) {
        return;
    }
    URL.revokeObjectURL(blobUrl);
    internal.blobUrls.delete(key);
}

function TrackManagedBlobUrl(internal: SmartAssetManagerInternals, key: string, url: string): void {
    if (url.startsWith("blob:")) {
        internal.blobUrls.set(key, url);
    }
}

async function CreateAndLoadTextureAsync(manager: SmartAssetManager, url: string, extensionHint?: string): Promise<BaseTexture> {
    return await new Promise<BaseTexture>((resolve, reject) => {
        const ext = (extensionHint || GetExtensionFromUrl(url)).toLowerCase();
        const onError = (message?: string, exception?: unknown) => {
            const err = exception instanceof Error ? exception : new Error(message ?? `SmartAssetManager: failed to load texture from "${url}".`);
            reject(err);
        };
        let texture: BaseTexture;
        const onLoad = () => resolve(texture);
        if (ext === ".hdr") {
            // HDR equirectangular files require HDRCubeTexture — CubeTexture's .hdr
            // loader explicitly throws ".hdr not supported in Cube." so we can't
            // route HDRs through the generic CubeTexture path.
            texture = new HDRCubeTexture(url, manager.scene, 256, false, true, false, false, onLoad, onError);
        } else if (ext === ".env" || ext === ".dds") {
            texture = new CubeTexture(url, manager.scene, null, false, null, onLoad, onError, undefined, ext === ".env");
        } else {
            texture = new Texture(url, manager.scene, undefined, undefined, undefined, onLoad, onError);
        }
    });
}

async function ResolveNotFoundAsync(manager: SmartAssetManager, key: string, expectedUrl: string): Promise<{ url: string; extensionHint?: string } | null> {
    if (!manager.onAssetNotFound) {
        return null;
    }
    const resolution = await manager.onAssetNotFound(key, expectedUrl);
    if (resolution === null || resolution === undefined) {
        return null;
    }
    if (typeof resolution === "string") {
        RegisterSmartAsset(manager.scene, key, resolution);
        return { url: resolution, extensionHint: GetSmartAssetInternals(manager).options.get(key)?.extension };
    }
    const blobUrl = URL.createObjectURL(resolution);
    const extensionHint = GetExtensionFromUrl(resolution.name) || undefined;
    RegisterSmartAsset(manager.scene, key, blobUrl, { extension: extensionHint });
    return { url: blobUrl, extensionHint };
}

async function LoadSmartAssetSceneFileAsync(manager: SmartAssetManager, key: string, url: string, extensionHint?: string): Promise<AssetContainer> {
    const loadAsync = async (loadUrl: string, extensionHint?: string) => {
        const container = await LoadAssetContainerAsync(loadUrl, manager.scene, { pluginExtension: extensionHint });
        container.addAllToScene();
        TrackLoadedSmartAssetContainer(manager, key, container);
        return container;
    };

    try {
        return await loadAsync(url, extensionHint);
    } catch (error) {
        const fallback = await ResolveNotFoundAsync(manager, key, url);
        if (fallback) {
            try {
                return await loadAsync(fallback.url, fallback.extensionHint);
            } catch (retryError) {
                Logger.Warn(`SmartAssetManager: Asset "${key}" could not be loaded from fallback "${fallback.url}".`);
                throw retryError;
            }
        }
        Logger.Warn(`SmartAssetManager: Asset "${key}" could not be loaded from "${url}".`);
        throw error;
    }
}

function TrackSmartAssetContainerObjects(manager: SmartAssetManager, key: string, container: AssetContainer): void {
    const internal = GetSmartAssetInternals(manager);

    for (const collection of [container.meshes, container.materials, container.textures, container.animationGroups, container.lights, container.cameras]) {
        for (const obj of collection) {
            internal.objectToKeyMap.set(obj, key);
        }
    }
}

const TextureExtensions = new Set([".png", ".jpg", ".jpeg", ".bmp", ".tga", ".gif", ".webp", ".env", ".hdr", ".dds", ".ktx", ".ktx2", ".basis"]);

/**
 * Returns the set of file extensions (including the leading dot) that {@link LoadAllSmartAssetsAsync}
 * treats as standalone textures.
 * @returns A read-only set of texture file extensions.
 */
export function GetSmartAssetTextureExtensions(): ReadonlySet<string> {
    return TextureExtensions;
}

/**
 * Returns true if the URL points to a standalone texture file.
 * @param url - The URL to check.
 * @returns True if the URL has a texture file extension.
 */
function IsTextureUrl(url: string): boolean {
    return TextureExtensions.has(GetExtensionFromUrl(url));
}

function IsTextureExtension(extension: string | undefined): boolean {
    return extension !== undefined && TextureExtensions.has(extension.toLowerCase());
}
