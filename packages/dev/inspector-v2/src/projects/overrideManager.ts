import { type Scene } from "core/scene";
import { Observable, type Observer } from "core/Misc/observable";
import { Logger } from "core/Misc/logger";
import { type IOverrideEntry, type OverrideTargetType, type OverrideValue } from "./overrideEntry";
import { FindSmartAssetKeyForObject, type SmartAssetManager } from "core/SmartAssets/smartAssetManager";

const OverrideManagerKey = Symbol.for("babylonjs:overrideManager");

// Mirror of the symbol used by smartAssetManager.ts. Read-only peek so the
// override system can use SAM tracking when one is present, without forcing
// SAM creation on scenes that don't have one yet.
const SmartAssetManagerKey = Symbol.for("babylonjs:smartAssetManager");

/**
 * Stateful handle for a scene's property override registry.
 *
 * Override behavior is exposed through module-level functions rather than
 * class methods so callers can import only the operations they need.
 *
 * Overrides are property diffs applied to scene objects. They persist across
 * reloads and are typically saved alongside a project file.
 *
 * The override manager is independent of {@link SmartAssetManager} — it works
 * with any Babylon Scene. When a SmartAssetManager is also attached to the
 * scene, overrides may target objects loaded by a specific smart asset key.
 *
 * @example
 * ```typescript
 * const overrides = GetOverrideManager(scene);
 *
 * // Set the material named "canPaint" from key "sodaCan" to red
 * AddOverride(scene, {
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

    /**
     * Fires whenever the override registry or applied state changes.
     */
    readonly onChangedObservable: Observable<void>;
};

type OverrideManagerInternals = {
    overrides: IOverrideEntry[];
    originalValues: Map<string, unknown>;
    sceneDisposeObserver: ReturnType<Scene["onDisposeObservable"]["add"]> | null;
};

const OverrideManagerInternals = new WeakMap<OverrideManager, OverrideManagerInternals>();
const OnOverrideManagerCreatedObservable = new Observable<OverrideManager>();

/**
 * Creates a new OverrideManager state object and attaches it to the scene.
 *
 * Internal: callers should use {@link GetOverrideManager} which returns the
 * existing manager when one is already attached.
 * @param scene - The scene this manager operates on.
 * @returns The created override manager state.
 */
function CreateOverrideManager(scene: Scene): OverrideManager {
    const manager: OverrideManager = {
        scene,
        onChangedObservable: new Observable<void>(),
    };

    const internal: OverrideManagerInternals = {
        overrides: [],
        originalValues: new Map(),
        sceneDisposeObserver: null,
    };
    OverrideManagerInternals.set(manager, internal);

    if (!scene.metadata) {
        scene.metadata = {};
    }
    scene.metadata[OverrideManagerKey] = manager;

    // Auto-dispose when the scene is disposed so the manager doesn't outlive it.
    internal.sceneDisposeObserver = scene.onDisposeObservable.add(() => DisposeOverrideManager(manager));

    OnOverrideManagerCreatedObservable.notifyObservers(manager);

    return manager;
}

/**
 * Returns the OverrideManager attached to the given scene, creating and
 * attaching one if none exists.
 * @param scene - The scene to look up or attach a manager to.
 * @returns The existing or newly created OverrideManager.
 */
export function GetOverrideManager(scene: Scene): OverrideManager {
    const existing = scene.metadata?.[OverrideManagerKey] as OverrideManager | undefined;
    if (existing) {
        return existing;
    }
    return CreateOverrideManager(scene);
}

/**
 * Adds an observer that is notified whenever an OverrideManager is created.
 * @param callback - The callback to invoke with each newly created manager.
 * @returns The observer registration.
 */
export function AddOverrideManagerCreatedObserver(callback: (manager: OverrideManager) => void): Observer<OverrideManager> {
    // Wrap so the EventState second-arg from Observable.add isn't passed through to the caller.
    return OnOverrideManagerCreatedObservable.add((manager) => callback(manager));
}

// ── Override CRUD ──

/**
 * Adds an override entry and immediately applies it if the target is loaded.
 * If an override with the same key/target/property already exists, it is replaced.
 * @param scene - The scene whose override registry to update.
 * @param entry - The override to add.
 * @param skipApply - If true, records the override without applying it immediately.
 *                    Use this when the value has already been set (e.g., by Inspector).
 */
