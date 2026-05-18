import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";

import { type Scene } from "core/scene";
import {
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetSmartAssetTextureExtensions,
    LoadAllSmartAssetsAsync,
    LoadSmartAssetAsync,
    RegisterSmartAsset,
    RemoveSmartAssetAsync,
    SerializeSmartAssetManagerMap,
} from "core/SmartAssets/smartAssetManager";
import { type ISerializedSmartAssetMap, DeserializeSmartAssetMap, ResolveAssetUrl, ReadJsonSourceAsync } from "core/SmartAssets/smartAssetSerializer";
import { ClearOverrides, DeserializeAndApplyOverrides, SerializeOverrides } from "./overrideManager";
import { type IOverrideEntry } from "./overrideEntry";

/**
 * Reserved smart asset key for user-created objects (materials, lights, cameras)
 * that are persisted as a companion `.babylon` file alongside the project JSON.
 */
export const ProjectLocalsKey = "__project_locals__";

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

// ── JSON layer (scene ↔ ISerializedProject) ──

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
    const companion = SerializeCompanionBabylon(scene);
    let companionBabylon: Blob | undefined;

    const assets = { ...assetMap.assets };

    if (companion) {
        companionBabylon = new Blob([JSON.stringify(companion)], { type: "application/json" });
        assets[ProjectLocalsKey] = { url: ProjectLocalsKey + ".babylon" };
    } else {
        // Remove stale companion entry if no locals exist
        delete assets[ProjectLocalsKey];
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
 * For loading the `.babylonproj` zip on-disk format, use {@link LoadProjectFileAsync}
 * instead — it extracts the zip and then calls this function with the embedded
 * JSON document.
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
    await Promise.all(Array.from(GetAllSmartAssets(scene).keys()).map(async (existingKey) => await RemoveSmartAssetAsync(scene, existingKey)));
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
        if (key === ProjectLocalsKey) {
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
        const companionEntry = doc.assets[ProjectLocalsKey];
        const companionUrl = resolvedRootUrl ? ResolveAssetUrl(companionEntry.url, resolvedRootUrl) : companionEntry.url;
        await LoadSmartAssetAsync(scene, ProjectLocalsKey, companionUrl, { extension: ".babylon" });
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
        throw new Error("ProjectFile: Invalid project file — expected an object.");
    }

    const doc = data as Record<string, unknown>;

    if (doc.version !== 2) {
        throw new Error(`ProjectFile: Unsupported project version "${doc.version}". Expected version 2.`);
    }

    // Validate the asset map portion
    DeserializeSmartAssetMap({ version: 1, assets: doc.assets });

    // Validate overrides array
    if (!Array.isArray(doc.overrides)) {
        throw new Error("ProjectFile: Invalid project file — 'overrides' must be an array.");
    }

    return data as ISerializedProject;
}

// ── Zip layer (.babylonproj on disk) ──

/**
 * Serializes a scene's project (smart assets + overrides) into a `.babylonproj`
 * zip bundle.
 *
 * The zip contains:
 * - `project.json` — the project document (assets + overrides)
 * - `__project_locals__.babylon` — companion file for user-created objects (if any)
 * - Bundled local asset files (blobs the user dragged in from disk)
 *
 * Remote URLs (http/https) are left as references and not bundled.
 *
 * @param scene - The scene to serialize.
 * @returns A Blob containing the zip bundle.
 */
export async function SaveProjectFileAsync(scene: Scene): Promise<Blob> {
    const bundle = SerializeProject(scene);
    const files: Record<string, Uint8Array> = {};

    // Collect local (blob/data URI) assets to bundle inside the zip.
    // Rewrite their URLs in the project JSON to relative paths.
    const projectAssets = { ...bundle.project.assets };

    // Fetch all blob/data URIs in parallel (avoid serial awaits in a loop).
    const blobEntries = Object.entries(projectAssets).filter(([key, entry]) => key !== ProjectLocalsKey && (entry.url.startsWith("blob:") || entry.url.startsWith("data:")));
    const fetched = await Promise.all(
        blobEntries.map(async ([key, entry]) => {
            try {
                const response = await fetch(entry.url);
                const arrayBuffer = await response.arrayBuffer();
                return { key, entry, arrayBuffer };
            } catch {
                // Can't fetch blob — leave the URL as-is (will break on reload,
                // but at least the project structure is preserved).
                return null;
            }
        })
    );
    for (const result of fetched) {
        if (!result) {
            continue;
        }
        const { key, entry, arrayBuffer } = result;
        const ext = GuessExtension(entry.url, IsTextureEntry(entry.url, entry.extension, entry.type));
        const filename = `assets/${key}${ext}`;
        files[filename] = new Uint8Array(arrayBuffer);
        projectAssets[key] = { ...entry, url: filename };
    }

    // Add companion .babylon if it exists
    if (bundle.companionBabylon) {
        const companionBuffer = await bundle.companionBabylon.arrayBuffer();
        const companionFilename = ProjectLocalsKey + ".babylon";
        files[companionFilename] = new Uint8Array(companionBuffer);
        projectAssets[ProjectLocalsKey] = { url: companionFilename };
    }

    // Write the project JSON with updated asset paths
    const projectWithBundledPaths = {
        ...bundle.project,
        assets: projectAssets,
    };
    files["project.json"] = strToU8(JSON.stringify(projectWithBundledPaths, null, 2));

    // Create the zip
    const zipped = zipSync(files, { level: 6 });
    return new Blob([zipped as BlobPart], { type: "application/zip" });
}

/**
 * Loads a `.babylonproj` zip bundle into a scene. Extracts all files, creates
 * blob URLs for bundled assets, and loads the project through SAM.
 *
 * @param scene - The scene to load the project into.
 * @param zipFile - The `.babylonproj` zip file to load.
 */
