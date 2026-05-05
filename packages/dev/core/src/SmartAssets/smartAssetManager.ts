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
import { type ISmartAssetProvenance } from "./smartAssetProvenance";
import { type ISmartAssetLoadedEvent, type ISmartAssetUrlChangedEvent, type ISmartAssetErrorEvent, type ISmartAssetUnloadedEvent } from "./smartAssetEvents";
import { type ISerializedSmartAssetMap, SerializeSmartAssetMap, DeserializeSmartAssetMap, ResolveAssetUrl, ReadJsonSourceAsync } from "./smartAssetSerializer";

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
     * Fires when an asset finishes loading successfully.
     */
    readonly onAssetLoadedObservable: Observable<ISmartAssetLoadedEvent>;

    /**
     * Fires when a key's URL is changed.
     */
    readonly onUrlChangedObservable: Observable<ISmartAssetUrlChangedEvent>;

    /**
     * Fires when an asset fails to load.
     */
    readonly onAssetErrorObservable: Observable<ISmartAssetErrorEvent>;

    /**
     * Fires when an asset is unloaded from the scene.
     */
    readonly onAssetUnloadedObservable: Observable<ISmartAssetUnloadedEvent>;

    /**
     * Optional callback invoked when an asset cannot be found at its registered URL.
     * Return a new URL or File to retry loading, or null to skip the asset.
     */
    onAssetNotFound: ((key: string, expectedUrl: string) => Promise<string | File | null>) | null;
};

type SmartAssetManagerInternals = {
    urls: Map<string, string>;
    containers: Map<string, AssetContainer>;
    provenance: Map<string, ISmartAssetProvenance>;
    objectToKeyMap: WeakMap<object, string>;
    textureKeys: Set<string>;
    refreshCallbacks: Map<string, () => Promise<File>>;
    applyOverridesForKey: ((key: string) => void) | null;
    applyAllOverrides: (() => void) | null;
};

const SmartAssetManagerInternals = new WeakMap<SmartAssetManager, SmartAssetManagerInternals>();
const ActiveSmartAssetManagers: SmartAssetManager[] = [];
let OriginalPreprocessUrl: ((url: string) => string) | undefined;
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
    return OriginalPreprocessUrl ? OriginalPreprocessUrl(url) : url;
};

/**
 * Creates a new SmartAssetManager state object and attaches it to the scene.
 * @param scene - The scene this manager operates on.
 * @returns The created smart asset manager state.
 */
