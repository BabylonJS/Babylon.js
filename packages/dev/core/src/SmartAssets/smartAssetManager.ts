import { type Scene } from "../scene";
import { type AssetContainer } from "../assetContainer";
import { type Node } from "../node";
import { type Material } from "../Materials/material";
import { type BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { CubeTexture } from "../Materials/Textures/cubeTexture";
import { type AnimationGroup } from "../Animations/animationGroup";
import { Observable } from "../Misc/observable";
import { Logger } from "../Misc/logger";
import { LoadAssetContainerAsync } from "../Loading/sceneLoader";
import { FileToolsOptions } from "../Misc/fileTools";
import { GetExtensionFromUrl } from "../Misc/urlTools";
import {
    type ISerializedSmartAssetEntry,
    type ISerializedSmartAssetMap,
    SerializeSmartAssetMap,
    DeserializeSmartAssetMap,
    ResolveAssetUrl,
    ReadJsonSourceAsync,
} from "./smartAssetSerializer";

// eslint-disable-next-line @typescript-eslint/naming-convention
const SMART_ASSET_MANAGER_KEY = Symbol.for("babylonjs:smartAssetManager");
const ASSET_PROTOCOL = "asset://";

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
 * A Smart Asset manager handle, or a scene that should use its attached manager.
 * When a scene is supplied to Smart Asset functions, the scene's manager is
 * created automatically if needed.
 */
export type SmartAssetManagerOrScene = SmartAssetManager | Scene;

/**
 * Optional registration data that helps select the correct loader when the URL
 * does not contain a usable file extension, such as blob-backed local files.
 */
export type SmartAssetRegistrationOptions = Pick<ISerializedSmartAssetEntry, "type" | "extension" | "metadata">;

type SmartAssetManagerInternals = {
    urls: Map<string, string>;
    options: Map<string, SmartAssetRegistrationOptions>;
    containers: Map<string, AssetContainer>;
    objectToKeyMap: WeakMap<object, string>;
    textureKeys: Set<string>;
    refreshCallbacks: Map<string, () => Promise<File>>;
    blobUrls: Map<string, string>;
};

const SmartAssetManagerInternals = new WeakMap<SmartAssetManager, SmartAssetManagerInternals>();
const ActiveSmartAssetManagers: SmartAssetManager[] = [];
let OriginalPreprocessUrl = FileToolsOptions.PreprocessUrl;
let SmartAssetProtocolHookInstalled = false;
let SmartAssetManagerCreatedCallback: ((manager: SmartAssetManager) => void) | null = null;

const SmartAssetPreprocessUrl = (url: string): string => {
    if (url.startsWith(ASSET_PROTOCOL)) {
        const key = url.substring(ASSET_PROTOCOL.length);
        for (let index = ActiveSmartAssetManagers.length - 1; index >= 0; index--) {
            const internal = SmartAssetManagerInternals.get(ActiveSmartAssetManagers[index]);
            const resolved = internal?.urls.get(key);
            if (resolved) {
                return resolved;
            }
        }
        Logger.Warn(`SmartAssetManager: Unknown asset key "${key}" in asset:// URL.`);
    }
    return OriginalPreprocessUrl(url);
};

/**
 * Creates a new SmartAssetManager state object and attaches it to the scene.
 * @param scene - The scene this manager operates on.
 * @returns The created smart asset manager state.
 */
export function CreateSmartAssetManager(scene: Scene): SmartAssetManager {
    const manager: SmartAssetManager = {
        scene,
        onChangedObservable: new Observable<void>(),
        onAssetNotFound: null,
    };

    SmartAssetManagerInternals.set(manager, {
        urls: new Map(),
        options: new Map(),
        containers: new Map(),
        objectToKeyMap: new WeakMap(),
        textureKeys: new Set(),
        refreshCallbacks: new Map(),
        blobUrls: new Map(),
    });

    if (!scene.metadata) {
        scene.metadata = {};
    }
    scene.metadata[SMART_ASSET_MANAGER_KEY] = manager;
    InstallSmartAssetProtocolHook(manager);
    SmartAssetManagerCreatedCallback?.(manager);

    return manager;
}

/**
 * Returns the SmartAssetManager attached to a scene, or undefined if none exists.
 * @param scene - The scene to look up.
 * @returns The SmartAssetManager, or undefined.
 */
export function GetSmartAssetManagerFromScene(scene: Scene): SmartAssetManager | undefined {
    return scene.metadata?.[SMART_ASSET_MANAGER_KEY] as SmartAssetManager | undefined;
}

/**
 * Returns the SmartAssetManager attached to a scene, creating one when needed.
 * @param scene - The scene to look up or attach a manager to.
 * @returns The existing or newly created SmartAssetManager.
 */
export function GetOrCreateSmartAssetManager(scene: Scene): SmartAssetManager {
    return GetSmartAssetManagerFromScene(scene) ?? CreateSmartAssetManager(scene);
}

/**
 * Gets the callback invoked whenever a SmartAssetManager is created.
 * @returns The current callback, or null.
 */
export function GetSmartAssetManagerCreatedCallback(): ((manager: SmartAssetManager) => void) | null {
    return SmartAssetManagerCreatedCallback;
}

/**
 * Sets the callback invoked whenever a SmartAssetManager is created.
 * @param callback - The callback to install, or null to clear it.
 */
export function SetSmartAssetManagerCreatedCallback(callback: ((manager: SmartAssetManager) => void) | null): void {
    SmartAssetManagerCreatedCallback = callback;
}

/**
 * Returns true if the given key was loaded as a standalone texture.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to check.
 * @returns True if this key is a texture key.
 */
export function IsSmartAssetTextureKey(managerOrScene: SmartAssetManagerOrScene, key: string): boolean {
    const manager = ResolveSmartAssetManager(managerOrScene);
    return GetSmartAssetInternals(manager).textureKeys.has(key);
}

/**
 * Marks a key as a standalone texture.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to mark.
 */
export function MarkSmartAssetAsTextureKey(managerOrScene: SmartAssetManagerOrScene, key: string): void {
    const manager = ResolveSmartAssetManager(managerOrScene);
    GetSmartAssetInternals(manager).textureKeys.add(key);
}

/**
 * Registers a smart asset entry mapping a key to a URL.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - Unique string identifier for this asset.
 * @param url - URL or path to the asset file.
 * @param options - Optional loader hints and metadata for this asset.
 */
export function RegisterSmartAsset(managerOrScene: SmartAssetManagerOrScene, key: string, url: string, options?: SmartAssetRegistrationOptions): void {
    const manager = ResolveSmartAssetManager(managerOrScene);
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
 * Sets a callback that provides fresh file contents for a key on reload.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The smart asset key.
 * @param callback - A function that returns a fresh File, or null to clear.
 */
export function SetSmartAssetRefreshCallback(managerOrScene: SmartAssetManagerOrScene, key: string, callback: (() => Promise<File>) | null): void {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    if (callback) {
        internal.refreshCallbacks.set(key, callback);
    } else {
        internal.refreshCallbacks.delete(key);
    }
}

/**
 * Removes a key from the registry. If the asset is loaded, it is unloaded first.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to remove.
 * @returns A promise that resolves when the asset has been unloaded and removed.
 */
export async function RemoveSmartAssetAsync(managerOrScene: SmartAssetManagerOrScene, key: string): Promise<void> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    if (internal.containers.has(key)) {
        await UnloadSmartAssetAsync(manager, key);
    }
    for (const tex of [...manager.scene.textures]) {
        if (internal.objectToKeyMap.get(tex) === key) {
            internal.objectToKeyMap.delete(tex);
            tex.dispose();
        }
    }
    internal.urls.delete(key);
    internal.options.delete(key);
    internal.textureKeys.delete(key);
    internal.refreshCallbacks.delete(key);
    RevokeManagedBlobUrl(internal, key);
    manager.onChangedObservable.notifyObservers();
}

/**
 * Resolves a key to its registered URL, or undefined if not registered.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to look up.
 * @returns The URL, or undefined.
 */
export function ResolveSmartAsset(managerOrScene: SmartAssetManagerOrScene, key: string): string | undefined {
    const manager = ResolveSmartAssetManager(managerOrScene);
    return GetSmartAssetInternals(manager).urls.get(key);
}

/**
 * Returns all registered key-to-URL mappings.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @returns A read-only map of keys to URLs.
 */
export function GetAllSmartAssets(managerOrScene: SmartAssetManagerOrScene): ReadonlyMap<string, string> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    return GetSmartAssetInternals(manager).urls;
}

