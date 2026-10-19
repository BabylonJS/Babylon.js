import * as fs from "fs";
import * as path from "path";

export type SideEffectsPackageName = "core" | "gui" | "loaders" | "serializers";

/**
 * Result of loading one package's side-effects manifest.
 */
export interface ISideEffectsManifestResult {
    /** Whether a manifest exists for the requested package. */
    available: boolean;
    /** Manifest-relative files known to have side effects. */
    files: Set<string>;
}

interface ISideEffectsManifestCacheEntry extends ISideEffectsManifestResult {
    checkedAt: number;
    signature: string;
}

/**
 * Find the repository side-effects manifest from the plugin source or build directory.
 * @param startDirectory - Directory to search upward from.
 * @returns The sharded or legacy manifest path, or null when no manifest exists.
 */
export function FindSideEffectsManifestRoot(startDirectory: string): string | null {
    let directory = startDirectory;
    for (let i = 0; i < 10; i++) {
        const shardedManifest = path.join(directory, "scripts", "treeshaking", "side-effects-manifest");
        if (fs.existsSync(shardedManifest)) {
            return shardedManifest;
        }
        const legacyManifest = path.join(directory, "scripts", "treeshaking", "side-effects-manifest.json");
        if (fs.existsSync(legacyManifest)) {
            return legacyManifest;
        }
        const parent = path.dirname(directory);
        if (parent === directory) {
            break;
        }
        directory = parent;
    }
    return null;
}

/**
 * Loads package manifest shards with short-lived caching suitable for editor linting.
 */
export class SideEffectsManifestLoader {
    private readonly _cache = new Map<SideEffectsPackageName, ISideEffectsManifestCacheEntry>();

    /**
     * Creates a manifest loader.
     * @param _manifestRoot - Sharded manifest directory or legacy manifest file.
     * @param _now - Clock used to expire cache entries.
     */
    public constructor(
        private readonly _manifestRoot: string,
        private readonly _now: () => number = Date.now
    ) {}

    /**
     * Loads the side-effect files for one package.
     * @param packageName - Package whose manifest should be loaded.
     * @returns The package's side-effect files and whether its manifest exists.
     */
    public load(packageName: SideEffectsPackageName): ISideEffectsManifestResult {
        const now = this._now();
        const cached = this._cache.get(packageName);
        if (cached && now - cached.checkedAt < 1000) {
            return cached;
        }

        const rootStat = this._stat(this._manifestRoot);
        const manifestPath = rootStat.isDirectory() ? path.join(this._manifestRoot, packageName) : packageName === "core" ? this._manifestRoot : null;
        if (!manifestPath || !fs.existsSync(manifestPath)) {
            return { available: false, files: new Set() };
        }

        const signature = this._getSignature(manifestPath);
        if (cached?.signature === signature) {
            cached.checkedAt = now;
            return cached;
        }

        const files = new Set<string>();
        this._loadManifest(manifestPath, files);
        const result: ISideEffectsManifestCacheEntry = { available: true, checkedAt: now, signature, files };
        this._cache.set(packageName, result);
        return result;
    }

    private _stat(manifestPath: string): fs.Stats {
        try {
            return fs.statSync(manifestPath);
        } catch (error) {
            throw this._manifestError("read manifest metadata", manifestPath, error);
        }
    }

    private _getSignature(manifestPath: string): string {
        const stat = this._stat(manifestPath);
        if (stat.isFile()) {
            return `${stat.mtimeMs}:${stat.size}`;
        }
        try {
            return fs
                .readdirSync(manifestPath, { withFileTypes: true })
                .filter((entry) => entry.isFile() && path.extname(entry.name) === ".json")
                .map((entry) => {
                    const entryStat = this._stat(path.join(manifestPath, entry.name));
                    return `${entry.name}:${entryStat.mtimeMs}:${entryStat.size}`;
                })
                .sort()
                .join("|");
        } catch (error) {
            throw this._manifestError("enumerate manifest shards", manifestPath, error);
        }
    }

    private _loadManifest(manifestPath: string, sideEffectFiles: Set<string>): void {
        const stat = this._stat(manifestPath);
        if (stat.isDirectory()) {
            let entries: fs.Dirent[];
            try {
                entries = fs.readdirSync(manifestPath, { withFileTypes: true });
            } catch (error) {
                throw this._manifestError("enumerate manifest shards", manifestPath, error);
            }
            for (const entry of entries) {
                if (entry.isFile() && path.extname(entry.name) === ".json") {
                    this._loadManifest(path.join(manifestPath, entry.name), sideEffectFiles);
                }
            }
            return;
        }

        let manifest: unknown;
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        } catch (error) {
            throw this._manifestError("parse manifest", manifestPath, error);
        }
        const invalidManifest = () => this._manifestError("validate manifest", manifestPath, new Error("expected a files collection containing file names"));
        if (!manifest || typeof manifest !== "object") {
            throw invalidManifest();
        }
        if ("manifest" in manifest && Array.isArray(manifest.manifest)) {
            const entries: unknown[] = manifest.manifest;
            for (const entry of entries) {
                if (!entry || typeof entry !== "object" || !("file" in entry) || typeof entry.file !== "string") {
                    throw invalidManifest();
                }
                sideEffectFiles.add(entry.file);
            }
            return;
        }
        if ("files" in manifest && manifest.files && !Array.isArray(manifest.files) && typeof manifest.files === "object") {
            Object.keys(manifest.files).forEach((file) => sideEffectFiles.add(file));
            return;
        }
        if ("files" in manifest && Array.isArray(manifest.files)) {
            for (const file of manifest.files) {
                if (typeof file !== "string") {
                    throw invalidManifest();
                }
                sideEffectFiles.add(file);
            }
            return;
        }
        throw invalidManifest();
    }

    private _manifestError(operation: string, manifestPath: string, error: unknown): Error {
        const detail = error instanceof Error ? error.message : String(error);
        return new Error(`Failed to ${operation} at "${manifestPath}": ${detail}`);
    }
}
