import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type IGaussianSplattingSplatRange } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { ParseSogMeta, type SOGRootData } from "./sog";

/**
 * A single LOD variant of a tree node: a contiguous splat range inside one streamed SOG file.
 */
interface ISOGLODEntry {
    /** Index into {@link ISOGLODMetadata.filenames}. */
    file: number;
    /** First splat index inside that file. */
    offset: number;
    /** Number of splats. */
    count: number;
}

/**
 * A node of the PlayCanvas-style SOG LOD octree. Internal nodes have `children`; leaves have `lods`.
 */
interface ISOGLODNode {
    bound: { min: number[]; max: number[] };
    children?: ISOGLODNode[];
    lods?: { [level: string]: ISOGLODEntry };
}

/**
 * Parsed contents of a PlayCanvas-style `lod-meta.json` file.
 */
export interface ISOGLODMetadata {
    /** Number of LOD levels (0 = highest detail). */
    lodLevels: number;
    /** SOG `meta.json` paths, relative to the metadata file, indexed by `ISOGLODEntry.file`. */
    filenames: string[];
    /** Optional always-on environment `.sog` bundle, relative to the metadata file. */
    environment?: string;
    /** Root of the LOD octree. */
    tree: ISOGLODNode;
}

/**
 * Options for {@link GaussianSplattingStream}.
 */
export interface IGaussianSplattingStreamOptions {
    /** URL of the fflate UMD module used to unzip `.sog` environment bundles. */
    deflateURL?: string;
    /** Pre-loaded fflate module. */
    fflate?: any;
}

/**
 * Streams a PlayCanvas-style SOG LOD scene (`lod-meta.json`) into a single Gaussian Splatting mesh.
 *
 * The implementation is intentionally simple: it streams only the least-detail (coarsest) SOG files
 * plus the environment, merges each decoded SOG (including its spherical harmonics) into the shared
 * splat texture as it arrives (without blocking rendering), and renders/sorts only the selected-LOD
 * splats via the mesh's interval filter. There is no distance-based LOD selection or refinement.
 *
 * @experimental
 */
export class GaussianSplattingStream extends GaussianSplattingMesh {
    private readonly _metadata: ISOGLODMetadata;
    private readonly _rootUrl: string;
    private readonly _streamOptions: IGaussianSplattingStreamOptions;

    // Selected-LOD entries grouped by source file index.
    private readonly _entriesByFile = new Map<number, ISOGLODEntry[]>();

    // Merged splat buffer (32 bytes/splat) grown as files stream in.
    private _mergedSplats: Uint8Array = new Uint8Array(0);
    private _mergedSplatCount = 0;

    // Merged spherical-harmonics textures (splat-major, 16 bytes/splat per texture), or null when no
    // SH is available/compatible. `_shDisabled` latches once an incompatible SH layout is seen.
    private _mergedSh: Nullable<Uint8Array[]> = null;
    private _shTextureCount = 0;
    private _mergedShDegree = 0;
    private _shDisabled = false;

    // Global splat offset where each loaded source file begins in the merged buffer.
    private readonly _fileBaseSplat = new Map<number, number>();
    // Global range covered by the environment file (always rendered), or null until it loads.
    private _environmentRange: Nullable<{ offset: number; count: number }> = null;

    private _disposed = false;

    private static readonly _RowLength = 32; // bytes per splat in the .splat layout fed to updateData
    private static readonly _ShBytesPerSplat = 16; // RGBA32F texel per splat in each SH texture

    /**
     * Returns true when the parsed JSON looks like a PlayCanvas-style `lod-meta.json` payload.
     * @param data parsed JSON
     * @returns whether the data is SOG LOD metadata
     */
    public static IsLODMetadata(data: unknown): data is ISOGLODMetadata {
        if (typeof data !== "object" || data === null) {
            return false;
        }
        const meta = data as Partial<ISOGLODMetadata>;
        return typeof meta.lodLevels === "number" && Array.isArray(meta.filenames) && typeof meta.tree === "object" && meta.tree !== null;
    }

    /**
     * Creates a new SOG LOD streaming mesh and immediately starts streaming (non-blocking).
     * @param name mesh name
     * @param metadata parsed `lod-meta.json`
     * @param rootUrl base URL the metadata's relative paths resolve against
     * @param scene hosting scene
     * @param options streaming options
     */
    constructor(name: string, metadata: ISOGLODMetadata, rootUrl: string, scene: Scene, options: IGaussianSplattingStreamOptions = {}) {
        super(name, null, scene, false);
        this._metadata = metadata;
        this._rootUrl = rootUrl;
        this._streamOptions = options;

        // PlayCanvas SOG data is authored with a flipped Y; match the standard SOG loader.
        this.scaling.y *= -1;
        // PlayCanvas SOG LOD scenes are authored Z-up; rotate into Babylon's Y-up convention.
        this.rotation.x = -Math.PI / 2;

        this._collectLodEntries(metadata.tree);

        // Kick off streaming without blocking the caller or the render loop.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
        this._streamAllAsync().catch((e) => {
            Logger.Error("GaussianSplattingStream: streaming failed: " + (e?.message ?? e));
        });
    }

