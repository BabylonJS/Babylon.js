import { type ServiceDefinition } from "../../../modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../../sceneContext";
import { type IPropertiesService, PropertiesServiceIdentity } from "../properties/propertiesService";

import { SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { OverrideManager } from "core/SmartAssets/overrideManager";
import { type OverrideTargetType } from "core/SmartAssets/overrideEntry";
import { type Scene } from "core/scene";
import { type Node } from "core/node";
import { type Material } from "core/Materials/material";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Light } from "core/Lights/light";
import { type Camera } from "core/Cameras/camera";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { Logger } from "core/Misc/logger";

/**
 * Inspector service that captures property edits on SmartAsset-loaded objects
 * and feeds them to the OverrideManager as persistent overrides.
 *
 * When a user changes a property in Inspector on an object that was loaded via
 * SmartAssetManager, this service:
 * 1. Identifies which smart asset key owns the object
 * 2. Determines the target type (mesh, material, light, etc.)
 * 3. Creates an override entry with the property path and new value
 * 4. Adds it to the OverrideManager so it persists across reloads
 *
 * This is the bridge between Inspector's property editing and the override
 * persistence system — the reason overrides exist.
 */
export const OverrideCaptureServiceDefinition: ServiceDefinition<[], [ISceneContext, IPropertiesService]> = {
    friendlyName: "Override Capture",
    consumes: [SceneContextIdentity, PropertiesServiceIdentity],
    factory: (sceneContext, propertiesService) => {
        const scene = sceneContext.currentScene;
        // eslint-disable-next-line no-console
        console.log("[OverrideCapture] factory called, scene:", !!scene);
        if (!scene) {
            return undefined;
        }

        const sam = SmartAssetManager.GetFromScene(scene);
        // eslint-disable-next-line no-console
        console.log("[OverrideCapture] SAM from scene:", !!sam, "metadata keys:", scene.metadata ? Object.keys(scene.metadata) : "none");
        if (!sam) {
            return undefined;
        }

        // Get or create OverrideManager
        let overrides = scene.metadata?.["babylonjs:overrideManager"] as OverrideManager | undefined;
        if (!overrides) {
            overrides = new OverrideManager(scene);
            overrides.linkSmartAssetManager(sam);
            if (!scene.metadata) {
                scene.metadata = {};
            }
            Object.defineProperty(scene.metadata, "babylonjs:overrideManager", {
                value: overrides,
                enumerable: false,
                configurable: true,
                writable: true,
            });
        }

        // Install Inspector's file-picker-based onAssetNotFound handler
        // if no handler is already installed by user code
        if (!sam.onAssetNotFound) {
            sam.onAssetNotFound = async (key, expectedUrl) => {
                return await new Promise<string | File | null>((resolve) => {
                    const shortUrl = expectedUrl.length > 60 ? "…" + expectedUrl.slice(-50) : expectedUrl;
                    Logger.Warn(`SmartAssetManager: Asset "${key}" not found at "${shortUrl}" — prompting user to locate it.`);

                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2";

                    // Show a brief message so the user knows why a file picker appeared
                    const msg = document.createElement("div");
                    msg.textContent = `Locate asset "${key}"`;
                    msg.style.cssText =
                        "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);" +
                        "background:#333;color:#fff;padding:16px 24px;border-radius:8px;z-index:10000;" +
                        "font:14px sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.5);";
                    document.body.appendChild(msg);

                    input.onchange = () => {
                        document.body.removeChild(msg);
                        resolve(input.files?.[0] ?? null);
                    };
                    input.oncancel = () => {
                        document.body.removeChild(msg);
                        resolve(null);
                    };
                    // Fallback: if the dialog is dismissed without oncancel firing
                    window.addEventListener("focus", function onFocus() {
                        window.removeEventListener("focus", onFocus);
                        setTimeout(() => {
                            if (msg.parentNode) {
                                document.body.removeChild(msg);
                                resolve(null);
                            }
                        }, 300);
                    });
                    input.click();
                });
            };
        }

        // Subscribe to Inspector property changes
        const observer = propertiesService.onPropertyChanged.add((changeInfo) => {
            const { entity, propertyKey, newValue } = changeInfo;

            // eslint-disable-next-line no-console
            console.log("[OverrideCapture] change:", { entityType: (entity as any)?.getClassName?.() ?? typeof entity, propertyKey, newValue });

            let key = _findKeyForEntity(sam, entity, scene);
            let targetType = key !== null ? _classifyEntity(entity, scene) : null;
            let targetName: string;
            let propertyPath = String(propertyKey);

            // eslint-disable-next-line no-console
            console.log("[OverrideCapture] direct lookup:", { key, targetType });

            if (key !== null && targetType !== null) {
                // Direct entity (scene, mesh, material, etc.)
                targetName = key === "" ? "" : _getEntityName(entity);
            } else {
                // Sub-object: check if this is a property of a known parent
                const parentInfo = _findParentEntity(entity, scene, sam);
                // eslint-disable-next-line no-console
                console.log("[OverrideCapture] parent lookup:", parentInfo);
                if (!parentInfo) {
                    return;
                }
                key = parentInfo.key;
                targetType = parentInfo.targetType;
                targetName = parentInfo.targetName;
                propertyPath = `${parentInfo.parentProperty}.${propertyPath}`;
            }

            const serializedValue = _serializeValue(newValue, scene, sam);
            // eslint-disable-next-line no-console
            console.log("[OverrideCapture] serialized:", { key, targetType, targetName, propertyPath, serializedValue });
            if (serializedValue === undefined) {
                return;
            }

            overrides!.addOverride(
                {
                    key,
                    targetType,
                    targetName,
                    propertyPath,
                    value: serializedValue,
                },
                true
            ); // skipApply — Inspector already set the value
        });

        return {
            dispose: () => {
                observer.remove();
            },
        };
    },
};