export async function LoadProjectFileAsync(scene: Scene, zipFile: File): Promise<void> {
    const arrayBuffer = await zipFile.arrayBuffer();
    const extracted = unzipSync(new Uint8Array(arrayBuffer));

    // Parse project.json
    const projectJsonBytes = extracted["project.json"];
    if (!projectJsonBytes) {
        throw new Error("ProjectFile: Invalid project bundle — missing project.json");
    }
    const projectJson = JSON.parse(strFromU8(projectJsonBytes));

    // Create blob URLs for all bundled files and rewrite asset URLs
    for (const [, entry] of Object.entries(projectJson.assets as Record<string, { url: string }>)) {
        const filename = entry.url;
        const fileBytes = extracted[filename];
        if (fileBytes) {
            const mimeType = GuessMimeType(filename);
            // Use a named File so LoadAssetContainerAsync can detect the
            // format from the filename (blob URLs alone have no extension).
            const file = new File([fileBytes as BlobPart], filename, { type: mimeType });
            const blobUrl = URL.createObjectURL(file);
            entry.url = blobUrl;
        }
        // If no file found in zip, assume the URL is a remote reference — leave it as-is
    }

    // Load through the standard JSON path
    await LoadProjectAsync(scene, projectJson);

    // Note: textures and scene files may still reference the blob URLs created
    // above, so we do NOT revoke them here. They'll be cleaned up when SAM disposes.
}

// ── Private ──

/**
 * Returns true if a scene object is a "local" — not owned by any external
 * smart asset, or owned by the reserved `__project_locals__` key.
 * @param scene - The scene that owns the object.
 * @param obj - The scene object to check.
 * @returns True if the object should be included in the companion file.
 */
function IsLocalObject(scene: Scene, obj: object): boolean {
    const key = FindSmartAssetKeyForObject(scene, obj as any);
    return key === undefined || key === ProjectLocalsKey;
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
function SerializeCompanionBabylon(scene: Scene): Record<string, unknown> | null {
    const materials: any[] = [];

    for (const mat of scene.materials) {
        if (mat.name !== "default material" && IsLocalObject(scene, mat)) {
            const serialized = mat.serialize();
            if (serialized) {
                RewriteTextureUrls(scene, serialized);
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
function RewriteTextureUrls(scene: Scene, serializedMaterial: Record<string, unknown>): void {
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

/**
 * Returns true if a serialized asset entry refers to a standalone texture,
 * based on the registered options or the URL extension.
 * @param url - The asset URL.
 * @param extension - Optional explicit extension hint from the registration options.
 * @param type - Optional explicit type from the registration options.
 * @returns True if the entry should be treated as a texture.
 */
function IsTextureEntry(url: string, extension: string | undefined, type: string | undefined): boolean {
    if (type === "texture") {
        return true;
    }
    const textureExts = GetSmartAssetTextureExtensions();
    if (extension && textureExts.has(extension.toLowerCase())) {
        return true;
    }
    const ext = ExtractExtension(url);
    return ext !== "" && textureExts.has(ext);
}

/**
 * Extracts the file extension (with leading dot, lowercased) from a URL,
 * stripping query/hash and ignoring blob/data prefixes.
 * @param url - The URL to inspect.
 * @returns The extension including the leading dot, or "" if none found.
 */
function ExtractExtension(url: string): string {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
        return "";
    }
    const clean = url.split("?")[0].split("#")[0];
    const lastDot = clean.lastIndexOf(".");
    const lastSlash = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
    if (lastDot > lastSlash && lastDot >= 0) {
        return clean.substring(lastDot).toLowerCase();
    }
    return "";
}

/**
 * Guesses a file extension for a blob/data URL when bundling into the zip.
 * @param url - The original URL.
 * @param isTexture - Whether the key is known to be a texture.
 * @returns A file extension including the dot (e.g. ".glb", ".png").
 */
function GuessExtension(url: string, isTexture: boolean): string {
    // Try to extract from data URI mime type
    if (url.startsWith("data:")) {
        const mimeMatch = url.match(/^data:([^;,]+)/);
        if (mimeMatch) {
            const ext = MimeToExtension(mimeMatch[1]);
            if (ext) {
                return ext;
            }
        }
    }
    return isTexture ? ".png" : ".glb";
}

// Tuple-array `Map`s rather than object literals so the MIME and extension
// keys (e.g. "model/gltf-binary", ".glb") don't trigger the naming-convention
// rule that runs on object-literal property names.
const MimeToExtensionMap = new Map<string, string>([
    ["model/gltf-binary", ".glb"],
    ["model/gltf+json", ".gltf"],
    ["image/png", ".png"],
    ["image/jpeg", ".jpg"],
    ["image/webp", ".webp"],
    ["application/octet-stream", ".glb"],
    ["application/json", ".babylon"],
]);

const ExtensionToMimeMap = new Map<string, string>([
    [".glb", "model/gltf-binary"],
    [".gltf", "model/gltf+json"],
    [".babylon", "application/json"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".env", "application/octet-stream"],
    [".hdr", "application/octet-stream"],
    [".dds", "application/octet-stream"],
    [".ktx", "application/octet-stream"],
    [".ktx2", "application/octet-stream"],
    [".json", "application/json"],
]);

/**
 * Maps a MIME type to a file extension.
 * @param mime - The MIME type string.
 * @returns The file extension including the dot, or empty string if unknown.
 */
function MimeToExtension(mime: string): string {
    return MimeToExtensionMap.get(mime) ?? "";
}

/**
 * Guesses a MIME type from a filename.
 * @param filename - The filename to check.
 * @returns The guessed MIME type string.
 */
function GuessMimeType(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    return ExtensionToMimeMap.get(ext) ?? "application/octet-stream";
}
