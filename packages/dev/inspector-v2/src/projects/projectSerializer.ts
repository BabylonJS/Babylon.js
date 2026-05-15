import {
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    LoadAllSmartAssetsAsync,
    LoadSmartAssetAsync,
    RegisterSmartAsset,
    RemoveSmartAssetAsync,
    SerializeSmartAssetManagerMap,
} from "core/SmartAssets/smartAssetManager";
import { ClearOverrides, DeserializeAndApplyOverrides, SerializeOverrides } from "./overrideManager";
import { type ISerializedSmartAssetMap, DeserializeSmartAssetMap, ResolveAssetUrl, ReadJsonSourceAsync } from "core/SmartAssets/smartAssetSerializer";
import { type IOverrideEntry } from "./overrideEntry";
import { type Scene } from "core/scene";

/**
 * Reserved smart asset key for user-created objects (materials, lights, cameras)
 * that are persisted as a companion `.babylon` file alongside the project JSON.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PROJECT_LOCALS_KEY = "__project_locals__";

/**
 * The result of serializing a project. Contains the project JSON and,
 * if the scene has user-created objects, a companion `.babylon` blob.
 */
export interface IProjectBundle {
    /** The project JSON document (assets + overrides, no embedded scene data). */
    readonly project: ISerializedProject;

    /**
     * A companion `.babylon` file containing user-created objects not owned by
     * any smart asset. Undefined if there are no such objects.
     */
    readonly companionBabylon?: Blob;
}

/**
 * A versioned project file that composes a smart asset map with overrides.
 * This is the unified on-disk format for persisting a complete project.
 */
export interface ISerializedProject {
    /** Schema version. Must be 2 for the current version. */
    readonly version: 2;

    /** Smart asset key→URL mappings (from SmartAssetManager). */
    readonly assets: ISerializedSmartAssetMap["assets"];

    /** Property overrides (from OverrideManager). */
    readonly overrides: IOverrideEntry[];
}

/**
 * Serializes a scene's smart asset map and override registry into a project
 * bundle. User-created objects (materials, lights, cameras not owned by any
 * smart asset) are serialized into a companion `.babylon` file rather than
 * embedded in the project JSON.
 *
 * Both managers are looked up (and created if missing) via their respective
 * `Get…Manager(scene)` accessors, so this function can be called on any scene.
 *
 * @param scene - The scene to serialize.
 * @param baseUrl - Optional base URL for making asset paths relative.
 * @returns A project bundle containing the JSON document and optional companion file.
 */
export function SerializeProject(scene: Scene, baseUrl?: string): IProjectBundle {
    const assetMap = SerializeSmartAssetManagerMap(scene, baseUrl);
    const overrides = SerializeOverrides(scene);

    // Build a minimal .babylon JSON with only user-created objects
    const companion = _serializeCompanionBabylon(scene);
    let companionBabylon: Blob | undefined;

    const assets = { ...assetMap.assets };

    if (companion) {
        companionBabylon = new Blob([JSON.stringify(companion)], { type: "application/json" });
        assets[PROJECT_LOCALS_KEY] = { url: PROJECT_LOCALS_KEY + ".babylon" };
    } else {
        // Remove stale companion entry if no locals exist
        delete assets[PROJECT_LOCALS_KEY];
    }

    const project: ISerializedProject = {
        version: 2,
        assets,
        overrides,
    };

    return { project, companionBabylon };
}

/**
 * Loads a project file from a URL, File, or pre-parsed object.
 * Registers all asset entries on the scene's SmartAssetManager, loads all
 * assets (including the companion `.babylon` for user-created objects), then
 * applies all overrides via the OverrideManager.
 *
 * @param scene - The scene to populate.
 * @param source - A URL string, File object, or pre-parsed ISerializedProject.
 * @param rootUrl - Optional root URL for resolving relative asset paths.
 */
