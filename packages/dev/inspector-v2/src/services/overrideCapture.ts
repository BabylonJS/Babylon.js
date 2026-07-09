import { type Scene } from "core/scene";
import { Node } from "core/node";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Light } from "core/Lights/light";
import { type Camera } from "core/Cameras/camera";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { FindSmartAssetKeyForObject } from "core/SmartAssets/smartAssetManager.pure";

import { AddOverride, RemoveOverride, RenameOverrideTarget, RenameOverrideValueReferences } from "shared-ui-components/projects/overrideManager";
import { type OverrideTargetType } from "shared-ui-components/projects/overrideEntry";

/**
 * Describes a property change captured from the Inspector (mirror of the
 * Inspector's PropertyChangeInfo, kept local so this module has no React deps).
 */
export type CapturedPropertyChange = {
    /** The entity whose property changed. */
    readonly entity: unknown;
    /** The changed property key. */
    readonly propertyKey: PropertyKey;
    /** The value before the change. */
    readonly oldValue: unknown;
    /** The value after the change. */
    readonly newValue: unknown;
};

/**
 * Per-scene identity tracking used to keep overrides attached to the correct
 * object across renames.
 *
 * - `previousIdentity` holds the entity's most recently seen name/index so a
 *   rename can move other overrides (and value references) to follow the
 *   *current* name.
 * - `originalIdentity` holds the first name/index ever seen for the entity.
 *   Renames are recorded as a `name` override keyed on this original identity,
 *   because a `.babylonproj` reloads SmartAsset (glTF) objects with their
 *   original names before overrides are applied.
 */
export type CaptureState = {
    /** Last-known name/index for each entity, used to follow renames. */
    readonly previousIdentity: WeakMap<object, { name: string; index: number }>;
    /** First-seen name/index for each entity, used to key `name` overrides. */
    readonly originalIdentity: WeakMap<object, { name: string; index: number }>;
};

/**
 * Creates a fresh capture state. One is created per attached scene so identities
 * never leak across scenes.
 * @returns A new, empty capture state.
 */
export function CreateCaptureState(): CaptureState {
    return { previousIdentity: new WeakMap(), originalIdentity: new WeakMap() };
}

/**
 * Handles a single Inspector property change, recording the corresponding
 * override. Name changes are handled specially so renames persist and other
 * overrides follow the rename.
 * @param scene - The active scene.
 * @param state - The capture state for this scene.
 * @param change - The captured property change.
 */
export function HandleCapturedPropertyChange(scene: Scene, state: CaptureState, change: CapturedPropertyChange): void {
    const { entity, propertyKey, oldValue, newValue } = change;

    if (propertyKey === "name" && typeof newValue === "string") {
        HandleRename(scene, state, entity, oldValue, newValue);
        return;
    }

    if (propertyKey === "id") {
        return;
    }

    RecordEntityPropertyOverride(scene, entity, String(propertyKey), newValue, oldValue, state);
}

/**
 * Records (or replaces) an override for a single property edit on a scene
 * entity. Also usable directly by non-Inspector edit paths (e.g. scene-explorer
 * commands like the visibility eye toggle, or drag-to-reparent) that mutate an
 * entity without going through the Inspector's property change pipeline.
 *
 * The caller is expected to have already applied `newValue` to the entity;
 * `oldValue` is recorded as the pre-edit original so the override can be
 * reverted later.
 * @param scene - The active scene.
 * @param entity - The mutated entity.
 * @param propertyPath - The dot-separated property path that changed.
 * @param newValue - The new (already-applied) value.
 * @param oldValue - The pre-edit value, recorded as the override's original.
 * @param state - Optional capture state; when provided, entity identities are
 * seeded so subsequent renames can be tracked.
 */
export function RecordEntityPropertyOverride(scene: Scene, entity: unknown, propertyPath: string, newValue: unknown, oldValue: unknown, state?: CaptureState): void {
    let targetType = ClassifyEntity(entity, scene);
    let targetName: string;
    let targetIndex: number;
    let finalPath = propertyPath;

    if (targetType !== null) {
        if (targetType === "scene") {
            targetName = "";
            targetIndex = 0;
        } else {
            targetName = GetEntityName(entity);
            targetIndex = ComputeTargetIndex(scene, targetType, entity, targetName);
            if (state && targetName) {
                SeedIdentity(state, entity as object, targetName, targetIndex);
            }
        }
    } else {
        // Sub-object: check if this is a property of a known parent
        const parentInfo = FindParentEntity(entity, scene);
        if (!parentInfo) {
            return;
        }
        targetType = parentInfo.targetType;
        targetName = parentInfo.targetName;
        targetIndex = parentInfo.targetIndex;
        finalPath = `${parentInfo.parentProperty}.${propertyPath}`;
    }

    const serializedValue = SerializeOverrideValueForCapture(newValue, scene);
    if (serializedValue === undefined) {
        return;
    }

    // The caller has already written `newValue` to the entity, so pass
    // `oldValue` so the manager records the true pre-edit value.
    AddOverride(scene, { targetType, targetName, targetIndex, propertyPath: finalPath, value: serializedValue }, { originalValue: oldValue });
}

