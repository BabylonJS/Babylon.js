import { type Scene } from "../scene";
import { type SmartAssetManager } from "./smartAssetManager";
import { type IOverrideEntry, type OverrideTargetType, type OverrideValue } from "./overrideEntry";
import { Logger } from "../Misc/logger";

const OVERRIDE_MANAGER_KEY = Symbol.for("babylonjs:overrideManager");

/**
 * Manages property overrides for smart assets and scene objects.
 *
 * Overrides are property diffs applied after an asset is loaded. They persist
 * across reloads and are stored alongside the asset map in the project file.
 *
 * The override manager is host-agnostic — it works with any Babylon Scene
 * without requiring Inspector, Playground, or any specific host environment.
 *
 * @example
 * ```typescript
 * const sam = new SmartAssetManager(scene);
 * const overrides = new OverrideManager(scene);
 * overrides.linkSmartAssetManager(sam);
 *
 * // Add an override: set the material named "canPaint" from key "sodaCan" to red
 * overrides.addOverride({
 *     key: "sodaCan",
 *     targetType: "materials",
 *     targetName: "canPaint",
 *     propertyPath: "albedoColor",
 *     value: [1, 0, 0],
 * });
 * ```
 */
export class OverrideManager {
    private _scene: Scene;
    private _smartAssetManager: SmartAssetManager | null = null;
    private _overrides: IOverrideEntry[] = [];
    private _originalValues: Map<string, unknown> = new Map();

    /**
     * Creates a new OverrideManager and attaches it to the scene.
     * @param scene - The scene this manager operates on.
     */
    constructor(scene: Scene) {
        this._scene = scene;
        if (!scene.metadata) {
            scene.metadata = {};
        }
        scene.metadata[OVERRIDE_MANAGER_KEY] = this;
    }

    /**
     * The scene this manager operates on.
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Returns the OverrideManager attached to a scene, or undefined if none exists.
     * @param scene - The scene to look up.
     * @returns The OverrideManager, or undefined.
     */
    public static GetFromScene(scene: Scene): OverrideManager | undefined {
        return scene.metadata?.[OVERRIDE_MANAGER_KEY] as OverrideManager | undefined;
    }

    /**
     * Links a SmartAssetManager so overrides are automatically reapplied
     * after smart asset reloads.
     * @param manager - The SmartAssetManager to link.
     */
    public linkSmartAssetManager(manager: SmartAssetManager): void {
        this._smartAssetManager = manager;
        manager.linkOverrideManager(this);
    }

    // ── Override CRUD ──

    /**
     * Adds an override entry and immediately applies it if the target is loaded.
     * If an override with the same key/target/property already exists, it is replaced.
     * @param entry - The override to add.
     * @param skipApply - If true, records the override without applying it immediately.
     *                    Use this when the value has already been set (e.g., by Inspector).
     */
    public addOverride(entry: IOverrideEntry, skipApply: boolean = false): void {
        // Remove existing override for same target+property
        this._removeMatchingOverride(entry.key, entry.targetType, entry.targetName, entry.propertyPath);
        this._overrides.push(entry);
        if (!skipApply) {
            this._applyOverride(entry);
        }
    }

    /**
     * Removes an override by matching key, target, and property path.
     * Restores the original value if one was captured.
     * @param key - The smart asset key.
     * @param targetType - The target type.
     * @param targetName - The target object name.
     * @param propertyPath - The property path to un-override.
     * @returns True if an override was removed.
     */
    public removeOverride(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): boolean {
        const idx = this._findOverrideIndex(key, targetType, targetName, propertyPath);
        if (idx < 0) {
            return false;
        }

        this._overrides.splice(idx, 1);

        // Restore original value
        const origKey = _makeOriginalValueKey(key, targetType, targetName, propertyPath);
        const original = this._originalValues.get(origKey);
        if (original !== undefined) {
            const target = this._resolveTarget(key, targetType, targetName);
            if (target) {
                _setNestedProperty(target, propertyPath, original);
            }
            this._originalValues.delete(origKey);
        }

        return true;
    }