export function AddOverride(scene: Scene, entry: IOverrideEntry, skipApply: boolean = false): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    RemoveMatchingOverride(internal, entry.key, entry.targetType, entry.targetName, entry.propertyPath);
    internal.overrides.push(entry);
    if (!skipApply) {
        ApplyOverrideEntry(manager, internal, entry);
    }
    manager.onChangedObservable.notifyObservers();
}

/**
 * Removes an override by matching key, target, and property path.
 * Restores the original value if one was captured.
 * @param scene - The scene whose override registry to update.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path to un-override.
 * @returns True if an override was removed.
 */
export function RemoveOverride(scene: Scene, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): boolean {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    const idx = FindOverrideIndex(internal, key, targetType, targetName, propertyPath);
    if (idx < 0) {
        return false;
    }

    internal.overrides.splice(idx, 1);

    const origKey = MakeOriginalValueKey(key, targetType, targetName, propertyPath);
    const original = internal.originalValues.get(origKey);
    if (original !== undefined) {
        const target = ResolveTarget(manager, key, targetType, targetName);
        if (target) {
            SetNestedProperty(target, propertyPath, original);
        }
        internal.originalValues.delete(origKey);
    }

    manager.onChangedObservable.notifyObservers();
    return true;
}

/**
 * Returns all overrides, optionally filtered by key.
 * @param scene - The scene whose override registry to read.
 * @param key - If provided, returns only overrides for this key.
 * @returns A read-only array of override entries.
 */
export function GetOverrides(scene: Scene, key?: string): readonly IOverrideEntry[] {
    const internal = GetOverrideInternals(GetOverrideManager(scene));
    if (key !== undefined) {
        return internal.overrides.filter((o) => o.key === key);
    }
    return internal.overrides;
}

/**
 * Removes all overrides, optionally restoring original values.
 * @param scene - The scene whose override registry to clear.
 * @param restoreOriginals - If true, restores all captured original values.
 */
export function ClearOverrides(scene: Scene, restoreOriginals: boolean = false): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    if (restoreOriginals) {
        for (const entry of [...internal.overrides]) {
            RemoveOverride(scene, entry.key, entry.targetType, entry.targetName, entry.propertyPath);
        }
        return;
    }

    internal.overrides.length = 0;
    internal.originalValues.clear();
    manager.onChangedObservable.notifyObservers();
}

/**
 * Updates the targetName on all overrides that match a given key, type, and old name.
 * Use this when an entity is renamed so existing overrides follow the new name.
 * @param scene - The scene whose override registry to update.
 * @param key - The smart asset key.
 * @param targetType - The target type (meshes, materials, etc.).
 * @param oldName - The old entity name.
 * @param newName - The new entity name.
 */
export function RenameOverrideTarget(scene: Scene, key: string, targetType: OverrideTargetType, oldName: string, newName: string): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    let changed = false;
    for (const entry of internal.overrides) {
        if (entry.key === key && entry.targetType === targetType && entry.targetName === oldName) {
            (entry as { targetName: string }).targetName = newName;
            changed = true;
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

    if (changed) {
        manager.onChangedObservable.notifyObservers();
    }
}

// ── Application ──

/**
 * Applies all overrides for a specific smart asset key.
 *
 * Call this after reloading a smart asset so persisted overrides reapply to
 * the freshly loaded objects. The override manager does not auto-subscribe to
 * smart asset changes — coordination is the caller's responsibility, which
 * keeps the two systems independent.
 * @param scene - The scene whose overrides to apply.
 * @param key - The smart asset key to apply overrides for.
 */
export function ApplyOverridesForKey(scene: Scene, key: string): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);
    for (const entry of internal.overrides) {
        if (entry.key === key) {
            ApplyOverrideEntry(manager, internal, entry);
        }
    }
}

/**
 * Applies all overrides (all keys + scene-level).
 * @param scene - The scene whose overrides to apply.
 */
export function ApplyAllOverrides(scene: Scene): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);
    for (const entry of internal.overrides) {
        ApplyOverrideEntry(manager, internal, entry);
    }
}

// ── Serialization ──