/**
 * Handles an entity rename. Records the rename as a `name` override keyed on the
 * entity's original (first-seen) name so it round-trips through a project
 * reload, and moves any other overrides / value references to follow the new
 * current name.
 * @param scene - The active scene.
 * @param state - The capture state for this scene.
 * @param entity - The renamed entity.
 * @param oldValue - The name before the rename.
 * @param newValue - The name after the rename.
 */
function HandleRename(scene: Scene, state: CaptureState, entity: unknown, oldValue: unknown, newValue: string): void {
    const targetType = ClassifyEntity(entity, scene);
    if (targetType === null || targetType === "scene") {
        return;
    }

    const entityObject = entity as object;
    const previous = state.previousIdentity.get(entityObject);
    const oldName = typeof oldValue === "string" ? oldValue : previous?.name;

    if (oldName !== undefined && oldName !== newValue) {
        // The entity already has the new name, so compute its new index among same-named siblings.
        const newIndex = ComputeTargetIndex(scene, targetType, entity, newValue);

        // Move existing overrides (and value references) to follow the current name.
        if (previous) {
            RenameOverrideTarget(scene, targetType, previous.name, previous.index, newValue, newIndex);
            const valueScheme = targetType === "textures" ? "texture" : "ref";
            RenameOverrideValueReferences(scene, valueScheme, previous.name, newValue);
        }

        // Record the rename as an override keyed on the entity's ORIGINAL name.
        let original = state.originalIdentity.get(entityObject);
        if (!original) {
            original = { name: oldName, index: previous?.index ?? ComputeTargetIndex(scene, targetType, entity, oldName) };
            state.originalIdentity.set(entityObject, original);
        }

        if (original.name !== newValue) {
            AddOverride(scene, { targetType, targetName: original.name, targetIndex: original.index, propertyPath: "name", value: newValue }, { originalValue: original.name });
        } else {
            // Renamed back to the original name — the name override is now a no-op.
            RemoveOverride(scene, targetType, original.name, original.index, "name");
        }
    }

    state.previousIdentity.set(entityObject, { name: newValue, index: ComputeTargetIndex(scene, targetType, entity, newValue) });
}

/**
 * Seeds both identity maps for an entity on first contact.
 * @param state - The capture state.
 * @param entity - The entity to seed.
 * @param name - The entity's current name.
 * @param index - The entity's index among same-named siblings.
 */
function SeedIdentity(state: CaptureState, entity: object, name: string, index: number): void {
    if (!state.previousIdentity.has(entity)) {
        state.previousIdentity.set(entity, { name, index });
    }
    if (!state.originalIdentity.has(entity)) {
        state.originalIdentity.set(entity, { name, index });
    }
}

/**
 * Classifies an entity into an OverrideTargetType by membership in the
 * scene's standard collections (or by being the scene itself).
 * @param entity - The entity to classify.
 * @param scene - The scene to check collections against.
 * @returns The target type, or null if unrecognized.
 */
function ClassifyEntity(entity: unknown, scene: Scene): OverrideTargetType | null {
    if (entity === scene) {
        return "scene";
    }

    const obj = entity as any;
    if (!obj || typeof obj !== "object") {
        return null;
    }

    if (scene.materials.includes(obj)) {
        return "materials";
    }
    if (scene.meshes.includes(obj)) {
        return "meshes";
    }
    if (scene.lights.includes(obj as Light)) {
        return "lights";
    }
    if (scene.cameras.includes(obj as Camera)) {
        return "cameras";
    }
    if (scene.textures.includes(obj as BaseTexture)) {
        return "textures";
    }
    if (scene.animationGroups.includes(obj as AnimationGroup)) {
        return "animationGroups";
    }

    return null;
}

/**
 * Gets the name of a scene entity.
 * @param entity - The entity to get the name from.
 * @returns The entity name, or an empty string if unavailable.
 */
function GetEntityName(entity: unknown): string {
    const obj = entity as any;
    return obj?.name ?? "";
}

/**
 * Returns the position of `entity` among scene[targetType] objects with the
 * same name. Used so overrides can disambiguate same-named siblings.
 * @param scene - The scene to inspect.
 * @param targetType - The target type / collection name.
 * @param entity - The entity to locate.
 * @param name - The name to filter by.
 * @returns The index within the same-name filter, or 0 if not found.
 */
function ComputeTargetIndex(scene: Scene, targetType: OverrideTargetType, entity: unknown, name: string): number {
    const collection = GetCollection(scene, targetType);
    if (!collection) {
        return 0;
    }
    const sameName = collection.filter((obj) => (obj as { name?: string }).name === name);
    const idx = sameName.indexOf(entity as object);
    return idx >= 0 ? idx : 0;
}

