import { type Scene } from "../scene";
import { type Observer } from "../Misc/observable";
import { Logger } from "../Misc/logger";
import { type IOverrideEntry, type OverrideTargetType, type OverrideValue } from "./overrideEntry";
import { type SmartAssetManager, AddSmartAssetManagerCreatedObserver, FindSmartAssetKeyForObject, GetSmartAssetManagerFromScene, ResolveSmartAsset } from "./smartAssetManager";

// eslint-disable-next-line @typescript-eslint/naming-convention
const OVERRIDE_MANAGER_KEY = Symbol.for("babylonjs:overrideManager");

/**
 * Stateful handle for a scene's property override registry.
 *
 * Override behavior is exposed through module-level functions rather than
 * class methods so callers can import only the operations they need.
 *
 * Overrides are property diffs applied after an asset is loaded. They persist
 * across reloads and are stored alongside the asset map in the project file.
 *
 * The override manager is host-agnostic — it works with any Babylon Scene
 * without requiring Inspector, Playground, or any specific host environment.
 *
 * @example
 * ```typescript
 * const sam = CreateSmartAssetManager(scene);
 * const overrides = CreateOverrideManager(scene);
 *
 * // Add an override: set the material named "canPaint" from key "sodaCan" to red
 * AddOverride(overrides, {
 *     key: "sodaCan",
 *     targetType: "materials",
 *     targetName: "canPaint",
 *     propertyPath: "albedoColor",
 *     value: [1, 0, 0],
 * });
 * ```
 */
export type OverrideManager = {
    /**
     * The scene this manager is attached to.
     */
    readonly scene: Scene;
};

/**
 * An OverrideManager handle, or a scene that should use its attached manager.
 * When a scene is supplied to override functions, the scene's manager is
 * created automatically if needed.
 */
export type OverrideManagerOrScene = OverrideManager | Scene;

type OverrideManagerInternals = {
    overrides: IOverrideEntry[];
    originalValues: Map<string, unknown>;
    sceneDisposeObserver: Observer<Scene> | null;
    samCreatedObserver: Observer<SmartAssetManager> | null;
    samChangedObserver: Observer<void> | null;
    linkedSam: SmartAssetManager | null;
};

const OverrideManagerInternals = new WeakMap<OverrideManager, OverrideManagerInternals>();

/**
 * Creates a new OverrideManager state object and attaches it to the scene.
 *
 * Throws if the scene already has an OverrideManager — use {@link GetOrCreateOverrideManager}
 * if you don't know whether one already exists.
 * @param scene - The scene this manager operates on.
 * @returns The created override manager state.
 */
export function CreateOverrideManager(scene: Scene): OverrideManager {
    if (GetOverrideManagerFromScene(scene)) {
        throw new Error("OverrideManager: A manager already exists for this scene. Use GetOrCreateOverrideManager instead.");
    }

    const manager: OverrideManager = { scene };

    const internal: OverrideManagerInternals = {
        overrides: [],
        originalValues: new Map(),
        sceneDisposeObserver: null,
        samCreatedObserver: null,
        samChangedObserver: null,
        linkedSam: null,
    };
    OverrideManagerInternals.set(manager, internal);

    if (!scene.metadata) {
        scene.metadata = {};
    }
    scene.metadata[OVERRIDE_MANAGER_KEY] = manager;

    // Auto-dispose when the scene is disposed so the manager doesn't outlive it.
    internal.sceneDisposeObserver = scene.onDisposeObservable.add(() => DisposeOverrideManager(manager));

    // If a SmartAssetManager already exists on this scene, link it now so overrides
    // are reapplied automatically on asset reload.
    const existingSam = GetSmartAssetManagerFromScene(scene);
    if (existingSam) {
        _linkSmartAssetManager(manager, existingSam);
    }

    // If a SmartAssetManager is created later on this same scene, link to it then.
    internal.samCreatedObserver = AddSmartAssetManagerCreatedObserver((sam) => {
        if (sam.scene === scene) {
            _linkSmartAssetManager(manager, sam);
        }
    });

    return manager;
}

