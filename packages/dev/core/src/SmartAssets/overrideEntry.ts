/**
 * Defines the shape of an override entry — a property diff applied to a
 * scene object loaded via a smart asset key.
 */
export interface IOverrideEntry {
    /** Smart asset key this override targets. Empty string means scene-level. */
    readonly key: string;

    /** The type of object to target (e.g., "meshes", "materials", "lights"). */
    readonly targetType: OverrideTargetType;

    /** The name of the target object within the key's asset container. */
    readonly targetName: string;

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
 * An override value. Supports scalars, color/vector arrays, and object references.
 * - number: scalar property (e.g., intensity, alpha)
 * - string: string property, material reference (prefixed with "ref:"), or
 *   texture reference (prefixed with "texture:") pointing to a smart asset key
 * - boolean: boolean property
 * - number[]: array property mapped to Vector3, Color3, Color4, etc.
 */
export type OverrideValue = number | string | boolean | number[];