/**
 * Serializes all overrides to a JSON-compatible array.
 * The on-disk shape is identical to the in-memory `IOverrideEntry`.
 * @param scene - The scene whose overrides to serialize.
 * @returns An array of override entries (shallow copies).
 */
export function SerializeOverrides(scene: Scene): IOverrideEntry[] {
    const internal = GetOverrideInternals(GetOverrideManager(scene));
    return internal.overrides.map((o) => ({ ...o }));
}

/**
 * Loads overrides from a serialized array and applies them.
 * @param scene - The scene whose override registry to populate.
 * @param data - Array of override entries.
 */
export function DeserializeAndApplyOverrides(scene: Scene, data: IOverrideEntry[]): void {
    if (!Array.isArray(data)) {
        throw new Error("OverrideManager: Expected an array of override entries.");
    }

    for (const entry of data) {
        if (entry.key === undefined || !entry.targetType || entry.targetName === undefined || !entry.propertyPath || entry.value === undefined) {
            Logger.Warn("OverrideManager: Skipping invalid override entry.");
            continue;
        }
        AddOverride(scene, entry);
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

    internal.overrides.length = 0;
    internal.originalValues.clear();

    manager.onChangedObservable.clear();

    if (manager.scene.metadata) {
        delete manager.scene.metadata[OverrideManagerKey];
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

/**
 * Reads the SmartAssetManager attached to the scene, if any, without creating
 * one. Used by target/texture resolution so overrides can take advantage of
 * SAM-tracked ownership when present, while keeping the two systems
 * independent (no auto-create, no observable subscription).
 * @param scene - The scene to inspect.
 * @returns The attached SmartAssetManager, or undefined if none is attached.
 */
function PeekSmartAssetManager(scene: Scene): SmartAssetManager | undefined {
    return scene.metadata?.[SmartAssetManagerKey] as SmartAssetManager | undefined;
}

/**
 * Applies a single override entry to its target, capturing the original value
 * on the first application so {@link RemoveOverride} can restore it later.
 * @param manager - The override manager owning the entry.
 * @param internal - The manager's internal state.
 * @param entry - The override to apply.
 */
function ApplyOverrideEntry(manager: OverrideManager, internal: OverrideManagerInternals, entry: IOverrideEntry): void {
    const target = ResolveTarget(manager, entry.key, entry.targetType, entry.targetName);
    if (!target) {
        Logger.Warn(
            `OverrideManager.ApplyOverrideEntry: target not found for key="${entry.key}" type="${entry.targetType}" name="${entry.targetName}" prop="${entry.propertyPath}"`
        );
        return; // Target not loaded yet — override will be applied on next load
    }

    // Capture original value before first override
    const origKey = MakeOriginalValueKey(entry.key, entry.targetType, entry.targetName, entry.propertyPath);
    if (!internal.originalValues.has(origKey)) {
        const currentValue = GetNestedProperty(target, entry.propertyPath);
        if (currentValue !== undefined) {
            internal.originalValues.set(origKey, CloneValue(currentValue));
        }
    }

    const resolvedValue = ResolveOverrideValue(manager, entry.value);
    SetNestedProperty(target, entry.propertyPath, resolvedValue);
}

/**
 * Locates a scene object by override entry coordinates. When a SmartAssetManager
 * is attached, ownership is checked via {@link FindSmartAssetKeyForObject}. When
 * no SAM exists, only empty-key (in-tool) overrides can be resolved.
 * @param manager - The override manager owning the lookup scene.
 * @param key - The smart asset key, or "" for in-tool/scene-level objects.
 * @param targetType - The override target type (meshes, materials, etc.).
 * @param targetName - The target object name.
 * @returns The matching scene object, or null if not found.
 */
function ResolveTarget(manager: OverrideManager, key: string, targetType: OverrideTargetType, targetName: string): object | null {
    const scene = manager.scene;

    // Scene-level overrides target the scene itself
    if (targetType === "scene") {
        return scene as unknown as object;
    }

    const sam = PeekSmartAssetManager(scene);

    // Empty key = in-tool-created object (not from a smart asset) — look up by name directly
    if (key === "") {
        return FindObjectByName(scene, sam, targetType, targetName, key);
    }

    // Without a SAM, only scene-level / empty-key lookups are possible.
    if (!sam) {
        return null;
    }

    return FindObjectByName(scene, sam, targetType, targetName, key);
}

/**
 * Finds a scene object by name, optionally requiring it be tracked by a
 * specific smart asset key.
 * @param scene - The scene to search.
 * @param sam - The attached SmartAssetManager, or undefined for scene-only lookup.
 * @param targetType - The collection to search.
 * @param name - The object name to match.
 * @param key - The smart asset key required ("" for objects not tracked by any key).
 * @returns The matching object, or null if none found.
 */
function FindObjectByName(scene: Scene, sam: SmartAssetManager | undefined, targetType: OverrideTargetType, name: string, key: string): object | null {
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
            const trackedKey = sam ? FindSmartAssetKeyForObject(sam.scene, obj) : undefined;
            return key === "" ? trackedKey === undefined : trackedKey === key;
        }) as object) ?? null
    );
}