/**
 * Returns the OverrideManager attached to a scene, or undefined if none exists.
 * @param scene - The scene to look up.
 * @returns The OverrideManager, or undefined.
 */
export function GetOverrideManagerFromScene(scene: Scene): OverrideManager | undefined {
    return scene.metadata?.[OVERRIDE_MANAGER_KEY] as OverrideManager | undefined;
}

/**
 * Returns the OverrideManager attached to a scene, creating one when needed.
 * @param scene - The scene to look up or attach a manager to.
 * @returns The existing or newly created OverrideManager.
 */
export function GetOrCreateOverrideManager(scene: Scene): OverrideManager {
    return GetOverrideManagerFromScene(scene) ?? CreateOverrideManager(scene);
}

// ── Override CRUD ──

/**
 * Adds an override entry and immediately applies it if the target is loaded.
 * If an override with the same key/target/property already exists, it is replaced.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param entry - The override to add.
 * @param skipApply - If true, records the override without applying it immediately.
 *                    Use this when the value has already been set (e.g., by Inspector).
 */
export function AddOverride(managerOrScene: OverrideManagerOrScene, entry: IOverrideEntry, skipApply: boolean = false): void {
    const manager = ResolveOverrideManager(managerOrScene);
    const internal = GetOverrideInternals(manager);

    _removeMatchingOverride(internal, entry.key, entry.targetType, entry.targetName, entry.propertyPath);
    internal.overrides.push(entry);
    if (!skipApply) {
        _applyOverride(manager, internal, entry);
    }
}

/**
 * Removes an override by matching key, target, and property path.
 * Restores the original value if one was captured.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path to un-override.
 * @returns True if an override was removed.
 */
export function RemoveOverride(managerOrScene: OverrideManagerOrScene, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): boolean {
    const manager = ResolveOverrideManager(managerOrScene);
    const internal = GetOverrideInternals(manager);

    const idx = _findOverrideIndex(internal, key, targetType, targetName, propertyPath);
    if (idx < 0) {
        return false;
    }

    internal.overrides.splice(idx, 1);

    const origKey = _makeOriginalValueKey(key, targetType, targetName, propertyPath);
    const original = internal.originalValues.get(origKey);
    if (original !== undefined) {
        const target = _resolveTarget(manager, key, targetType, targetName);
        if (target) {
            _setNestedProperty(target, propertyPath, original);
        }
        internal.originalValues.delete(origKey);
    }

    return true;
}

/**
 * Returns all overrides, optionally filtered by key.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param key - If provided, returns only overrides for this key.
 * @returns A read-only array of override entries.
 */
export function GetOverrides(managerOrScene: OverrideManagerOrScene, key?: string): readonly IOverrideEntry[] {
    const internal = GetOverrideInternals(ResolveOverrideManager(managerOrScene));
    if (key !== undefined) {
        return internal.overrides.filter((o) => o.key === key);
    }
    return internal.overrides;
}

/**
 * Removes all overrides, optionally restoring original values.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param restoreOriginals - If true, restores all captured original values.
 */
export function ClearOverrides(managerOrScene: OverrideManagerOrScene, restoreOriginals: boolean = false): void {
    const manager = ResolveOverrideManager(managerOrScene);
    const internal = GetOverrideInternals(manager);

    if (restoreOriginals) {
        for (const entry of [...internal.overrides]) {
            RemoveOverride(manager, entry.key, entry.targetType, entry.targetName, entry.propertyPath);
        }
    } else {
        internal.overrides.length = 0;
        internal.originalValues.clear();
    }
}

/**
 * Updates the targetName on all overrides that match a given key, type, and old name.
 * Use this when an entity is renamed so existing overrides follow the new name.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param key - The smart asset key.
 * @param targetType - The target type (meshes, materials, etc.).
 * @param oldName - The old entity name.
 * @param newName - The new entity name.
 */
