import { type Scene } from "../scene";
import { type AssetContainer } from "../assetContainer";
import { type Node } from "../node";
import { type Material } from "../Materials/material";
import { type BaseTexture } from "../Materials/Textures/baseTexture";
import { type AnimationGroup } from "../Animations/animationGroup";
import { Observable } from "../Misc/observable";
import { Logger } from "../Misc/logger";
import { LoadAssetContainerAsync } from "../Loading/sceneLoader";
import { FileToolsOptions } from "../Misc/fileTools";
import { type ISmartAssetProvenance } from "./smartAssetProvenance";
import { type ISmartAssetLoadedEvent, type ISmartAssetUrlChangedEvent, type ISmartAssetErrorEvent, type ISmartAssetUnloadedEvent } from "./smartAssetEvents";
import { type ISerializedSmartAssetMap, serializeSmartAssetMap, deserializeSmartAssetMap, resolveAssetUrl, readJsonSource } from "./smartAssetSerializer";
import { RegisterClass } from "../Misc/typeStore";

const SMART_ASSET_MANAGER_KEY = Symbol.for("babylonjs:smartAssetManager");
const ASSET_PROTOCOL = "asset://";

/**
 * Manages a table of smart assets — logical keys mapped to asset URLs.
 *
 * Installs an `asset://` protocol hook into FileTools so that existing
 * SceneLoader APIs work transparently with smart asset keys
 * (e.g., `SceneLoader.LoadAsync("asset://shark")`).
 *
 * For standalone textures (which bypass the protocol hook), use `loadTextureAsync`.
 *
 * The manager attaches itself to the scene for discovery by Inspector and other consumers.
 * Use `SmartAssetManager.GetFromScene(scene)` to retrieve it.
 */
export class SmartAssetManager {
    private _scene: Scene;
    private _urls: Map<string, string> = new Map();
    private _containers: Map<string, AssetContainer> = new Map();
    private _provenance: Map<string, ISmartAssetProvenance> = new Map();
    private _objectToKeyMap: WeakMap<object, string> = new WeakMap();
    private _textureKeys: Set<string> = new Set();
    private _refreshCallbacks: Map<string, () => Promise<File>> = new Map();
    private _applyOverridesForKey: ((key: string) => void) | null = null;
    private _applyAllOverrides: (() => void) | null = null;
    private _originalPreprocessUrl: ((url: string) => string) | null = null;

    /**
     * Fires when an asset finishes loading successfully.
     */
    public readonly onAssetLoadedObservable: Observable<ISmartAssetLoadedEvent> = new Observable<ISmartAssetLoadedEvent>();

    /**
     * Fires when a key's URL is changed via setUrl().
     */
    public readonly onUrlChangedObservable: Observable<ISmartAssetUrlChangedEvent> = new Observable<ISmartAssetUrlChangedEvent>();

    /**
     * Fires when an asset fails to load.
     */
    public readonly onAssetErrorObservable: Observable<ISmartAssetErrorEvent> = new Observable<ISmartAssetErrorEvent>();

    /**
     * Fires when an asset is unloaded from the scene.
     */
    public readonly onAssetUnloadedObservable: Observable<ISmartAssetUnloadedEvent> = new Observable<ISmartAssetUnloadedEvent>();

    /**
     * Optional callback invoked when an asset cannot be found at its registered URL.
     * Return a new URL or File to retry loading, or null to skip the asset.
     */
    public onAssetNotFound: ((key: string, expectedUrl: string) => Promise<string | File | null>) | null = null;

    /**
     * Static callback invoked whenever a new SmartAssetManager is created.
     * Used by hosting environments (e.g., Playground) to install handlers
     * like onAssetNotFound before user code runs.
     */
    public static OnInstanceCreated: ((manager: SmartAssetManager) => void) | null = null;