/**
 * Resolves an override value, expanding string references like "ref:name" or
 * "texture:key" into the actual scene object they refer to.
 * @param manager - The override manager (used for scene access).
 * @param value - The serialized override value.
 * @returns The runtime value to assign to the target property.
 */
function ResolveOverrideValue(manager: OverrideManager, value: OverrideValue): unknown {
    // String references: "ref:materialName" or "texture:smartAssetKey"
    if (typeof value === "string") {
        if (value.startsWith("ref:")) {
            const refName = value.substring(4);
            return ResolveObjectReference(manager.scene, refName);
        }
        if (value.startsWith("texture:")) {
            const textureKey = value.substring(8);
            return ResolveTextureReference(manager.scene, textureKey);
        }
    }

    // Number arrays are passed through as-is. SetNestedProperty will use
    // the live target's `fromArray` method (Vector3, Color3, etc.) to push
    // values in-place, preserving the math instance identity.
    return value;
}

/**
 * Resolves a "ref:name" value by looking up a material, light, or camera
 * in the scene by name.
 * @param scene - The scene to search.
 * @param name - The object name to resolve.
 * @returns The matching material, light, or camera, or undefined if not found.
 */
function ResolveObjectReference(scene: Scene, name: string): unknown {
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
 * @param scene - The scene to search.
 * @param key - The smart asset key, or texture name fallback.
 * @returns The matching texture, or undefined if not found.
 */
function ResolveTextureReference(scene: Scene, key: string): unknown {
    const sam = PeekSmartAssetManager(scene);
    if (sam) {
        for (const tex of scene.textures) {
            if (FindSmartAssetKeyForObject(sam.scene, tex) === key) {
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

/**
 * Finds the index of an override matching the given coordinates.
 * @param internal - The manager's internal state.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path.
 * @returns The matching index, or -1 if none found.
 */
function FindOverrideIndex(internal: OverrideManagerInternals, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): number {
    return internal.overrides.findIndex((o) => o.key === key && o.targetType === targetType && o.targetName === targetName && o.propertyPath === propertyPath);
}

/**
 * Removes any existing override that matches the given coordinates. Used by
 * {@link AddOverride} to enforce one entry per (key, target, property).
 * @param internal - The manager's internal state.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path.
 */
function RemoveMatchingOverride(internal: OverrideManagerInternals, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): void {
    const idx = FindOverrideIndex(internal, key, targetType, targetName, propertyPath);
    if (idx >= 0) {
        internal.overrides.splice(idx, 1);
    }
}

/**
 * Creates a unique key for storing original values.
 * @param key - The smart asset key.
 * @param targetType - The override target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path.
 * @returns A composite string key uniquely identifying the original value slot.
 */
function MakeOriginalValueKey(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): string {
    return `${key}::${targetType}::${targetName}::${propertyPath}`;
}

/**
 * Gets a nested property from an object using a dot-separated path.
 * @param obj - The root object to traverse.
 * @param path - The dot-separated property path.
 * @returns The value at the path, or undefined if any segment is missing.
 */
function GetNestedProperty(obj: object, path: string): unknown {
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
 * @param obj - The root object to mutate.
 * @param path - The dot-separated property path.
 * @param value - The new value to assign.
 */
function SetNestedProperty(obj: object, path: string, value: unknown): void {
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
 * @param value - The value to snapshot.
 * @returns The snapshot value (cloned for plain math types, by reference for entities).
 */
function CloneValue(value: unknown): unknown {
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
