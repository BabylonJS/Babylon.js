import { zip, unzip, strToU8, strFromU8, type Unzipped } from "fflate";

// Side-effect import: registers the `.babylon` SceneLoader plugin so the
// companion `.babylon` file produced by SerializeProject can be loaded back.
// Without this, LoadAssetContainerAsync logs "Unable to find a plugin to
// load .babylon files" and the companion load fails.
import "core/Loading/Plugins/babylonFileLoader";

import { type Scene } from "core/scene";
import { Mesh } from "core/Meshes/mesh";
import { SceneSerializer } from "core/Misc/sceneSerializer";
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
 * ## `.babylonproj` project file format
 *
 * The `.babylonproj` zip on disk packages three layers:
 * 1. **SmartAsset registry** — URL references to external assets (glb/gltf/textures
 *    loaded via SAM). Local blob/data assets are bundled inside the zip and
 *    extracted to fresh blob URLs on load.
 * 2. **OverrideManager state** — declarative property overrides applied after load.
 * 3. **Companion `.babylon`** — meshes, lights, cameras, transform nodes, and
 *    materials that are *not* tracked by SAM (i.e. user-created scene content).
 *    Plus a `companionBindings` side table mapping material texture slots back
 *    to SAM-tracked textures so re-attachment works without embedding texture
 *    bytes in the companion.
 *
 * ### What round-trips cleanly
 * - SAM-tracked assets (re-fetched from their URLs or extracted from the zip)
 * - User-created `Mesh` geometry, `Material`s (Standard/PBR/Multi/Node), and
 *   `*Texture` slot bindings to SAM textures
 * - `Light`s, `Camera`s, `TransformNode`s, scene/material image processing,
 *   clear color, fog, environment intensity
 * - Property overrides on any of the above
 *
 * ### Known gaps (not preserved on save/load)
 * - `PostProcess` attachments to cameras (a post-process attaches to a *specific*
 *   camera instance; we dispose+recreate cameras, leaving post-processes orphaned).
 * - `AdvancedDynamicTexture` GUI controls — not in `.babylon` format.
 * - Audio (`Sound` / `AudioEngine` state).
 * - Particle systems with runtime state, baked vertex animations.
 * - Complex shader-driven content like GaussianSplatting: the mesh round-trips
 *   but its companion utility materials (`gaussianSplattingDepth`, `ProxyMaterial`)
 *   get duplicated on each load cycle.
 * - Skeleton animation playback state.
 *
 * If you hit a "the scene looks different after load" issue, it's almost
 * certainly one of the gaps above rather than camera or mesh state drift.
 */

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
 * Maps each user-created material (by name) to its texture-slot bindings.
 * A binding records "this `*Texture` slot on this material should be
 * re-attached to the SmartAsset registered under this key" so that texture
 * references survive a save/load round-trip without embedding the texture
 * data inside the companion `.babylon`.
 */
