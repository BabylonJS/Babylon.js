import { type Scene } from "core/scene";
import { Observable, type Observer } from "core/Misc/observable";
import { Logger } from "core/Misc/logger";
import { FindSmartAssetKeyForObject } from "core/SmartAssets/smartAssetManager";
import { type IOverrideEntry, type OverrideTargetType, type OverrideValue } from "./overrideEntry";

const OverrideManagerKey = Symbol("babylonjs:overrideManager");

/**
 * Stateful handle for a scene's property override registry.
 *
 * Override behavior is exposed through module-level functions rather than
 * class methods so callers can import only the operations they need.
 *
 * Overrides are property diffs applied to scene objects identified by name.
 * They persist across reloads and are typically saved alongside a project
 * file. The override manager is fully independent of any other scene
 * subsystem (SmartAssetManager, loaders, etc.) — it works with any object
 * in the scene's standard collections (meshes, materials, lights, …)
 * regardless of how that object was created.
 *
 * When multiple objects share a name (e.g. two materials both called
 * "Default" loaded from different glTFs), {@link IOverrideEntry.targetIndex}
 * disambiguates: it stores the object's position among same-named siblings
 * at capture time and is used to pick the correct one at apply time.
 *
 * @example
 * ```typescript
 * AddOverride(scene, {
 *     targetType: "materials",
 *     targetName: "canPaint",
 *     targetIndex: 0,
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
    return OnOverrideManagerCreatedObservable.add((manager) => callback(manager));
}

// ── Override CRUD ──

/**
 * Options for {@link AddOverride}.
 */
export type AddOverrideOptions = {
    /**
     * If the `originalValue` field is present, the override is recorded *without*
     * re-applying it (the caller is presumed to have already mutated the entity)
     * and the field's content is captured as the property's pre-override
     * "original" so {@link RemoveOverride} can restore it later.
     *
     * Inspector-driven edits use this: by the time `onPropertyChanged` fires,
     * the binding has already written the new value, but it still has the prior
     * value in hand. Without this seeding path, an override created via
     * Inspector could never be reverted (the manager would have no record of
     * the pre-edit value).
     *
     * If the field is absent, the override is applied normally and the original
     * is captured by reading the property's current value on first apply.
     */
    readonly originalValue?: unknown;
};

/**
 * Adds an override entry and immediately applies it.
 * If an override with the same target coordinates already exists, it is replaced.
 *
 * When the caller has already mutated the target (e.g. an Inspector edit),
 * pass `{ originalValue }` containing the property's prior value — this seeds
 * the original-value map (so {@link RemoveOverride} can restore it) and skips
 * the redundant apply step.
 * @param scene - The scene whose override registry to update.
 * @param entry - The override to add.
 * @param options - Optional behavior modifiers; see {@link AddOverrideOptions}.
 */
export function AddOverride(scene: Scene, entry: IOverrideEntry, options?: AddOverrideOptions): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    RemoveMatchingOverride(internal, entry.targetType, entry.targetName, entry.targetIndex, entry.propertyPath);
    internal.overrides.push(entry);

    if (options && "originalValue" in options) {
        // Caller already applied the new value. Seed the captured original from
        // their pre-edit snapshot — otherwise ApplyOverrideEntry would capture
        // the post-edit value and RemoveOverride would have nothing to restore.
        const origKey = MakeOriginalValueKey(entry.targetType, entry.targetName, entry.targetIndex, entry.propertyPath);
        if (!internal.originalValues.has(origKey)) {
            internal.originalValues.set(origKey, CloneValue(options.originalValue));
        }
    } else {
        ApplyOverrideEntry(manager, internal, entry);
    }

    manager.onChangedObservable.notifyObservers();
}

/**
 * Removes a single override matching the given coordinates. Restores the
 * original value if one was captured.
 * @param scene - The scene whose override registry to update.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param targetIndex - The target index among same-named siblings.
 * @param propertyPath - The property path to un-override.
 * @returns True if an override was removed.
 */