    public override getClassName(): string {
        return "GaussianSplattingStream";
    }

    public override dispose(doNotRecurse?: boolean): void {
        this._disposed = true;
        super.dispose(doNotRecurse);
    }

    /**
     * Walks the LOD tree and records each leaf's least-detail (highest-numbered) LOD entry,
     * grouped by the source file it lives in.
     * @param node current tree node
     */
    private _collectLodEntries(node: ISOGLODNode): void {
        if (node.children) {
            for (const child of node.children) {
                this._collectLodEntries(child);
            }
            return;
        }

        if (!node.lods) {
            return;
        }

        // Least detail == highest LOD key (PlayCanvas convention: level 0 is the finest).
        let bestLevel = Number.NEGATIVE_INFINITY;
        for (const key of Object.keys(node.lods)) {
            const level = Number(key);
            if (level > bestLevel) {
                bestLevel = level;
            }
        }
        if (!Number.isFinite(bestLevel)) {
            return;
        }

        const entry = node.lods[String(bestLevel)];
        if (!entry || entry.count <= 0) {
            return;
        }

        let entries = this._entriesByFile.get(entry.file);
        if (!entries) {
            entries = [];
            this._entriesByFile.set(entry.file, entries);
        }
        entries.push(entry);
    }

    /**
     * Streams the environment (if any) and every selected-LOD source file, merging each as it arrives.
     */
    private async _streamAllAsync(): Promise<void> {
        if (this._metadata.environment) {
            await this._streamEnvironmentAsync(this._metadata.environment);
        }

        for (const fileId of Array.from(this._entriesByFile.keys())) {
            if (this._disposed) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await this._streamFileAsync(fileId);
        }
    }

    /**
     * Loads and merges the always-on environment `.sog` bundle.
     * @param relativePath environment path relative to the metadata root
     */
    private async _streamEnvironmentAsync(relativePath: string): Promise<void> {
        try {
            const url = this._rootUrl + relativePath;
            const buffer = (await Tools.LoadFileAsync(url, true)) as ArrayBuffer;
            const files = await this._unzipAsync(new Uint8Array(buffer));
            const parsed = await ParseSogMeta(files, "", this._scene);
            if (this._disposed) {
                return;
            }
            const count = parsed.data.byteLength / GaussianSplattingStream._RowLength;
            const base = this._mergeSplatBuffer(parsed.data, parsed.sh, parsed.shDegree);
            this._environmentRange = { offset: base, count };
            this._refreshActiveRanges();
        } catch (e: any) {
            // The environment is non-essential — keep streaming the LOD tree even if it fails.
            Logger.Warn("GaussianSplattingStream: failed to load environment: " + (e?.message ?? e));
        }
    }

    /**
     * Loads, decodes, and merges one selected-LOD source file, then activates its splat ranges.
     * @param fileId index into the metadata `filenames` array
     */
    private async _streamFileAsync(fileId: number): Promise<void> {
        const relativePath = this._metadata.filenames[fileId];
        if (!relativePath) {
            Logger.Warn(`GaussianSplattingStream: missing filename for file index ${fileId}.`);
            return;
        }

        try {
            const metaUrl = this._rootUrl + relativePath;
            const subRootUrl = metaUrl.substring(0, metaUrl.lastIndexOf("/") + 1);
            const metaText = (await Tools.LoadFileAsync(metaUrl, false)) as string;
            const sogData = JSON.parse(metaText) as SOGRootData;
            const parsed = await ParseSogMeta(sogData, subRootUrl, this._scene);
            if (this._disposed) {
                return;
            }
            const base = this._mergeSplatBuffer(parsed.data, parsed.sh, parsed.shDegree);
            this._fileBaseSplat.set(fileId, base);
            this._refreshActiveRanges();
        } catch (e: any) {
            Logger.Warn(`GaussianSplattingStream: failed to load file ${relativePath}: ${e?.message ?? e}`);
        }
    }

    /**
     * Appends a decoded SOG `.splat` buffer (and its spherical harmonics) to the merged buffers and
     * uploads the new splats.
     * @param data decoded `.splat` bytes for the new file
     * @param sh optional per-texture SH bytes for the new file (splat-major, 16 bytes/splat)
     * @param shDegree SH degree of the new file
     * @returns the global splat offset where the appended data starts
     */
    private _mergeSplatBuffer(data: ArrayBuffer, sh?: Uint8Array[], shDegree?: number): number {
        const previousVertexCount = this._mergedSplatCount;
        const addedBytes = new Uint8Array(data);
        const addedCount = addedBytes.byteLength / GaussianSplattingStream._RowLength;

        const merged = new Uint8Array(this._mergedSplats.byteLength + addedBytes.byteLength);
        merged.set(this._mergedSplats, 0);
        merged.set(addedBytes, this._mergedSplats.byteLength);

        this._mergedSplats = merged;
        this._mergedSplatCount += addedCount;

        this._mergeSh(previousVertexCount, addedCount, sh, shDegree);

        this.updateData(merged.buffer, this._mergedSh ?? undefined, { flipY: false, previousVertexCount }, undefined, this._mergedSh ? this._mergedShDegree : undefined);

        return previousVertexCount;
    }