    /**
     * Creates a new SmartAssetManager and attaches it to the given scene.
     * Installs an `asset://` protocol hook into FileTools.PreprocessUrl.
     * @param scene - The scene this manager operates on.
     */
    constructor(scene: Scene) {
        this._scene = scene;
        if (!scene.metadata) {
            scene.metadata = {};
        }
        scene.metadata[SMART_ASSET_MANAGER_KEY] = this;

        // Install asset:// protocol hook
        this._originalPreprocessUrl = FileToolsOptions.PreprocessUrl;
        FileToolsOptions.PreprocessUrl = (url: string) => {
            if (url.startsWith(ASSET_PROTOCOL)) {
                const key = url.substring(ASSET_PROTOCOL.length);
                const resolved = this._urls.get(key);
                if (resolved) {
                    return resolved;
                }
                Logger.Warn(`SmartAssetManager: Unknown asset key "${key}" in asset:// URL.`);
            }
            return this._originalPreprocessUrl ? this._originalPreprocessUrl(url) : url;
        };

        if (SmartAssetManager.OnInstanceCreated) {
            SmartAssetManager.OnInstanceCreated(this);
        }
    }

    /**
     * The scene this manager is attached to.
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Returns true if the given key was loaded as a standalone texture.
     * @param key - The key to check.
     * @returns True if this key is a texture key.
     */
    public isTextureKey(key: string): boolean {
        return this._textureKeys.has(key);
    }

    /**
     * Marks a key as a standalone texture so that reload and loadAll
     * route it through `loadTextureAsync` even when the URL has no
     * recognizable file extension (e.g. blob URLs).
     * @param key - The key to mark.
     */
    public markAsTextureKey(key: string): void {
        this._textureKeys.add(key);
    }

    /**
     * Returns the SmartAssetManager attached to a scene, or undefined if none exists.
     * @param scene - The scene to look up.
     * @returns The SmartAssetManager, or undefined.
     */
    public static GetFromScene(scene: Scene): SmartAssetManager | undefined {
        return scene.metadata?.[SMART_ASSET_MANAGER_KEY] as SmartAssetManager | undefined;
    }

    // ── Registry ──

    /**
     * Registers a smart asset entry mapping a key to a URL.
     * Also enables the `asset://key` protocol for this key in SceneLoader APIs.
     * @param key - Unique string identifier for this asset.
     * @param url - URL or path to the asset file.
     */
    public register(key: string, url: string): void {
        this._urls.set(key, url);
    }

    /**
     * Sets a callback that provides fresh file contents for a key on reload.
     * Use this when an asset was loaded from a local file and should pick up
     * on-disk changes when reloaded (e.g. via a FileSystemFileHandle).
     * @param key - The smart asset key.
     * @param callback - A function that returns a fresh File, or null to clear.
     */
    public setRefreshCallback(key: string, callback: (() => Promise<File>) | null): void {
        if (callback) {
            this._refreshCallbacks.set(key, callback);
        } else {
            this._refreshCallbacks.delete(key);
        }
    }

    /**
     * Removes a key from the registry. If the asset is loaded, it is unloaded first.
     * @param key - The key to remove.
     */
    public async remove(key: string): Promise<void> {
        if (this._containers.has(key)) {
            await this.unloadAsync(key);
        }
        // Dispose standalone textures tracked under this key
        for (const tex of [...this._scene.textures]) {
            if (this._objectToKeyMap.get(tex) === key) {
                this._objectToKeyMap.delete(tex);
                tex.dispose();
            }
        }
        this._urls.delete(key);
        this._textureKeys.delete(key);
        this._refreshCallbacks.delete(key);
        this._provenance.delete(key);
    }

    /**
     * Resolves a key to its registered URL, or undefined if not registered.
     * @param key - The key to look up.
     * @returns The URL, or undefined.
     */
    public resolve(key: string): string | undefined {
        return this._urls.get(key);
    }

    /**
     * Returns all registered key→URL mappings.
     * @returns A read-only map of keys to URLs.
     */
    public getAll(): ReadonlyMap<string, string> {
        return this._urls;
    }