export type CompanionTextureBindings = Record<string, Record<string, string>>;

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

    /**
     * Optional bindings that re-attach SmartAsset-tracked textures to
     * user-created material slots after the companion `.babylon` loads.
     * Omitted when no user-created material references a SmartAsset texture.
     */
    readonly companionBindings?: CompanionTextureBindings;
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

    // Build a minimal .babylon JSON with only user-created objects, plus the
    // texture-binding side table that records which SmartAsset textures should
    // be re-attached to which material slots after load.
    const companionResult = SerializeCompanionBabylon(scene);
    let companionBabylon: Blob | undefined;

    const assets = { ...assetMap.assets };

    if (companionResult) {
        companionBabylon = new Blob([JSON.stringify(companionResult.companion)], { type: "application/json" });
        assets[ProjectLocalsKey] = { url: ProjectLocalsKey + ".babylon" };
    } else {
        // Remove stale companion entry if no locals exist
        delete assets[ProjectLocalsKey];
    }

    const hasBindings = companionResult && Object.keys(companionResult.bindings).length > 0;
    const project: ISerializedProject = {
        version: 2,
        assets,
        overrides,
        ...(hasBindings ? { companionBindings: companionResult.bindings } : {}),
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

    // Pause the engine's render loops for the duration of the swap. Disposing
    // cameras mid-frame would throw "No camera defined" out of `scene.render`,
    // which kills the render loop entirely (it is not re-queued after an
    // uncaught exception). Snapshot the active loops first so we can restore
    // exactly what was running, even if multiple callbacks were registered.
    const engine = scene.getEngine();
    const savedRenderLoops = [...engine.activeRenderLoops];
    engine.stopRenderLoop();

    try {
        // Clear existing state so we load fresh from the project file.
        // The companion `.babylon` (when present) is the source of truth for all
        // user-created scene content, so dispose user-owned meshes, lights,
        // cameras, materials, and animation groups before reloading.
        await Promise.all(Array.from(GetAllSmartAssets(scene).keys()).map(async (existingKey) => await RemoveSmartAssetAsync(scene, existingKey)));
        ClearOverrides(scene);

        for (const mesh of [...scene.meshes]) {
            mesh.dispose();
        }
        for (const tn of [...scene.transformNodes]) {
            tn.dispose();
        }
        for (const ag of [...scene.animationGroups]) {
            ag.dispose();
        }
        for (const mat of [...scene.materials]) {
            mat.dispose();
        }
        for (const light of [...scene.lights]) {
            light.dispose();
        }
        for (const camera of [...scene.cameras]) {
            camera.dispose();
        }

        // Register all assets. Defer the companion .babylon — it must load after
        // textures are available so binding re-attachment can find them.
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

        // Now load the companion .babylon. Its materials were saved with texture
        // slots stripped (the binding side table records which SmartAsset texture
        // each slot should be re-attached to), so the loader never sees a broken
        // texture URL. Pass the .babylon extension hint because blob URLs have
        // no file extension.
        if (hasCompanion) {
            const companionEntry = doc.assets[ProjectLocalsKey];
            const companionUrl = resolvedRootUrl ? ResolveAssetUrl(companionEntry.url, resolvedRootUrl) : companionEntry.url;
            await LoadSmartAssetAsync(scene, ProjectLocalsKey, companionUrl, { extension: ".babylon" });

            if (doc.companionBindings) {
                ApplyCompanionBindings(scene, doc.companionBindings);
            }
        }

        // Apply overrides
        if (doc.overrides.length > 0) {
            DeserializeAndApplyOverrides(scene, doc.overrides);
        }

        // Re-assign the active camera if the companion brought in fresh cameras.
        // The .babylon scene loader populates scene.cameras but does not set
        // scene.activeCamera, so render would otherwise throw "No camera defined".
        if (!scene.activeCamera && scene.cameras.length > 0) {
            scene.activeCamera = scene.cameras[0];
        }

        // Attach controls so the user can rotate/zoom/pan after load. New
        // camera instances from the companion .babylon are not attached to
        // the canvas by the loader — without this, the camera renders but
        // ignores mouse/touch input.
        const canvas = engine.getRenderingCanvas();
        if (scene.activeCamera && canvas) {
            scene.activeCamera.attachControl(canvas, true);
        }
    } finally {
        // Always restore the render loops, even if loading threw — otherwise
        // the canvas stays frozen forever and the user has no way to recover.
        for (const loop of savedRenderLoops) {
            engine.runRenderLoop(loop);
        }
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

    // Validate optional companion bindings (shape-only check)
    if (doc.companionBindings !== undefined) {
        if (typeof doc.companionBindings !== "object" || doc.companionBindings === null || Array.isArray(doc.companionBindings)) {
            throw new Error("ProjectFile: Invalid project file — 'companionBindings' must be an object.");
        }
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

    // Create the zip (async — runs in a Web Worker to avoid blocking the UI thread)
    const zipped = await new Promise<Uint8Array>((resolve, reject) => {
        zip(files, { level: 6 }, (err, data) => (err ? reject(err) : resolve(data)));
    });
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
    const extracted = await new Promise<Unzipped>((resolve, reject) => {
        unzip(new Uint8Array(arrayBuffer), (err, data) => (err ? reject(err) : resolve(data)));
    });

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
 * Builds a `.babylon`-compatible JSON containing all user-created scene
 * content (meshes, lights, cameras, transform nodes, and materials not owned
 * by any external smart asset), plus a side table recording which `*Texture`
 * slots on each material should be re-attached to which SmartAsset textures
 * after load.
 *
 * Mesh, light, camera, and standalone material serialization is delegated to
 * `SceneSerializer.SerializeMesh`, which auto-handles geometries, sub-materials,
 * and skeletons. Texture slots that map to a SmartAsset-tracked texture are
 * stripped from the serialized material so the `.babylon` loader never sees a
 * broken URL; the binding table is the sole source of truth for re-attachment.
 *
 * @param scene - The scene to extract locals from.
 * @returns The companion document and binding table, or null if there are no local objects.
 */
function SerializeCompanionBabylon(scene: Scene): { companion: Record<string, unknown>; bindings: CompanionTextureBindings } | null {
    const meshes = scene.meshes.filter((m) => m instanceof Mesh && m.name !== "__root__" && IsLocalObject(scene, m));
    const lights = scene.lights.filter((l) => IsLocalObject(scene, l));
    const cameras = scene.cameras.filter((c) => IsLocalObject(scene, c));
    const transformNodes = scene.transformNodes.filter((t) => IsLocalObject(scene, t));

    // Standalone materials (not attached to any included mesh) need to be
    // added explicitly — SerializeMesh only picks up materials reachable from
    // the supplied meshes.
    const meshMaterialIds = new Set(meshes.map((m) => m.material?.uniqueId).filter((id): id is number => id !== undefined));
    const standaloneMaterials = scene.materials.filter((mat) => mat.name !== "default material" && IsLocalObject(scene, mat) && !meshMaterialIds.has(mat.uniqueId));

    if (meshes.length === 0 && lights.length === 0 && cameras.length === 0 && transformNodes.length === 0 && standaloneMaterials.length === 0) {
        return null;
    }

    const companion = SceneSerializer.SerializeMesh([...meshes, ...lights, ...cameras, ...transformNodes], false, false) as Record<string, unknown>;

    const allMaterials = (companion.materials as any[]) ?? [];
    companion.materials = allMaterials;
    for (const mat of standaloneMaterials) {
        const serialized = mat.serialize();
        if (serialized && !allMaterials.some((m: any) => m.uniqueId === serialized.uniqueId)) {
            allMaterials.push(serialized);
        }
    }

    // Strip non-JSON-serializable metadata (e.g. metadata that references
    // another scene object) to avoid `Converting circular structure to JSON`
    // when the companion is stringified. Simple JSON metadata is preserved.
    SanitizeMetadataInPlace(companion);

    // Walk every serialized material (mesh-attached + standalone + multi-material
    // children) and extract SmartAsset texture bindings, stripping those slots
    // from the serialized data.
    const bindings: CompanionTextureBindings = {};
    for (const serializedMat of allMaterials) {
        const matBindings = ExtractTextureBindings(scene, serializedMat);
        if (Object.keys(matBindings).length > 0 && typeof serializedMat.name === "string") {
            bindings[serializedMat.name] = matBindings;
        }
    }
    const multiMaterials = (companion.multiMaterials as any[]) ?? [];
    for (const serializedMat of multiMaterials) {
        const matBindings = ExtractTextureBindings(scene, serializedMat);
        if (Object.keys(matBindings).length > 0 && typeof serializedMat.name === "string") {
            bindings[serializedMat.name] = matBindings;
        }
    }

    return { companion, bindings };
}

/**
 * Walks the top-level entity arrays in a serialized companion document and
 * strips `metadata` fields that cannot be JSON-stringified (typically because
 * the user put a reference to another scene object in metadata). Simple
 * JSON-serializable metadata is preserved.
 * @param companion - The serialized companion document to mutate in-place.
 */
function SanitizeMetadataInPlace(companion: Record<string, unknown>): void {
    const arrays: (keyof typeof companion)[] = ["meshes", "transformNodes", "lights", "cameras", "materials", "multiMaterials"];
    for (const arrayKey of arrays) {
        const arr = companion[arrayKey];
        if (!Array.isArray(arr)) {
            continue;
        }
        for (const item of arr) {
            if (item && typeof item === "object" && "metadata" in item && item.metadata !== undefined) {
                try {
                    item.metadata = JSON.parse(JSON.stringify(item.metadata));
                } catch {
                    delete item.metadata;
                }
            }
        }
    }
}

/**
 * Walks a serialized material's `*Texture` slots and, for any that reference a
 * SmartAsset-tracked texture, records a `{slot: samKey}` binding and removes
 * the slot from the serialized data so the `.babylon` loader does not try to
 * fetch the (now-dead) original URL.
 * @param scene - The scene that owns the textures.
 * @param serializedMaterial - The serialized material data to rewrite in-place.
 * @returns A map of stripped slot names to their SmartAsset keys.
 */
function ExtractTextureBindings(scene: Scene, serializedMaterial: Record<string, unknown>): Record<string, string> {
    const bindings: Record<string, string> = {};

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
                bindings[propName] = key;
                delete serializedMaterial[propName];
                break;
            }
        }
    }

    return bindings;
}

/**
 * Re-attaches SmartAsset-tracked textures to user-created material slots
 * after the companion `.babylon` has loaded. Silently skips bindings whose
 * material or texture is no longer present (e.g. the underlying SmartAsset
 * was removed before reload).
 * @param scene - The scene that owns the materials and textures.
 * @param bindings - The binding table from the project document.
 */
function ApplyCompanionBindings(scene: Scene, bindings: CompanionTextureBindings): void {
    for (const [materialName, slots] of Object.entries(bindings)) {
        const mat = scene.materials.find((m) => m.name === materialName);
        if (!mat) {
            continue;
        }
        for (const [slotName, samKey] of Object.entries(slots)) {
            const texture = scene.textures.find((tex) => FindSmartAssetKeyForObject(scene, tex) === samKey);
            if (texture) {
                (mat as any)[slotName] = texture;
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
