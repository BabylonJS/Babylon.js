import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "./sceneContext";
import { type IPropertiesService, PropertiesServiceIdentity } from "./panes/properties/propertiesService";

import { AddOverride, RenameOverrideTarget, RenameOverrideValueReferences } from "shared-ui-components/projects/overrideManager";
import { type OverrideTargetType } from "shared-ui-components/projects/overrideEntry";
import { type Scene } from "core/scene";
import { type IObserver } from "core/Misc/observable";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Light } from "core/Lights/light";
import { type Camera } from "core/Cameras/camera";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { FindSmartAssetKeyForObject } from "core/SmartAssets/smartAssetManager.pure";

/**
 * Inspector service that captures property edits made through Inspector and
 * feeds them to the OverrideManager as persistent overrides.
 *
 * Works on any scene object — overrides have no concept of "which asset"
 * owns an object. When multiple objects share a name, an entity's position
 * among same-named siblings (`targetIndex`) is captured so the override
 * re-applies to the same object after reload.
 *
 * The service re-attaches to the current scene whenever it changes, so
 * overrides are captured against the active scene even after loads/swaps.
 */
export const OverrideCaptureServiceDefinition: ServiceDefinition<[], [ISceneContext, IPropertiesService]> = {
    friendlyName: "Override Capture",
    consumes: [SceneContextIdentity, PropertiesServiceIdentity],
    factory: (sceneContext, propertiesService) => {
        // Track each entity's name + index at first contact so we can update
        // existing overrides when the user renames the entity in Inspector.
        // Re-created on each scene attach so identities don't leak across scenes.
        let previousIdentity = new WeakMap<object, { name: string; index: number }>();
        let changeObserver: IObserver | null = null;

        function attachToScene(scene: Scene | null): void {
            if (changeObserver) {
                changeObserver.remove();
                changeObserver = null;
            }
            previousIdentity = new WeakMap();
            if (!scene) {
                return;
            }

            changeObserver = propertiesService.onPropertyChanged.add((changeInfo) => {
                const { entity, propertyKey, oldValue, newValue } = changeInfo;

                // When "name" changes, update the matching override so it follows the rename
                // instead of creating a new (orphaned) one. Also rewrite any overrides
                // whose *value* referenced this entity by name so cross-references
                // (e.g. `mesh.material = ref:redMat`) survive the rename too.
                if (propertyKey === "name" && typeof newValue === "string") {
                    const targetType = ClassifyEntity(entity, scene);
                    if (targetType !== null && targetType !== "scene") {
                        const previous = previousIdentity.get(entity as object);
                        if (previous && previous.name !== newValue) {
                            // The entity already has the new name at this point, so compute its new index among same-named siblings.
                            const newIndex = ComputeTargetIndex(scene, targetType, entity, newValue);
                            RenameOverrideTarget(scene, targetType, previous.name, previous.index, newValue, newIndex);

                            // Mirror the rename into override values that reference
                            // this entity by name. SmartAsset textures use the
                            // `samTexture:<key>` form and stay decoupled from the
                            // texture's runtime name, so they don't need rewriting.
                            const valueScheme = targetType === "textures" ? "texture" : "ref";
                            RenameOverrideValueReferences(scene, valueScheme, previous.name, newValue);
                        }
                        previousIdentity.set(entity as object, { name: newValue, index: ComputeTargetIndex(scene, targetType, entity, newValue) });
                    }
                    return;
                }

                if (propertyKey === "id") {
                    return;
                }

                let targetType = ClassifyEntity(entity, scene);
                let targetName: string;
                let targetIndex: number;
                let propertyPath = String(propertyKey);
                let targetEntity: object | Scene;

                if (targetType !== null) {
                    if (targetType === "scene") {
                        targetName = "";
                        targetIndex = 0;
                        targetEntity = scene;
                    } else {
                        targetName = GetEntityName(entity);
                        targetIndex = ComputeTargetIndex(scene, targetType, entity, targetName);
                        targetEntity = entity as object;
                    }
                    // Seed identity on first contact so rename tracking works
                    if (!previousIdentity.has(targetEntity as object) && targetName) {
                        previousIdentity.set(targetEntity as object, { name: targetName, index: targetIndex });
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
                    propertyPath = `${parentInfo.parentProperty}.${propertyPath}`;
                }

                const serializedValue = SerializeOverrideValueForCapture(newValue, scene);
                if (serializedValue === undefined) {
                    return;
                }

                // The Inspector binding has already written `newValue` to the
                // entity, so pass `oldValue` so the manager can record the
                // true pre-edit value (without this, RemoveOverride would have
                // no record of the original and could not restore it).
                AddOverride(
                    scene,
                    {
                        targetType,
                        targetName,
                        targetIndex,
                        propertyPath,
                        value: serializedValue,
                    },
                    { originalValue: oldValue }
                );
            });
        }

        attachToScene(sceneContext.currentScene);
        const sceneSubObserver = sceneContext.currentSceneObservable.add((scene) => attachToScene(scene));

        return {
            dispose: () => {
                sceneSubObserver.remove();
                if (changeObserver) {
                    changeObserver.remove();
                    changeObserver = null;
                }
            },
        };
    },
};

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
    // null is a legitimate override value (e.g. clearing a material slot) and
    // must round-trip as null — substituting "" here would silently corrupt
    // object-typed slots with an empty string on reload.
    if (value === null) {
        return null;
    }
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        return value;
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

    // Vector3 / Vector4
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