export function RemoveOverride(scene: Scene, targetType: OverrideTargetType, targetName: string, targetIndex: number, propertyPath: string): boolean {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    const idx = FindOverrideIndex(internal, targetType, targetName, targetIndex, propertyPath);
    if (idx < 0) {
        return false;
    }

    internal.overrides.splice(idx, 1);

    const origKey = MakeOriginalValueKey(targetType, targetName, targetIndex, propertyPath);
    const original = internal.originalValues.get(origKey);
    if (original !== undefined) {
        const target = ResolveTarget(manager.scene, targetType, targetName, targetIndex);
        if (target) {
            SetNestedProperty(target, propertyPath, original);
        }
        internal.originalValues.delete(origKey);
    }

    manager.onChangedObservable.notifyObservers();
    return true;
}

/**
 * Returns all overrides currently registered with the scene.
 * @param scene - The scene whose override registry to read.
 * @returns A read-only array of override entries.
 */
export function GetOverrides(scene: Scene): readonly IOverrideEntry[] {
    return GetOverrideInternals(GetOverrideManager(scene)).overrides;
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
        // Snapshot the entries so we can restore each original without firing
        // an onChangedObservable notification per entry; consumers only need
        // one signal that the registry was emptied.
        const entries = [...internal.overrides];
        internal.overrides.length = 0;
        for (const entry of entries) {
            const origKey = MakeOriginalValueKey(entry.targetType, entry.targetName, entry.targetIndex, entry.propertyPath);
            const original = internal.originalValues.get(origKey);
            if (original !== undefined) {
                const target = ResolveTarget(manager.scene, entry.targetType, entry.targetName, entry.targetIndex);
                if (target) {
                    SetNestedProperty(target, entry.propertyPath, original);
                }
            }
        }
        internal.originalValues.clear();
        manager.onChangedObservable.notifyObservers();
        return;
    }

    internal.overrides.length = 0;
    internal.originalValues.clear();
    manager.onChangedObservable.notifyObservers();
}

/**
 * Updates the target coordinates on the override matching a specific (type,
 * old-name, old-index) so it follows an entity rename. Used by capture services
 * to keep overrides attached to a specific object after the user renames it.
 *
 * Only the override at the exact `(targetType, oldName, oldIndex)` slot is
 * updated, so other same-named siblings keep their own overrides untouched.
 *
 * @param scene - The scene whose override registry to update.
 * @param targetType - The target type.
 * @param oldName - The previous name of the renamed entity.
 * @param oldIndex - The previous index of the renamed entity among same-named siblings.
 * @param newName - The new name of the renamed entity.
 * @param newIndex - The new index of the renamed entity among same-named siblings.
 */
export function RenameOverrideTarget(scene: Scene, targetType: OverrideTargetType, oldName: string, oldIndex: number, newName: string, newIndex: number): void {
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    let changed = false;
    for (let i = 0; i < internal.overrides.length; i++) {
        const entry = internal.overrides[i];
        if (entry.targetType === targetType && entry.targetName === oldName && entry.targetIndex === oldIndex) {
            internal.overrides[i] = { ...entry, targetName: newName, targetIndex: newIndex };
            changed = true;
        }
    }

    // Update original-value keys to match the new identity
    const oldPrefix = `${targetType}::${oldName}::${oldIndex}::`;
    const newPrefix = `${targetType}::${newName}::${newIndex}::`;
    for (const [origKey, value] of Array.from(internal.originalValues.entries())) {
        if (origKey.startsWith(oldPrefix)) {
            const propertyPath = origKey.substring(oldPrefix.length);
            internal.originalValues.set(newPrefix + propertyPath, value);
            internal.originalValues.delete(origKey);
        }
    }

    if (changed) {
        manager.onChangedObservable.notifyObservers();
    }
}

/**
 * Rewrites override *values* that reference an entity by name when that entity
 * has been renamed. Mirrors {@link RenameOverrideTarget} but operates on the
 * `value` field rather than the `targetName` field, so overrides whose value
 * is `"ref:oldName"` (material/light/camera references) or `"texture:oldName"`
 * (non-SmartAsset texture references) follow the rename instead of silently
 * pointing at a non-existent entity.
 *
 * SmartAsset texture references (`"samTexture:<key>"`) are unaffected because
 * the SmartAsset key is decoupled from the texture's runtime `name` field.
 *
 * @param scene - The scene whose override registry to update.
 * @param valueScheme - Which encoded-reference prefix to rewrite: `"ref"` for
 * material/light/camera references, `"texture"` for non-SAM textures.
 * @param oldName - The previous name embedded in the reference.
 * @param newName - The new name embedded in the reference.
 */
