import { type SmartAssetManager } from "./smartAssetManager";
import { type OverrideManager } from "./overrideManager";
import { type ISerializedSmartAssetMap, serializeSmartAssetMap, deserializeSmartAssetMap, resolveAssetUrl, readJsonSource } from "./smartAssetSerializer";
import { type ISerializedOverrideEntry } from "./overrideEntry";
import { type Scene } from "../scene";

/**
 * A serialized inline object — a scene entity (material, light, camera, etc.)
 * that was created in-tool rather than loaded from a smart asset.
 */
export interface ISerializedInlineObject {
    /** The class name used for deserialization (e.g., "PBRMaterial", "HemisphericLight"). */
    readonly className: string;

    /** The serialized data produced by the object's serialize() method. */
    readonly data: Record<string, unknown>;
}

/**
 * A versioned project file that composes a smart asset map with overrides.
 * This is the unified on-disk format for persisting a complete project.
 */
export interface ISerializedProject {
    /** Schema version. Must be 1 for the current version. */
    readonly version: 1;

    /** Smart asset key→URL mappings (from SmartAssetManager). */
    readonly assets: ISerializedSmartAssetMap["assets"];

    /** Optional provenance snapshot. */
    readonly provenance?: ISerializedSmartAssetMap["provenance"];

    /** Property overrides (from OverrideManager). */
    readonly overrides: ISerializedOverrideEntry[];

    /**
     * Objects created in-tool (not from a smart asset) that must survive
     * the project reload cycle. Keyed by object name.
     */
    readonly inlineObjects?: Record<string, ISerializedInlineObject>;
}

/**
 * Serializes both a SmartAssetManager and an OverrideManager into a single
 * project JSON document. In-tool-created objects (materials, lights, cameras)
 * that are not owned by any smart asset key are captured in the inlineObjects
 * section so they survive the project reload cycle.
 *
 * @param smartAssetManager - The asset manager to serialize.
 * @param overrideManager - The override manager to serialize.
 * @param baseUrl - Optional base URL for making asset paths relative.
 * @returns A serialized project document.
 */
export function serializeProject(smartAssetManager: SmartAssetManager, overrideManager: OverrideManager, baseUrl?: string): ISerializedProject {
    const assetMap = serializeSmartAssetMap(smartAssetManager, baseUrl);
    const overrides = overrideManager.serialize();
    const scene = smartAssetManager.scene;

    // Collect in-tool-created objects not owned by any smart asset key
    const inlineObjects: Record<string, ISerializedInlineObject> = {};
    let hasInlineObjects = false;

    for (const mat of scene.materials) {
        if (!smartAssetManager.findKeyForObject(mat) && mat.name !== "default material") {
            const serialized = mat.serialize();
            if (serialized) {
                inlineObjects[mat.name] = {
                    className: mat.getClassName(),
                    data: serialized,
                };
                hasInlineObjects = true;
            }
        }
    }

    for (const light of scene.lights) {
        if (!smartAssetManager.findKeyForObject(light)) {
            const serialized = light.serialize();
            if (serialized) {
                inlineObjects[light.name] = {
                    className: light.getClassName(),
                    data: serialized,
                };
                hasInlineObjects = true;
            }
        }
    }

    for (const camera of scene.cameras) {
        if (!smartAssetManager.findKeyForObject(camera)) {
            const serialized = camera.serialize();
            if (serialized) {
                inlineObjects[camera.name] = {
                    className: camera.getClassName(),
                    data: serialized,
                };
                hasInlineObjects = true;
            }
        }
    }

    return {
        version: 1,
        assets: assetMap.assets,
        ...(assetMap.provenance ? { provenance: assetMap.provenance } : {}),
        overrides,
        ...(hasInlineObjects ? { inlineObjects: _sanitizeInlineObjects(inlineObjects) } : {}),
    };
}

/**
 * Loads a project file from a URL, File, or pre-parsed object.
 * Registers all asset entries in the SmartAssetManager, loads all assets,
 * recreates in-tool-created objects from inlineObjects, then applies all
 * overrides via the OverrideManager.
 *
 * @param source - A URL string, File object, or pre-parsed ISerializedProject.
 * @param smartAssetManager - The asset manager to populate.
 * @param overrideManager - The override manager to populate.
 * @param rootUrl - Optional root URL for resolving relative asset paths.
 */