/**
 * Returns registration options for a smart asset key.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to look up.
 * @returns The registered options, or undefined if none were supplied.
 */
export function GetSmartAssetRegistrationOptions(managerOrScene: SmartAssetManagerOrScene, key: string): Readonly<SmartAssetRegistrationOptions> | undefined {
    const manager = ResolveSmartAssetManager(managerOrScene);
    return GetSmartAssetInternals(manager).options.get(key);
}

/**
 * Changes the URL for an existing key. If the asset is loaded, triggers a reload.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to update.
 * @param newUrl - The new URL.
 * @returns A promise that resolves once any required reload has completed.
 */
export async function SetSmartAssetUrlAsync(managerOrScene: SmartAssetManagerOrScene, key: string, newUrl: string): Promise<void> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    RevokeManagedBlobUrl(internal, key, newUrl);
    internal.urls.set(key, newUrl);
    manager.onChangedObservable.notifyObservers();
    if (internal.containers.has(key) || internal.textureKeys.has(key)) {
        await ReloadSmartAssetAsync(manager, key);
    }
}

/**
 * Loads a scene-file asset by key.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to load.
 * @param url - Optional URL. If provided, the key is registered first.
 * @param options - Optional loader hints and metadata for this asset.
 * @returns A promise resolving to the loaded AssetContainer.
 */
