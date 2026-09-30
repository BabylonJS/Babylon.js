function _NormalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").toLowerCase();
}

function _CanonicalPath(path: string): string {
    const parts: string[] = [];
    for (const part of _NormalizePath(path).split("/")) {
        if (part === "" || part === ".") {
            continue;
        }
        if (part === ".." && parts.length && parts[parts.length - 1] !== "..") {
            parts.pop();
        } else {
            parts.push(part);
        }
    }
    return parts.join("/");
}

function _ResourcePath(uri: string): string {
    try {
        return _NormalizePath(decodeURIComponent(uri));
    } catch {
        throw new Error(`Invalid companion resource URI: ${uri}`);
    }
}

/** A recoverable local resource that needs an explicit file choice. */
export class GltfCompanionResolutionError extends Error {
    /** The referenced glTF resource URI. */
    public readonly uri: string;
    /** Why automatic matching could not choose a file. */
    public readonly kind: "missing" | "ambiguous";

    /**
     * @param kind matching failure
     * @param uri referenced glTF resource URI
     * @param message user-facing description
     */
    constructor(kind: "missing" | "ambiguous", uri: string, message: string) {
        super(message);
        this.name = "GltfCompanionResolutionError";
        this.kind = kind;
        this.uri = uri;
    }
}

/**
 * Get the virtual file keys used by Babylon's buffer and image loaders.
 * @param uri local resource URI
 * @returns keys with and without an initial dot path segment when needed
 */
export function GetGltfResourceKeys(uri: string): string[] {
    const normalized = _ResourcePath(uri);
    const decoded = decodeURIComponent(uri).replace(/\\/g, "/").toLowerCase();
    return normalized === decoded ? [normalized] : [normalized, decoded];
}

/**
 * Matches referenced local resources to dropped files without conflating two
 * textures that happen to share a basename in different directories.
 * @param mainFile dropped glTF file
 * @param resourceUris local or remote resource URIs referenced by the glTF
 * @param companions other dropped files
 * @param sourcePath original path of the main file, retained after an edited copy is made
 * @param overrides files the user explicitly chose for resource URIs
 * @returns local resource URI to companion file mapping
 */
export function ResolveGltfCompanionFiles(
    mainFile: File,
    resourceUris: readonly string[],
    companions: readonly File[],
    sourcePath = mainFile.webkitRelativePath || mainFile.name,
    overrides: ReadonlyMap<string, File> = new Map()
): Map<string, File> {
    const mainPath = _NormalizePath(sourcePath);
    const mainDirectory = mainPath.includes("/") ? mainPath.slice(0, mainPath.lastIndexOf("/") + 1) : "";
    const result = new Map<string, File>();
    const assigned = new Set<File>();
    const assignedKeys = new Set<string>();
    for (const uri of resourceUris) {
        // Network and data resources are resolved by the loader, not the drop target.
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(uri)) {
            continue;
        }
        const path = _ResourcePath(uri);
        const keys = GetGltfResourceKeys(uri);
        if (keys.some((key) => assignedKeys.has(key))) {
            throw new Error(`Ambiguous companion file for ${uri}. Resource paths differ only by case or a leading dot.`);
        }
        const exact = companions.filter((file) => {
            const droppedPath = _CanonicalPath(file.webkitRelativePath || file.name);
            return droppedPath === _CanonicalPath(path) || droppedPath === _CanonicalPath(mainDirectory + path);
        });
        const basename = path.slice(path.lastIndexOf("/") + 1);
        const explicit = overrides.get(uri);
        const matches = explicit ? [explicit] : exact.length ? exact : companions.filter((file) => _NormalizePath(file.name) === basename);
        if (matches.length > 1) {
            throw new GltfCompanionResolutionError("ambiguous", uri, `Ambiguous companion file for ${uri}. Choose the file that matches this resource path.`);
        }
        if (!matches.length) {
            throw new GltfCompanionResolutionError("missing", uri, `Missing companion file for ${uri}. Choose the referenced file to continue importing.`);
        }
        const match = matches[0];
        if (assigned.has(match) && !overrides.has(uri)) {
            throw new GltfCompanionResolutionError("ambiguous", uri, `Ambiguous companion file for ${uri}. One file matches multiple resource paths.`);
        }
        assigned.add(match);
        keys.forEach((key) => assignedKeys.add(key));
        result.set(uri, match);
    }
    return result;
}
