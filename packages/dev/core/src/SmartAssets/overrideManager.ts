import { type Scene } from "../scene";
import { type SmartAssetManager, FindSmartAssetKeyForObject, GetSmartAssetProvenance, LinkSmartAssetOverrideHandlers } from "./smartAssetManager";
import { type IOverrideEntry, type OverrideTargetType, type OverrideValue } from "./overrideEntry";
import { Logger } from "../Misc/logger";

const OVERRIDE_MANAGER_KEY = Symbol.for("babylonjs:overrideManager");

/**
 * Stateful handle for property overrides applied to smart assets and scene objects.
 */
export type OverrideManager = {
    /**
     * The scene this override manager operates on.
     */
    readonly scene: Scene;
};

type OverrideManagerInternals = {
    smartAssetManager: SmartAssetManager | null;
    overrides: IOverrideEntry[];
    originalValues: Map<string, unknown>;
};

const OverrideManagerInternals = new WeakMap<OverrideManager, OverrideManagerInternals>();

/**
 * Creates a new OverrideManager state object and attaches it to the scene.
 * @param scene - The scene this manager operates on.
 * @returns The created override manager state.
 */
export function CreateOverrideManager(scene: Scene): OverrideManager {
    const manager: OverrideManager = { scene };
    OverrideManagerInternals.set(manager, {
        smartAssetManager: null,
        overrides: [],
        originalValues: new Map(),
    });

    if (!scene.metadata) {
        scene.metadata = {};
    }
    scene.metadata[OVERRIDE_MANAGER_KEY] = manager;

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
 * Links a SmartAssetManager so overrides are automatically reapplied after smart asset reloads.
 * @param manager - The override manager state.
 * @param smartAssetManager - The smart asset manager state to link.
 */
export function LinkOverrideManagerSmartAssets(manager: OverrideManager, smartAssetManager: SmartAssetManager): void {
    GetOverrideManagerInternals(manager).smartAssetManager = smartAssetManager;
    LinkSmartAssetOverrideHandlers(smartAssetManager, {
        applyOverridesForKey: (key) => ApplyOverridesForKey(manager, key),
        applyAllOverrides: () => ApplyAllOverrides(manager),
    });
}

/**
 * Adds an override entry and immediately applies it if the target is loaded.
 * @param manager - The override manager state.
 * @param entry - The override to add.
 * @param skipApply - If true, records the override without applying it immediately.
 */
export function AddOverride(manager: OverrideManager, entry: IOverrideEntry, skipApply: boolean = false): void {
    const internal = GetOverrideManagerInternals(manager);
    RemoveMatchingOverride(internal, entry.key, entry.targetType, entry.targetName, entry.propertyPath);
    internal.overrides.push(entry);
    if (!skipApply) {
        ApplyOverride(manager, entry);
    }
}

/**
 * Removes an override by matching key, target, and property path.
 * @param manager - The override manager state.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param targetName - The target object name.
 * @param propertyPath - The property path to un-override.
 * @returns True if an override was removed.
 */
export function RemoveOverride(manager: OverrideManager, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): boolean {
    const internal = GetOverrideManagerInternals(manager);
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

    return true;
}

/**
 * Returns all overrides, optionally filtered by key.
 * @param manager - The override manager state.
 * @param key - If provided, returns only overrides for this key.
 * @returns A read-only array of override entries.
 */
export function GetOverrides(manager: OverrideManager, key?: string): readonly IOverrideEntry[] {
    const overrides = GetOverrideManagerInternals(manager).overrides;
    if (key !== undefined) {
        return overrides.filter((o) => o.key === key);
    }
    return overrides;
}

/**
 * Removes all overrides, optionally restoring original values.
 * @param manager - The override manager state.
 * @param restoreOriginals - If true, restores all captured original values.
 */
export function ClearOverrides(manager: OverrideManager, restoreOriginals: boolean = false): void {
    const internal = GetOverrideManagerInternals(manager);
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
 * @param manager - The override manager state.
 * @param key - The smart asset key.
 * @param targetType - The target type.
 * @param oldName - The old entity name.
 * @param newName - The new entity name.
 */
export function RenameOverrideTarget(manager: OverrideManager, key: string, targetType: OverrideTargetType, oldName: string, newName: string): void {
    const internal = GetOverrideManagerInternals(manager);
    for (const entry of internal.overrides) {
        if (entry.key === key && entry.targetType === targetType && entry.targetName === oldName) {
            (entry as { targetName: string }).targetName = newName;
        }
    }

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

/**
 * Applies all overrides for a specific smart asset key.
 * @param manager - The override manager state.
 * @param key - The smart asset key to apply overrides for.
 */
export function ApplyOverridesForKey(manager: OverrideManager, key: string): void {
    for (const entry of GetOverrideManagerInternals(manager).overrides) {
        if (entry.key === key) {
            ApplyOverride(manager, entry);
        }
    }
}

/**
 * Applies all overrides.
 * @param manager - The override manager state.
 */
export function ApplyAllOverrides(manager: OverrideManager): void {
    for (const entry of GetOverrideManagerInternals(manager).overrides) {
        ApplyOverride(manager, entry);
    }
}

/**
 * Serializes all overrides to a JSON-compatible array.
 * @param manager - The override manager state.
 * @returns An array of override entries.
 */
export function SerializeOverrides(manager: OverrideManager): IOverrideEntry[] {
    return GetOverrideManagerInternals(manager).overrides.map((o) => ({ ...o }));
}

/**
 * Loads overrides from a serialized array and applies them.
 * @param manager - The override manager state.
 * @param data - Array of override entries.
 */
export function DeserializeAndApplyOverrides(manager: OverrideManager, data: IOverrideEntry[]): void {
    if (!Array.isArray(data)) {
        throw new Error("OverrideManager: Expected an array of override entries.");
    }

    for (const entry of data) {
        if (entry.key === undefined || !entry.targetType || entry.targetName === undefined || !entry.propertyPath || entry.value === undefined) {
            Logger.Warn("OverrideManager: Skipping invalid override entry.");
            continue;
        }
        AddOverride(manager, entry);
    }
}

/**
 * Disposes the override manager, clearing all overrides and references.
 * @param manager - The override manager state.
 */
export function DisposeOverrideManager(manager: OverrideManager): void {
    const internal = GetOverrideManagerInternals(manager);
    internal.overrides.length = 0;
    internal.originalValues.clear();
    internal.smartAssetManager = null;
    if (manager.scene.metadata) {
        delete manager.scene.metadata[OVERRIDE_MANAGER_KEY];
    }
}

function GetOverrideManagerInternals(manager: OverrideManager): OverrideManagerInternals {
    const internal = OverrideManagerInternals.get(manager);
    if (!internal) {
        throw new Error("OverrideManager: Unknown manager state.");
    }
    return internal;
}

function ApplyOverride(manager: OverrideManager, entry: IOverrideEntry): void {
    const internal = GetOverrideManagerInternals(manager);
    const target = ResolveTarget(manager, entry.key, entry.targetType, entry.targetName);
    if (!target) {
        Logger.Warn(`OverrideManager: target not found for key="${entry.key}" type="${entry.targetType}" name="${entry.targetName}" prop="${entry.propertyPath}"`);
        return;
    }

    const origKey = MakeOriginalValueKey(entry.key, entry.targetType, entry.targetName, entry.propertyPath);
    if (!internal.originalValues.has(origKey)) {
        const currentValue = GetNestedProperty(target, entry.propertyPath);
        if (currentValue !== undefined) {
            internal.originalValues.set(origKey, CloneValue(currentValue));
        }
    }

    const resolvedValue = ResolveValue(manager, entry.value);
    SetNestedProperty(target, entry.propertyPath, resolvedValue);
}

function ResolveTarget(manager: OverrideManager, key: string, targetType: OverrideTargetType, targetName: string): object | null {
    const internal = GetOverrideManagerInternals(manager);
    if (targetType === "scene") {
        return manager.scene as unknown as object;
    }

    if (!internal.smartAssetManager) {
        return null;
    }

    if (key === "") {
        return FindObjectByName(manager, targetType, targetName, key);
    }

    const provenance = GetSmartAssetProvenance(internal.smartAssetManager, key);
    if (!provenance) {
        return null;
    }

    return FindObjectByName(manager, targetType, targetName, key);
}

function FindObjectByName(manager: OverrideManager, targetType: OverrideTargetType, name: string, key: string): object | null {
    const internal = GetOverrideManagerInternals(manager);
    const collections: Record<string, unknown[]> = {
        meshes: manager.scene.meshes,
        materials: manager.scene.materials,
        textures: manager.scene.textures,
        lights: manager.scene.lights,
        cameras: manager.scene.cameras,
        animationGroups: manager.scene.animationGroups,
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
            const trackedKey = internal.smartAssetManager ? FindSmartAssetKeyForObject(internal.smartAssetManager, obj) : undefined;
            return key === "" ? trackedKey === undefined : trackedKey === key;
        }) as object) ?? null
    );
}