    /**
     * Changes the URL for an existing key. If the asset is currently loaded, triggers a reload.
     * @param key - The key to update.
     * @param newUrl - The new URL.
     */
    public async setUrl(key: string, newUrl: string): Promise<void> {
        const oldUrl = this._urls.get(key);
        this._urls.set(key, newUrl);
        if (oldUrl !== undefined) {
            this.onUrlChangedObservable.notifyObservers({ key, oldUrl, newUrl });
        }
        if (this._containers.has(key)) {
            await this.reloadAsync(key);
        }
    }

    // ── Loading (Scene Files) ──

    /**
     * Loads a scene-file asset (GLB, glTF, OBJ, .babylon) by key.
     * If a URL is provided and the key is not yet registered, registers it first.
     * If already loaded, returns the existing container.
     *
     * @param key - The key to load.
     * @param url - Optional URL. If provided and the key is not registered, auto-registers it.
     * @returns A promise resolving to the loaded AssetContainer.
     *
     * @example
     * ```typescript
     * // Register and load in one call
     * const container = await sam.loadAsync("shark", "https://models.babylonjs.com/shark.glb");
     * console.log(container.meshes);
     *
     * // Load a previously registered key
     * const container2 = await sam.loadAsync("shark");
     * ```
     */
    public async loadAsync(key: string, url?: string): Promise<AssetContainer> {
        if (url) {
            this.register(key, url);
        }

        const resolvedUrl = this._urls.get(key);
        if (!resolvedUrl) {
            throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
        }

        // Return existing if already loaded
        const existing = this._containers.get(key);
        if (existing) {
            return existing;
        }

        return await this._loadSceneFile(key, resolvedUrl);
    }

    /**
     * Loads all registered assets concurrently.
     * Automatically detects standalone textures by file extension and uses
     * the appropriate loader (loadTextureAsync for images/env, loadAsync for scene files).
     * @returns A promise resolving to an array of loaded AssetContainers.
     */
    public async loadAllAsync(): Promise<AssetContainer[]> {
        const scenePromises: Promise<AssetContainer | null>[] = [];
        const texturePromises: Promise<void>[] = [];

        for (const [key, url] of this._urls) {
            if (this._containers.has(key)) {
                continue;
            }
            if (this._textureKeys.has(key) || _isTextureExtension(url)) {
                texturePromises.push(
                    this.loadTextureAsync(key)
                        .then(() => {})
                        .catch(() => {
                            Logger.Warn(`SmartAssetManager: Texture "${key}" could not be loaded — skipping.`);
                        })
                );
            } else {
                scenePromises.push(
                    this.loadAsync(key).catch(() => {
                        // Asset failed to load (and onAssetNotFound didn't resolve it) — skip it
                        Logger.Warn(`SmartAssetManager: Asset "${key}" could not be loaded — skipping.`);
                        return null;
                    })
                );
            }
        }

        await Promise.all(texturePromises);
        const results = await Promise.all(scenePromises);
        return results.filter((r): r is AssetContainer => r !== null);
    }

    // ── Loading (Textures) ──

    /**
     * Loads a standalone texture by key. Use this for textures that aren't
     * embedded in a GLB (e.g., environment maps, individual texture files
     * for material composition).
     *
     * @param key - The key to load.
     * @param url - Optional URL. If provided and the key is not registered, auto-registers it.
     * @returns A promise resolving to the loaded texture.
     *
     * @example
     * ```typescript
     * const envTex = await sam.loadTextureAsync("env", "textures/environment.env");
     * scene.environmentTexture = envTex;
     *
     * const skin = await sam.loadTextureAsync("skin", "textures/skin.png");
     * material.albedoTexture = skin;
     * ```
     */
    public async loadTextureAsync(key: string, url?: string): Promise<BaseTexture> {
        if (url) {
            this.register(key, url);
        }

        this._textureKeys.add(key);

        const resolvedUrl = this._urls.get(key);
        if (!resolvedUrl) {
            throw new Error(`SmartAssetManager: Key "${key}" is not registered. Provide a URL to auto-register.`);
        }

        const texture = await this._createTexture(resolvedUrl);

        // Wait for the texture to load or fail
        const loaded = await this._waitForTextureLoad(texture);
        if (!loaded && this.onAssetNotFound) {
            // Texture failed to load — ask the user to locate it
            texture.dispose();
            const resolution = await this.onAssetNotFound(key, resolvedUrl);
            if (resolution !== null && resolution !== undefined) {
                let newUrl: string;
                if (typeof resolution === "string") {
                    newUrl = resolution;
                } else {
                    newUrl = URL.createObjectURL(resolution);
                }
                this.register(key, newUrl);
                const retryTexture = await this._createTexture(newUrl);
                await this._waitForTextureLoad(retryTexture);
                this._objectToKeyMap.set(retryTexture, key);
                this.onAssetLoadedObservable.notifyObservers({ key });
                return retryTexture;
            }
        }

        this._objectToKeyMap.set(texture, key);
        this.onAssetLoadedObservable.notifyObservers({ key });
        return texture;
    }