export function CreateSmartAssetManager(scene: Scene): SmartAssetManager {
    const manager: SmartAssetManager = {
        scene,
        onAssetLoadedObservable: new Observable<ISmartAssetLoadedEvent>(),
        onUrlChangedObservable: new Observable<ISmartAssetUrlChangedEvent>(),
        onAssetErrorObservable: new Observable<ISmartAssetErrorEvent>(),
        onAssetUnloadedObservable: new Observable<ISmartAssetUnloadedEvent>(),
        onAssetNotFound: null,
    };

    SmartAssetManagerInternals.set(manager, {
        urls: new Map(),
        containers: new Map(),
        provenance: new Map(),
        objectToKeyMap: new WeakMap(),
        textureKeys: new Set(),
        refreshCallbacks: new Map(),
        applyOverridesForKey: null,
        applyAllOverrides: null,
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
 * @param manager - The smart asset manager state.
 * @param key - The key to check.
 * @returns True if this key is a texture key.
 */
export function IsSmartAssetTextureKey(manager: SmartAssetManager, key: string): boolean {
    return GetSmartAssetInternals(manager).textureKeys.has(key);
}

/**
 * Marks a key as a standalone texture.
 * @param manager - The smart asset manager state.
 * @param key - The key to mark.
 */
export function MarkSmartAssetAsTextureKey(manager: SmartAssetManager, key: string): void {
    GetSmartAssetInternals(manager).textureKeys.add(key);
}

/**
 * Registers a smart asset entry mapping a key to a URL.
 * @param manager - The smart asset manager state.
 * @param key - Unique string identifier for this asset.
 * @param url - URL or path to the asset file.
 */
export function RegisterSmartAsset(manager: SmartAssetManager, key: string, url: string): void {
    GetSmartAssetInternals(manager).urls.set(key, url);
}

/**
 * Sets a callback that provides fresh file contents for a key on reload.
 * @param manager - The smart asset manager state.
 * @param key - The smart asset key.
 * @param callback - A function that returns a fresh File, or null to clear.
 */
export function SetSmartAssetRefreshCallback(manager: SmartAssetManager, key: string, callback: (() => Promise<File>) | null): void {
    const internal = GetSmartAssetInternals(manager);
    if (callback) {
        internal.refreshCallbacks.set(key, callback);
    } else {
        internal.refreshCallbacks.delete(key);
    }
}

/**
 * Removes a key from the registry. If the asset is loaded, it is unloaded first.
 * @param manager - The smart asset manager state.
 * @param key - The key to remove.
 */
export async function RemoveSmartAssetAsync(manager: SmartAssetManager, key: string): Promise<void> {
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
    internal.textureKeys.delete(key);
    internal.refreshCallbacks.delete(key);
    internal.provenance.delete(key);
}

/**
 * Resolves a key to its registered URL, or undefined if not registered.
 * @param manager - The smart asset manager state.
 * @param key - The key to look up.
 * @returns The URL, or undefined.
 */
export function ResolveSmartAsset(manager: SmartAssetManager, key: string): string | undefined {
    return GetSmartAssetInternals(manager).urls.get(key);
}

/**
 * Returns all registered key-to-URL mappings.
 * @param manager - The smart asset manager state.
 * @returns A read-only map of keys to URLs.
 */
export function GetAllSmartAssets(manager: SmartAssetManager): ReadonlyMap<string, string> {
    return GetSmartAssetInternals(manager).urls;
}

/**
 * Changes the URL for an existing key. If the asset is loaded, triggers a reload.
 * @param manager - The smart asset manager state.
 * @param key - The key to update.
 * @param newUrl - The new URL.
 */
export async function SetSmartAssetUrlAsync(manager: SmartAssetManager, key: string, newUrl: string): Promise<void> {
    const internal = GetSmartAssetInternals(manager);
    const oldUrl = internal.urls.get(key);
    internal.urls.set(key, newUrl);
    if (oldUrl !== undefined) {
        manager.onUrlChangedObservable.notifyObservers({ key, oldUrl, newUrl });
    }
    if (internal.containers.has(key) || internal.textureKeys.has(key)) {
        await ReloadSmartAssetAsync(manager, key);
    }
}

/**
 * Loads a scene-file asset by key.
 * @param manager - The smart asset manager state.
 * @param key - The key to load.
 * @param url - Optional URL. If provided, the key is registered first.
 * @returns A promise resolving to the loaded AssetContainer.
 */
export async function LoadSmartAssetAsync(manager: SmartAssetManager, key: string, url?: string): Promise<AssetContainer> {
    const internal = GetSmartAssetInternals(manager);
    if (url) {
        RegisterSmartAsset(manager, key, url);
    }

    const resolvedUrl = internal.urls.get(key);
    if (!resolvedUrl) {
        throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
    }

    const existing = internal.containers.get(key);
    if (existing) {
        return existing;
    }

    return await LoadSmartAssetSceneFileAsync(manager, key, resolvedUrl);
}

/**
 * Loads all registered assets concurrently.
 * @param manager - The smart asset manager state.
 * @returns A promise resolving to loaded scene-file containers.
 */
export async function LoadAllSmartAssetsAsync(manager: SmartAssetManager): Promise<AssetContainer[]> {
    const internal = GetSmartAssetInternals(manager);
    const scenePromises: Promise<AssetContainer | null>[] = [];
    const texturePromises: Promise<void>[] = [];

    for (const [key, url] of Array.from(internal.urls)) {
        if (internal.containers.has(key)) {
            continue;
        }
        if (internal.textureKeys.has(key) || IsTextureUrl(url)) {
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
 * @param manager - The smart asset manager state.
 * @param key - The key to load.
 * @param url - Optional URL. If provided, the key is registered first.
 * @returns A promise resolving to the loaded texture.
 */
export async function LoadSmartAssetTextureAsync(manager: SmartAssetManager, key: string, url?: string): Promise<BaseTexture> {
    const internal = GetSmartAssetInternals(manager);
    if (url) {
        RegisterSmartAsset(manager, key, url);
    }

    internal.textureKeys.add(key);

    const resolvedUrl = internal.urls.get(key);
    if (!resolvedUrl) {
        throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
    }

    let texture: BaseTexture;
    try {
        texture = await CreateAndLoadTextureAsync(manager, resolvedUrl);
    } catch (error) {
        manager.onAssetErrorObservable.notifyObservers({ key, url: resolvedUrl, error });
        const fallback = await ResolveNotFoundAsync(manager, key, resolvedUrl);
        if (!fallback) {
            throw error;
        }
        texture = await CreateAndLoadTextureAsync(manager, fallback.url);
    }

    internal.objectToKeyMap.set(texture, key);
    manager.onAssetLoadedObservable.notifyObservers({ key });
    internal.applyAllOverrides?.();
    return texture;
}

/**
 * Unloads a loaded asset while keeping the key registered.
 * @param manager - The smart asset manager state.
 * @param key - The key to unload.
 */
export async function UnloadSmartAssetAsync(manager: SmartAssetManager, key: string): Promise<void> {
    const internal = GetSmartAssetInternals(manager);
    const container = internal.containers.get(key);
    if (container) {
        container.removeAllFromScene();
        container.dispose();
        internal.containers.delete(key);
        internal.provenance.delete(key);
        manager.onAssetUnloadedObservable.notifyObservers({ key });
        return;
    }

    for (const tex of [...manager.scene.textures]) {
        if (internal.objectToKeyMap.get(tex) === key) {
            internal.objectToKeyMap.delete(tex);
            tex.dispose();
        }
    }
    manager.onAssetUnloadedObservable.notifyObservers({ key });
}

/**
 * Unloads and re-loads an asset.
 * @param manager - The smart asset manager state.
 * @param key - The key to reload.
 * @returns A promise resolving to the newly loaded AssetContainer or BaseTexture.
 */
export async function ReloadSmartAssetAsync(manager: SmartAssetManager, key: string): Promise<AssetContainer | BaseTexture> {
    const internal = GetSmartAssetInternals(manager);
    const refreshCallback = internal.refreshCallbacks.get(key);
    if (refreshCallback) {
        try {
            const freshFile = await refreshCallback();
            const blobUrl = URL.createObjectURL(freshFile);
            RegisterSmartAsset(manager, key, blobUrl);
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
 * Returns which scene objects were produced by a key.
 * @param manager - The smart asset manager state.
 * @param key - The key to query.
 * @returns The provenance record, or undefined.
 */
export function GetSmartAssetProvenance(manager: SmartAssetManager, key: string): Readonly<ISmartAssetProvenance> | undefined {
    return GetSmartAssetInternals(manager).provenance.get(key);
}

/**
 * Finds which smart asset key owns a scene object.
 * @param manager - The smart asset manager state.
 * @param object - A scene object.
 * @returns The key, or undefined if the object is not tracked.
 */
export function FindSmartAssetKeyForObject(manager: SmartAssetManager, object: Node | Material | BaseTexture | AnimationGroup): string | undefined {
    return GetSmartAssetInternals(manager).objectToKeyMap.get(object);
}

/**
 * Serializes the registry to a JSON-compatible document.
 * @param manager - The smart asset manager state.
 * @param baseUrl - Optional base URL for making asset paths relative.
 * @returns A serialized asset map document.
 */
export function SerializeSmartAssetManagerMap(manager: SmartAssetManager, baseUrl?: string): ISerializedSmartAssetMap {
    return SerializeSmartAssetMap(manager, baseUrl);
}

/**
 * Loads an asset map from a URL, File, or pre-parsed JSON object.
 * @param manager - The smart asset manager state.
 * @param source - A URL string, File object, or pre-parsed ISerializedSmartAssetMap.
 * @param rootUrl - Optional root URL for resolving relative asset paths.
 */
export async function LoadSmartAssetMapAsync(manager: SmartAssetManager, source: string | File | ISerializedSmartAssetMap, rootUrl?: string): Promise<void> {
    let resolvedRootUrl = rootUrl ?? "";

    if (typeof source === "string" && !rootUrl) {
        const { Tools } = await import("../Misc/tools");
        resolvedRootUrl = Tools.GetFolderPath(source);
    }

    const raw = await ReadJsonSourceAsync(source);
    const doc = DeserializeSmartAssetMap(raw);

    for (const [key, entry] of Object.entries(doc.assets)) {
        const resolved = resolvedRootUrl ? ResolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
        RegisterSmartAsset(manager, key, resolved);
    }

    await LoadAllSmartAssetsAsync(manager);
}

/**
 * Links override callbacks so smart asset reloads can reapply overrides.
 * @param manager - The smart asset manager state.
 * @param overrideHandlers - Handlers for applying overrides after reload.
 */
export function LinkSmartAssetOverrideHandlers(manager: SmartAssetManager, overrideHandlers: { applyOverridesForKey(key: string): void; applyAllOverrides(): void }): void {
    const internal = GetSmartAssetInternals(manager);
    internal.applyOverridesForKey = (key: string) => overrideHandlers.applyOverridesForKey(key);
    internal.applyAllOverrides = () => overrideHandlers.applyAllOverrides();
}

/**
 * Registers an externally loaded AssetContainer under a key.
 * @param manager - The smart asset manager state.
 * @param key - The key to associate with the container.
 * @param container - The loaded AssetContainer.
 */
export function TrackLoadedSmartAssetContainer(manager: SmartAssetManager, key: string, container: AssetContainer): void {
    const internal = GetSmartAssetInternals(manager);
    internal.containers.set(key, container);
    BuildSmartAssetProvenance(manager, key, container);
    manager.onAssetLoadedObservable.notifyObservers({ key, container });
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
    internal.textureKeys.clear();
    internal.refreshCallbacks.clear();
    internal.containers.clear();
    internal.provenance.clear();
    internal.objectToKeyMap = new WeakMap();
    internal.applyOverridesForKey = null;
    internal.applyAllOverrides = null;

    manager.onAssetLoadedObservable.clear();
    manager.onUrlChangedObservable.clear();
    manager.onAssetErrorObservable.clear();
    manager.onAssetUnloadedObservable.clear();

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

function InstallSmartAssetProtocolHook(manager: SmartAssetManager): void {
    if (!ActiveSmartAssetManagers.includes(manager)) {
        ActiveSmartAssetManagers.push(manager);
    }
    if (!OriginalPreprocessUrl) {
        OriginalPreprocessUrl = FileToolsOptions.PreprocessUrl;
        FileToolsOptions.PreprocessUrl = SmartAssetPreprocessUrl;
    }
}

function RemoveSmartAssetProtocolHook(manager: SmartAssetManager): void {
    const index = ActiveSmartAssetManagers.indexOf(manager);
    if (index >= 0) {
        ActiveSmartAssetManagers.splice(index, 1);
    }
    if (ActiveSmartAssetManagers.length === 0 && OriginalPreprocessUrl) {
        if (FileToolsOptions.PreprocessUrl === SmartAssetPreprocessUrl) {
            FileToolsOptions.PreprocessUrl = OriginalPreprocessUrl;
        }
        OriginalPreprocessUrl = undefined;
    }
}

async function CreateAndLoadTextureAsync(manager: SmartAssetManager, url: string): Promise<BaseTexture> {
    return await new Promise<BaseTexture>((resolve, reject) => {
        const ext = GetExtensionFromUrl(url);
        const isCube = ext === ".env" || ext === ".hdr" || ext === ".dds";
        const onError = (message?: string, exception?: any) => {
            const err = exception instanceof Error ? exception : new Error(message ?? `SmartAssetManager: failed to load texture from "${url}".`);
            reject(err);
        };
        let texture: BaseTexture;
        const onLoad = () => resolve(texture);
        if (isCube) {
            texture = new CubeTexture(url, manager.scene, null, false, null, onLoad, onError, undefined, true);
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
        return { url: resolution };
    }
    const blobUrl = URL.createObjectURL(resolution);
    RegisterSmartAsset(manager, key, blobUrl);
    return { url: blobUrl, extensionHint: GetExtensionFromUrl(resolution.name) || undefined };
}

async function LoadSmartAssetSceneFileAsync(manager: SmartAssetManager, key: string, url: string): Promise<AssetContainer> {
    const loadAsync = async (loadUrl: string, extensionHint?: string) => {
        const container = await LoadAssetContainerAsync(loadUrl, manager.scene, { pluginExtension: extensionHint });
        container.addAllToScene();
        TrackLoadedSmartAssetContainer(manager, key, container);
        GetSmartAssetInternals(manager).applyOverridesForKey?.(key);
        return container;
    };

    try {
        return await loadAsync(url);
    } catch (error) {
        manager.onAssetErrorObservable.notifyObservers({ key, url, error });
        const fallback = await ResolveNotFoundAsync(manager, key, url);
        if (fallback) {
            try {
                return await loadAsync(fallback.url, fallback.extensionHint);
            } catch (retryError) {
                manager.onAssetErrorObservable.notifyObservers({ key, url: fallback.url, error: retryError });
            }
        }
        Logger.Warn(`SmartAssetManager: Asset "${key}" could not be loaded from "${url}".`);
        throw error;
    }
}

function BuildSmartAssetProvenance(manager: SmartAssetManager, key: string, container: AssetContainer): void {
    const internal = GetSmartAssetInternals(manager);
    const provenance: ISmartAssetProvenance = {
        key,
        meshNames: container.meshes.map((m) => m.name),
        materialNames: container.materials.map((m) => m.name),
        textureNames: container.textures.map((t) => t.name),
        animationGroupNames: container.animationGroups.map((a) => a.name),
        lightNames: container.lights.map((l) => l.name),
        cameraNames: container.cameras.map((c) => c.name),
    };
    internal.provenance.set(key, provenance);

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
