import type { SmartAssetManager } from "./smartAssetManager";
import type { OverrideManager } from "./overrideManager";
import type { ISerializedProject } from "./projectSerializer";
import { serializeProject } from "./projectSerializer";

/**
 * Describes a file entry in a project bundle.
 */
export interface IBundleFileEntry {
    /** Path within the bundle (e.g., "assets/chair.glb"). */
    readonly path: string;

    /** The file data as an ArrayBuffer, Blob, or string URL to fetch. */
    readonly data: ArrayBuffer | Blob | string;
}

/**
 * The result of preparing a project bundle — the project JSON and
 * all referenced files with rewritten relative paths.
 *
 * The consumer is responsible for actual zip compression using their
 * preferred library (fflate, JSZip, etc.).
 */
export interface IPreparedBundle {
    /** The project JSON with asset URLs rewritten to relative bundle paths. */
    readonly projectJson: ISerializedProject;

    /** All files that need to be included in the bundle. */
    readonly files: IBundleFileEntry[];
}

/**
 * Prepares a project bundle by collecting all referenced asset files and
 * rewriting their URLs to relative paths within the bundle.
 *
 * This does NOT perform zip compression — it produces the data needed
 * for a consumer to create the zip using their preferred library.
 *
 * @param smartAssetManager - The asset manager with registered assets.
 * @param overrideManager - The override manager with property diffs.
 * @returns A prepared bundle with project JSON and file entries.
 *
 * @example
 * ```typescript
 * const bundle = await prepareBundleAsync(sam, overrides);
 *
 * // Use fflate, JSZip, or any zip library to create the archive:
 * const zip = new JSZip();
 * zip.file("project.json", JSON.stringify(bundle.projectJson, null, 2));
 * for (const file of bundle.files) {
 *     zip.file(file.path, file.data);
 * }
 * const blob = await zip.generateAsync({ type: "blob" });
 * ```
 */
export async function prepareBundleAsync(smartAssetManager: SmartAssetManager, overrideManager: OverrideManager): Promise<IPreparedBundle> {
    const files: IBundleFileEntry[] = [];
    const urlToPath = new Map<string, string>();
    let fileIndex = 0;

    // Collect all asset URLs and assign bundle-relative paths
    for (const [key, url] of smartAssetManager.getAll()) {
        if (urlToPath.has(url)) {
            continue; // Same URL referenced by multiple keys — include once
        }

        const fileName = _extractFileName(url) || `asset_${fileIndex}`;
        const bundlePath = `assets/${fileName}`;
        urlToPath.set(url, bundlePath);
        fileIndex++;

        // Fetch the file data
        const data = await _fetchAsData(url);
        files.push({ path: bundlePath, data });
    }

    // Build project JSON with rewritten URLs
    const project = serializeProject(smartAssetManager, overrideManager);
    const rewrittenAssets: Record<string, { url: string }> = {};

    for (const [key, entry] of Object.entries(project.assets)) {
        const originalUrl = smartAssetManager.resolve(key) ?? entry.url;
        const bundlePath = urlToPath.get(originalUrl) ?? entry.url;
        rewrittenAssets[key] = { url: bundlePath };
    }

    const bundleProject: ISerializedProject = {
        version: 1,
        assets: rewrittenAssets,
        overrides: project.overrides,
    };

    return {
        projectJson: bundleProject,
        files,
    };
}

/**
 * Loads a project from a prepared bundle's project JSON and file data.
 * This is the inverse of prepareBundleAsync — takes the unpacked bundle
 * contents and loads the project.
 *
 * @param projectJson - The parsed project.json from the bundle.
 * @param fileBlobs - A map from bundle-relative paths to Blob/ArrayBuffer data.
 * @param smartAssetManager - The asset manager to populate.
 * @param overrideManager - The override manager to populate.
 */
export async function loadBundleAsync(
    projectJson: ISerializedProject,
    fileBlobs: Map<string, Blob>,
    smartAssetManager: SmartAssetManager,
    overrideManager: OverrideManager
): Promise<void> {
    // Create blob URLs for all bundled files
    const blobUrls = new Map<string, string>();

    for (const [path, blob] of fileBlobs) {
        blobUrls.set(path, URL.createObjectURL(blob));
    }

    // Register assets with blob URLs
    for (const [key, entry] of Object.entries(projectJson.assets)) {
        const blobUrl = blobUrls.get(entry.url);
        const resolvedUrl = blobUrl ?? entry.url;
        smartAssetManager.register(key, resolvedUrl);
    }

    // Load all assets
    await smartAssetManager.loadAllAsync();

    // Apply overrides
    if (projectJson.overrides.length > 0) {
        overrideManager.deserializeAndApply(projectJson.overrides);
    }
}

/**
 * Extracts a filename from a URL, stripping query strings and path segments.
 */
function _extractFileName(url: string): string {
    const cleanUrl = url.split("?")[0].split("#")[0];
    const lastSlash = Math.max(cleanUrl.lastIndexOf("/"), cleanUrl.lastIndexOf("\\"));
    return lastSlash >= 0 ? cleanUrl.substring(lastSlash + 1) : cleanUrl;
}

/**
 * Fetches a URL and returns its data as an ArrayBuffer.
 */
async function _fetchAsData(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`ProjectBundle: Failed to fetch "${url}" — HTTP ${response.status}`);
    }
    return response.arrayBuffer();
}