/**
 * Finds the smart asset key that owns an entity, or "" for scene-level
 * and in-tool-created objects, or null if the entity type is unrecognized.
 * @param sam - The SmartAssetManager to query.
 * @param entity - The entity to find the key for.
 * @param scene - The scene the entity belongs to.
 * @returns The smart asset key, "" for scene-level objects, or null if unrecognized.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _findKeyForEntity(sam: SmartAssetManager, entity: unknown, scene: Scene): string | null {
    // Scene-level properties
    if (entity === scene) {
        return "";
    }

    // Check if the entity is tracked by SmartAssetManager
    const key = sam.findKeyForObject(entity as Node | Material | BaseTexture | AnimationGroup);
    if (key !== undefined) {
        return key;
    }

    // For objects not tracked by SAM (in-tool-created cameras, lights, materials),
    // use empty key so overrides are still captured
    if (_classifyEntity(entity, scene) !== null) {
        return "";
    }

    return null;
}

/**
 * Classifies an entity into an OverrideTargetType.
 * @param entity - The entity to classify.
 * @param scene - The scene to check collections against.
 * @returns The target type, or null if unrecognized.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _classifyEntity(entity: unknown, scene: Scene): OverrideTargetType | null {
    if (entity === scene) {
        return "scene";
    }

    const obj = entity as any;
    if (!obj || typeof obj !== "object") {
        return null;
    }

    // Check by presence on scene collections
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
// eslint-disable-next-line @typescript-eslint/naming-convention
function _getEntityName(entity: unknown): string {
    const obj = entity as any;
    return obj?.name ?? "";
}

/**
 * Serializes a property value into an OverrideValue.
 * Returns undefined for unsupported types.
 * @param value - The value to serialize.
 * @param scene - Optional scene for resolving object references.
 * @param sam - Optional SmartAssetManager for resolving texture references.
 * @returns The serialized value, or undefined if unsupported.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _serializeValue(value: unknown, scene?: Scene, sam?: SmartAssetManager): number | string | boolean | number[] | undefined {
    if (value === null) {
        return "";
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

    // Texture reference → "texture:key" or "texture:name"
    if (value && typeof value === "object" && "getClassName" in value && scene) {
        const className = (value as any).getClassName() as string;
        if (className.includes("Texture") || className.includes("texture")) {
            // Try to find the smart asset key for this texture
            if (sam) {
                const texKey = sam.findKeyForObject(value as BaseTexture);
                if (texKey) {
                    return `texture:${texKey}`;
                }
            }
            // Fall back to texture name
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
 * @param sam - The SmartAssetManager for key lookup.
 * @returns The parent entity info, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _findParentEntity(
    entity: unknown,
    scene: Scene,
    sam: SmartAssetManager
): { key: string; targetType: OverrideTargetType; targetName: string; parentProperty: string } | null {
    // Check scene sub-objects (imageProcessingConfiguration, fogSettings, etc.)
    const sceneSubProps = ["imageProcessingConfiguration", "postProcessRenderPipelineManager", "ambientColor", "gravity"] as const;

    for (const prop of sceneSubProps) {
        if ((scene as any)[prop] === entity) {
            return { key: "", targetType: "scene", targetName: "", parentProperty: prop };
        }
    }

    // Check material sub-objects (e.g., PBR material sub-configurations)
    for (const mat of scene.materials) {
        for (const prop of Object.keys(mat)) {
            if (prop.startsWith("_")) {
                continue;
            }
            try {
                if ((mat as any)[prop] === entity) {
                    const matKey = sam.findKeyForObject(mat) ?? "";
                    return { key: matKey, targetType: "materials", targetName: mat.name, parentProperty: prop };
                }
            } catch {
                // Skip properties that throw on access
            }
        }
    }

    // Check camera sub-objects
    for (const cam of scene.cameras) {
        for (const prop of Object.keys(cam)) {
            if (prop.startsWith("_")) {
                continue;
            }
            try {
                if ((cam as any)[prop] === entity) {
                    const camKey = sam.findKeyForObject(cam) ?? "";
                    return { key: camKey, targetType: "cameras", targetName: cam.name, parentProperty: prop };
                }
            } catch {
                // Skip
            }
        }
    }

    // Check mesh sub-objects (position, rotation, scaling, etc.)
    for (const mesh of scene.meshes) {
        for (const prop of Object.keys(mesh)) {
            if (prop.startsWith("_")) {
                continue;
            }
            try {
                if ((mesh as any)[prop] === entity) {
                    const meshKey = sam.findKeyForObject(mesh) ?? "";
                    return { key: meshKey, targetType: "meshes", targetName: mesh.name, parentProperty: prop };
                }
            } catch {
                // Skip properties that throw on access
            }
        }
    }

    // Check light sub-objects (diffuse, specular, direction, etc.)
    for (const light of scene.lights) {
        for (const prop of Object.keys(light)) {
            if (prop.startsWith("_")) {
                continue;
            }
            try {
                if ((light as any)[prop] === entity) {
                    const lightKey = sam.findKeyForObject(light) ?? "";
                    return { key: lightKey, targetType: "lights", targetName: light.name, parentProperty: prop };
                }
            } catch {
                // Skip
            }
        }
    }

    return null;
}