export async function LoadProjectAsync(scene: Scene, source: string | File | ISerializedProject, rootUrl?: string): Promise<void> {
    let resolvedRootUrl = rootUrl ?? "";

    if (typeof source === "string" && !rootUrl) {
        const { Tools } = await import("core/Misc/tools");
        resolvedRootUrl = Tools.GetFolderPath(source);
    }

    const raw = await ReadJsonSourceAsync(source);
    const doc = DeserializeProject(raw);

    // Clear existing state so we load fresh from the project file
    for (const existingKey of Array.from(GetAllSmartAssets(scene).keys())) {
        // eslint-disable-next-line no-await-in-loop
        await RemoveSmartAssetAsync(scene, existingKey);
    }
    ClearOverrides(scene);

    // Clear asset-loaded meshes, animation groups, and materials.
    // Preserve cameras and lights — they are scene furniture managed by the host.
    for (const mesh of [...scene.meshes]) {
        mesh.dispose();
    }
    for (const ag of [...scene.animationGroups]) {
        ag.dispose();
    }
    for (const mat of [...scene.materials]) {
        mat.dispose();
    }

    // Register all assets. Defer the companion .babylon — it must load after
    // textures are available because its materials use asset:// texture refs.
    let hasCompanion = false;
    for (const [key, entry] of Object.entries(doc.assets)) {
        if (key === PROJECT_LOCALS_KEY) {
            hasCompanion = true;
            continue;
        }
        const resolved = resolvedRootUrl ? ResolveAssetUrl(entry.url, resolvedRootUrl) : entry.url;
        RegisterSmartAsset(scene, key, resolved, { type: entry.type, extension: entry.extension, metadata: entry.metadata });
    }

    await LoadAllSmartAssetsAsync(scene);

    // Now load the companion .babylon — textures are ready so asset:// refs resolve.
    // Pass the .babylon extension hint because blob URLs have no file extension.
    if (hasCompanion) {
        const companionEntry = doc.assets[PROJECT_LOCALS_KEY];
        const companionUrl = resolvedRootUrl ? ResolveAssetUrl(companionEntry.url, resolvedRootUrl) : companionEntry.url;
        await LoadSmartAssetAsync(scene, PROJECT_LOCALS_KEY, companionUrl, { extension: ".babylon" });
    }

    // Apply overrides
    if (doc.overrides.length > 0) {
        DeserializeAndApplyOverrides(scene, doc.overrides);
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

    if (doc.version !== 2) {
        throw new Error(`ProjectSerializer: Unsupported project version "${doc.version}". Expected version 2.`);
    }

    // Validate the asset map portion
    DeserializeSmartAssetMap({ version: 1, assets: doc.assets });

    // Validate overrides array
    if (!Array.isArray(doc.overrides)) {
        throw new Error("ProjectSerializer: Invalid project file — 'overrides' must be an array.");
    }

    return data as ISerializedProject;
}

// ── Companion .babylon builder ──

/**
 * Returns true if a scene object is a "local" — not owned by any external
 * smart asset, or owned by the reserved `__project_locals__` key.
 * @param scene - The scene that owns the object.
 * @param obj - The scene object to check.
 * @returns True if the object should be included in the companion file.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _isLocalObject(scene: Scene, obj: object): boolean {
    const key = FindSmartAssetKeyForObject(scene, obj as any);
    return key === undefined || key === PROJECT_LOCALS_KEY;
}

/**
 * Builds a minimal `.babylon`-compatible JSON containing only scene materials
 * that are not owned by any external smart asset. Texture references on
 * materials are rewritten to `asset://key` for SAM-tracked textures so they
 * resolve correctly via the protocol hook.
 *
 * Note: lights and cameras are not currently serialized into the companion
 * file. User-created lights/cameras will not survive a save/load cycle.
 *
 * @param scene - The scene to extract locals from.
 * @returns A `.babylon`-format object, or null if there are no local objects.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _serializeCompanionBabylon(scene: Scene): Record<string, unknown> | null {
    const materials: any[] = [];

    for (const mat of scene.materials) {
        if (mat.name !== "default material" && _isLocalObject(scene, mat)) {
            const serialized = mat.serialize();
            if (serialized) {
                _rewriteTextureUrls(scene, serialized);
                materials.push(serialized);
            }
        }
    }

    if (materials.length === 0) {
        return null;
    }

    return { materials };
}

/**
 * Rewrites texture URLs in serialized material data to use `asset://key`
 * for textures tracked by the SmartAssetManager. When the companion .babylon
 * is loaded, the SAM protocol hook resolves these to real URLs.
 * @param scene - The scene that owns the textures.
 * @param serializedMaterial - The serialized material data to rewrite in-place.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _rewriteTextureUrls(scene: Scene, serializedMaterial: Record<string, unknown>): void {
    for (const [propName, propValue] of Object.entries(serializedMaterial)) {
        if (!propName.endsWith("Texture") || typeof propValue !== "object" || propValue === null) {
            continue;
        }
        const texData = propValue as Record<string, unknown>;
        const texName = typeof texData.name === "string" ? texData.name : undefined;
        const texUrl = typeof texData.url === "string" ? texData.url : undefined;
        if (!texName && !texUrl) {
            continue;
        }

        for (const tex of scene.textures) {
            const key = FindSmartAssetKeyForObject(scene, tex);
            if (key && (tex.name === texName || (tex as any).url === texName || tex.name === texUrl || (tex as any).url === texUrl)) {
                const assetUrl = `asset://${key}`;
                texData.name = assetUrl;
                if (typeof texData.url === "string") {
                    texData.url = assetUrl;
                }
                break;
            }
        }
    }
}
