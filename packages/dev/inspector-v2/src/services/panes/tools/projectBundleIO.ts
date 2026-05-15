import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";

import { type Scene } from "core/scene";
import { GetSmartAssetTextureExtensions } from "core/SmartAssets/smartAssetManager";
import { SerializeProject, LoadProjectAsync, PROJECT_LOCALS_KEY } from "../../../projects/projectSerializer";

/**
 * Serializes a project into a `.babylonproj` zip bundle.
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
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function saveProjectBundleAsync(scene: Scene): Promise<Blob> {
    const bundle = SerializeProject(scene);
    const files: Record<string, Uint8Array> = {};

    // Collect local (blob/data URI) assets to bundle inside the zip.
    // Rewrite their URLs in the project JSON to relative paths.
    const projectAssets = { ...bundle.project.assets };

    // Fetch all blob/data URIs in parallel (avoid serial awaits in a loop).
    const blobEntries = Object.entries(projectAssets).filter(([key, entry]) => key !== PROJECT_LOCALS_KEY && (entry.url.startsWith("blob:") || entry.url.startsWith("data:")));
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
        const ext = _guessExtension(entry.url, key, _isTextureEntry(entry.url, entry.extension, entry.type));
        const filename = `assets/${key}${ext}`;
        files[filename] = new Uint8Array(arrayBuffer);
        projectAssets[key] = { ...entry, url: filename };
    }

    // Add companion .babylon if it exists
    if (bundle.companionBabylon) {
        const companionBuffer = await bundle.companionBabylon.arrayBuffer();
        const companionFilename = PROJECT_LOCALS_KEY + ".babylon";
        files[companionFilename] = new Uint8Array(companionBuffer);
        projectAssets[PROJECT_LOCALS_KEY] = { url: companionFilename };
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
 * Loads a `.babylonproj` zip bundle into a scene. Extracts all files,
 * creates blob URLs for bundled assets, and loads the project through SAM.
 *
 * @param scene - The scene to load the project into.
 * @param zipFile - The zip file to load.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function loadProjectBundleAsync(scene: Scene, zipFile: File): Promise<void> {
    const arrayBuffer = await zipFile.arrayBuffer();
    const extracted = unzipSync(new Uint8Array(arrayBuffer));

    // Parse project.json
    const projectJsonBytes = extracted["project.json"];
    if (!projectJsonBytes) {
        throw new Error("Invalid project bundle: missing project.json");
    }
    const projectJson = JSON.parse(strFromU8(projectJsonBytes));

    // Create blob URLs for all bundled files and rewrite asset URLs
    for (const [, entry] of Object.entries(projectJson.assets as Record<string, { url: string }>)) {
        const filename = entry.url;
        const fileBytes = extracted[filename];
        if (fileBytes) {
            const mimeType = _guessMimeType(filename);
            // Use a named File so LoadAssetContainerAsync can detect the
            // format from the filename (blob URLs alone have no extension).
            const file = new File([fileBytes as BlobPart], filename, { type: mimeType });
            const blobUrl = URL.createObjectURL(file);
            entry.url = blobUrl;
        }
        // If no file found in zip, assume the URL is a remote reference — leave it as-is
    }

    // Load through the standard path
    await LoadProjectAsync(scene, projectJson);

    // Clean up blob URLs after loading (SAM has already consumed them)
    // Note: textures and scene files may still reference these URLs internally,
    // so we do NOT revoke them here. They'll be cleaned up when SAM disposes.
}

/**
 * Returns true if a serialized asset entry refers to a standalone texture,
 * based on the registered options or the URL extension.
 * @param url - The asset URL.
 * @param extension - Optional explicit extension hint from the registration options.
 * @param type - Optional explicit type from the registration options.
 * @returns True if the entry should be treated as a texture.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _isTextureEntry(url: string, extension: string | undefined, type: string | undefined): boolean {
    if (type === "texture") {
        return true;
    }
    const textureExts = GetSmartAssetTextureExtensions();
    if (extension && textureExts.has(extension.toLowerCase())) {
        return true;
    }
    const ext = _extractExtension(url);
    return ext !== "" && textureExts.has(ext);
}

/**
 * Extracts the file extension (with leading dot, lowercased) from a URL,
 * stripping query/hash and ignoring blob/data prefixes.
 * @param url - The URL to inspect.
 * @returns The extension including the leading dot, or "" if none found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _extractExtension(url: string): string {
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
 * Guesses a file extension for a blob/data URL based on context.
 * @param url - The original URL.
 * @param key - The smart asset key.
 * @param isTexture - Whether the key is known to be a texture.
 * @returns A file extension including the dot (e.g. ".glb", ".png").
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _guessExtension(url: string, key: string, isTexture: boolean): string {
    // Try to extract from data URI mime type
    if (url.startsWith("data:")) {
        const mimeMatch = url.match(/^data:([^;,]+)/);
        if (mimeMatch) {
            const ext = _mimeToExtension(mimeMatch[1]);
            if (ext) {
                return ext;
            }
        }
    }
    return isTexture ? ".png" : ".glb";
}

/**
 * Maps a MIME type to a file extension.
 * @param mime - The MIME type string.
 * @returns The file extension including the dot, or empty string if unknown.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _mimeToExtension(mime: string): string {
    const map: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "model/gltf-binary": ".glb",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "model/gltf+json": ".gltf",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "image/png": ".png",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "image/jpeg": ".jpg",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "image/webp": ".webp",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "application/octet-stream": ".glb",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "application/json": ".babylon",
    };
    return map[mime] ?? "";
}

/**
 * Guesses a MIME type from a filename.
 * @param filename - The filename to check.
 * @returns The guessed MIME type string.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _guessMimeType(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    const map: Record<string, string> = {
        ".glb": "model/gltf-binary",
        ".gltf": "model/gltf+json",
        ".babylon": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".env": "application/octet-stream",
        ".hdr": "application/octet-stream",
        ".dds": "application/octet-stream",
        ".ktx": "application/octet-stream",
        ".ktx2": "application/octet-stream",
        ".json": "application/json",
    };
    return map[ext] ?? "application/octet-stream";
}