    /**
     * Merges the new file's spherical-harmonics textures into the growing merged SH buffers.
     * SH is established from the first SH-bearing file (earlier splats are zero-padded). Files
     * without SH contribute zeros; an incompatible SH layout permanently disables SH.
     * @param previousVertexCount splat count before this file
     * @param addedCount number of splats added by this file
     * @param sh optional per-texture SH bytes for the new file
     * @param shDegree SH degree of the new file
     */
    private _mergeSh(previousVertexCount: number, addedCount: number, sh?: Uint8Array[], shDegree?: number): void {
        if (this._shDisabled) {
            return;
        }

        if (this._mergedSh === null) {
            if (!sh || sh.length === 0) {
                return; // no SH established yet and this file has none
            }
            this._shTextureCount = sh.length;
            this._mergedShDegree = shDegree ?? 0;
            this._mergedSh = [];
            for (let t = 0; t < this._shTextureCount; t++) {
                this._mergedSh.push(new Uint8Array(0));
            }
        } else if (sh && sh.length !== this._shTextureCount) {
            // Incompatible SH layout across files: drop SH entirely rather than render corrupt data.
            Logger.Warn("GaussianSplattingStream: incompatible SH layout across files; disabling SH.");
            this._mergedSh = null;
            this._shDisabled = true;
            return;
        }

        const stride = GaussianSplattingStream._ShBytesPerSplat;
        const total = this._mergedSplatCount;
        for (let t = 0; t < this._shTextureCount; t++) {
            const grown = new Uint8Array(total * stride);
            const old = this._mergedSh[t];
            grown.set(old.subarray(0, Math.min(old.byteLength, previousVertexCount * stride)), 0);
            if (sh) {
                grown.set(sh[t].subarray(0, addedCount * stride), previousVertexCount * stride);
            }
            this._mergedSh[t] = grown;
        }
    }

    /**
     * Rebuilds the active (selected-LOD) interval set from every loaded file plus the environment,
     * coalesces adjacent ranges, and pushes it to the sort worker.
     */
    private _refreshActiveRanges(): void {
        const ranges: IGaussianSplattingSplatRange[] = [];

        if (this._environmentRange) {
            ranges.push({ offset: this._environmentRange.offset, count: this._environmentRange.count });
        }

        for (const [fileId, entries] of Array.from(this._entriesByFile)) {
            const base = this._fileBaseSplat.get(fileId);
            if (base === undefined) {
                continue; // file not streamed yet
            }
            for (const entry of entries) {
                ranges.push({ offset: base + entry.offset, count: entry.count });
            }
        }

        this.setSplatIndexRanges(GaussianSplattingStream._CoalesceRanges(ranges));
    }

    /**
     * Sorts and merges adjacent/overlapping ranges to keep the interval list compact.
     * @param ranges raw ranges
     * @returns coalesced ranges
     */
    private static _CoalesceRanges(ranges: IGaussianSplattingSplatRange[]): IGaussianSplattingSplatRange[] {
        if (ranges.length <= 1) {
            return ranges;
        }
        const sorted = ranges.slice().sort((a, b) => a.offset - b.offset);
        const merged: IGaussianSplattingSplatRange[] = [{ offset: sorted[0].offset, count: sorted[0].count }];
        for (let i = 1; i < sorted.length; i++) {
            const last = merged[merged.length - 1];
            const range = sorted[i];
            const lastEnd = last.offset + last.count;
            if (range.offset <= lastEnd) {
                const end = Math.max(lastEnd, range.offset + range.count);
                last.count = end - last.offset;
            } else {
                merged.push({ offset: range.offset, count: range.count });
            }
        }
        return merged;
    }

    /**
     * Unzips a `.sog` bundle into a name -> bytes map, loading fflate on demand.
     * @param data zipped bytes
     * @returns map of entry name to bytes
     */
    private async _unzipAsync(data: Uint8Array): Promise<Map<string, Uint8Array>> {
        let fflateModule = this._streamOptions.fflate;
        if (!fflateModule) {
            if (typeof (window as any).fflate === "undefined") {
                await Tools.LoadScriptAsync(this._streamOptions.deflateURL ?? "https://unpkg.com/fflate/umd/index.js");
            }
            fflateModule = (window as any).fflate;
        }

        const unzipped = fflateModule.unzipSync(data) as Record<string, Uint8Array>;
        const files = new Map<string, Uint8Array>();
        for (const [name, content] of Object.entries(unzipped)) {
            files.set(name, content);
        }
        return files;
    }
}