export async function LoadSmartAssetAsync(managerOrScene: SmartAssetManagerOrScene, key: string, url?: string, options?: SmartAssetRegistrationOptions): Promise<AssetContainer> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    if (url) {
        RegisterSmartAsset(manager, key, url, options);
    }

    const resolvedUrl = internal.urls.get(key);
    if (!resolvedUrl) {
        throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
    }

    const existing = internal.containers.get(key);
    if (existing) {
        return existing;
    }

    return await LoadSmartAssetSceneFileAsync(manager, key, resolvedUrl, internal.options.get(key)?.extension);
}

/**
 * Loads all registered assets concurrently.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @returns A promise resolving to loaded scene-file containers.
 */
export async function LoadAllSmartAssetsAsync(managerOrScene: SmartAssetManagerOrScene): Promise<AssetContainer[]> {
    const manager = ResolveSmartAssetManager(managerOrScene);
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
                    await LoadSmartAssetTextureAsync(manager, key);
                } catch {
                    Logger.Warn(`SmartAssetManager: Texture "${key}" could not be loaded — skipping.`);
                }
            };
            texturePromises.push(textureLoadAsync());
        } else {
            const sceneLoadAsync = async () => {
                try {
                    return await LoadSmartAssetAsync(manager, key);
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
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to load.
 * @param url - Optional URL. If provided, the key is registered first.
 * @param options - Optional loader hints and metadata for this asset.
 * @returns A promise resolving to the loaded texture.
 */
export async function LoadSmartAssetTextureAsync(
    managerOrScene: SmartAssetManagerOrScene,
    key: string,
    url?: string,
    options?: SmartAssetRegistrationOptions
): Promise<BaseTexture> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    if (url) {
        RegisterSmartAsset(manager, key, url, { ...options, type: options?.type ?? "texture" });
    }

    internal.textureKeys.add(key);

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
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to unload.
 * @returns A promise that resolves once the asset has been unloaded.
 */
export async function UnloadSmartAssetAsync(managerOrScene: SmartAssetManagerOrScene, key: string): Promise<void> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    const container = internal.containers.get(key);
    if (container) {
        container.removeAllFromScene();
        container.dispose();
        internal.containers.delete(key);
        manager.onChangedObservable.notifyObservers();
        return;
    }

    for (const tex of [...manager.scene.textures]) {
        if (internal.objectToKeyMap.get(tex) === key) {
            internal.objectToKeyMap.delete(tex);
            tex.dispose();
        }
    }
    manager.onChangedObservable.notifyObservers();
}

/**
 * Unloads and re-loads an asset.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to reload.
 * @returns A promise resolving to the newly loaded AssetContainer or BaseTexture.
 */
export async function ReloadSmartAssetAsync(managerOrScene: SmartAssetManagerOrScene, key: string): Promise<AssetContainer | BaseTexture> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    const refreshCallback = internal.refreshCallbacks.get(key);
    if (refreshCallback) {
        try {
            const freshFile = await refreshCallback();
            const blobUrl = URL.createObjectURL(freshFile);
            RegisterSmartAssetBlobUrl(manager, key, blobUrl, { extension: GetExtensionFromUrl(freshFile.name) || internal.options.get(key)?.extension });
        } catch (e) {
            Logger.Warn(`SmartAssetManager: Refresh callback failed for "${key}": ${e}`);
        }
    }

    await UnloadSmartAssetAsync(manager, key);

    let result: AssetContainer | BaseTexture;
    if (internal.textureKeys.has(key)) {
        result = await LoadSmartAssetTextureAsync(manager, key);
    } else {
        result = await LoadSmartAssetAsync(manager, key);
    }

    return result;
}

/**
 * Finds which smart asset key owns a scene object.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param object - A scene object.
 * @returns The key, or undefined if the object is not tracked.
 */
export function FindSmartAssetKeyForObject(managerOrScene: SmartAssetManagerOrScene, object: Node | Material | BaseTexture | AnimationGroup): string | undefined {
    const manager = ResolveSmartAssetManager(managerOrScene);
    return GetSmartAssetInternals(manager).objectToKeyMap.get(object);
}

/**
 * Serializes the registry to a JSON-compatible document.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param baseUrl - Optional base URL for making asset paths relative.
 * @returns A serialized asset map document.
 */
export function SerializeSmartAssetManagerMap(managerOrScene: SmartAssetManagerOrScene, baseUrl?: string): ISerializedSmartAssetMap {
    const manager = ResolveSmartAssetManager(managerOrScene);
    return SerializeSmartAssetMap(manager, baseUrl);
}

/**
 * Loads an asset map from a URL, File, or pre-parsed JSON object.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param source - A URL string, File object, or pre-parsed ISerializedSmartAssetMap.
 * @param rootUrl - Optional root URL for resolving relative asset paths.
 * @returns A promise that resolves after the map has been loaded and all registered assets have been attempted.
 */
export async function LoadSmartAssetMapAsync(managerOrScene: SmartAssetManagerOrScene, source: string | File | ISerializedSmartAssetMap, rootUrl?: string): Promise<void> {
    const manager = ResolveSmartAssetManager(managerOrScene);
    let resolvedRootUrl = rootUrl ?? "";

    if (typeof source === "string" && !rootUrl) {
        const { Tools } = await import("../Misc/tools");
        resolvedRootUrl = Tools.GetFolderPath(source);
    }

    const raw = await ReadJsonSourceAsync(source);
    const doc = DeserializeSmartAssetMap(raw);

    for (const [key, entry] of Object.entries(doc.assets)) {
        const resolved = resolvedRootUrl ? ResolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
        RegisterSmartAsset(manager, key, resolved, { type: entry.type, extension: entry.extension, metadata: entry.metadata });
    }

    await LoadAllSmartAssetsAsync(manager);
}

/**
 * Registers an externally loaded AssetContainer under a key.
 * @param managerOrScene - The smart asset manager state, or a scene that owns one.
 * @param key - The key to associate with the container.
 * @param container - The loaded AssetContainer.
 */
export function TrackLoadedSmartAssetContainer(managerOrScene: SmartAssetManagerOrScene, key: string, container: AssetContainer): void {
    const manager = ResolveSmartAssetManager(managerOrScene);
    const internal = GetSmartAssetInternals(manager);
    internal.containers.set(key, container);
    TrackSmartAssetContainerObjects(manager, key, container);
    manager.onChangedObservable.notifyObservers();
}

/**
 * Disposes the manager, unloading all assets and restoring global protocol hooks if needed.
 * @param manager - The smart asset manager state.
 */
export function DisposeSmartAssetManager(manager: SmartAssetManager): void {
    const internal = GetSmartAssetInternals(manager);
    for (const [, container] of Array.from(internal.containers)) {
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
    internal.refreshCallbacks.clear();
    internal.containers.clear();
    for (const blobUrl of Array.from(internal.blobUrls.values())) {
        URL.revokeObjectURL(blobUrl);
    }
    internal.blobUrls.clear();
    internal.objectToKeyMap = new WeakMap();

    manager.onChangedObservable.clear();

    RemoveSmartAssetProtocolHook(manager);

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

function RegisterSmartAssetBlobUrl(manager: SmartAssetManager, key: string, blobUrl: string, options?: SmartAssetRegistrationOptions): void {
    RegisterSmartAsset(manager, key, blobUrl, options);
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

function ResolveSmartAssetManager(managerOrScene: SmartAssetManagerOrScene): SmartAssetManager {
    return SmartAssetManagerInternals.has(managerOrScene as SmartAssetManager) ? (managerOrScene as SmartAssetManager) : GetOrCreateSmartAssetManager(managerOrScene as Scene);
}

function InstallSmartAssetProtocolHook(manager: SmartAssetManager): void {
    if (!ActiveSmartAssetManagers.includes(manager)) {
        ActiveSmartAssetManagers.push(manager);
    }
    if (!SmartAssetProtocolHookInstalled) {
        OriginalPreprocessUrl = FileToolsOptions.PreprocessUrl;
        FileToolsOptions.PreprocessUrl = SmartAssetPreprocessUrl;
        SmartAssetProtocolHookInstalled = true;
    }
}

function RemoveSmartAssetProtocolHook(manager: SmartAssetManager): void {
    const index = ActiveSmartAssetManagers.indexOf(manager);
    if (index >= 0) {
        ActiveSmartAssetManagers.splice(index, 1);
    }
    if (ActiveSmartAssetManagers.length === 0 && SmartAssetProtocolHookInstalled) {
        if (FileToolsOptions.PreprocessUrl === SmartAssetPreprocessUrl) {
            FileToolsOptions.PreprocessUrl = OriginalPreprocessUrl;
        }
        SmartAssetProtocolHookInstalled = false;
    }
}

async function CreateAndLoadTextureAsync(manager: SmartAssetManager, url: string, extensionHint?: string): Promise<BaseTexture> {
    return await new Promise<BaseTexture>((resolve, reject) => {
        const ext = (extensionHint || GetExtensionFromUrl(url)).toLowerCase();
        const isCube = ext === ".env" || ext === ".hdr" || ext === ".dds";
        const onError = (message?: string, exception?: any) => {
            const err = exception instanceof Error ? exception : new Error(message ?? `SmartAssetManager: failed to load texture from "${url}".`);
            reject(err);
        };
        let texture: BaseTexture;
        const onLoad = () => resolve(texture);
        if (isCube) {
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
        RegisterSmartAsset(manager, key, resolution);
        return { url: resolution, extensionHint: GetSmartAssetInternals(manager).options.get(key)?.extension };
    }
    const blobUrl = URL.createObjectURL(resolution);
    const extensionHint = GetExtensionFromUrl(resolution.name) || undefined;
    RegisterSmartAssetBlobUrl(manager, key, blobUrl, { extension: extensionHint });
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