export function RenameOverrideValueReferences(scene: Scene, valueScheme: "ref" | "texture", oldName: string, newName: string): void {
    if (oldName === newName) {
        return;
    }
    const manager = GetOverrideManager(scene);
    const internal = GetOverrideInternals(manager);

    const oldValue = `${valueScheme}:${oldName}`;
    const newValue = `${valueScheme}:${newName}`;

    let changed = false;
    for (let i = 0; i < internal.overrides.length; i++) {
        const entry = internal.overrides[i];
        if (entry.value === oldValue) {
            internal.overrides[i] = { ...entry, value: newValue };
            changed = true;
        }
    }

    if (changed) {
        manager.onChangedObservable.notifyObservers();
    }
}

// ── Application ──

/**
 * Applies all overrides to their current targets in the scene.
 *
 * Call this after any scene mutation that might have invalidated previously
 * applied state (asset reload, object recreation, project load). The override
 * manager does not auto-subscribe to other scene subsystems — coordination is
 * the caller's responsibility, which keeps the override system independent.
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
        if (!entry.targetType || entry.targetName === undefined || typeof entry.targetIndex !== "number" || !entry.propertyPath || entry.value === undefined) {
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
 * Applies a single override entry to its target, capturing the original value
 * on the first application so {@link RemoveOverride} can restore it later.
 * @param manager - The override manager owning the entry.
 * @param internal - The manager's internal state.
 * @param entry - The override to apply.
 */
function ApplyOverrideEntry(manager: OverrideManager, internal: OverrideManagerInternals, entry: IOverrideEntry): void {
    const target = ResolveTarget(manager.scene, entry.targetType, entry.targetName, entry.targetIndex);
    if (!target) {
        Logger.Warn(`OverrideManager: target not found for type="${entry.targetType}" name="${entry.targetName}" index=${entry.targetIndex} prop="${entry.propertyPath}"`);
        return; // Target not loaded yet — override will be applied on next ApplyAllOverrides
    }

    // Capture original value before first override
    const origKey = MakeOriginalValueKey(entry.targetType, entry.targetName, entry.targetIndex, entry.propertyPath);
    if (!internal.originalValues.has(origKey)) {
        const currentValue = GetNestedProperty(target, entry.propertyPath);
        if (currentValue !== undefined) {
            internal.originalValues.set(origKey, CloneValue(currentValue));
        }
    }

    const resolvedValue = ResolveOverrideValue(manager.scene, entry.value);
    SetNestedProperty(target, entry.propertyPath, resolvedValue);
}

/**
 * Locates a scene object by (targetType, targetName, targetIndex). The scene
 * collection is filtered to objects matching `targetName`; the N-th survivor
 * (per `targetIndex`) is returned. Falls back to the first match if the index
 * is out of range — useful when the scene shape has changed since capture.
 * @param scene - The scene to search.
 * @param targetType - The override target type.
 * @param targetName - The target object name (or "" for scene-level).
 * @param targetIndex - The target's position among same-named siblings.
 * @returns The matching scene object, or null if not found.
 */
function ResolveTarget(scene: Scene, targetType: OverrideTargetType, targetName: string, targetIndex: number): object | null {
    // Scene-level overrides target the scene itself
    if (targetType === "scene") {
        return scene as unknown as object;
    }

    const collection = GetCollection(scene, targetType);
    if (!collection) {
        return null;
    }

    const matches = collection.filter((obj) => (obj as { name?: string }).name === targetName);
    if (matches.length === 0) {
        return null;
    }
    return (matches[targetIndex] ?? matches[0]) as object;
}

/**
 * Returns the scene collection corresponding to an override target type.
 * @param scene - The scene to inspect.
 * @param targetType - The target type.
 * @returns The collection, or null if the type has no collection.
 */