    // ── Unload / Reload ──

    /**
     * Unloads a loaded asset, removing it from the scene and disposing its container
     * or standalone texture. The key remains registered and can be loaded again.
     * @param key - The key to unload.
     */
    public async unloadAsync(key: string): Promise<void> {
        const container = this._containers.get(key);
        if (container) {
            container.removeAllFromScene();
            container.dispose();
            this._containers.delete(key);
            this._provenance.delete(key);
            this.onAssetUnloadedObservable.notifyObservers({ key });
            return;
        }

        // Dispose standalone textures tracked under this key
        for (const tex of [...this._scene.textures]) {
            if (this._objectToKeyMap.get(tex) === key) {
                this._objectToKeyMap.delete(tex);
                tex.dispose();
            }
        }
        this.onAssetUnloadedObservable.notifyObservers({ key });
    }

    /**
     * Unloads and re-loads an asset. Automatically detects whether the key
     * points to a standalone texture or a scene file and uses the appropriate
     * loader. If an OverrideManager is linked, overrides are reapplied after loading.
     * @param key - The key to reload.
     * @returns A promise resolving to the newly loaded AssetContainer or BaseTexture.
     */
    public async reloadAsync(key: string): Promise<AssetContainer | BaseTexture> {
        // If a refresh callback exists, get fresh file contents and update the URL
        const refreshCallback = this._refreshCallbacks.get(key);
        if (refreshCallback) {
            try {
                const freshFile = await refreshCallback();
                const blobUrl = URL.createObjectURL(freshFile);
                this.register(key, blobUrl);
            } catch (e) {
                Logger.Warn(`SmartAssetManager: Refresh callback failed for "${key}": ${e}`);
            }
        }

        await this.unloadAsync(key);

        let result: AssetContainer | BaseTexture;
        if (this._textureKeys.has(key)) {
            result = await this.loadTextureAsync(key);
            // Texture references appear in override values (e.g. "texture:key"),
            // not in override keys, so re-apply all overrides to update materials.
            if (this._applyAllOverrides) {
                this._applyAllOverrides();
            }
        } else {
            result = await this.loadAsync(key);
            if (this._applyOverridesForKey) {
                this._applyOverridesForKey(key);
            }
        }

        return result;
    }

    // ── Provenance ──

    /**
     * Returns which scene objects were produced by a key, or undefined if not loaded.
     * @param key - The key to query.
     * @returns The provenance record, or undefined.
     */
    public getProvenance(key: string): Readonly<ISmartAssetProvenance> | undefined {
        return this._provenance.get(key);
    }

    /**
     * Finds which smart asset key (if any) owns a given scene object.
     * @param object - A scene object (Node, Material, BaseTexture, or AnimationGroup).
     * @returns The key, or undefined if the object is not tracked.
     */
    public findKeyForObject(object: Node | Material | BaseTexture | AnimationGroup): string | undefined {
        return this._objectToKeyMap.get(object);
    }

    // ── Serialization ──