function ResolveValue(manager: OverrideManager, value: OverrideValue): unknown {
    if (typeof value === "string") {
        if (value.startsWith("ref:")) {
            return ResolveObjectReference(manager, value.substring(4));
        }
        if (value.startsWith("texture:")) {
            return ResolveTextureReference(manager, value.substring(8));
        }
    }

    return value;
}

function ResolveObjectReference(manager: OverrideManager, name: string): unknown {
    const mat = manager.scene.materials.find((m) => m.name === name);
    if (mat) {
        return mat;
    }
    const light = manager.scene.lights.find((l) => l.name === name);
    if (light) {
        return light;
    }
    const camera = manager.scene.cameras.find((c) => c.name === name);
    if (camera) {
        return camera;
    }
    Logger.Warn(`OverrideManager: Object reference "${name}" not found in scene.`);
    return undefined;
}

function ResolveTextureReference(manager: OverrideManager, key: string): unknown {
    const internal = GetOverrideManagerInternals(manager);
    if (internal.smartAssetManager) {
        for (const tex of manager.scene.textures) {
            const trackedKey = FindSmartAssetKeyForObject(internal.smartAssetManager, tex);
            if (trackedKey === key) {
                return tex;
            }
        }
    }
    const tex = manager.scene.textures.find((t) => t.name === key);
    if (tex) {
        return tex;
    }
    Logger.Warn(`OverrideManager: Texture reference "${key}" not found.`);
    return undefined;
}

function FindOverrideIndex(internal: OverrideManagerInternals, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): number {
    return internal.overrides.findIndex((o) => o.key === key && o.targetType === targetType && o.targetName === targetName && o.propertyPath === propertyPath);
}

function RemoveMatchingOverride(internal: OverrideManagerInternals, key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): void {
    const idx = FindOverrideIndex(internal, key, targetType, targetName, propertyPath);
    if (idx >= 0) {
        internal.overrides.splice(idx, 1);
    }
}

function MakeOriginalValueKey(key: string, targetType: OverrideTargetType, targetName: string, propertyPath: string): string {
    return `${key}::${targetType}::${targetName}::${propertyPath}`;
}

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
