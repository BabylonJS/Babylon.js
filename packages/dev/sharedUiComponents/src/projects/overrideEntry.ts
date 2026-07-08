/**
 * Defines the shape of an override entry — a property diff applied to a
 * scene object identified by name. Overrides target any object in the
 * scene's standard collections (meshes, materials, lights, etc.) regardless
 * of how that object was created.
 */
export interface IOverrideEntry {
    /** The type of object to target (e.g., "meshes", "materials", "lights"). */
    readonly targetType: OverrideTargetType;

    /** The name of the target object. Use "" for scene-level overrides. */
    readonly targetName: string;

    /**
     * Disambiguator for when multiple objects in `scene[targetType]` share the
     * same `targetName`. The override applies to the N-th match (0-based) at
     * apply time. When names are unique, use 0.
     */
    readonly targetIndex: number;

    /** Dot-separated property path on the target (e.g., "albedoColor", "position.x"). */
    readonly propertyPath: string;

    /** The override value. */
    readonly value: OverrideValue;
}

/**
 * The types of scene objects that can be targeted by overrides.
 */
export type OverrideTargetType = "meshes" | "materials" | "textures" | "lights" | "cameras" | "animationGroups" | "scene";

/**
 * An override value. Supports scalars, color/vector arrays, object references,
 * and null (used to clear a slot, e.g. removing a material assignment).
 * - number: scalar property (e.g., intensity, alpha)
 * - string: string property, or "ref:name" / "samTexture:key" / "texture:name" object reference
 * - boolean: boolean property
 * - number[]: array property mapped to Vector3, Color3, Color4, etc.
 * - null: explicitly clear an object-typed slot
 */
export type OverrideValue = number | string | boolean | number[] | null;
