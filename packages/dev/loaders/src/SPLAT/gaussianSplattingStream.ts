import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type IGaussianSplattingSplatRange } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { Vector3 } from "core/Maths/math.vector";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { ParseSogMetaAsTextures, type SOGRootData } from "./sog";
import { GaussianSplattingWorkBuffer } from "./gaussianSplattingWorkBuffer";
import { type ISogTexturePack } from "./splatDefs";

/**
 * Internal descriptor for one resource to stream (environment bundle or a LOD source file).
 */
interface ILoadDescriptor {
    kind: "env" | "file";
    /** Number of splats in this resource. */
    count: number;
    /** First splat index (pixel offset) assigned in the work buffer. */
    offset: number;
    /** Index into `filenames` (kind "file"). */
    fileId: number;
    /** Parsed SOG metadata (kind "file"). */
    sogData?: SOGRootData;
    /** Base URL for the file's webp images (kind "file"). */
    subRootUrl?: string;
    /** Unzipped bundle contents (kind "env"). */
    files?: Map<string, Uint8Array>;
}

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
 * Each selected SOG file (plus the environment) is loaded directly as GPU textures and decoded on the
 * GPU into one unified, PlayCanvas-style square work buffer (no CPU splat decode or `updateData`). Only
 * the selected-LOD splats are rendered/sorted via the mesh's interval filter. There is no distance-based
 * LOD selection or refinement.
 *
 * @experimental
 */
export class GaussianSplattingStream extends GaussianSplattingMesh {
    private readonly _metadata: ISOGLODMetadata;
    private readonly _rootUrl: string;
    private readonly _streamOptions: IGaussianSplattingStreamOptions;

    // Selected-LOD entries grouped by source file index.
    private readonly _entriesByFile = new Map<number, ISOGLODEntry[]>();

    // GPU work buffer holding all decoded splats; created once the total capacity is known.
    private _workBuffer: Nullable<GaussianSplattingWorkBuffer> = null;

    // Global splat offset where each loaded source file begins in the work buffer.
    private readonly _fileBaseSplat = new Map<number, number>();
    // Global range covered by the environment file (always rendered), or null until it loads.
    private _environmentRange: Nullable<{ offset: number; count: number }> = null;

    // Running local-space bounds of all decoded splat centers (for frustum culling / picking).
    private readonly _boundsMin = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private readonly _boundsMax = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    private _disposed = false;

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
        this._workBuffer?.dispose();
        this._workBuffer = null;
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
     * Streams the environment (if any) and every selected-LOD source file: first learns each splat
     * count, allocates the unified GPU work buffer, then GPU-decodes each resource into its block.
     */
    private async _streamAllAsync(): Promise<void> {
        // Phase 1: fetch metadata to learn splat counts (cheap; no webp decode yet).
        const descriptors = await this._gatherLoadDescriptorsAsync();
        if (this._disposed || descriptors.length === 0) {
            return;
        }

        // Allocate the unified work buffer sized to the total splat count (PlayCanvas-style square).
        let capacity = 0;
        for (const descriptor of descriptors) {
            descriptor.offset = capacity;
            if (descriptor.kind === "env") {
                this._environmentRange = { offset: capacity, count: descriptor.count };
            } else {
                this._fileBaseSplat.set(descriptor.fileId, capacity);
            }
            capacity += descriptor.count;
        }

        this._workBuffer = new GaussianSplattingWorkBuffer(this._scene, capacity);
        const splatPositions = new Float32Array(capacity * 4);
        const textures = this._workBuffer.textures;
        this._setExternalWorkBuffer(textures[0], textures[1], textures[2], textures[3], splatPositions, capacity);
        // Nothing is active until at least one resource has been decoded.
        this.setSplatIndexRanges([]);
        this.setEnabled(true);

        // Phase 2: GPU-decode each resource into its block, activating its splats as it arrives.
        for (const descriptor of descriptors) {
            if (this._disposed) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await this._decodeDescriptorAsync(descriptor);
        }
    }

