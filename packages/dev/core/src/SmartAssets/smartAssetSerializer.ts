import type { ISmartAssetProvenance } from "./smartAssetProvenance";
import type { SmartAssetManager } from "./smartAssetManager";
import { Tools } from "../Misc/tools";

/**
 * A serialized smart asset entry in the asset map JSON document.
 */
export interface ISerializedSmartAssetEntry {
    /** URL or path to the asset file. */
    readonly url: string;

    /** Optional loader type hint (e.g., "gltf", "texture"). */
    readonly type?: string;

    /** Optional file extension hint (e.g., ".glb", ".png"). */
    readonly extension?: string;

    /** Optional user-defined metadata. */
    readonly metadata?: Record<string, unknown>;
}

/**
 * A versioned JSON document describing a smart asset map.
 * This is the on-disk format for persisting the asset table.
 */
export interface ISerializedSmartAssetMap {
    /** Schema version. Must be 1 for the current version. */
    readonly version: 1;

    /** Map of asset keys to their serialized entries. */
    readonly assets: Record<string, ISerializedSmartAssetEntry>;

    /** Optional provenance snapshot recording which objects each key produced. Informational only. */
    readonly provenance?: Record<string, ISmartAssetProvenance>;
}

/**
 * Serializes a SmartAssetManager's asset table to a JSON-compatible document.
 * If a baseUrl is provided, asset URLs are stored relative to it for portability.
 * @param manager - The SmartAssetManager to serialize.
 * @param baseUrl - Optional base URL for making asset paths relative.
 * @returns A serialized asset map document.
 */
export function serializeSmartAssetMap(manager: SmartAssetManager, baseUrl?: string): ISerializedSmartAssetMap {
    const assets: Record<string, ISerializedSmartAssetEntry> = {};
    const provenance: Record<string, ISmartAssetProvenance> = {};
    let hasProvenance = false;

    for (const [key, registeredUrl] of manager.getAll()) {
        let url = registeredUrl;

        if (baseUrl && !_isAbsoluteOrSpecialUrl(url)) {
            url = _makeRelative(url, baseUrl);
        }

        assets[key] = { url, ...(manager.isTextureKey(key) ? { type: "texture" } : {}) };

        const prov = manager.getProvenance(key);
        if (prov) {
            provenance[key] = prov;
            hasProvenance = true;
        }
    }

    return {
        version: 1,
        assets,
        ...(hasProvenance ? { provenance } : {}),
    };
}

/**
 * Validates and parses a serialized smart asset map document.
 * @param data - The raw data to validate (typically parsed JSON).
 * @returns The validated document.
 * @throws If the data does not conform to the expected schema.
 */
export function deserializeSmartAssetMap(data: unknown): ISerializedSmartAssetMap {
    if (!data || typeof data !== "object") {
        throw new Error("SmartAssetSerializer: Invalid asset map — expected an object.");
    }

    const doc = data as Record<string, unknown>;

    if (doc.version !== 1) {
        throw new Error(`SmartAssetSerializer: Unsupported asset map version "${doc.version}". Expected version 1.`);
    }

    if (!doc.assets || typeof doc.assets !== "object" || Array.isArray(doc.assets)) {
        throw new Error("SmartAssetSerializer: Invalid asset map — 'assets' must be an object.");
    }

    const assets = doc.assets as Record<string, unknown>;
    for (const [key, entry] of Object.entries(assets)) {
        if (!entry || typeof entry !== "object") {
            throw new Error(`SmartAssetSerializer: Invalid entry for key "${key}" — expected an object.`);
        }
        const entryObj = entry as Record<string, unknown>;
        if (typeof entryObj.url !== "string" || entryObj.url.length === 0) {
            throw new Error(`SmartAssetSerializer: Invalid entry for key "${key}" — 'url' must be a non-empty string.`);
        }
    }

    return data as ISerializedSmartAssetMap;
}

/**
 * Resolves an asset URL relative to a base URL.
 * Absolute URLs (http://, https://) and data URIs are returned as-is.
 * @param assetUrl - The asset URL to resolve.
 * @param baseUrl - The base URL to resolve against (typically the folder containing the asset map file).
 * @returns The resolved URL.
 */
export function resolveAssetUrl(assetUrl: string, baseUrl: string): string {
    if (_isAbsoluteOrSpecialUrl(assetUrl)) {
        return assetUrl;
    }
    // Ensure baseUrl ends with a folder separator
    const folder = Tools.GetFolderPath(baseUrl);
    return folder + assetUrl;
}

/**
 * Checks whether a URL is absolute (has a protocol) or a data/blob URI.
 */
function _isAbsoluteOrSpecialUrl(url: string): boolean {
    return url.startsWith("data:") || url.startsWith("blob:") || Tools.IsAbsoluteUrl(url);
}

/**
 * Makes a URL relative to a base URL by stripping the common prefix.
 * If the URL doesn't share a prefix with baseUrl, returns it unchanged.
 */
function _makeRelative(url: string, baseUrl: string): string {
    const folder = Tools.GetFolderPath(baseUrl);
    if (url.startsWith(folder)) {
        return url.substring(folder.length);
    }
    return url;
}

/**
 * Reads a JSON source from a string URL, File object, or pre-parsed object.
 * @param source - The source to read.
 * @returns A promise resolving to the parsed JSON data.
 */
export async function readJsonSource(source: string | File | object): Promise<unknown> {
    if (typeof source === "string") {
        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`SmartAssetSerializer: Failed to fetch "${source}" — HTTP ${response.status}`);
        }
        return response.json();
    }

    if (source instanceof File) {
        return new Promise<unknown>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    resolve(JSON.parse(reader.result as string));
                } catch (e) {
                    reject(new Error(`SmartAssetSerializer: Failed to parse JSON from file "${source.name}".`));
                }
            };
            reader.onerror = () => reject(new Error(`SmartAssetSerializer: Failed to read file "${source.name}".`));
            reader.readAsText(source);
        });
    }

    // Already a parsed object
    return source;
}
