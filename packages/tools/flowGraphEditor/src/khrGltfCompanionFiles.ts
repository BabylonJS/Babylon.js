function _NormalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").toLowerCase();
}

type FileWithDropPath = File & { correctName?: string };

function _HasRecordedPath(file: File): boolean {
    const correctName = (file as FileWithDropPath).correctName;
    return !!file.webkitRelativePath || !!(correctName && _NormalizePath(correctName).includes("/"));
}

/**
 * Get the path retained by a native folder drop or directory file picker.
 * @param file selected file
 * @returns source-relative path, falling back to the filename for flat selections
 */
export function GetGltfFilePath(file: File): string {
    return (file as FileWithDropPath).correctName || file.webkitRelativePath || file.name;
}

/**
 * Collect native drop entries, including every batch of nested directory contents.
 * A read failure rejects the entire collection rather than silently omitting files.
 * @param transfer drag data, read synchronously while the drop event is active
 * @returns files with retained folder paths
 */
export async function CollectGltfDropFilesAsync(transfer: DataTransfer): Promise<File[]> {
    const items = Array.from(transfer.items ?? []);
    const fallback = Array.from(transfer.files ?? []);
    const entries = items
        .filter((item) => item.kind === "file")
        .map((item) => ({
            entry: (item as DataTransferItem & { getAsEntry?: () => FileSystemEntry | null }).getAsEntry?.() ?? item.webkitGetAsEntry?.(),
            file: item.getAsFile(),
        }));
    const visitAsync = async (entry: FileSystemEntry, selectedFile?: File): Promise<File[]> => {
        try {
            if (entry.isFile) {
                const file = selectedFile ?? (await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject)));
                const path = file.webkitRelativePath || entry.fullPath.replace(/^\/+/, "");
                // Native top-level file entries expose only /basename. A folder traversal
                // or directory picker supplies an actual path, which must match strictly.
                if (file.webkitRelativePath || path.includes("/")) {
                    (file as FileWithDropPath).correctName = path;
                }
                return [file];
            }
            if (entry.isDirectory) {
                const reader = (entry as FileSystemDirectoryEntry).createReader();
                const files: File[] = [];
                for (;;) {
                    // Directory readers must be consumed one batch at a time.
                    // eslint-disable-next-line no-await-in-loop
                    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
                    if (!batch.length) {
                        return files;
                    }
                    // eslint-disable-next-line no-await-in-loop
                    files.push(...(await Promise.all(batch.map(async (child) => await visitAsync(child)))).flat());
                }
            }
            return [];
        } catch (error) {
            throw new Error(`Unable to read dropped entry ${entry.fullPath}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    };
    if (!entries.some(({ entry }) => entry)) {
        return fallback.length ? fallback : entries.flatMap(({ file }) => (file ? [file] : []));
    }
    return (
        await Promise.all(
            entries.map(async ({ entry, file }) => {
                if (entry) {
                    return await visitAsync(entry, file ?? undefined);
                }
                if (file) {
                    return [file];
                }
                throw new Error("Unable to read dropped file. Select the file again to continue importing.");
            })
        )
    ).flat();
}

function _CanonicalPath(path: string, ignoreCase = true): string {
    const parts: string[] = [];
    for (const part of (ignoreCase ? _NormalizePath(path) : path.replace(/\\/g, "/")).split("/")) {
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

function _ResourceIdentity(uri: string): string {
    return (uri.startsWith("/") ? "/" : "") + _CanonicalPath(decodeURIComponent(uri), false);
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
    // FileTools lowercases the URL before decoding, so an encoded capital can
    // remain uppercase in its lookup key. Buffer loading alone strips one ./.
    _ResourcePath(uri);
    const decoded = decodeURIComponent(uri.toLowerCase());
    const normalized = decoded.replace(/^\.\//, "");
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
    sourcePath = GetGltfFilePath(mainFile),
    overrides: ReadonlyMap<string, File> = new Map()
): Map<string, File> {
    const mainPath = _NormalizePath(sourcePath);
    const mainDirectory = mainPath.includes("/") ? mainPath.slice(0, mainPath.lastIndexOf("/") + 1) : "";
    const result = new Map<string, File>();
    const files = [...new Set(companions)];
    const assigned = new Set<File>();
    const assignedKeys = new Map<string, string>();
    const assignedPaths = new Map<string, File>();
    const explicitPaths = new Map<string, File>();
    for (const [uri, file] of overrides) {
        _ResourcePath(uri);
        const identity = _ResourceIdentity(uri);
        if (explicitPaths.has(identity) && explicitPaths.get(identity) !== file) {
            throw new Error(`Ambiguous companion file for ${uri}. Equivalent resource paths have different file choices.`);
        }
        explicitPaths.set(identity, file);
    }
    // Network and data resources are resolved by the loader, not the drop target.
    const references = resourceUris
        .filter((uri) => !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(uri))
        .map((uri) => {
            const path = _ResourcePath(uri);
            const identity = _ResourceIdentity(uri);
            const keys = GetGltfResourceKeys(uri);
            const expectedPath = _CanonicalPath(uri.startsWith("/") ? path : mainDirectory + path);
            const exact = files.filter((file) => _HasRecordedPath(file) && _CanonicalPath(GetGltfFilePath(file)) === expectedPath);
            return { uri, identity, keys, exact, basename: path.slice(path.lastIndexOf("/") + 1) };
        });
    const flatPaths = new Map<string, Set<string>>();
    for (const { uri, identity, keys, exact, basename } of references) {
        // Reject lookup collisions before offering choices that cannot fix them.
        if (keys.some((key) => assignedKeys.has(key) && assignedKeys.get(key) !== identity)) {
            throw new Error(`Ambiguous companion file for ${uri}. Distinct resource paths share a loader lookup key.`);
        }
        keys.forEach((key) => assignedKeys.set(key, identity));
        if (!exact.length) {
            const identities = flatPaths.get(basename) ?? new Set<string>();
            identities.add(identity);
            flatPaths.set(basename, identities);
        }
    }
    for (const { uri, identity, exact, basename } of references) {
        const explicit = explicitPaths.get(identity);
        const matches = explicit
            ? [explicit]
            : assignedPaths.has(identity)
              ? [assignedPaths.get(identity)!]
              : exact.length
                ? exact
                : files.filter((file) => !_HasRecordedPath(file) && _NormalizePath(GetGltfFilePath(file)) === basename);
        // A flat basename must identify both one file and one distinct resource.
        // Keep this ambiguity across retries: choosing one path cannot identify
        // which other path an original basename-only File belongs to.
        if (matches.length && !explicit && !exact.length && (flatPaths.get(basename)?.size ?? 0) > 1) {
            throw new GltfCompanionResolutionError("ambiguous", uri, `Ambiguous companion file for ${uri}. One file matches multiple resource paths. Choose a file for each path.`);
        }
        if (matches.length > 1) {
            throw new GltfCompanionResolutionError("ambiguous", uri, `Ambiguous companion file for ${uri}. Choose the file that matches this resource path.`);
        }
        if (!matches.length) {
            throw new GltfCompanionResolutionError("missing", uri, `Missing companion file for ${uri}. Choose the referenced file to continue importing.`);
        }
        const match = matches[0];
        if (assignedPaths.has(identity) && assignedPaths.get(identity) !== match) {
            throw new Error(`Ambiguous companion file for ${uri}. Equivalent resource paths have different file choices.`);
        }
        if (assigned.has(match) && !assignedPaths.has(identity) && !explicit) {
            throw new GltfCompanionResolutionError("ambiguous", uri, `Ambiguous companion file for ${uri}. One file matches multiple resource paths.`);
        }
        assigned.add(match);
        assignedPaths.set(identity, match);
        result.set(uri, match);
    }
    return result;
}