function GetCollection(scene: Scene, targetType: OverrideTargetType): readonly unknown[] | null {
    switch (targetType) {
        case "meshes":
            return scene.meshes;
        case "materials":
            return scene.materials;
        case "textures":
            return scene.textures;
        case "lights":
            return scene.lights;
        case "cameras":
            return scene.cameras;
        case "animationGroups":
            return scene.animationGroups;
        default:
            return null;
    }
}

/**
 * Resolves an override value, expanding string references like "ref:name",
 * "samTexture:key", or "texture:name" into the actual scene object they refer to.
 * @param scene - The scene used to look up references.
 * @param value - The serialized override value.
 * @returns The runtime value to assign to the target property.
 */
function ResolveOverrideValue(scene: Scene, value: OverrideValue): unknown {
    if (typeof value === "string") {
        if (value.startsWith("ref:")) {
            return ResolveObjectReference(scene, value.substring(4));
        }
        if (value.startsWith("samTexture:")) {
            return ResolveSamTextureReference(scene, value.substring(11));
        }
        if (value.startsWith("texture:")) {
            return ResolveTextureReference(scene, value.substring(8));
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
 * Resolves a "texture:name" value by looking up a texture in the scene by name.
 * @param scene - The scene to search.
 * @param name - The texture name to resolve.
 * @returns The matching texture, or undefined if not found.
 */
function ResolveTextureReference(scene: Scene, name: string): unknown {
    const tex = scene.textures.find((t) => t.name === name);
    if (tex) {
        return tex;
    }
    Logger.Warn(`OverrideManager: Texture reference "${name}" not found.`);
    return undefined;
}

/**
 * Resolves a "samTexture:key" value by looking up a SmartAsset-tracked texture
 * by its registry key. The SAM key is stable across save/load whereas the
 * texture's `name` (for SAM textures, the blob URL) changes on every reload,
 * so this is the only reliable way to round-trip texture references on
 * user-uploaded SmartAsset textures.
 * @param scene - The scene to search.
 * @param key - The SmartAsset key to resolve.
 * @returns The matching texture, or undefined if not found.
 */
function ResolveSamTextureReference(scene: Scene, key: string): unknown {
    const tex = scene.textures.find((t) => FindSmartAssetKeyForObject(scene, t) === key);
    if (tex) {
        return tex;
    }
    Logger.Warn(`OverrideManager: SmartAsset texture "${key}" not found.`);
    return undefined;
}

/**
 * Finds the index of an override matching the given coordinates.
 * @param internal - The manager's internal state.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param targetIndex - The target index among same-named siblings.
 * @param propertyPath - The property path.
 * @returns The matching index, or -1 if none found.
 */
function FindOverrideIndex(internal: OverrideManagerInternals, targetType: OverrideTargetType, targetName: string, targetIndex: number, propertyPath: string): number {
    return internal.overrides.findIndex((o) => o.targetType === targetType && o.targetName === targetName && o.targetIndex === targetIndex && o.propertyPath === propertyPath);
}

/**
 * Removes any existing override that matches the given coordinates. Used by
 * {@link AddOverride} to enforce one entry per (type, name, index, property).
 * @param internal - The manager's internal state.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param targetIndex - The target index among same-named siblings.
 * @param propertyPath - The property path.
 */
function RemoveMatchingOverride(internal: OverrideManagerInternals, targetType: OverrideTargetType, targetName: string, targetIndex: number, propertyPath: string): void {
    const idx = FindOverrideIndex(internal, targetType, targetName, targetIndex, propertyPath);
    if (idx >= 0) {
        internal.overrides.splice(idx, 1);
    }
}

/**
 * Creates a unique key for storing original values.
 * @param targetType - The override target type.
 * @param targetName - The target object name.
 * @param targetIndex - The target index among same-named siblings.
 * @param propertyPath - The property path.
 * @returns A composite string key uniquely identifying the original value slot.
 */
function MakeOriginalValueKey(targetType: OverrideTargetType, targetName: string, targetIndex: number, propertyPath: string): string {
    return `${targetType}::${targetName}::${targetIndex}::${propertyPath}`;
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
