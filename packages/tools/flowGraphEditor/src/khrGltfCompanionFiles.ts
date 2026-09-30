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
 * @returns local resource URI to companion file mapping
 */
export function ResolveGltfCompanionFiles(
    mainFile: File,
    resourceUris: readonly string[],
    companions: readonly File[],
    sourcePath = mainFile.webkitRelativePath || mainFile.name
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
        const matches = exact.length ? exact : companions.filter((file) => _NormalizePath(file.name) === basename);
        if (matches.length > 1) {
            throw new Error(`Ambiguous companion file for ${uri}. The dropped files need distinguishable relative folder paths.`);
        }
        if (!matches.length) {
            throw new Error(`Missing companion file for ${uri}. Drop it alongside the glTF file.`);
        }
        const match = matches[0];
        if (assigned.has(match) && !result.has(uri)) {
            throw new Error(`Ambiguous companion file for ${uri}. One dropped file matches multiple resource paths.`);
        }
        assigned.add(match);
        keys.forEach((key) => assignedKeys.add(key));
        result.set(uri, match);
    }
    return result;
}