    /**
     * Returns all overrides, optionally filtered by key.
     * @param key - If provided, returns only overrides for this key.
     * @returns A read-only array of override entries.
     */
    public getOverrides(key?: string): readonly IOverrideEntry[] {
        if (key !== undefined) {
            return this._overrides.filter((o) => o.key === key);
        }
        return this._overrides;
    }

    /**
     * Removes all overrides, optionally restoring original values.
     * @param restoreOriginals - If true, restores all captured original values.
     */
    public clearOverrides(restoreOriginals: boolean = false): void {
        if (restoreOriginals) {
            for (const entry of [...this._overrides]) {
                this.removeOverride(entry.key, entry.targetType, entry.targetName, entry.propertyPath);
            }
        } else {
            this._overrides.length = 0;
            this._originalValues.clear();
        }
    }

    // ── Application ──

    /**
     * Applies all overrides for a specific smart asset key.
     * Called automatically by SmartAssetManager after a reload.
     * @param key - The smart asset key to apply overrides for.
     */
    public applyOverridesForKey(key: string): void {
        for (const entry of this._overrides) {
            if (entry.key === key) {
                this._applyOverride(entry);
            }
        }
    }

    /**
     * Applies all overrides (all keys + scene-level).
     */
    public applyAllOverrides(): void {
        for (const entry of this._overrides) {
            this._applyOverride(entry);
        }
    }

    // ── Serialization ──

    /**
     * Serializes all overrides to a JSON-compatible array.
     * The on-disk shape is identical to the in-memory `IOverrideEntry`.
     * @returns An array of override entries (shallow copies).
     */
    public serialize(): IOverrideEntry[] {
        return this._overrides.map((o) => ({ ...o }));
    }

    /**
     * Loads overrides from a serialized array and applies them.
     * @param data - Array of override entries.
     */
    public deserializeAndApply(data: IOverrideEntry[]): void {
        if (!Array.isArray(data)) {
            throw new Error("OverrideManager: Expected an array of override entries.");
        }

        for (const entry of data) {
            if (entry.key === undefined || !entry.targetType || entry.targetName === undefined || !entry.propertyPath || entry.value === undefined) {
                Logger.Warn("OverrideManager: Skipping invalid override entry.");
                continue;
            }
            this.addOverride(entry);
        }
    }

    // ── Lifecycle ──

    /**
     * Disposes the override manager, clearing all overrides and references.
     */
    public dispose(): void {
        this._overrides.length = 0;
        this._originalValues.clear();
        this._smartAssetManager = null;
        if (this._scene.metadata) {
            delete this._scene.metadata[OVERRIDE_MANAGER_KEY];
        }
    }

    // ── Private ──

    private _applyOverride(entry: IOverrideEntry): void {
        const target = this._resolveTarget(entry.key, entry.targetType, entry.targetName);
        if (!target) {
            Logger.Warn(
                `OverrideManager._applyOverride: target not found for key="${entry.key}" type="${entry.targetType}" name="${entry.targetName}" prop="${entry.propertyPath}"`
            );
            return; // Target not loaded yet — override will be applied on next load
        }

        // Capture original value before first override
        const origKey = _makeOriginalValueKey(entry.key, entry.targetType, entry.targetName, entry.propertyPath);
        if (!this._originalValues.has(origKey)) {
            const currentValue = _getNestedProperty(target, entry.propertyPath);
            if (currentValue !== undefined) {
                this._originalValues.set(origKey, _cloneValue(currentValue));
            }
        }

        // Resolve and apply the value
        const resolvedValue = this._resolveValue(entry.value, entry.propertyPath, target);
        _setNestedProperty(target, entry.propertyPath, resolvedValue);
    }

    private _resolveTarget(key: string, targetType: OverrideTargetType, targetName: string): object | null {
        // Scene-level overrides target the scene itself
        if (targetType === "scene") {
            return this._scene as unknown as object;
        }

        if (!this._smartAssetManager) {
            return null;
        }

        // Empty key = in-tool-created object (not from a smart asset) — look up by name directly
        if (key === "") {
            return this._findObjectByName(targetType, targetName, key);
        }

        // Get the container for this key by querying provenance
        const provenance = this._smartAssetManager.getProvenance(key);
        if (!provenance) {
            return null;
        }

        // Look up the object in the scene by name, scoped to what this key loaded
        return this._findObjectByName(targetType, targetName, key);
    }