    /**
     * Fetches the environment bundle and each selected file's metadata to determine splat counts.
     * @returns descriptors for every resource to decode
     */
    private async _gatherLoadDescriptorsAsync(): Promise<ILoadDescriptor[]> {
        const descriptors: ILoadDescriptor[] = [];

        if (this._metadata.environment) {
            try {
                const url = this._rootUrl + this._metadata.environment;
                const buffer = (await Tools.LoadFileAsync(url, true)) as ArrayBuffer;
                const files = await this._unzipAsync(new Uint8Array(buffer));
                const metaBytes = files.get("meta.json");
                if (metaBytes) {
                    const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as SOGRootData;
                    descriptors.push({ kind: "env", count: GaussianSplattingStream._GetSplatCount(meta), offset: 0, fileId: -1, files });
                }
            } catch (e: any) {
                // The environment is non-essential — keep streaming the LOD tree even if it fails.
                Logger.Warn("GaussianSplattingStream: failed to load environment: " + (e?.message ?? e));
            }
        }

        for (const fileId of Array.from(this._entriesByFile.keys())) {
            const relativePath = this._metadata.filenames[fileId];
            if (!relativePath) {
                Logger.Warn(`GaussianSplattingStream: missing filename for file index ${fileId}.`);
                continue;
            }
            try {
                const metaUrl = this._rootUrl + relativePath;
                const subRootUrl = metaUrl.substring(0, metaUrl.lastIndexOf("/") + 1);
                // eslint-disable-next-line no-await-in-loop
                const metaText = (await Tools.LoadFileAsync(metaUrl, false)) as string;
                const sogData = JSON.parse(metaText) as SOGRootData;
                descriptors.push({ kind: "file", count: GaussianSplattingStream._GetSplatCount(sogData), offset: 0, fileId, sogData, subRootUrl });
            } catch (e: any) {
                Logger.Warn(`GaussianSplattingStream: failed to load metadata for ${relativePath}: ${e?.message ?? e}`);
            }
        }

        return descriptors;
    }

    /**
     * Loads one resource as GPU textures, decodes it into the work buffer, records its CPU centers for
     * sorting, frees the source textures, and activates its splat ranges.
     * @param descriptor the resource to decode
     */
    private async _decodeDescriptorAsync(descriptor: ILoadDescriptor): Promise<void> {
        try {
            const parsed =
                descriptor.kind === "env"
                    ? await ParseSogMetaAsTextures(descriptor.files!, "", this._scene)
                    : await ParseSogMetaAsTextures(descriptor.sogData!, descriptor.subRootUrl!, this._scene);
            if (this._disposed || !this._workBuffer) {
                return;
            }
            const pack = parsed.sogTextures;
            if (!pack) {
                return;
            }

            await this._workBuffer.decodeAsync(pack, descriptor.offset);
            if (this._disposed) {
                GaussianSplattingStream._DisposePack(pack);
                return;
            }
            // Copy CPU centers for the depth-sort worker, then free the GPU source textures.
            this._splatPositions!.set(pack.positions.subarray(0, descriptor.count * 4), descriptor.offset * 4);
            GaussianSplattingStream._DisposePack(pack);

            this._updateBounds(pack.positions, descriptor.count);
            this._notifyWorkerNewData();
            this._refreshActiveRanges();
        } catch (e: any) {
            Logger.Warn("GaussianSplattingStream: failed to decode SOG resource: " + (e?.message ?? e));
        }
    }

    /**
     * Reads the splat count from SOG metadata.
     * @param data SOG metadata
     * @returns the splat count
     */
    private static _GetSplatCount(data: SOGRootData): number {
        return data.count ?? (Array.isArray(data.means.shape) ? data.means.shape[0] : 0);
    }

    /**
     * Disposes all GPU source textures of a SOG pack (they are only needed for the one decode pass).
     * @param pack the SOG texture pack
     */
    private static _DisposePack(pack: ISogTexturePack): void {
        pack.meansTextureL.dispose();
        pack.meansTextureU.dispose();
        pack.scalesTexture.dispose();
        pack.quatsTexture.dispose();
        pack.sh0Texture.dispose();
        pack.shCentroidsTexture?.dispose();
        pack.shLabelsTexture?.dispose();
        pack.codebookTexture?.dispose();
    }

    /**
     * Expands the running splat-center bounds with a newly decoded file's centers and updates the
     * mesh bounding info so the GS is correctly frustum-culled and pickable.
     * @param positions stride-4 splat centers for the new file
     * @param count number of splats
     */
    private _updateBounds(positions: Float32Array, count: number): void {
        const min = this._boundsMin;
        const max = this._boundsMax;
        for (let i = 0; i < count; i++) {
            const x = positions[i * 4 + 0];
            const y = positions[i * 4 + 1];
            const z = positions[i * 4 + 2];
            min.minimizeInPlaceFromFloats(x, y, z);
            max.maximizeInPlaceFromFloats(x, y, z);
        }
        this.setBoundingInfo(new BoundingInfo(min, max));
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