    /**
     * Serializes the registry to a JSON-compatible document.
     * @param baseUrl - Optional base URL for making asset paths relative.
     * @returns A serialized asset map document.
     */
    public serializeAssetMap(baseUrl?: string): ISerializedSmartAssetMap {
        return serializeSmartAssetMap(this, baseUrl);
    }

    /**
     * Loads an asset map from a URL, File, or pre-parsed JSON object.
     * Registers all entries, resolves URLs, and loads all assets.
     * @param source - A URL string, File object, or pre-parsed ISerializedSmartAssetMap.
     * @param rootUrl - Optional root URL for resolving relative asset paths.
     */
    public async loadAssetMapAsync(source: string | File | ISerializedSmartAssetMap, rootUrl?: string): Promise<void> {
        let resolvedRootUrl = rootUrl ?? "";

        if (typeof source === "string" && !rootUrl) {
            const { Tools } = await import("../Misc/tools");
            resolvedRootUrl = Tools.GetFolderPath(source);
        }

        const raw = await readJsonSource(source);
        const doc = deserializeSmartAssetMap(raw);

        for (const [key, entry] of Object.entries(doc.assets)) {
            const resolved = resolvedRootUrl ? resolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
            this.register(key, resolved);
        }

        await this.loadAllAsync();
    }

    // ── Override Integration ──

    /**
     * Links an OverrideManager so overrides are reapplied after smart asset reload.
     * @param overrideManager - The override manager to link.
     */
    public linkOverrideManager(overrideManager: { applyOverridesForKey(key: string): void; applyAllOverrides(): void }): void {
        this._applyOverridesForKey = (key: string) => overrideManager.applyOverridesForKey(key);
        this._applyAllOverrides = () => overrideManager.applyAllOverrides();
    }

    // ── Lifecycle ──

    /**
     * Disposes the manager, unloading all assets and restoring the original PreprocessUrl.
     */
    public dispose(): void {
        for (const [key] of this._containers) {
            const container = this._containers.get(key);
            if (container) {
                container.removeAllFromScene();
                container.dispose();
            }
        }
        this._urls.clear();
        this._textureKeys.clear();
        this._refreshCallbacks.clear();
        this._containers.clear();
        this._provenance.clear();
        this._objectToKeyMap = new WeakMap();

        this.onAssetLoadedObservable.clear();
        this.onUrlChangedObservable.clear();
        this.onAssetErrorObservable.clear();
        this.onAssetUnloadedObservable.clear();

        // Restore original PreprocessUrl
        if (this._originalPreprocessUrl) {
            FileToolsOptions.PreprocessUrl = this._originalPreprocessUrl;
        }

        if (this._scene.metadata) {
            delete this._scene.metadata[SMART_ASSET_MANAGER_KEY];
        }
    }

    // ── Private ──

    private async _createTexture(url: string): Promise<BaseTexture> {
        const ext = _getExtension(url).toLowerCase();
        const isCube = ext === ".env" || ext === ".hdr" || ext === ".dds";

        if (isCube) {
            const { CubeTexture } = await import("../Materials/Textures/cubeTexture");
            return CubeTexture.CreateFromPrefilteredData(url, this._scene);
        } else {
            const { Texture } = await import("../Materials/Textures/texture");
            return new Texture(url, this._scene);
        }
    }