export function RenameOverrideTarget(managerOrScene: OverrideManagerOrScene, key: string, targetType: OverrideTargetType, oldName: string, newName: string): void {
    const internal = GetOverrideInternals(ResolveOverrideManager(managerOrScene));

    for (const entry of internal.overrides) {
        if (entry.key === key && entry.targetType === targetType && entry.targetName === oldName) {
            (entry as { targetName: string }).targetName = newName;
        }
    }

    // Update original-value keys to match the new name
    for (const [origKey, value] of Array.from(internal.originalValues.entries())) {
        const prefix = `${key}::${targetType}::${oldName}::`;
        if (origKey.startsWith(prefix)) {
            const propertyPath = origKey.substring(prefix.length);
            const newOrigKey = `${key}::${targetType}::${newName}::${propertyPath}`;
            internal.originalValues.set(newOrigKey, value);
            internal.originalValues.delete(origKey);
        }
    }
}

// ── Application ──

/**
 * Applies all overrides for a specific smart asset key.
 * Called automatically when the linked SmartAssetManager reloads assets.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param key - The smart asset key to apply overrides for.
 */
export function ApplyOverridesForKey(managerOrScene: OverrideManagerOrScene, key: string): void {
    const manager = ResolveOverrideManager(managerOrScene);
    const internal = GetOverrideInternals(manager);
    for (const entry of internal.overrides) {
        if (entry.key === key) {
            _applyOverride(manager, internal, entry);
        }
    }
}

/**
 * Applies all overrides (all keys + scene-level).
 * @param managerOrScene - The override manager state, or a scene that owns one.
 */
export function ApplyAllOverrides(managerOrScene: OverrideManagerOrScene): void {
    const manager = ResolveOverrideManager(managerOrScene);
    const internal = GetOverrideInternals(manager);
    for (const entry of internal.overrides) {
        _applyOverride(manager, internal, entry);
    }
}

// ── Serialization ──

/**
 * Serializes all overrides to a JSON-compatible array.
 * The on-disk shape is identical to the in-memory `IOverrideEntry`.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @returns An array of override entries (shallow copies).
 */
export function SerializeOverrides(managerOrScene: OverrideManagerOrScene): IOverrideEntry[] {
    const internal = GetOverrideInternals(ResolveOverrideManager(managerOrScene));
    return internal.overrides.map((o) => ({ ...o }));
}

/**
 * Loads overrides from a serialized array and applies them.
 * @param managerOrScene - The override manager state, or a scene that owns one.
 * @param data - Array of override entries.
 */
export function DeserializeAndApplyOverrides(managerOrScene: OverrideManagerOrScene, data: IOverrideEntry[]): void {
    if (!Array.isArray(data)) {
        throw new Error("OverrideManager: Expected an array of override entries.");
    }

    const manager = ResolveOverrideManager(managerOrScene);
    for (const entry of data) {
        if (entry.key === undefined || !entry.targetType || entry.targetName === undefined || !entry.propertyPath || entry.value === undefined) {
            Logger.Warn("OverrideManager: Skipping invalid override entry.");
            continue;
        }
        AddOverride(manager, entry);
    }
}

// ── Lifecycle ──

/**
 * Disposes the manager, clearing all overrides and detaching it from its scene.
 * Safe to call multiple times; subsequent calls are no-ops. Automatically invoked when the
 * owning scene is disposed.
 * @param manager - The override manager state.
 */
export function DisposeOverrideManager(manager: OverrideManager): void {
    const internal = OverrideManagerInternals.get(manager);
    if (!internal) {
        return;
    }
    OverrideManagerInternals.delete(manager);

    if (internal.sceneDisposeObserver) {
        manager.scene.onDisposeObservable.remove(internal.sceneDisposeObserver);
        internal.sceneDisposeObserver = null;
    }
    if (internal.samCreatedObserver) {
        // The created observable lives on the smart asset manager module; remove via the
        // returned observer's parent to keep this dispose self-contained.
        internal.samCreatedObserver.remove();
        internal.samCreatedObserver = null;
    }
    if (internal.samChangedObserver && internal.linkedSam) {
        internal.linkedSam.onChangedObservable.remove(internal.samChangedObserver);
    }
    internal.samChangedObserver = null;
    internal.linkedSam = null;

    internal.overrides.length = 0;
    internal.originalValues.clear();

    if (manager.scene.metadata) {
        delete manager.scene.metadata[OVERRIDE_MANAGER_KEY];
    }
}

