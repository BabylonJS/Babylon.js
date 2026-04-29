import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";

import { type SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { type OverrideManager } from "core/SmartAssets/overrideManager";
import { SerializeProject, LoadProjectAsync, PROJECT_LOCALS_KEY } from "core/SmartAssets/projectSerializer";

/**
 * Serializes a project into a `.babylonproject` zip bundle.
 *
 * The zip contains:
 * - `project.json` — the project document (assets + overrides)
 * - `__project_locals__.babylon` — companion file for user-created objects (if any)
 * - Bundled local asset files (blobs the user dragged in from disk)
 *
 * Remote URLs (http/https) are left as references and not bundled.
 *
 * @param sam - The SmartAssetManager to serialize.
 * @param overrides - The OverrideManager to serialize.
 * @returns A Blob containing the zip bundle.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function saveProjectBundleAsync(sam: SmartAssetManager, overrides: OverrideManager): Promise<Blob> {
    const bundle = SerializeProject(sam, overrides);
    const files: Record<string, Uint8Array> = {};

    // Collect local (blob/data URI) assets to bundle inside the zip.
    // Rewrite their URLs in the project JSON to relative paths.
    const projectAssets = { ...bundle.project.assets };

    for (const [key, entry] of Object.entries(projectAssets)) {
        if (key === PROJECT_LOCALS_KEY) {
            // Companion is handled separately below
            continue;
        }

        if (entry.url.startsWith("blob:") || entry.url.startsWith("data:")) {
            // Fetch the blob content and bundle it
            try {
                const response = await fetch(entry.url);
                const arrayBuffer = await response.arrayBuffer();
                const ext = _guessExtension(entry.url, key, sam.isTextureKey(key));
                const filename = `assets/${key}${ext}`;
                files[filename] = new Uint8Array(arrayBuffer);
                projectAssets[key] = { ...entry, url: filename };
            } catch {
                // Can't fetch blob — leave the URL as-is (will break on reload,
                // but at least the project structure is preserved)
            }
        }
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
    return new Blob([zipped], { type: "application/zip" });
}

/**
 * Loads a `.babylonproject` zip bundle. Extracts all files, creates blob
 * URLs for bundled assets, and loads the project through SAM.
 *
 * @param zipFile - The zip file to load.
 * @param sam - The SmartAssetManager to populate.
 * @param overrides - The OverrideManager to populate.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function loadProjectBundleAsync(zipFile: File, sam: SmartAssetManager, overrides: OverrideManager): Promise<void> {
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
            const file = new File([fileBytes], filename, { type: mimeType });
            const blobUrl = URL.createObjectURL(file);
            entry.url = blobUrl;
        }
        // If no file found in zip, assume the URL is a remote reference — leave it as-is
    }

    // Load through the standard path
    await LoadProjectAsync(projectJson, sam, overrides);

    // Clean up blob URLs after loading (SAM has already consumed them)
    // Note: textures and scene files may still reference these URLs internally,
    // so we do NOT revoke them here. They'll be cleaned up when SAM disposes.
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
        "model/gltf-binary": ".glb",
        "model/gltf+json": ".gltf",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "application/octet-stream": ".glb",
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
