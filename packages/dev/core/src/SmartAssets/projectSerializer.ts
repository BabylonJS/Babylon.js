import { type SmartAssetManager } from "./smartAssetManager";
import { type OverrideManager } from "./overrideManager";
import { type ISerializedSmartAssetMap, SerializeSmartAssetMap, DeserializeSmartAssetMap, ResolveAssetUrl, ReadJsonSourceAsync } from "./smartAssetSerializer";
import { type IOverrideEntry } from "./overrideEntry";
import { type Scene } from "../scene";
import { GetClass } from "../Misc/typeStore";
import { Logger } from "../Misc/logger";

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

    /** Property overrides (from OverrideManager). */
    readonly overrides: IOverrideEntry[];

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
export function SerializeProject(smartAssetManager: SmartAssetManager, overrideManager: OverrideManager, baseUrl?: string): ISerializedProject {
    const assetMap = SerializeSmartAssetMap(smartAssetManager, baseUrl);
    const overrides = overrideManager.serialize();
    const scene = smartAssetManager.scene;

    // Collect in-tool-created objects not owned by any smart asset key
    const inlineObjects: Record<string, ISerializedInlineObject> = {};
    let hasInlineObjects = false;

    for (const mat of scene.materials) {
        if (!smartAssetManager.findKeyForObject(mat) && mat.name !== "default material") {
            const serialized = mat.serialize();
            hasInlineObjects = CollectInlineObject(mat.name, serialized, mat.getClassName(), inlineObjects) || hasInlineObjects;
        }
    }

    for (const light of scene.lights) {
        if (!smartAssetManager.findKeyForObject(light)) {
            hasInlineObjects = CollectInlineObject(light.name, light.serialize(), light.getClassName(), inlineObjects) || hasInlineObjects;
        }
    }

    for (const camera of scene.cameras) {
        if (!smartAssetManager.findKeyForObject(camera)) {
            hasInlineObjects = CollectInlineObject(camera.name, camera.serialize(), camera.getClassName(), inlineObjects) || hasInlineObjects;
        }
    }

    return {
        version: 1,
        assets: assetMap.assets,
        overrides,
        ...(hasInlineObjects ? { inlineObjects: SanitizeInlineObjects(inlineObjects) } : {}),
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
export async function LoadProjectAsync(
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

    const raw = await ReadJsonSourceAsync(source);
    const doc = DeserializeProject(raw);

    const scene = smartAssetManager.scene;

    // Clear existing state so we load fresh from the project file
    for (const existingKey of Array.from(smartAssetManager.getAll().keys())) {
        // eslint-disable-next-line no-await-in-loop
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
        const resolved = resolvedRootUrl ? ResolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
        smartAssetManager.register(key, resolved);
        // Pre-mark texture keys so loadAllAsync routes them correctly
        // even when the URL is a blob (which has no file extension).
        if (entry.type === "texture") {
            smartAssetManager.markAsTextureKey(key);
        }
    }

    await smartAssetManager.loadAllAsync();

    // Recreate in-tool-created objects, then rebind their texture slots to
    // the canonical SAM-tracked textures (Material.Parse may have created
    // duplicates from inlined texture data).
    if (doc.inlineObjects) {
        RecreateInlineObjects(doc.inlineObjects, smartAssetManager.scene, resolvedRootUrl);
        RebindMaterialTexturesToSam(smartAssetManager);
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
export function DeserializeProject(data: unknown): ISerializedProject {
    if (!data || typeof data !== "object") {
        throw new Error("ProjectSerializer: Invalid project file — expected an object.");
    }

    const doc = data as Record<string, unknown>;

    if (doc.version !== 1) {
        throw new Error(`ProjectSerializer: Unsupported project version "${doc.version}". Expected version 1.`);
    }

    // Validate the asset map portion
    DeserializeSmartAssetMap({ version: 1, assets: doc.assets });

    // Validate overrides array
    if (!Array.isArray(doc.overrides)) {
        throw new Error("ProjectSerializer: Invalid project file — 'overrides' must be an array.");
    }

    return data as ISerializedProject;
}

/**
 * Adds a serialized object to the inlineObjects record.
 * @param name - The object's name (used as the key in inlineObjects).
 * @param serialized - The serialized data, or null/undefined if serialization failed.
 * @param className - The class name for deserialization.
 * @param inlineObjects - The record to add the serialized object to.
 * @returns True if an object was collected, false otherwise.
 */
function CollectInlineObject(name: string, serialized: any, className: string, inlineObjects: Record<string, ISerializedInlineObject>): boolean {
    if (!serialized) {
        return false;
    }
    inlineObjects[name] = {
        className,
        data: serialized,
    };
    return true;
}

/**
 * Sanitizes inline object data by stripping circular references
 * that some serialize() methods produce (e.g., cameras referencing the scene).
 * @param inlineObjects - The inline objects to sanitize.
 * @returns A sanitized copy with circular references removed.
 */
function SanitizeInlineObjects(inlineObjects: Record<string, ISerializedInlineObject>): Record<string, ISerializedInlineObject> {
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
 * Recreates in-tool-created objects from the inlineObjects section of a
 * project file. Dispatch uses Babylon's `GetClass` registry — the same
 * mechanism every `*.Parse` method already relies on — instead of brittle
 * substring matching on the class name.
 * @param inlineObjects - The serialized inline objects to recreate.
 * @param scene - The scene to add recreated objects to.
 * @param rootUrl - The root URL for resolving relative asset paths.
 */
function RecreateInlineObjects(inlineObjects: Record<string, ISerializedInlineObject>, scene: Scene, rootUrl: string): void {
    for (const [name, entry] of Object.entries(inlineObjects)) {
        const data = entry.data as Record<string, unknown>;

        // Skip if an object with this name already exists in the scene
        if (scene.materials.some((m) => m.name === name) || scene.lights.some((l) => l.name === name) || scene.cameras.some((c) => c.name === name)) {
            continue;
        }

        const ctor = GetClass(entry.className);
        if (!ctor || typeof ctor.Parse !== "function") {
            Logger.Warn(`ProjectSerializer: No Parse method registered for class "${entry.className}"; skipping inline object "${name}".`);
            continue;
        }

        try {
            ctor.Parse(data, scene, rootUrl);
        } catch (e) {
            Logger.Warn(`ProjectSerializer: Failed to parse inline object "${name}" of class "${entry.className}": ${e}`);
        }
    }
}

/**
 * After `Material.Parse` runs, materials may hold duplicate texture instances
 * created from the inlined texture data in the serialized material. Walk every
 * material's texture slots and rebind any texture whose name matches a
 * SAM-tracked texture to the canonical SAM instance, disposing the duplicate.
 * @param sam - The SmartAssetManager with the canonical textures.
 */
function RebindMaterialTexturesToSam(sam: SmartAssetManager): void {
    const scene = sam.scene;

    // Build a name → SAM texture map (skip non-tracked textures).
    const samTexByName = new Map<string, import("../Materials/Textures/baseTexture").BaseTexture>();
    for (const tex of scene.textures) {
        if (sam.findKeyForObject(tex)) {
            samTexByName.set(tex.name, tex);
            const url = (tex as any).url;
            if (typeof url === "string" && url !== tex.name) {
                samTexByName.set(url, tex);
            }
        }
    }

    if (samTexByName.size === 0) {
        return;
    }

    const toDispose = new Set<import("../Materials/Textures/baseTexture").BaseTexture>();

    for (const mat of scene.materials) {
        for (const propName of Object.keys(mat)) {
            if (!propName.endsWith("Texture")) {
                continue;
            }
            const current = (mat as any)[propName] as import("../Materials/Textures/baseTexture").BaseTexture | null | undefined;
            if (!current || sam.findKeyForObject(current)) {
                continue;
            }
            const canonical = samTexByName.get(current.name) ?? samTexByName.get((current as any).url);
            if (canonical && canonical !== current) {
                (mat as any)[propName] = canonical;
                toDispose.add(current);
            }
        }
    }

    for (const tex of Array.from(toDispose)) {
        tex.dispose();
    }
}