    private _findObjectByName(targetType: OverrideTargetType, name: string, _key: string): object | null {
        // Search in the scene's collections — provenance ensures we know the name came from this key
        const collections: Record<string, unknown[]> = {
            meshes: this._scene.meshes,
            materials: this._scene.materials,
            textures: this._scene.textures,
            lights: this._scene.lights,
            cameras: this._scene.cameras,
            animationGroups: this._scene.animationGroups,
        };

        const collection = collections[targetType];
        if (!collection) {
            return null;
        }

        return (collection.find((obj: any) => obj.name === name) as object) ?? null;
    }

    private _resolveValue(value: OverrideValue, _propertyPath: string, _target: object): unknown {
        // String references: "ref:materialName" or "texture:smartAssetKey"
        if (typeof value === "string") {
            if (value.startsWith("ref:")) {
                const refName = value.substring(4);
                return this._resolveObjectReference(refName);
            }
            if (value.startsWith("texture:")) {
                const textureKey = value.substring(8);
                return this._resolveTextureReference(textureKey);
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
     * @param name - The name of the object to look up.
     * @returns The resolved object, or undefined if not found.
     */
    private _resolveObjectReference(name: string): unknown {
        const mat = this._scene.materials.find((m) => m.name === name);
        if (mat) {
            return mat;
        }
        const light = this._scene.lights.find((l) => l.name === name);
        if (light) {
            return light;
        }
        const camera = this._scene.cameras.find((c) => c.name === name);
        if (camera) {
            return camera;
        }
        Logger.Warn(`OverrideManager: Object reference "${name}" not found in scene.`);
        return undefined;
    }

    /**
     * Resolves a "texture:key" value by finding a texture loaded by the
     * SmartAssetManager under that key. Falls back to searching scene
     * textures by name.
     * @param key - The smart asset key for the texture.
     * @returns The resolved texture, or undefined if not found.
     */
    private _resolveTextureReference(key: string): unknown {
        // First try: find a texture tracked by the smart asset manager
        if (this._smartAssetManager) {
            for (const tex of this._scene.textures) {
                const trackedKey = this._smartAssetManager.findKeyForObject(tex);
                if (trackedKey === key) {
                    return tex;
                }
            }
        }
        // Fallback: find by name in scene textures
        const tex = this._scene.textures.find((t) => t.name === key);
        if (tex) {
            return tex;
        }
        Logger.Warn(`OverrideManager: Texture reference "${key}" not found.`);
        return undefined;
    }

    private _findOverrideIndex(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): number {
        return this._overrides.findIndex((o) => o.key === key && o.targetType === targetType && o.targetName === targetName && o.propertyPath === propertyPath);
    }

    private _removeMatchingOverride(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): void {
        const idx = this._findOverrideIndex(key, targetType, targetName, propertyPath);
        if (idx >= 0) {
            this._overrides.splice(idx, 1);
        }
    }
}

/**
 * Creates a unique key for storing original values.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path.
 * @returns A unique string key.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _makeOriginalValueKey(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): string {
    return `${key}::${targetType}::${targetName}::${propertyPath}`;
}

/**
 * Gets a nested property from an object using a dot-separated path.
 * @param obj - The object to read from.
 * @param path - Dot-separated property path (e.g. "albedoColor.r").
 * @returns The value at the path, or undefined if not found.
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
 * @param obj - The object to write to.
 * @param path - Dot-separated property path (e.g. "albedoColor").
 * @param value - The value to set.
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

    // If both sides look like Babylon math types, mutate in place via fromArray
    // so the live instance identity is preserved.
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
 * @returns A clone for math types, or the original reference for scene entities.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _cloneValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }
    if (typeof value !== "object") {
        return value;
    }
    // Scene entities (textures, materials, meshes, etc.) — store the reference,
    // never clone, because cloning registers duplicates in the scene.
    if (typeof (value as any).getScene === "function") {
        return value;
    }
    // Clone plain math types (Color3, Vector3, Quaternion, etc.)
    if ("clone" in (value as object) && typeof (value as any).clone === "function") {
        return (value as any).clone();
    }
    // Fallback: shallow copy
    return { ...value };
}