/**
 * Returns the scene collection matching a target type.
 * @param scene - The scene to inspect.
 * @param targetType - The target type.
 * @returns The collection, or null if `targetType` doesn't map to one.
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
 * Serializes a property value into an OverrideValue.
 * Returns undefined for unsupported types.
 * @param value - The value to serialize.
 * @param scene - Optional scene for resolving object references.
 * @returns The serialized value, or undefined if unsupported.
 */
function SerializeOverrideValueForCapture(value: unknown, scene?: Scene): number | string | boolean | number[] | null | undefined {
    // null is a legitimate override value (e.g. clearing a material slot or a
    // parent) and must round-trip as null — substituting "" here would silently
    // corrupt object-typed slots with an empty string on reload.
    if (value === null) {
        return null;
    }
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        return value;
    }

    // Node reference (parent, etc.) → "ref:nodeName". Checked before the math
    // heuristics below because a Node is an object without top-level x/y/z.
    if (value instanceof Node) {
        return `ref:${value.name}`;
    }

    // Material reference → "ref:materialName"
    if (value && typeof value === "object" && "getClassName" in value && typeof (value as any).getClassName === "function") {
        const className = (value as any).getClassName() as string;
        if (className.includes("Material") || className.includes("material")) {
            return `ref:${(value as any).name}`;
        }
    }

    // Texture reference → "samTexture:<key>" if SmartAsset-tracked, else "texture:<name>".
    // The SAM key is stable across save/load; `texture.name` for a SAM-tracked
    // texture is the blob URL, which dies on page reload — using it as the
    // override identifier would break the override after every reload.
    if (value && typeof value === "object" && "getClassName" in value && scene) {
        const className = (value as any).getClassName() as string;
        if (className.includes("Texture") || className.includes("texture")) {
            const samKey = FindSmartAssetKeyForObject(scene, value as BaseTexture);
            if (samKey !== undefined) {
                return `samTexture:${samKey}`;
            }
            return `texture:${(value as any).name}`;
        }
    }

    // Color3 / Color4
    if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
        const color = value as { r: number; g: number; b: number; a?: number };
        if ("a" in color && color.a !== undefined) {
            return [color.r, color.g, color.b, color.a];
        }
        return [color.r, color.g, color.b];
    }

    // Vector3 / Vector4 / Quaternion
    if (value && typeof value === "object" && "x" in value && "y" in value && "z" in value) {
        const vec = value as { x: number; y: number; z: number; w?: number };
        if ("w" in vec && vec.w !== undefined) {
            return [vec.x, vec.y, vec.z, vec.w];
        }
        return [vec.x, vec.y, vec.z];
    }

    // Vector2
    if (value && typeof value === "object" && "x" in value && "y" in value && !("z" in value)) {
        const vec2 = value as { x: number; y: number };
        return [vec2.x, vec2.y];
    }

    return undefined;
}

/**
 * Checks if an entity is a sub-object of a known scene entity by scanning
 * well-known sub-object properties on the scene and its collections.
 * Returns the parent entity info with the property path prefix.
 * @param entity - The entity to search for.
 * @param scene - The scene to search in.
 * @returns The parent entity info, or null if not found.
 */
function FindParentEntity(entity: unknown, scene: Scene): { targetType: OverrideTargetType; targetName: string; targetIndex: number; parentProperty: string } | null {
    // Check scene sub-objects (imageProcessingConfiguration, fogSettings, etc.)
    const sceneSubProps = ["imageProcessingConfiguration", "postProcessRenderPipelineManager", "ambientColor", "gravity"] as const;
    for (const prop of sceneSubProps) {
        if ((scene as any)[prop] === entity) {
            return { targetType: "scene", targetName: "", targetIndex: 0, parentProperty: prop };
        }
    }

    const collections: { type: OverrideTargetType; items: readonly { name: string }[] }[] = [
        { type: "materials", items: scene.materials as unknown as readonly { name: string }[] },
        { type: "cameras", items: scene.cameras as unknown as readonly { name: string }[] },
        { type: "meshes", items: scene.meshes as unknown as readonly { name: string }[] },
        { type: "lights", items: scene.lights as unknown as readonly { name: string }[] },
    ];

    for (const { type, items } of collections) {
        for (const parent of items) {
            for (const prop of Object.keys(parent)) {
                if (prop.startsWith("_")) {
                    continue;
                }
                try {
                    if ((parent as any)[prop] === entity) {
                        const targetIndex = items.filter((p) => p.name === parent.name).indexOf(parent);
                        return { targetType: type, targetName: parent.name, targetIndex: Math.max(targetIndex, 0), parentProperty: prop };
                    }
                } catch {
                    // Skip properties that throw on access
                }
            }
        }
    }

    return null;
}