// ── Private ──

function GetOverrideInternals(manager: OverrideManager): OverrideManagerInternals {
    const internal = OverrideManagerInternals.get(manager);
    if (!internal) {
        throw new Error("OverrideManager: Unknown manager state.");
    }
    return internal;
}

function ResolveOverrideManager(managerOrScene: OverrideManagerOrScene): OverrideManager {
    return OverrideManagerInternals.has(managerOrScene as OverrideManager) ? (managerOrScene as OverrideManager) : GetOrCreateOverrideManager(managerOrScene as Scene);
}

/**
 * Subscribes to the SmartAssetManager's onChangedObservable so overrides are
 * reapplied automatically whenever asset state changes (e.g., after a reload).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _linkSmartAssetManager(manager: OverrideManager, sam: SmartAssetManager): void {
    const internal = GetOverrideInternals(manager);
    if (internal.linkedSam === sam) {
        return;
    }
    if (internal.samChangedObserver && internal.linkedSam) {
        internal.linkedSam.onChangedObservable.remove(internal.samChangedObserver);
    }
    internal.linkedSam = sam;
    internal.samChangedObserver = sam.onChangedObservable.add(() => ApplyAllOverrides(manager));
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _applyOverride(manager: OverrideManager, internal: OverrideManagerInternals, entry: IOverrideEntry): void {
    const target = _resolveTarget(manager, entry.key, entry.targetType, entry.targetName);
    if (!target) {
        Logger.Warn(
            `OverrideManager._applyOverride: target not found for key="${entry.key}" type="${entry.targetType}" name="${entry.targetName}" prop="${entry.propertyPath}"`
        );
        return; // Target not loaded yet — override will be applied on next load
    }

    // Capture original value before first override
    const origKey = _makeOriginalValueKey(entry.key, entry.targetType, entry.targetName, entry.propertyPath);
    if (!internal.originalValues.has(origKey)) {
        const currentValue = _getNestedProperty(target, entry.propertyPath);
        if (currentValue !== undefined) {
            internal.originalValues.set(origKey, _cloneValue(currentValue));
        }
    }

    const resolvedValue = _resolveValue(manager, entry.value);
    _setNestedProperty(target, entry.propertyPath, resolvedValue);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _resolveTarget(manager: OverrideManager, key: string, targetType: OverrideTargetType, targetName: string): object | null {
    const scene = manager.scene;

    // Scene-level overrides target the scene itself
    if (targetType === "scene") {
        return scene as unknown as object;
    }

    const sam = GetSmartAssetManagerFromScene(scene);

    // Empty key = in-tool-created object (not from a smart asset) — look up by name directly
    if (key === "") {
        return _findObjectByName(scene, sam, targetType, targetName, key);
    }

    // Without a SAM, only scene-level / empty-key lookups are possible.
    if (!sam) {
        return null;
    }

    // Verify the key is registered before attempting to resolve.
    if (ResolveSmartAsset(sam, key) === undefined) {
        return null;
    }

    return _findObjectByName(scene, sam, targetType, targetName, key);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _findObjectByName(scene: Scene, sam: SmartAssetManager | undefined, targetType: OverrideTargetType, name: string, key: string): object | null {
    const collections: Record<string, unknown[]> = {
        meshes: scene.meshes,
        materials: scene.materials,
        textures: scene.textures,
        lights: scene.lights,
        cameras: scene.cameras,
        animationGroups: scene.animationGroups,
    };

    const collection = collections[targetType];
    if (!collection) {
        return null;
    }

    return (
        (collection.find((obj: any) => {
            if (obj.name !== name) {
                return false;
            }
            const trackedKey = sam ? FindSmartAssetKeyForObject(sam, obj) : undefined;
            return key === "" ? trackedKey === undefined : trackedKey === key;
        }) as object) ?? null
    );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _resolveValue(manager: OverrideManager, value: OverrideValue): unknown {
    // String references: "ref:materialName" or "texture:smartAssetKey"
    if (typeof value === "string") {
        if (value.startsWith("ref:")) {
            const refName = value.substring(4);
            return _resolveObjectReference(manager.scene, refName);
        }
        if (value.startsWith("texture:")) {
            const textureKey = value.substring(8);
            return _resolveTextureReference(manager.scene, textureKey);
        }
    }

    // Number arrays are passed through as-is. _setNestedProperty will use
    // the live target's `fromArray` method (Vector3, Color3, etc.) to push
    // values in-place, preserving the math instance identity.
    return value;
}

/**
 * Resolves a "ref:name" value by looking up a material, light, or camera
 * in the scene by name.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _resolveObjectReference(scene: Scene, name: string): unknown {
    const mat = scene.materials.find((m) => m.name === name);
    if (mat) {
        return mat;
    }
    const light = scene.lights.find((l) => l.name === name);
    if (light) {
        return light;
    }
    const camera = scene.cameras.find((c) => c.name === name);
    if (camera) {
        return camera;
    }
    Logger.Warn(`OverrideManager: Object reference "${name}" not found in scene.`);
    return undefined;
}

/**
 * Resolves a "texture:key" value by finding a texture loaded by the
 * SmartAssetManager under that key. Falls back to searching scene textures by name.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _resolveTextureReference(scene: Scene, key: string): unknown {
    const sam = GetSmartAssetManagerFromScene(scene);
    if (sam) {
        for (const tex of scene.textures) {
            if (FindSmartAssetKeyForObject(sam, tex) === key) {
                return tex;
            }
        }
    }
    const tex = scene.textures.find((t) => t.name === key);
    if (tex) {
        return tex;
    }
    Logger.Warn(`OverrideManager: Texture reference "${key}" not found.`);
    return undefined;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _findOverrideIndex(internal: OverrideManagerInternals, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): number {
    return internal.overrides.findIndex((o) => o.key === key && o.targetType === targetType && o.targetName === targetName && o.propertyPath === propertyPath);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function _removeMatchingOverride(internal: OverrideManagerInternals, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): void {
    const idx = _findOverrideIndex(internal, key, targetType, targetName, propertyPath);
    if (idx >= 0) {
        internal.overrides.splice(idx, 1);
    }
}

/**
 * Creates a unique key for storing original values.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _makeOriginalValueKey(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): string {
    return `${key}::${targetType}::${targetName}::${propertyPath}`;
}

/**
 * Gets a nested property from an object using a dot-separated path.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _getNestedProperty(obj: object, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== "object") {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }

    return current;
}

/**
 * Sets a nested property on an object using a dot-separated path.
 *
 * When the value is a number array and the existing property is a Babylon
 * math type (Vector*, Quaternion, Color3/4, Matrix), uses the math type's
 * `fromArray` method to mutate it in place — preserving the live instance
 * identity that consumers may already hold references to. Otherwise falls
 * back to direct property replacement.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _setNestedProperty(obj: object, path: string, value: unknown): void {
    const parts = path.split(".");
    let current: unknown = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        if (current === null || current === undefined || typeof current !== "object") {
            return;
        }
        current = (current as Record<string, unknown>)[parts[i]];
    }

    if (current === null || current === undefined || typeof current !== "object") {
        return;
    }

    const lastPart = parts[parts.length - 1];
    const existing = (current as Record<string, unknown>)[lastPart];

    if (Array.isArray(value) && existing && typeof existing === "object" && typeof (existing as any).fromArray === "function") {
        (existing as any).fromArray(value);
        return;
    }

    (current as Record<string, unknown>)[lastPart] = value;
}

/**
 * Snapshots a value for original-value tracking.
 *
 * Scene entities (textures, materials, meshes, etc.) are stored by reference
 * because cloning them would register unwanted duplicates in the scene.
 * Plain math types (Vector3, Color3, etc.) are cloned so mutations to the
 * live object don't corrupt the saved original.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _cloneValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }
    if (typeof value !== "object") {
        return value;
    }
    if (typeof (value as any).getScene === "function") {
        return value;
    }
    if ("clone" in (value as object) && typeof (value as any).clone === "function") {
        return (value as any).clone();
    }
    return { ...value };
}
