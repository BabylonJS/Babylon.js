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
 *
 * Runtime object ownership is intentionally not persisted — it is rebuilt from
 * each loaded `AssetContainer` after load. Persisting it would risk staleness.
 */
export interface ISerializedSmartAssetMap {
    /** Schema version. Must be 1 for the current version. */
    readonly version: 1;

    /** Map of asset keys to their serialized entries. */
    readonly assets: Record<string, ISerializedSmartAssetEntry>;
}

/**
 * Validates and parses a serialized smart asset map document.
 * @param data - The raw data to validate (typically parsed JSON).
 * @returns The validated document.
 * @throws If the data does not conform to the expected schema.
 */
export function DeserializeSmartAssetMap(data: unknown): ISerializedSmartAssetMap {
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
 * Returns true for `data:`, `blob:`, or any URL with an absolute protocol.
 * @param url - The URL to inspect.
 * @returns Whether the URL is absolute or a data/blob URI.
 */
export function IsAbsoluteOrSpecialUrl(url: string): boolean {
    return url.startsWith("data:") || url.startsWith("blob:") || Tools.IsAbsoluteUrl(url);
}

/**
 * Resolves an asset URL relative to a base URL.
 * Absolute URLs (http://, https://) and data URIs are returned as-is.
 * @param assetUrl - The asset URL to resolve.
 * @param baseUrl - The base URL to resolve against (typically the folder containing the asset map file).
 * @returns The resolved URL.
 */
export function ResolveAssetUrl(assetUrl: string, baseUrl: string): string {
    if (IsAbsoluteOrSpecialUrl(assetUrl)) {
        return assetUrl;
    }
    return Tools.GetFolderPath(baseUrl) + assetUrl;
}

/**
 * Makes a URL relative to a base URL by stripping the common folder prefix.
 * If the URL doesn't share a prefix with baseUrl, returns it unchanged.
 * @param url - The URL to relativize.
 * @param baseUrl - The base URL whose folder is the relativization root.
 * @returns The relativized URL, or the original if no common prefix exists.
 */
export function MakeRelative(url: string, baseUrl: string): string {
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
export async function ReadJsonSourceAsync(source: string | File | object): Promise<unknown> {
    if (typeof source === "string") {
        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`SmartAssetSerializer: Failed to fetch "${source}" — HTTP ${response.status}`);
        }
        return await response.json();
    }

    if (source instanceof File) {
        return await new Promise<unknown>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    resolve(JSON.parse(reader.result as string));
                } catch {
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