    private _waitForTextureLoad(texture: BaseTexture): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (texture.isReady()) {
                resolve(true);
                return;
            }
            if (texture.loadingError) {
                resolve(false);
                return;
            }
            let settled = false;
            const settle = (result: boolean) => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    clearInterval(poll);
                    resolve(result);
                }
            };
            const timeout = setTimeout(() => settle(!texture.loadingError), 5000);
            texture.onLoadObservable.addOnce(() => settle(true));
            // Re-check after subscribing to catch loads that completed between
            // the initial isReady() check and the observable subscription.
            if (texture.isReady()) {
                settle(true);
                return;
            }
            // Poll for loadingError since there's no instance-level error observable
            const poll = setInterval(() => {
                if (texture.loadingError) {
                    settle(false);
                }
            }, 100);
        });
    }

    private async _loadSceneFile(key: string, url: string): Promise<AssetContainer> {
        try {
            const container = await LoadAssetContainerAsync(url, this._scene);
            container.addAllToScene();
            this._containers.set(key, container);
            this._buildProvenance(key, container);
            this.onAssetLoadedObservable.notifyObservers({ key, container });
            return container;
        } catch (error) {
            this.onAssetErrorObservable.notifyObservers({ key, url, error });

            if (this.onAssetNotFound) {
                const resolution = await this.onAssetNotFound(key, url);
                if (resolution !== null && resolution !== undefined) {
                    let newUrl: string;
                    let extensionHint: string | undefined;
                    if (typeof resolution === "string") {
                        newUrl = resolution;
                    } else {
                        newUrl = URL.createObjectURL(resolution);
                        // Extract extension from the File name for loader selection
                        extensionHint = _getExtension(resolution.name) || undefined;
                    }
                    // Always update the registry so the URL map reflects the new location
                    this.register(key, newUrl);
                    try {
                        const container = await LoadAssetContainerAsync(newUrl, this._scene, {
                            pluginExtension: extensionHint,
                        });
                        container.addAllToScene();
                        this._containers.set(key, container);
                        this._buildProvenance(key, container);
                        this.onAssetLoadedObservable.notifyObservers({ key, container });
                        return container;
                    } catch (retryError) {
                        this.onAssetErrorObservable.notifyObservers({ key, url: newUrl, error: retryError });
                    }
                }
            }

            Logger.Warn(`SmartAssetManager: Asset "${key}" could not be loaded from "${url}".`);
            throw error;
        }
    }

    private _buildProvenance(key: string, container: AssetContainer): void {
        const provenance: ISmartAssetProvenance = {
            key,
            meshNames: container.meshes.map((m) => m.name),
            materialNames: container.materials.map((m) => m.name),
            textureNames: container.textures.map((t) => t.name),
            animationGroupNames: container.animationGroups.map((a) => a.name),
            lightNames: container.lights.map((l) => l.name),
            cameraNames: container.cameras.map((c) => c.name),
        };
        this._provenance.set(key, provenance);

        for (const mesh of container.meshes) {
            this._objectToKeyMap.set(mesh, key);
        }
        for (const mat of container.materials) {
            this._objectToKeyMap.set(mat, key);
        }
        for (const tex of container.textures) {
            this._objectToKeyMap.set(tex, key);
        }
        for (const ag of container.animationGroups) {
            this._objectToKeyMap.set(ag, key);
        }
        for (const light of container.lights) {
            this._objectToKeyMap.set(light, key);
        }
        for (const cam of container.cameras) {
            this._objectToKeyMap.set(cam, key);
        }
    }
}

/**
 * Returns the file extension from a URL string, including the leading dot.
 * @param url - The URL to extract the extension from.
 * @returns The file extension including the dot, or an empty string if none found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _getExtension(url: string): string {
    const cleanUrl = url.split("?")[0].split("#")[0];
    const lastDot = cleanUrl.lastIndexOf(".");
    const lastSlash = Math.max(cleanUrl.lastIndexOf("/"), cleanUrl.lastIndexOf("\\"));
    if (lastDot > lastSlash && lastDot >= 0) {
        return cleanUrl.substring(lastDot);
    }
    return "";
}

const _TEXTURE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".bmp", ".tga", ".gif", ".webp", ".env", ".hdr", ".dds", ".ktx", ".ktx2", ".basis"]);

/**
 * Returns true if the URL points to a standalone texture file
 * rather than a scene file (GLB, glTF, etc.).
 * @param url - The URL to check.
 * @returns True if the URL has a texture file extension.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _isTextureExtension(url: string): boolean {
    return _TEXTURE_EXTENSIONS.has(_getExtension(url).toLowerCase());
}

RegisterClass("BABYLON.SmartAssetManager", SmartAssetManager);