export async function loadProjectAsync(
    source: string | File | ISerializedProject,
    smartAssetManager: SmartAssetManager,
    overrideManager: OverrideManager,
    rootUrl?: string
): Promise<void> {
    let resolvedRootUrl = rootUrl ?? "";

    if (typeof source === "string" && !rootUrl) {
        const { Tools } = await import("../Misc/tools");
        resolvedRootUrl = Tools.GetFolderPath(source);
    }

    const raw = await readJsonSource(source);
    const doc = deserializeProject(raw);

    const scene = smartAssetManager.scene;

    // Clear existing state so we load fresh from the project file
    for (const [existingKey] of smartAssetManager.getAll()) {
        await smartAssetManager.remove(existingKey);
    }
    overrideManager.clearOverrides();

    // Clear asset-loaded meshes and animation groups.
    // Preserve cameras, lights, environment texture, and materials/textures —
    // materials are recreated by inlineObjects and SAM overrides handle
    // texture reassignment. Disposing materials can cascade-dispose textures.
    for (const mesh of [...scene.meshes]) {
        mesh.dispose();
    }
    for (const ag of [...scene.animationGroups]) {
        ag.dispose();
    }

    // Register and load all assets
    for (const [key, entry] of Object.entries(doc.assets)) {
        const resolved = resolvedRootUrl ? resolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
        smartAssetManager.register(key, resolved);
    }

    await smartAssetManager.loadAllAsync();

    // Recreate in-tool-created objects
    if (doc.inlineObjects) {
        await _recreateInlineObjects(doc.inlineObjects, smartAssetManager.scene, resolvedRootUrl);
    }

    // Apply overrides
    if (doc.overrides.length > 0) {
        overrideManager.deserializeAndApply(doc.overrides);
    }
}

/**
 * Validates and parses a serialized project document.
 * @param data - The raw data to validate (typically parsed JSON).
 * @returns The validated project document.
 * @throws If the data does not conform to the expected schema.
 */
export function deserializeProject(data: unknown): ISerializedProject {
    if (!data || typeof data !== "object") {
        throw new Error("ProjectSerializer: Invalid project file — expected an object.");
    }

    const doc = data as Record<string, unknown>;

    if (doc.version !== 1) {
        throw new Error(`ProjectSerializer: Unsupported project version "${doc.version}". Expected version 1.`);
    }

    // Validate the asset map portion
    deserializeSmartAssetMap({ version: 1, assets: doc.assets });

    // Validate overrides array
    if (!Array.isArray(doc.overrides)) {
        throw new Error("ProjectSerializer: Invalid project file — 'overrides' must be an array.");
    }

    return data as ISerializedProject;
}

/**
 * Sanitizes inline object data by stripping circular references
 * that some serialize() methods produce (e.g., cameras referencing the scene).
 * @param inlineObjects - The inline objects to sanitize.
 * @returns A sanitized copy with circular references removed.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _sanitizeInlineObjects(inlineObjects: Record<string, ISerializedInlineObject>): Record<string, ISerializedInlineObject> {
    const seen = new WeakSet();
    const sanitized = JSON.parse(
        JSON.stringify(inlineObjects, (_key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return undefined;
                }
                seen.add(value);
            }
            return value;
        })
    );
    return sanitized;
}

/**
 * Recreates in-tool-created objects from the inlineObjects section
 * of a project file using the Babylon material/light/camera Parse methods.
 * @param inlineObjects - The serialized inline objects to recreate.
 * @param scene - The scene to add recreated objects to.
 * @param rootUrl - The root URL for resolving relative asset paths.
 * @returns A promise that resolves when all objects have been recreated.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
async function _recreateInlineObjects(inlineObjects: Record<string, ISerializedInlineObject>, scene: Scene, rootUrl: string): Promise<void> {
    const { Material } = await import("../Materials/material");
    const { Light } = await import("../Lights/light");
    const { Camera } = await import("../Cameras/camera");

    for (const [name, entry] of Object.entries(inlineObjects)) {
        const data = entry.data as Record<string, unknown>;

        // Skip if an object with this name already exists in the scene
        if (scene.materials.some((m) => m.name === name) || scene.lights.some((l) => l.name === name) || scene.cameras.some((c) => c.name === name)) {
            continue;
        }

        // Determine the category from className and use the appropriate Parse
        const className = entry.className;

        if (className.includes("Material") || className.includes("material")) {
            // Strip embedded texture data — texture assignments are managed
            // separately by the override system (texture:key references).
            // Parsing them here would create duplicate texture instances.
            const strippedData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(data)) {
                if (key.endsWith("Texture") && typeof value === "object" && value !== null) {
                    continue;
                }
                strippedData[key] = value;
            }
            Material.Parse(strippedData, scene, rootUrl);
        } else if (className.includes("Light") || className.includes("light")) {
            Light.Parse(data, scene);
        } else if (className.includes("Camera") || className.includes("camera")) {
            Camera.Parse(data, scene);
        }
    }
}
