/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";
import { type Scene } from "core/scene.pure";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type Vector2 } from "core/Maths/math.vector";
import { type Effect } from "core/Materials/effect.pure";
import { GetGaussianSplattingMaxPartCount } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial.pure";
import { GaussianSplattingMeshBase, AllocateShBuffers, type IGaussianSplattingSplatRange } from "./gaussianSplattingMeshBase.pure";
import { GaussianSplattingSortWorkerCommand } from "./gaussianSplattingSortWorker";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { type MultiRenderTarget } from "core/Materials/Textures/multiRenderTarget.pure";
import { Constants } from "core/Engines/constants";
import { DecodeBase64ToBinary, EncodeArrayBufferToBase64 } from "core/Misc/stringTools";
import { Mesh } from "core/Meshes/mesh.pure";
import { GaussianSplattingPartProxyMesh } from "./gaussianSplattingPartProxyMesh.pure";
import { BoundingInfo } from "../../Culling/boundingInfo";
import { type BaseTexture } from "../../Materials/Textures/baseTexture.pure";
import { type AbstractMesh } from "core/Meshes/abstractMesh.pure";

const _GaussianSplattingBytesPerSplat = 32;
const _GaussianSplattingBytesPerShTexel = 16;

interface IGaussianSplattingPartSource {
    name: string;
    _vertexCount: number;
    _splatsData: Nullable<ArrayBuffer | ArrayBufferView>;
    _shData: Nullable<Uint8Array[]>;
    _shDegree: number;
    isCompound: boolean;
    getWorldMatrix(): Matrix;
    getBoundingInfo(): BoundingInfo;
    dispose(): void;
    /**
     * When true this is a placeholder that reserves `_vertexCount` empty (invisible) splats in the
     * atlas instead of copying real data. Used by {@link GaussianSplattingMesh.reserveStreamingPart}
     * so a streaming engine can later GPU-decode into the reserved region. Sources flagged this way
     * are allowed to have a null `_splatsData`; their atlas region is left zeroed (invisible padding).
     */
    _isReservedEmpty?: boolean;
}

/**
 * Run-Length Encoding (RLE) compression for serialization
 * Compressed Uint32Array can be parsed using {@link ParsePartIndices}
 * Some notes for devs: We do not expect Uint8Array larger than 4GB,
 * so it should be safe to use Uint32Array.
 * @param partIndices A view of partIndices from GaussianSplattingMesh
 * @returns A compressed Uint32Array of [count, value, ...]
 */
function CompressPartIndices(partIndices: Uint8Array): Uint32Array {
    const runs: number[] = [];
    const length = partIndices.length;
    let i = 0;
    while (i < length) {
        const value = partIndices[i];
        let count = 1;
        while (i + count < length && partIndices[i + count] === value) {
            count++;
        }
        runs.push(count, value);
        i += count;
    }
    return new Uint32Array(runs);
}

/**
 * Parse partIndices compressed by {@link CompressPartIndices} to runtime array
 * @param compressed The compressed partIndices of [count, value, ...]
 * @returns runtime Uint8Array for GaussianSplattingMesh
 */
function ParsePartIndices(compressed: Uint32Array | number[]): Uint8Array {
    let totalCount = 0;
    const length = compressed.length;
    for (let i = 0; i < length; i += 2) {
        totalCount += compressed[i];
    }

    const partIndices = new Uint8Array(totalCount);
    let offset = 0;
    for (let i = 0; i < length; i += 2) {
        const count = compressed[i];
        const value = compressed[i + 1];
        partIndices.fill(value, offset, offset + count);
        offset += count;
    }

    return partIndices;
}

/**
 * Handle to a region of a compound Gaussian Splatting mesh reserved for dynamic (streamed) content by
 * {@link GaussianSplattingMesh.reserveStreamingPart}. It lets a streaming engine populate the region's
 * splats over time and drive which of them are sorted/rendered, while the compound keeps depth-sorting
 * and drawing every part (static + streamed) together in one pass.
 *
 * Ranges/offsets passed to this handle are LOCAL to the part (0-based within `[0, capacity)`); the handle
 * translates them to the compound's global atlas coordinates.
 */
export interface IGaussianSplattingStreamingPart {
    /** The proxy mesh controlling this part's world transform and visibility. */
    readonly proxy: GaussianSplattingPartProxyMesh;
    /** The part index assigned to this streaming region in the compound. */
    readonly partIndex: number;
    /** First atlas splat index of the reserved region. */
    readonly base: number;
    /** Number of splats reserved for the region. */
    readonly capacity: number;
    /** The compound's shared centers texture (the region occupies `[base, base+capacity)` within it). */
    readonly centersTexture: Nullable<BaseTexture>;
    /** The compound's shared covariance A texture. */
    readonly covariancesATexture: Nullable<BaseTexture>;
    /** The compound's shared covariance B texture. */
    readonly covariancesBTexture: Nullable<BaseTexture>;
    /** The compound's shared colors texture. */
    readonly colorsTexture: Nullable<BaseTexture>;
    /** The compound's shared CPU centers buffer consumed by the sort worker. */
    readonly splatPositions: Nullable<Float32Array>;
    /** The compound's shared render-target atlas a streaming engine decodes into, or null on a non-GPU backend. */
    readonly mrtAtlas: Nullable<MultiRenderTarget>;
    /**
     * The compound's shared higher-order SH render-target atlas (one single-attachment integer MRT per packed-u32
     * SH texture) a streaming engine bakes SH into, or null when SH decode was not requested for this part.
     */
    readonly shMrtAtlas: Nullable<MultiRenderTarget[]>;
    /**
     * The compound's shared rotation/scale render-target atlas (one 3-attachment half-float MRT) a streaming engine
     * decodes rotation/scale into for voxel-IBL shadows, or null when rotation decode was not requested for this part.
     */
    readonly rotMrtAtlas: Nullable<MultiRenderTarget>;
    /** Width (in texels) of the atlas, used to address decode/readback over the wide layout. */
    readonly atlasWidth: number;
    /** Whether the compound's shared depth sort is settled (a streaming engine polls this to detect readiness). */
    readonly isDepthSortSettled: boolean;
    /**
     * Restricts which of this part's splats are sorted/rendered, in LOCAL coordinates. `null` renders the
     * whole reserved region. The compound merges this with every other part's ranges into the single sort.
     * @param localRanges active local ranges, or `null` for the full region
     */
    setActiveRanges(localRanges: Nullable<readonly IGaussianSplattingSplatRange[]>): void;
    /**
     * CPU-decodes raw `.splat` bytes into the region at `localOffset`, uploading only those texels and
     * patching the sort worker. Grows the part's bounding info to include the written centers. This is the
     * CPU population path (used to seed the region or as a fallback when GPU decode is unavailable).
     * @param localOffset first local splat index to write
     * @param count number of splats to write
     * @param splatsData raw `.splat` bytes for `count` splats (stride 32)
     */
    writeSplats(localOffset: number, count: number, splatsData: ArrayBuffer | ArrayBufferView): void;
    /**
     * Patches only `[localOffset, localOffset+count)` of the worker's position buffer (for the GPU path,
     * where texel data is written directly to the atlas and only the CPU centers are pushed to the worker).
     * @param localOffset first local splat index
     * @param count number of splats
     */
    postPositionsRange(localOffset: number, count: number): void;
    /**
     * Grows the part's (and compound's) bounding info to include the given local-space centers extent.
     * @param min minimum corner
     * @param max maximum corner
     */
    expandBounds(min: Vector3, max: Vector3): void;
    /**
     * Re-posts the full merged position + part-index set to the compound's sort worker. Only needed after a
     * relayout moved the region's data wholesale; per-decode updates use {@link postPositionsRange} instead.
     */
    notifyDataChanged(): void;
    /**
     * Subscribes to the "about to recreate the shared atlas to grow it" event (e.g. another part is being added).
     * The callback receives the OLD atlas and should back up this region's GPU-only data before it is disposed.
     * @param callback invoked with the old atlas MRT
     * @returns an unsubscribe function (call it on dispose)
     */
    onBeforeAtlasRebuild(callback: (oldAtlas: MultiRenderTarget) => void): () => void;
    /**
     * Subscribes to the "shared atlas has been recreated" event. The callback receives the NEW atlas and should
     * rebind to it and restore this region's backed-up data.
     * @param callback invoked with the new atlas MRT
     * @returns an unsubscribe function (call it on dispose)
     */
    onAfterAtlasRebuild(callback: (newAtlas: MultiRenderTarget) => void): () => void;
}

/**
 * Internal mutable bookkeeping for one reserved streaming region. The handle's `base`/`partIndex` getters and
 * the compaction re-post read from this object, so {@link GaussianSplattingMesh.compactAtlas} can RELOCATE a
 * region (assign it a new base/partIndex) in place without invalidating the streaming engine's handle.
 */
interface IStreamingPartState {
    /** The proxy mesh for this region (stable identity across a relocation). */
    proxy: GaussianSplattingPartProxyMesh;
    /** First usable atlas splat index of the region (row-aligned). Updated when the region is relocated. */
    base: number;
    /** The region's current part index. Updated when parts before it are removed. */
    partIndex: number;
    /** Usable capacity (row-aligned), fixed for the region's lifetime. */
    capacity: number;
    /** Running local-space bounds of the region's written centers (shared with the handle's closures). */
    boundsMin: Vector3;
    boundsMax: Vector3;
    /** The region's last active LOD ranges in LOCAL coordinates, so a relocation can re-post them at the new base. */
    localRanges: Nullable<readonly IGaussianSplattingSplatRange[]>;
    /** Number of packed-u32 SH textures this streaming part bakes into the shared SH atlas (0 = no SH). Used to
     * recompute the compound's SH-atlas state from the SURVIVING parts when a part is removed (so removing the last
     * SH part turns the SH atlas off instead of leaving stale render-target degree/count behind). */
    shTextureCount: number;
    /** SH degree of this streaming part's baked SH (0 = no SH). Feeds the compound's max-degree recompute. */
    shDegree: number;
    /** Whether this streaming part decodes rotation/scale into the shared rotation atlas (for voxel-IBL shadows).
     * Used to recompute the compound's rotation-atlas state from the SURVIVING parts when a part is removed. */
    needsRotationScale: boolean;
    /** Set once the part is removed (tombstoned). The handle returned by {@link GaussianSplattingMesh.reserveStreamingPart}
     * checks this so a caller that retained a removed handle can't mutate a surviving part that later inherited this
     * region's part index/base. */
    removed: boolean;
}

/**
 * Class used to render a Gaussian Splatting mesh. Supports both single-cloud and compound
 * (multi-part) rendering. In compound mode, multiple Gaussian Splatting source meshes are
 * merged into one draw call while retaining per-part world-matrix control via
 * addPart/addParts and removePart.
 */
export class GaussianSplattingMesh extends GaussianSplattingMeshBase {
    /**
     * Proxy meshes indexed by part index. Maintained in sync with _partMatrices.
     */
    private _partProxies: GaussianSplattingPartProxyMesh[] = [];

    /** Part 0 local-space AABB when owned directly (not proxied). Set on first addPart, cleared on dispose/reset. */
    private _part0LocalMin: Nullable<Vector3> = null;
    private _part0LocalMax: Nullable<Vector3> = null;

    /**
     * World matrices for each part, indexed by part index.
     */
    protected _partMatrices: Matrix[] = [];

    /** When true, suppresses the sort trigger inside setWorldMatrixForPart during batch rebuilds. */
    private _rebuilding: boolean = false;

    /**
     * Visibility values for each part (0.0 to 1.0), indexed by part index.
     */
    protected _partVisibility: number[] = [];

    /**
     * Per-part active source-splat range overrides, indexed by part index, in GLOBAL source-splat
     * coordinates (offsets into the merged atlas). A part with no entry (undefined) renders its full
     * range; a part with an entry renders only those ranges. Used by streaming parts to render just
     * their currently-active LOD splats while static parts render fully. No overrides at all means no
     * filter (the base renders every splat, preserving the non-streaming fast path).
     */
    private _partSplatRanges: Nullable<IGaussianSplattingSplatRange[]>[] = [];

    /**
     * True once a streaming part has been reserved. A streamed region's data lives only on the GPU (no retained CPU
     * source), so atlas rebuilds and part add/remove take the streaming-aware paths that back up and restore each
     * region rather than regenerating it from a CPU source.
     * @internal
     */
    protected _hasStreamingPart = false;

    /** Mutable bookkeeping for each reserved streaming region, so {@link compactAtlas} can relocate them. */
    private _streamingStates: IStreamingPartState[] = [];

    /**
     * Max SH degree contributed by the live (non-tombstoned) streaming parts. Recomputed by
     * {@link _refreshStreamingShState} whenever parts change, so removing the last SH stream turns the shared SH
     * atlas off instead of leaving SH_DEGREE high over texels nothing refills.
     */
    private _streamingShDegree = 0;

    /** Part indices tombstoned by {@link removePart} while streaming — excluded from render, reclaimed by {@link compactAtlas}. */
    private _tombstonedPartIndices = new Set<number>();

    private _partIndicesTexture: Nullable<BaseTexture> = null;
    private _partIndices: Nullable<Uint8Array> = null;

    /** Gets the part indices texture used for compound rendering */
    public get partIndicesTexture() {
        return this._partIndicesTexture;
    }

    /**
     * Creates a new GaussianSplattingMesh
     * @param name the name of the mesh
     * @param url optional URL to load a Gaussian Splatting file from
     * @param scene the hosting scene
     * @param keepInRam whether to keep the raw splat data in RAM after uploading to GPU
     * @param needsRotationScaleTextures generate rotation and scale matrix textures required for voxel-based IBL shadows
     */
    constructor(name: string, url: Nullable<string> = null, scene: Nullable<Scene> = null, keepInRam: boolean = false, needsRotationScaleTextures: boolean = false) {
        super(name, url, scene, keepInRam);
        // Ensure _splatsData is retained once compound mode is entered — addPart/addParts need
        // the source data for full-texture rebuilds. Set after super() so it is visible to
        // _updateData when the async load completes.
        this._alwaysRetainSplatsData = true;
        this._needsRotationScaleTextures = needsRotationScaleTextures;
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingMesh"
     */
    public override getClassName(): string {
        return "GaussianSplattingMesh";
    }

    /**
     * Is this node ready to be used/rendered.
     * Force-syncs every part proxy's world matrix into `_partMatrices` BEFORE delegating to
     * the base readiness check. This guarantees that any pending proxy transform changes
     * (for example a user-set `proxy.position`) are reflected in the next sort post, so the
     * base `isReady` will only return true once `sortAppliedId === sortRequestId` for that
     * up-to-date state. Without this, the proxy's `onAfterWorldMatrixUpdateObservable` would
     * fire during the first render and queue a fresh sort AFTER readiness was reported,
     * leaving the rendered frame with stale splat order on `renderCount=1` runs.
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @returns true when ready
     */
    public override isReady(completeCheck = false): boolean {
        for (const proxy of this._partProxies) {
            if (proxy) {
                proxy.computeWorldMatrix(true);
            }
        }
        return super.isReady(completeCheck);
    }

    /**
     * Recomputes compound local-space bounds from part 0's stored AABB (if unproxied) plus all
     * proxy world AABBs inverse-transformed to compound-local space. All 8 corners of each proxy
     * AABB are transformed so the result is correct under non-identity compound rotation/scale.
     */
    private _updateBoundingInfoFromProxies(): void {
        const compoundWorld = this.getWorldMatrix();
        const invCompoundWorld = Matrix.Invert(compoundWorld);

        const localMin = this._part0LocalMin ? this._part0LocalMin.clone() : new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const localMax = this._part0LocalMax ? this._part0LocalMax.clone() : new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        const corner = new Vector3();
        for (const proxy of this._partProxies) {
            // Skip removed parts: a tombstoned proxy is kept (for compaction) but renders nothing, so it must not
            // inflate the compound's bounds (and thus its frustum culling) until its rows are actually reclaimed.
            if (!proxy || this._tombstonedPartIndices.has(proxy.partIndex)) {
                continue;
            }
            // Proxies have no geometry — getHierarchyBoundingVectors returns sentinels. Use boundingBox directly.
            proxy.computeWorldMatrix(false);
            const bb = proxy.getBoundingInfo().boundingBox;
            const wMin = bb.minimumWorld;
            const wMax = bb.maximumWorld;
            for (let b = 0; b < 8; b++) {
                corner.set(b & 1 ? wMax.x : wMin.x, b & 2 ? wMax.y : wMin.y, b & 4 ? wMax.z : wMin.z);
                Vector3.TransformCoordinatesToRef(corner, invCompoundWorld, corner);
                localMin.minimizeInPlace(corner);
                localMax.maximizeInPlace(corner);
            }
        }

        if (localMin.x <= localMax.x) {
            // Direct access avoids getBoundingInfo() → _updateBoundingInfo() recursion.
            if (this._boundingInfo) {
                this._boundingInfo.reConstruct(localMin, localMax, compoundWorld);
            } else {
                this._boundingInfo = new BoundingInfo(localMin, localMax, compoundWorld);
            }
            this._cachedBoundingMin = localMin.clone();
            this._cachedBoundingMax = localMax.clone();
        }
    }

    /**
     * Override for compound meshes: recomputes bounds from proxy world extents instead of
     * local bounds × world matrix, which is wrong for proxied parts with independent transforms.
     * @returns this mesh
     */
    public override _updateBoundingInfo(): AbstractMesh {
        if (this.isCompound) {
            this._updateBoundingInfoFromProxies();
            this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
            return this;
        }
        return super._updateBoundingInfo();
    }

    /**
     * Replaces the base hierarchy bounds computation for compound meshes: computes world bounds
     * from scratch by iterating part 0's local AABB and all proxy meshes, rather than delegating
     * to the base _children traversal which never reaches proxies (they are not parented to the
     * compound). Visibility per-part is respected; invisible parts are excluded.
     * @param includeDescendants when true, includes descendants (default: true)
     * @param predicate optional filter predicate
     * @returns world-space min/max of the hierarchy bounding box
     */
    public override getHierarchyBoundingVectors(
        includeDescendants: boolean = true,
        predicate: Nullable<(abstractMesh: AbstractMesh) => boolean> = null
    ): { min: Vector3; max: Vector3 } {
        if (!this.isCompound) {
            return super.getHierarchyBoundingVectors(includeDescendants, predicate);
        }
        // For compound meshes, compute visible-only world bounds from scratch so that
        // invisible parts don't inflate the result (e.g. for voxelization scene bounds).
        const min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        // Unproxied part 0: the compound mesh owns this geometry directly (no proxy node).
        // Transform its local AABB to world space if visible.
        if (this._part0LocalMin && (this._partVisibility[0] ?? 1.0) > 0) {
            const wm = this.getWorldMatrix();
            const lMin = this._part0LocalMin;
            const lMax = this._part0LocalMax!;
            const corner = new Vector3();
            for (let b = 0; b < 8; b++) {
                corner.set(b & 1 ? lMax.x : lMin.x, b & 2 ? lMax.y : lMin.y, b & 4 ? lMax.z : lMin.z);
                Vector3.TransformCoordinatesToRef(corner, wm, corner);
                min.minimizeInPlace(corner);
                max.maximizeInPlace(corner);
            }
        }
        for (let i = 0; i < this._partProxies.length; i++) {
            const proxy = this._partProxies[i];
            if (!proxy || (this._partVisibility[i] ?? 1.0) === 0) {
                continue;
            }
            proxy.computeWorldMatrix(false);
            const bb = proxy.getBoundingInfo().boundingBox;
            min.minimizeInPlace(bb.minimumWorld);
            max.maximizeInPlace(bb.maximumWorld);
        }
        return { min, max };
    }

    /**
     * Disposes proxy meshes and clears part data in addition to the base class GPU resources.
     * @param doNotRecurse Set to true to not recurse into each children
     */
    public override dispose(doNotRecurse?: boolean): void {
        for (const proxy of this._partProxies) {
            proxy.dispose();
        }
        this._partIndicesTexture?.dispose();
        this._partProxies = [];
        this._partMatrices = [];
        this._partVisibility = [];
        this._partIndicesTexture = null;
        this._part0LocalMin = null;
        this._part0LocalMax = null;
        super.dispose(doNotRecurse);
    }

    // ---------------------------------------------------------------------------
    // Worker and material hooks
    // ---------------------------------------------------------------------------

    /**
     * Posts the initial per-part data to the sort worker after it has been created.
     * Sends the current part matrices and group index array so the worker can correctly
     * weight depth values per part.
     * @param worker the newly created sort worker
     */
    protected override _onWorkerCreated(worker: Worker): void {
        worker.postMessage({ command: GaussianSplattingSortWorkerCommand.PART_MATRICES, partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
        worker.postMessage({ command: GaussianSplattingSortWorkerCommand.PART_INDICES, partIndices: this._partIndices ? new Uint8Array(this._partIndices) : null });
    }

    /**
     * Stores the raw part index array, padded to texture length, so the worker and GPU texture
     * creation step have access to it.
     * @param partIndices - the raw part indices array received during a data load
     * @param textureLength - the padded texture length to allocate into
     */
    protected override _onIndexDataReceived(partIndices: Uint8Array, textureLength: number): void {
        this._partIndices = new Uint8Array(textureLength);
        this._partIndices.set(partIndices);
    }

    /**
     * Returns `true` when at least one part has been added to this compound mesh.
     * Returns `false` before any parts are added, so the mesh renders in normal
     * (non-compound) mode until the first addPart/addParts call. This matches the
     * old base-class behavior of `this._partMatrices.length > 0` and avoids
     * binding unset partWorld uniforms (which would cause division-by-zero in the
     * Gaussian projection Jacobian and produce huge distorted splats).
     * @internal
     */
    public override get isCompound(): boolean {
        return this._partMatrices.length > 0;
    }

    /**
     * During a removePart rebuild, keep the existing sort worker alive rather than
     * tearing it down and spinning up a new one. This avoids startup latency and the
     * transient state window where a stale sort could fire against an incomplete
     * partMatrices array.
     * Outside of a rebuild the base-class behaviour is used unchanged.
     */
    protected override _instantiateWorker(): void {
        if (this._rebuilding && this._worker) {
            // Worker already exists and is kept alive; just resize the splat-index buffer.
            this._updateSplatIndexBuffer(this._vertexCount);
            return;
        }
        super._instantiateWorker();
    }

    /**
     * Ensures the part-index GPU texture exists at the start of an incremental update.
     * Called before the sub-texture upload so the correct texture is available for the first batch.
     * @param textureSize - current texture dimensions
     */
    protected override _onIncrementalUpdateStart(textureSize: Vector2): void {
        this._ensurePartIndicesTexture(textureSize, this._partIndices ?? undefined);
    }

    /**
     * Posts positions (via super) and then additionally posts the current part-index array
     * to the sort worker so it can associate each splat with its part.
     */
    protected override _notifyWorkerNewData(): void {
        super._notifyWorkerNewData();
        if (this._worker) {
            this._worker.postMessage({ command: GaussianSplattingSortWorkerCommand.PART_INDICES, partIndices: this._partIndices ?? null });
        }
    }

    /**
     * Binds all compound-specific shader uniforms: the group index texture, per-part world
     * matrices, and per-part visibility values.
     * @param effect the shader effect that is being bound
     * @internal
     */
    public override bindExtraEffectUniforms(effect: Effect): void {
        if (!this._partIndicesTexture) {
            return;
        }
        effect.setTexture("partIndicesTexture", this._partIndicesTexture);
        const partWorldData = new Float32Array(this.partCount * 16);
        for (let i = 0; i < this.partCount; i++) {
            this._partMatrices[i].toArray(partWorldData, i * 16);
        }
        effect.setMatrices("partWorld", partWorldData);
        const partVisibilityData: number[] = [];
        for (let i = 0; i < this.partCount; i++) {
            partVisibilityData.push(this._partVisibility[i] ?? 1.0);
        }
        effect.setArray("partVisibility", partVisibilityData);
    }

    // ---------------------------------------------------------------------------
    // Part matrix / visibility management
    // ---------------------------------------------------------------------------

    /**
     * Gets the number of parts in the compound.
     */
    public get partCount(): number {
        return this._partMatrices.length;
    }

    /**
     * Gets the part visibility array.
     */
    public get partVisibility(): number[] {
        return this._partVisibility;
    }

    /**
     * Sets the world matrix for a specific part of the compound.
     * This will trigger a re-sort of the mesh.
     * The `_partMatrices` array is automatically extended when `partIndex >= partCount`.
     * @param partIndex index of the part
     * @param worldMatrix the world matrix to set
     */
    public setWorldMatrixForPart(partIndex: number, worldMatrix: Matrix): void {
        if (this._partMatrices.length <= partIndex) {
            this.computeWorldMatrix(true);
            const defaultMatrix = this.getWorldMatrix();
            while (this._partMatrices.length <= partIndex) {
                this._partMatrices.push(defaultMatrix.clone());
                this._partVisibility.push(1.0);
            }
        }
        // Skip the post / sort if the matrix is unchanged. Babylon recomputes the proxy mesh's world matrix every frame
        // and fires onAfterWorldMatrixUpdateObservable, so without this guard a stable scene would queue a forced sort
        // every frame and `isReady()` would never settle (sortRequestId would keep advancing past sortAppliedId).
        if (this._partMatrices[partIndex].equals(worldMatrix)) {
            return;
        }
        this._partMatrices[partIndex].copyFrom(worldMatrix);
        // During a batch rebuild suppress intermediate posts — the final correct set is posted
        // once the full rebuild completes (at the end of removePart).
        if (!this._rebuilding) {
            if (this._worker) {
                this._worker.postMessage({
                    command: GaussianSplattingSortWorkerCommand.PART_MATRICES,
                    partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)),
                });
            }
            this._postToWorker(true);
        }
    }

    /**
     * Gets the world matrix for a specific part of the compound.
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @returns the world matrix for the part, or the current world matrix of the mesh if the part is not found
     */
    public getWorldMatrixForPart(partIndex: number): Matrix {
        return this._partMatrices[partIndex] ?? this.getWorldMatrix();
    }

    /**
     * Gets the visibility for a specific part of the compound.
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @returns the visibility value (0.0 to 1.0) for the part
     */
    public getPartVisibility(partIndex: number): number {
        return this._partVisibility[partIndex] ?? 1.0;
    }

    /**
     * Sets the visibility for a specific part of the compound.
     * @param partIndex index of the part, that must be between 0 and partCount - 1
     * @param value the visibility value (0.0 to 1.0) to set
     */
    public setPartVisibility(partIndex: number, value: number): void {
        this._partVisibility[partIndex] = Math.max(0.0, Math.min(1.0, value));
    }

    /**
     * Restricts which source splats of a single part are sorted and rendered, in GLOBAL source-splat
     * coordinates (offsets into the merged atlas). Static parts render fully by default; a streaming
     * part uses this to render only its currently-active LOD splats. The compound recomputes the union
     * of every part's active ranges and drives the single shared depth sort / draw with it, so all
     * parts still sort together in one pass.
     *
     * Passing `null` clears the override for that part (it reverts to rendering its full range). When no
     * part has an override, the compound clears the range filter entirely (renders every splat), which
     * preserves the non-streaming fast path.
     * @param partIndex index of the part to constrain
     * @param ranges active global source-splat ranges for the part, or `null` to render the whole part
     */
    public setPartSplatRanges(partIndex: number, ranges: Nullable<readonly IGaussianSplattingSplatRange[]>): void {
        if (partIndex < 0) {
            return;
        }
        this._partSplatRanges[partIndex] = ranges ? ranges.map((r) => ({ offset: r.offset, count: r.count })) : null;
        this._refreshPartRangeUnion();
    }

    /**
     * Recomputes the global active-range union across all parts and pushes it to the shared sort/draw
     * via the base {@link setSplatIndexRanges}. When no part carries an override the filter is cleared
     * (render everything). A part without an override contributes its full `[offset, count)` derived
     * from its proxy; a part with an override contributes exactly those ranges.
     */
    private _refreshPartRangeUnion(): void {
        let hasOverride = false;
        for (let i = 0; i < this._partSplatRanges.length; i++) {
            if (this._partSplatRanges[i]) {
                hasOverride = true;
                break;
            }
        }
        if (!hasOverride) {
            // No part constrains its splats: render the whole atlas (base fast path).
            this.setSplatIndexRanges(null);
            return;
        }

        const collected: IGaussianSplattingSplatRange[] = [];
        const partCount = this.partCount;
        for (let partIndex = 0; partIndex < partCount; partIndex++) {
            const override = this._partSplatRanges[partIndex];
            if (override) {
                for (const range of override) {
                    if (range.count > 0) {
                        collected.push({ offset: range.offset, count: range.count });
                    }
                }
                continue;
            }
            // No override: render the part's full extent, derived from its proxy.
            const proxy = this._partProxies[partIndex];
            if (proxy && proxy._vertexCount > 0) {
                collected.push({ offset: proxy._splatsDataOffset, count: proxy._vertexCount });
            }
        }

        this.setSplatIndexRanges(GaussianSplattingMesh._CoalesceSplatRanges(collected));
    }

    /**
     * Sorts and merges adjacent/overlapping source-splat ranges so the interval list handed to the sort
     * worker stays compact (parts occupy disjoint regions, so this mainly coalesces contiguous parts).
     * @param ranges raw ranges
     * @returns coalesced ranges sorted by offset
     */
    private static _CoalesceSplatRanges(ranges: IGaussianSplattingSplatRange[]): IGaussianSplattingSplatRange[] {
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

    protected override _copyTextures(source: GaussianSplattingMeshBase): void {
        super._copyTextures(source);
        this._partIndicesTexture = (source as GaussianSplattingMesh)._partIndicesTexture?.clone()!;
    }

    protected override _onUpdateTextures(textureSize: Vector2) {
        const createTextureFromDataU8 = (data: Uint8Array, width: number, height: number, format: number) => {
            return new RawTexture(data, width, height, format, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE);
        };

        // Keep the part indices texture in sync with _partIndices whenever textures are rebuilt.
        // The old "only create if absent" logic left the texture stale after a second addPart/addParts
        // call that doesn't change the texture dimensions: all new splats kept reading partIndex=0
        // (the first part), causing wrong positions, broken GPU picking, and shared movement.
        if (this._partIndices) {
            const buffer = new Uint8Array(this._partIndices);
            if (!this._partIndicesTexture) {
                this._partIndicesTexture = createTextureFromDataU8(buffer, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RED);
                this._partIndicesTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                this._partIndicesTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            } else {
                const existingSize = this._partIndicesTexture.getSize();
                if (existingSize.width !== textureSize.x || existingSize.height !== textureSize.y) {
                    // Dimensions changed — dispose and recreate at the new size.
                    this._partIndicesTexture.dispose();
                    this._partIndicesTexture = createTextureFromDataU8(buffer, textureSize.x, textureSize.y, Constants.TEXTUREFORMAT_RED);
                    this._partIndicesTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                    this._partIndicesTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                } else {
                    // Same size — update data in-place (e.g. second addParts fitting in existing dims).
                    this._updateTextureFromData(this._partIndicesTexture, buffer, textureSize.x, 0, textureSize.y);
                }
            }
        }
    }

    protected override _updateSubTextures(
        splatPositions: Float32Array,
        covA: Uint16Array,
        covB: Uint16Array,
        colorArray: Uint8Array,
        lineStart: number,
        lineCount: number,
        sh?: Uint8Array[],
        partIndices?: Uint8Array
    ): void {
        super._updateSubTextures(splatPositions, covA, covB, colorArray, lineStart, lineCount, sh);
        if (partIndices && this._partIndicesTexture) {
            const textureSize = this._getTextureSize(this._vertexCount);
            const texelStart = lineStart * textureSize.x;
            const texelCount = lineCount * textureSize.x;
            const partIndicesView = new Uint8Array(partIndices.buffer, texelStart, texelCount);
            this._updateTextureFromData(this._partIndicesTexture, partIndicesView, textureSize.x, lineStart, lineCount);

            if (this._worker) {
                this._worker.postMessage({ command: GaussianSplattingSortWorkerCommand.PART_INDICES, partIndices: partIndices });
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    /**
     * Creates the part indices GPU texture the first time an incremental addPart introduces
     * compound data. Has no effect if the texture already exists or no partIndices are provided.
     * @param textureSize - Current texture dimensions
     * @param partIndices - Part index data; if undefined the method is a no-op
     */
    protected _ensurePartIndicesTexture(textureSize: Vector2, partIndices: Uint8Array | undefined): void {
        if (!partIndices || this._partIndicesTexture) {
            return;
        }
        const buffer = new Uint8Array(this._partIndices!);
        this._partIndicesTexture = new RawTexture(
            buffer,
            textureSize.x,
            textureSize.y,
            Constants.TEXTUREFORMAT_RED,
            this._scene,
            false,
            false,
            Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        this._partIndicesTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this._partIndicesTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        if (this._worker) {
            this._worker.postMessage({ command: GaussianSplattingSortWorkerCommand.PART_INDICES, partIndices: partIndices ?? null });
        }
    }

    private _appendPartSourceToArrays(
        source: IGaussianSplattingPartSource,
        dstOffset: number,
        covA: Uint16Array,
        covB: Uint16Array,
        colorArray: Uint8Array,
        sh: Uint8Array[] | undefined,
        minimum: Vector3,
        maximum: Vector3
    ): void {
        this._appendSourceToArrays(source as unknown as GaussianSplattingMeshBase, dstOffset, covA, covB, colorArray, sh, minimum, maximum);
    }

    private _createRetainedPartSource(proxy: GaussianSplattingPartProxyMesh): Nullable<IGaussianSplattingPartSource> {
        if (!this._splatsData || (this._shDegree > 0 && !this._shData)) {
            return null;
        }

        const splatByteOffset = proxy._splatsDataOffset * _GaussianSplattingBytesPerSplat;
        const splatByteLength = proxy._vertexCount * _GaussianSplattingBytesPerSplat;
        const shByteOffset = proxy._shDataOffset * _GaussianSplattingBytesPerShTexel;
        const shByteLength = proxy._vertexCount * _GaussianSplattingBytesPerShTexel;
        const splatBytes = GaussianSplattingMeshBase._GetSplatDataBytes(this._splatsData);

        return {
            name: proxy.name,
            _vertexCount: proxy._vertexCount,
            _splatsData: splatBytes.subarray(splatByteOffset, splatByteOffset + splatByteLength),
            _shData: this._shData?.map((texture) => texture.subarray(shByteOffset, shByteOffset + shByteLength)) ?? null,
            _shDegree: this._shData ? this._shDegree : 0,
            isCompound: false,
            getWorldMatrix: () => proxy.getWorldMatrix(),
            getBoundingInfo: () => proxy.getBoundingInfo(),
            dispose: () => {},
        };
    }

    private _retainMergedPartData(existingVertexCount: number, totalCount: number, others: IGaussianSplattingPartSource[], shDegree: number): void {
        if (!this._keepInRam && !this._alwaysRetainSplatsData) {
            this._splatsData = null;
            this._shData = null;
            return;
        }

        const mergedSplatsData = new Uint8Array(totalCount * _GaussianSplattingBytesPerSplat);
        let splatByteOffset = 0;

        if (this._splatsData && existingVertexCount > 0) {
            mergedSplatsData.set(
                GaussianSplattingMeshBase._GetSplatDataBytes(this._splatsData).subarray(0, existingVertexCount * _GaussianSplattingBytesPerSplat),
                splatByteOffset
            );
            splatByteOffset += existingVertexCount * _GaussianSplattingBytesPerSplat;
        }

        for (const other of others) {
            if (!other._splatsData) {
                continue;
            }

            const splatByteLength = other._vertexCount * _GaussianSplattingBytesPerSplat;
            mergedSplatsData.set(GaussianSplattingMeshBase._GetSplatDataBytes(other._splatsData).subarray(0, splatByteLength), splatByteOffset);
            splatByteOffset += splatByteLength;
        }

        this._splatsData = mergedSplatsData.buffer;

        if (shDegree <= 0) {
            this._shData = null;
            return;
        }

        // Each SH texture holds one texel per splat; each texel is _GaussianSplattingBytesPerShTexel
        // bytes with one byte per scalar, so it carries that many scalars. Degree d has
        // ((d+1)^2 - 1) higher-order coefficients × 3 RGB = total scalars per splat; divide by texel capacity.
        const shTextureCount = Math.ceil((((shDegree + 1) * (shDegree + 1) - 1) * 3) / _GaussianSplattingBytesPerShTexel);
        const mergedShData = AllocateShBuffers(shTextureCount, totalCount * _GaussianSplattingBytesPerShTexel);

        let shByteOffset = 0;
        if (this._shData && existingVertexCount > 0) {
            const existingShByteLength = existingVertexCount * _GaussianSplattingBytesPerShTexel;
            for (let textureIndex = 0; textureIndex < mergedShData.length; textureIndex++) {
                if (textureIndex < this._shData.length) {
                    mergedShData[textureIndex].set(this._shData[textureIndex].subarray(0, existingShByteLength), shByteOffset);
                }
            }
            shByteOffset += existingShByteLength;
        }

        for (const other of others) {
            const otherShByteLength = other._vertexCount * _GaussianSplattingBytesPerShTexel;
            if (other._shData) {
                for (let textureIndex = 0; textureIndex < mergedShData.length; textureIndex++) {
                    if (textureIndex < other._shData.length) {
                        mergedShData[textureIndex].set(other._shData[textureIndex].subarray(0, otherShByteLength), shByteOffset);
                    }
                }
            }
            shByteOffset += otherShByteLength;
        }

        this._shData = mergedShData;
    }

    /**
     * Core implementation for adding one or more source parts as new
     * parts. Writes directly into texture-sized CPU arrays, updates the retained merged source
     * buffers, and uploads in one pass.
     *
     * @param others - Source meshes to append (must each be non-compound and fully loaded)
     * @param disposeOthers - Dispose source meshes after appending
     * @returns Proxy meshes and their assigned part indices
     */
    protected _addPartsInternal(others: IGaussianSplattingPartSource[], disposeOthers: boolean): { proxyMeshes: GaussianSplattingPartProxyMesh[]; assignedPartIndices: number[] } {
        if (others.length === 0) {
            return { proxyMeshes: [], assignedPartIndices: [] };
        }

        // Validate
        for (const other of others) {
            // Reserved-empty placeholders (reserveStreamingPart) intentionally carry no splat data —
            // their atlas region is left zeroed (invisible) for a streaming engine to decode into later.
            if (!other._splatsData && !other._isReservedEmpty) {
                throw new Error(`To call addPart()/addParts(), each source mesh must be fully loaded`);
            }
            if (other.isCompound) {
                throw new Error(`To call addPart()/addParts(), each source mesh must not be a compound`);
            }
        }

        const splatCountA = this._vertexCount;
        const totalOtherCount = others.reduce((s, o) => s + o._vertexCount, 0);
        const totalCount = splatCountA + totalOtherCount;

        const textureSize = this._getTextureSize(totalCount);
        const textureLength = textureSize.x * textureSize.y;
        const covBSItemSize = this._useRGBACovariants ? 4 : 2;

        // Allocate destination arrays for the full new texture
        const covA = new Uint16Array(textureLength * 4);
        const covB = new Uint16Array(covBSItemSize * textureLength);
        const colorArray = new Uint8Array(textureLength * 4);

        // Merged SH degree. The compound carries SH if any existing or new part has it, or a hosted stream bakes it.
        // Parts without SH get neutral (128) fill. `_streamingShDegree` is the degree of the live SH streams (recomputed
        // from surviving parts, so it shrinks when one is removed); folding it in keeps `_shDegree` correct across a
        // rebuild (which resets it) and drops it to 0 when no SH stream survives.
        const streamingShDegree = this._streamingShDegree;
        const staticHasSH = this._shDegree > 0 || others.some((o) => o._shData !== null);
        const hasSH = staticHasSH || streamingShDegree > 0;
        const shDegreeNew = hasSH ? Math.max(this._shDegree, streamingShDegree, ...others.map((o) => o._shDegree)) : 0;
        let sh: Uint8Array[] | undefined = undefined;
        // Allocate the neutral (128 == 0 after decode) CPU SH base whenever the atlas carries SH, and upload it over
        // the whole atlas before any SH stream restores its region, so non-SH regions read neutral instead of raw 0
        // (which decodes to -1).
        if (hasSH && shDegreeNew > 0) {
            // Each SH texture holds one texel per splat; each texel is _GaussianSplattingBytesPerShTexel
            // bytes with one byte per scalar, so it carries that many scalars. Degree d has
            // ((d+1)^2 - 1) higher-order coefficients × 3 RGB = total scalars per splat; divide by texel capacity.
            const shTextureCount = Math.ceil((((shDegreeNew + 1) * (shDegreeNew + 1) - 1) * 3) / _GaussianSplattingBytesPerShTexel);
            sh = AllocateShBuffers(shTextureCount, textureLength * _GaussianSplattingBytesPerShTexel);
        }

        // --- Incremental path: can we reuse the already-committed GPU region? ---
        const incremental = this._canReuseCachedData(splatCountA, totalCount, sh?.length ?? 0);
        const firstNewLine = incremental ? Math.floor(splatCountA / textureSize.x) : 0;

        const minimum = incremental ? this._cachedBoundingMin!.clone() : new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const maximum = incremental ? this._cachedBoundingMax!.clone() : new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        // Preserve existing processed positions in the new array
        const oldPositions = this._splatPositions;
        this._splatPositions = new Float32Array(4 * textureLength);
        if (incremental && oldPositions) {
            this._splatPositions.set(oldPositions.subarray(0, splatCountA * 4));
        }

        // --- Build part indices ---
        let nextPartIndex = this.partCount;
        let partIndicesA = this._partIndices;
        if (!partIndicesA) {
            // First addPart on a plain mesh: assign its splats to part 0
            partIndicesA = new Uint8Array(splatCountA);
            nextPartIndex = splatCountA > 0 ? 1 : 0;
        }

        this._partIndices = new Uint8Array(textureLength);
        this._partIndices.set(partIndicesA.subarray(0, splatCountA));

        const assignedPartIndices: number[] = [];
        const assignedSplatsDataOffsets: number[] = [];
        let dstOffset = splatCountA;
        const maxPartCount = GetGaussianSplattingMaxPartCount(this._scene.getEngine());
        for (const other of others) {
            if (nextPartIndex >= maxPartCount) {
                throw new Error(`Cannot add part, as the maximum part count (${maxPartCount}) has been reached`);
            }
            const newPartIndex = nextPartIndex++;
            assignedPartIndices.push(newPartIndex);
            assignedSplatsDataOffsets.push(dstOffset);
            this._partIndices.fill(newPartIndex, dstOffset, dstOffset + other._vertexCount);
            dstOffset += other._vertexCount;
        }

        // --- Process source data ---
        if (!incremental) {
            // Full rebuild path — only reached when the GPU texture must be reallocated
            // (either the texture height needs to grow to fit the new total, or this is
            // the very first addPart onto a mesh with no GPU textures yet). In the common
            // case where the texture height is unchanged, `incremental` is true and this
            // entire block is skipped. The `splatCountA > 0` guard avoids redundant work
            // on the first-ever addPart when the compound mesh starts empty.
            if (splatCountA > 0) {
                if (this._partProxies.length > 0) {
                    // Already compound: rebuild every existing part from its stored source data.
                    //
                    // DESIGN NOTE: The intended use of GaussianSplattingMesh / GaussianSplattingCompoundMesh
                    // in compound mode is to start EMPTY and compose parts exclusively via addPart/addParts.
                    // In a future major version this will be the only supported path and the "own data"
                    // legacy branch below will be removed.
                    //
                    // Until then, two layouts are possible:
                    //   A) LEGACY — compound loaded its own splat data (via URL or updateData) before
                    //      any addPart call. _partProxies[0] is undefined; the mesh's own splat data
                    //      is treated as an implicit "part 0" in this._splatsData. Proxied parts occupy
                    //      indices 1+. This layout will be deprecated in the next major version.
                    //   B) PREFERRED — compound started empty; first addPart assigned partIndex=0.
                    //      _partProxies[0] is set; this._splatsData is null; all parts are proxied.
                    let rebuildOffset = 0;

                    // Rebuild the compound's legacy "own" data at part 0 (scenario A only).
                    // Skipped in the preferred empty-composer path (scenario B).
                    if (!this._partProxies[0] && this._splatsData) {
                        const proxyVertexCount = this._partProxies.reduce((sum, proxy) => sum + (proxy ? proxy._vertexCount : 0), 0);
                        const part0Count = splatCountA - proxyVertexCount;
                        if (part0Count > 0) {
                            const uBufA = GaussianSplattingMeshBase._GetSplatDataBytes(this._splatsData);
                            const fBufA = GaussianSplattingMeshBase._GetSplatDataFloats(this._splatsData);
                            for (let i = 0; i < part0Count; i++) {
                                this._makeSplat(i, fBufA, uBufA, covA, covB, colorArray, minimum, maximum, false);
                            }
                            if (sh && this._shData) {
                                for (let texIdx = 0; texIdx < sh.length; texIdx++) {
                                    if (texIdx < this._shData.length) {
                                        sh[texIdx].set(this._shData[texIdx].subarray(0, part0Count * _GaussianSplattingBytesPerShTexel), 0);
                                    }
                                }
                            }
                            rebuildOffset += part0Count;
                        }
                    }

                    // Rebuild all proxied parts. Loop from index 0 because in the preferred
                    // scenario B, part 0 is itself a proxied part with no implicit "own" data.
                    for (let partIndex = 0; partIndex < this._partProxies.length; partIndex++) {
                        const proxy = this._partProxies[partIndex];
                        if (!proxy) {
                            continue;
                        }
                        // Streaming parts have no retained CPU source — their atlas rows (core + SH) are
                        // GPU-authoritative and preserved across the rebuild by the backup/restore hooks. Leave their
                        // rows at the fresh-array defaults (zero core, neutral SH) for the restore to overwrite; just
                        // advance the offset. (With a static part present _splatsData is non-null and these would
                        // otherwise reconstruct as a harmless zeros-slice; with only streaming parts it is null and
                        // _createRetainedPartSource returns null — so this skip is required, not just an optimization.)
                        if (this._streamingStates.some((s) => s.proxy === proxy)) {
                            rebuildOffset += proxy._vertexCount;
                            continue;
                        }
                        const source = this._createRetainedPartSource(proxy);
                        if (!source) {
                            throw new Error(`Cannot rebuild compound part "${proxy.name}": the retained compound source data is not available.`);
                        }
                        this._appendPartSourceToArrays(source, rebuildOffset, covA, covB, colorArray, sh, minimum, maximum);
                        rebuildOffset += source._vertexCount;
                    }
                } else {
                    // No proxies yet: this is the very first addPart call on a mesh that loaded
                    // its own splat data (scenario A legacy path). Re-process that own data so
                    // it occupies the start of the new texture before the incoming part is appended.
                    // In the preferred scenario B (empty composer) splatCountA is 0 and this
                    // entire branch is skipped by the outer `if (splatCountA > 0)` guard.
                    if (this._splatsData) {
                        const uBufA = GaussianSplattingMeshBase._GetSplatDataBytes(this._splatsData);
                        const fBufA = GaussianSplattingMeshBase._GetSplatDataFloats(this._splatsData);
                        for (let i = 0; i < splatCountA; i++) {
                            this._makeSplat(i, fBufA, uBufA, covA, covB, colorArray, minimum, maximum, false);
                        }
                        if (sh && this._shData) {
                            for (let texIdx = 0; texIdx < sh.length; texIdx++) {
                                if (texIdx < this._shData.length) {
                                    sh[texIdx].set(this._shData[texIdx].subarray(0, splatCountA * _GaussianSplattingBytesPerShTexel), 0);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Incremental path: rebuild the partial first row (indices firstNewTexel to splatCountA-1)
        // so _updateSubTextures does not upload stale zeros over those already-committed texels.
        // The base-class _updateData always re-processes from firstNewTexel for the same reason;
        // the compound path must do the same.
        // Boundary-row SH is restored after _retainMergedPartData (see below), where _shData is ready.
        if (incremental) {
            const firstNewTexel = firstNewLine * textureSize.x;
            if (firstNewTexel < splatCountA) {
                if (this._partProxies.length === 0) {
                    // No proxies: the mesh loaded its own splat data and this is the first
                    // addPart call (scenario A legacy path). Re-process the partial boundary
                    // row so it is not clobbered by stale zeros during the sub-texture upload.
                    if (this._splatsData) {
                        const uBufA = GaussianSplattingMeshBase._GetSplatDataBytes(this._splatsData);
                        const fBufA = GaussianSplattingMeshBase._GetSplatDataFloats(this._splatsData);
                        for (let i = firstNewTexel; i < splatCountA; i++) {
                            this._makeSplat(i, fBufA, uBufA, covA, covB, colorArray, minimum, maximum, false, i);
                        }
                    }
                } else {
                    // Already compound: build a per-partIndex source lookup so each splat in the
                    // partial boundary row can be re-processed from its original source buffer.
                    //
                    // Handles both layouts (see full-rebuild comment above):
                    //   A) LEGACY: _partProxies[0] absent → seed lookup[0] with this._splatsData
                    //   B) PREFERRED: _partProxies[0] present → all entries filled from proxies
                    const proxyTotal = this._partProxies.reduce((s, p) => s + (p ? p._vertexCount : 0), 0);
                    const part0Count = splatCountA - proxyTotal; // > 0 only in legacy scenario A
                    const srcUBufs: (Uint8Array | null)[] = new Array(this._partProxies.length).fill(null);
                    const srcFBufs: (Float32Array | null)[] = new Array(this._partProxies.length).fill(null);
                    const partStarts: number[] = new Array(this._partProxies.length).fill(0);
                    // Legacy scenario A: part 0 is the mesh's own loaded data.
                    if (!this._partProxies[0] && this._splatsData && part0Count > 0) {
                        srcUBufs[0] = GaussianSplattingMeshBase._GetSplatDataBytes(this._splatsData);
                        srcFBufs[0] = GaussianSplattingMeshBase._GetSplatDataFloats(this._splatsData);
                        partStarts[0] = 0;
                    }
                    // All proxied parts — start from pi=0 to cover preferred scenario B.
                    let cumOffset = part0Count;
                    for (let pi = 0; pi < this._partProxies.length; pi++) {
                        const proxy = this._partProxies[pi];
                        if (!proxy) {
                            continue;
                        }
                        // Streaming parts are GPU-authoritative (no CPU source) — skip reconstruction (their rows are
                        // restored via the atlas hooks). Row-aligned regions mean a streamed part's splats never fall
                        // in the partial boundary row anyway; leave its source buffers null and just track the offset.
                        if (this._streamingStates.some((s) => s.proxy === proxy)) {
                            partStarts[pi] = cumOffset;
                            cumOffset += proxy._vertexCount;
                            continue;
                        }
                        const source = this._createRetainedPartSource(proxy);
                        if (!source || !source._splatsData) {
                            throw new Error(`Cannot rebuild compound part "${proxy.name}": the retained compound source data is not available.`);
                        }
                        srcUBufs[pi] = GaussianSplattingMeshBase._GetSplatDataBytes(source._splatsData);
                        srcFBufs[pi] = GaussianSplattingMeshBase._GetSplatDataFloats(source._splatsData);
                        partStarts[pi] = cumOffset;
                        cumOffset += source._vertexCount;
                    }
                    for (let splatIdx = firstNewTexel; splatIdx < splatCountA; splatIdx++) {
                        const partIdx = this._partIndices ? this._partIndices[splatIdx] : 0;
                        const uBuf = partIdx < srcUBufs.length ? srcUBufs[partIdx] : null;
                        const fBuf = partIdx < srcFBufs.length ? srcFBufs[partIdx] : null;
                        if (uBuf && fBuf) {
                            this._makeSplat(splatIdx, fBuf, uBuf, covA, covB, colorArray, minimum, maximum, false, splatIdx - (partStarts[partIdx] ?? 0));
                        }
                    }
                }
            }
        }

        // Append each new source
        dstOffset = splatCountA;
        for (const other of others) {
            this._appendPartSourceToArrays(other, dstOffset, covA, covB, colorArray, sh, minimum, maximum);
            dstOffset += other._vertexCount;
        }

        // Pad empty splats to texture boundary
        const paddedEnd = (totalCount + 15) & ~0xf;
        for (let i = totalCount; i < paddedEnd; i++) {
            this._makeEmptySplat(i, covA, covB, colorArray);
        }

        // --- Update vertex count / index buffer ---
        if (totalCount !== this._vertexCount) {
            this._updateSplatIndexBuffer(totalCount);
        }
        // Retain CPU SH only for the STATIC contribution — a stream-only SH atlas has no CPU SH to reconstruct on a
        // later compaction (the stream re-decodes/backup-restores its own region), so don't retain neutral buffers.
        this._retainMergedPartData(splatCountA, totalCount, others, staticHasSH ? shDegreeNew : 0);
        this._vertexCount = totalCount;
        this._shDegree = shDegreeNew;
        // Keep the max in sync so the public `shDegree` setter's clamp tracks the current data (and shrinks when a
        // higher-degree part is removed). The compound's SH degree is fully described by the live parts.
        this._maxShDegree = shDegreeNew;

        // Gate the sort worker for the duration of this operation. _updateTextures (below) may create the worker and fire an
        // immediate sort via _postToWorker. At that point partMatrices has not yet been updated for the incoming parts, so the
        // worker would compute depthCoeffs for fewer parts than partIndices references — crashing with
        // "Cannot read properties of undefined (reading '0')".
        // When called from removePart, _rebuilding is already true and _canPostToWorker is already false, so the gate is a
        // no-op — removePart handles the final post+sort.
        const needsWorkerGate = !this._rebuilding;
        if (needsWorkerGate) {
            this._canPostToWorker = false;
            this._rebuilding = true;
        }

        try {
            // --- Upload to GPU ---
            if (incremental) {
                // Create missing SH GPU textures: either the compound just gained SH for the first
                // time (_shTextures===null) or the degree increased (sh.length > _shTextures.length).
                // Use _shData when available (contains correct merged values for all rows);
                // fall back to sh[idx] (pre-filled with 128) when _shData is absent (keepInRam=false).
                // _updateSubTextures will re-upload from firstNewLine, which is redundant but harmless.
                if (sh && (!this._shTextures || sh.length > this._shTextures.length)) {
                    if (!this._shTextures) {
                        this._shTextures = [];
                    }
                    while (this._shTextures.length < sh.length) {
                        const idx = this._shTextures.length;
                        const shTexture = new RawTexture(
                            null,
                            textureSize.x,
                            textureSize.y,
                            Constants.TEXTUREFORMAT_RGBA_INTEGER,
                            this._scene,
                            false,
                            false,
                            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                            Constants.TEXTURETYPE_UNSIGNED_INTEGER
                        );
                        shTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                        shTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
                        this._shTextures.push(shTexture);
                        const src = this._shData && idx < this._shData.length ? this._shData[idx] : sh[idx];
                        this._updateShTextureData(shTexture, src, textureSize.x, 0, textureSize.y);
                    }
                }

                // Restore boundary-row SH: sh is freshly filled with 128, and _updateSubTextures
                // starts at firstNewLine — existing splats on that row need their values from _shData.
                if (sh && this._shData) {
                    const firstNewTexel = firstNewLine * textureSize.x;
                    if (firstNewTexel < splatCountA) {
                        const byteStart = firstNewTexel * _GaussianSplattingBytesPerShTexel;
                        const byteEnd = splatCountA * _GaussianSplattingBytesPerShTexel;
                        for (let texIdx = 0; texIdx < sh.length; texIdx++) {
                            if (texIdx < this._shData.length) {
                                sh[texIdx].set(this._shData[texIdx].subarray(byteStart, byteEnd), byteStart);
                            }
                        }
                    }
                }

                // Update the part-indices texture (handles both create and update-in-place).
                // _ensurePartIndicesTexture is a no-op when the texture already exists, so on the
                // second+ addPart the partIndices would be stale without this call.
                this._onUpdateTextures(textureSize);
                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, firstNewLine, textureSize.y - firstNewLine, sh);
            } else {
                this._updateTextures(covA, covB, colorArray, sh);
            }

            this.setEnabled(true);
            this._notifyWorkerNewData();

            // Bounding info is updated via _updateBoundingInfoFromProxies (called below, after proxy
            // world matrices are known), which needs part 0's local-space AABB as an input:
            //   • For unproxied part 0 (legacy layout A: compound loaded its own splat data before
            //     any addPart call, so no _partProxies[0]), capture the local-space AABB from the
            //     compound mesh's existing _boundingInfo — set when the mesh loaded its own data via
            //     URL/updateData — so _updateBoundingInfoFromProxies can include part 0's geometry.
            //   • For proxied part 0, skip — its bounds are already on the proxy's getBoundingInfo()
            //     and _updateBoundingInfoFromProxies picks it up there.
            // Guard splatCountA > 0 avoids reading a stale bounding box on a fresh empty mesh.
            // Guard !this._part0LocalMin ensures we only store once; subsequent addPart calls must
            // not overwrite it, because by then _boundingInfo reflects the full merged dataset.
            if (!this._partProxies[0] && splatCountA > 0 && !this._part0LocalMin) {
                this._part0LocalMin = this.getBoundingInfo().minimum.clone();
                this._part0LocalMax = this.getBoundingInfo().maximum.clone();
            }

            // --- Create proxy meshes ---
            const proxyMeshes: GaussianSplattingPartProxyMesh[] = [];
            for (let i = 0; i < others.length; i++) {
                const other = others[i];
                const newPartIndex = assignedPartIndices[i];

                const partWorldMatrix = other.getWorldMatrix();
                this.setWorldMatrixForPart(newPartIndex, partWorldMatrix);

                const proxyMesh = new GaussianSplattingPartProxyMesh(
                    other.name,
                    this.getScene(),
                    this,
                    newPartIndex,
                    other.getBoundingInfo(),
                    other._vertexCount,
                    assignedSplatsDataOffsets[i],
                    assignedSplatsDataOffsets[i]
                );

                if (disposeOthers) {
                    other.dispose();
                }

                const quaternion = new Quaternion();
                partWorldMatrix.decompose(proxyMesh.scaling, quaternion, proxyMesh.position);
                proxyMesh.rotationQuaternion = quaternion;
                proxyMesh.computeWorldMatrix(true);

                this._partProxies[newPartIndex] = proxyMesh;
                proxyMeshes.push(proxyMesh);
            }

            // Update compound bounds now that all proxy world matrices are known.
            this._updateBoundingInfoFromProxies();

            // Restore the rebuild gate and post the now-complete partMatrices in one message, then trigger a single sort pass.
            // This ensures the worker sees a consistent partMatrices array that matches the partIndices for every splat.
            if (needsWorkerGate) {
                this._rebuilding = false;
                if (this._worker) {
                    this._worker.postMessage({
                        command: GaussianSplattingSortWorkerCommand.PART_MATRICES,
                        partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)),
                    });
                }
                this._canPostToWorker = true;
                // A streaming compound renders the active-range UNION (a part carries an override), so a newly
                // added static part must be folded into that union now — otherwise it stays out of the sorted
                // set and isn't drawn until the stream's next LOD re-evaluation happens to refresh the union.
                // (No-op for non-streaming compounds: with no override the union clears to the render-all path.)
                if (this._hasStreamingPart) {
                    this._refreshPartRangeUnion();
                }
                this._postToWorker(true);
            }

            this.onPartCountChangedObservable.notifyObservers(this.partCount);
            return { proxyMeshes, assignedPartIndices };
        } catch (e) {
            // Ensure the gates are always restored so sorting is not permanently frozen.
            if (needsWorkerGate) {
                this._rebuilding = false;
                this._canPostToWorker = true;
            }
            throw e;
        }
    }

    // ---------------------------------------------------------------------------
    // Public compound API
    // ---------------------------------------------------------------------------

    /**
     * Add another mesh to this mesh, as a new part. This makes the current mesh a compound, if not already.
     * The source mesh's splat data is read directly and copied into the compound's retained source buffers.
     * @param other - The other mesh to add. Must be fully loaded before calling this method.
     * @param disposeOther - Whether to dispose the other mesh after adding it to the current mesh.
     * @returns a placeholder mesh that can be used to manipulate the part transform
     * @deprecated Use {@link GaussianSplattingCompoundMesh.addPart} instead.
     */
    public addPart(other: GaussianSplattingMesh, disposeOther: boolean = true): GaussianSplattingPartProxyMesh {
        // Adding parts while a streaming part exists is supported: the grow rebuild preserves streamed regions
        // (their GPU data is backed up/restored around the atlas recreation). Only removal is still restricted,
        // because it shifts existing part offsets (which streamed regions' work buffers depend on).
        const { proxyMeshes } = this._addPartsInternal([other], disposeOther);
        return proxyMeshes[0];
    }

    /**
     * Recomputes the shared SH-atlas state ({@link _useShMrtAtlas}, {@link _shMrtAtlasTextureCount},
     * {@link _streamingShDegree}) from the currently-live (non-tombstoned) streaming parts. Call before an atlas
     * rebuild that follows a removal so a stale SH degree/count from a removed part can't keep the SH atlas active
     * (and SH_DEGREE high) with nothing refilling the SH texels.
     */
    private _refreshStreamingShState(): void {
        let count = 0;
        let degree = 0;
        let needsRot = false;
        for (const state of this._streamingStates) {
            if (this._tombstonedPartIndices.has(state.partIndex)) {
                continue;
            }
            if (state.shTextureCount > count) {
                count = state.shTextureCount;
            }
            if (state.shDegree > degree) {
                degree = state.shDegree;
            }
            if (state.needsRotationScale) {
                needsRot = true;
            }
        }
        this._shMrtAtlasTextureCount = count;
        this._useShMrtAtlas = count > 0;
        this._streamingShDegree = degree;
        // Render-backed rotation atlas is active iff a live streaming part decodes rotation/scale. (`_needsRotationScaleTextures`
        // is left as-is — removing a stream doesn't disable IBL for surviving static parts, which keep CPU RawTextures.)
        this._useRotMrtAtlas = needsRot;
    }

    /**
     * Tombstones a part of a streaming compound: excludes it from the render union permanently and hides its
     * proxy, leaving its atlas rows idle. Used instead of the compacting {@link removePart} rebuild whenever a
     * streaming part is reserved — a streamed region has no retained CPU source and decodes at a FIXED base
     * offset, so the rebuild can neither reconstruct it nor shift any part without desynchronizing the streaming
     * engine. Every other part keeps its exact offset (no shift), so resident streams keep decoding at their base.
     * The empty `[]` override survives future add-driven rebuilds, so the region stays invisible even though its
     * texels get rebuilt; memory is only reclaimed by disposing/recreating the whole compound.
     * @param index the part index to tombstone
     */
    private _tombstonePart(index: number): void {
        // Fire before mutation so the stream driving this part (which subscribes to this observable at reservation)
        // can dispose itself: stop its LOD loop, free its work buffer, and drop its atlas-rebuild hooks.
        this.onPartRemovedObservable.notifyObservers(index);
        const proxy = this._partProxies[index];
        if (proxy) {
            proxy.setEnabled(false);
            proxy.visibility = 0;
        }
        this._partVisibility[index] = 0;
        // Invalidate this region's streaming handle so a caller that retained it can't later mutate a surviving part
        // that inherits this index/base after compaction.
        const removedState = this._streamingStates.find((s) => s.partIndex === index);
        if (removedState) {
            removedState.removed = true;
        }
        // Empty (non-null) override = "this part contributes no splats"; keeps the union filter engaged so the
        // idle region is never rendered, even after another part's addition rebuilds the atlas.
        this._partSplatRanges[index] = [];
        // Record the tombstone so compactAtlas() can drop this part's atlas rows and reclaim the memory.
        this._tombstonedPartIndices.add(index);
        this._refreshPartRangeUnion();
        this._updateBoundingInfoFromProxies();
    }

    /**
     * Tears the compound down to an empty state so a subsequent {@link _addPartsInternal} recreates fresh GPU
     * textures. Shared by {@link removePart} (compacting rebuild) and {@link compactAtlas}. Does NOT dispose the
     * part proxies — callers dispose only the proxies being removed and reuse the survivors' proxy objects.
     * @internal
     */
    protected _resetForRebuild(): void {
        // Terminate the sort worker before zeroing _vertexCount. The worker's onmessage handler compares
        // depthMix.length against (_vertexCount + 15) & ~0xf; with _vertexCount = 0 that becomes 16, forcing a
        // re-sort loop on stale data and resetting _canPostToWorker to true, defeating the rebuild gate. The
        // worker is re-instantiated after the rebuild via the first _postToWorker call.
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        // Dispose GPU textures and null them so _updateTextures sees firstTime=true and allocates fresh ones.
        // For a streaming atlas the four data textures are attachments of _mrtAtlas — dispose the MRT, not each.
        if (this._mrtAtlas) {
            this._mrtAtlas.dispose();
            this._mrtAtlas = null;
            this._covariancesATexture = this._covariancesBTexture = this._centersTexture = this._colorsTexture = null;
        } else {
            this._covariancesATexture?.dispose();
            this._covariancesBTexture?.dispose();
            this._centersTexture?.dispose();
            this._colorsTexture?.dispose();
            this._covariancesATexture = null;
            this._covariancesBTexture = null;
            this._centersTexture = null;
            this._colorsTexture = null;
        }
        if (this._rotMrtAtlas) {
            // The three rotation textures are attachments of this MRT — dispose the MRT, not each attachment.
            this._rotMrtAtlas.dispose();
            this._rotMrtAtlas = null;
        } else {
            this._rotationsATexture?.dispose();
            this._rotationsBTexture?.dispose();
            this._rotationScaleTexture?.dispose();
        }
        this._rotationsATexture = null;
        this._rotationsBTexture = null;
        this._rotationScaleTexture = null;
        if (this._shMrtAtlas) {
            // SH attachments belong to these MRTs — dispose the MRTs, not each attachment (mirrors _mrtAtlas).
            for (const mrt of this._shMrtAtlas) {
                mrt.dispose();
            }
            this._shMrtAtlas = null;
            this._shTextures = null;
        } else if (this._shTextures) {
            for (const t of this._shTextures) {
                t.dispose();
            }
            this._shTextures = null;
        }
        if (this._partIndicesTexture) {
            this._partIndicesTexture.dispose();
            this._partIndicesTexture = null;
        }
        this._vertexCount = 0;
        this._splatPositions = null;
        this._partIndices = null;
        this._partMatrices = [];
        this._partVisibility = [];
        this._cachedBoundingMin = null;
        this._cachedBoundingMax = null;
        this._part0LocalMin = null;
        this._part0LocalMax = null;
        this._splatsData = null;
        this._shData = null;
        this._shDegree = 0;
        this._partProxies = [];
        // Drop per-part range overrides too: a rebuild reassigns part indices from 0, so a leftover entry at a
        // now-unused high index would otherwise be inherited by a later-added part (rendering it wrong/nothing).
        // The rebuild re-sets the surviving parts' entries.
        this._partSplatRanges = [];
    }

    /**
     * Reclaims the atlas rows of parts removed (tombstoned) while a streaming part was resident. `removePart`
     * on a streaming compound only tombstones — it excludes the part from the render union and hides its proxy,
     * but leaves its rows allocated, since compacting them would relocate the still-resident streaming regions.
     * This method performs that compaction: it rebuilds the shared atlas from the LIVE parts at new, contiguous
     * (row-aligned for streaming) offsets, physically relocating each surviving streaming region's GPU texels,
     * CPU sort positions, and decode/render base offset, and drops the tombstoned rows — shrinking the atlas.
     *
     * Call it after removing one or more models to actually free the GPU/CPU memory (e.g. on idle, or once a
     * batch of removals settles). No-op when nothing is tombstoned. Safe while streams are actively decoding:
     * each surviving region is backed up before the old atlas is disposed and restored at its new base after.
     */
    public compactAtlas(): void {
        if (this._tombstonedPartIndices.size === 0) {
            return;
        }

        const atlasWidth = this._getTextureSize(1).x;

        // Build the compacted layout of the LIVE parts (skip tombstoned ones), in current part-index order.
        // Static parts pack tightly from their retained CPU source; streaming regions are re-reserved as
        // row-aligned empty sources (front-padded to the next row) and relocated via the atlas-rebuild hooks.
        type LivePartSpec = {
            oldProxy: GaussianSplattingPartProxyMesh;
            source: IGaussianSplattingPartSource;
            worldMatrix: Matrix;
            visibility: number;
            state: Nullable<IStreamingPartState>;
            newBase: number; // streaming only: the region's usable base after compaction
            frontPad: number; // streaming only
        };
        const specs: LivePartSpec[] = [];
        let cumOffset = 0;
        for (let i = 0; i < this._partProxies.length; i++) {
            const proxy = this._partProxies[i];
            if (!proxy || this._tombstonedPartIndices.has(i)) {
                continue;
            }
            const state = this._streamingStates.find((s) => s.proxy === proxy) ?? null;
            const worldMatrix = proxy.getWorldMatrix().clone();
            const visibility = this._partVisibility[i] ?? 1.0;
            if (state) {
                // Streaming: reserve an empty, row-aligned region (front pad + capacity) at the compacted offset.
                const alignedBase = Math.ceil(cumOffset / atlasWidth) * atlasWidth;
                const frontPad = alignedBase - cumOffset;
                const regionSplats = frontPad + state.capacity;
                const source: IGaussianSplattingPartSource = {
                    name: proxy.name,
                    _vertexCount: regionSplats,
                    _splatsData: null,
                    _shData: null,
                    _shDegree: 0,
                    isCompound: false,
                    getWorldMatrix: () => worldMatrix,
                    getBoundingInfo: () => new BoundingInfo(Vector3.ZeroReadOnly, Vector3.ZeroReadOnly),
                    dispose: () => {},
                    _isReservedEmpty: true,
                };
                specs.push({ oldProxy: proxy, source, worldMatrix, visibility, state, newBase: alignedBase, frontPad });
                cumOffset += regionSplats;
            } else {
                const source = this._createRetainedPartSource(proxy);
                if (!source || !source._splatsData) {
                    throw new Error(`compactAtlas: the retained source data for static part "${proxy.name}" is not available.`);
                }
                specs.push({ oldProxy: proxy, source, worldMatrix, visibility, state: null, newBase: 0, frontPad: 0 });
                cumOffset += source._vertexCount;
            }
        }

        // Back up every surviving streaming region's GPU texels + CPU positions before the atlas is torn down.
        if (this._mrtAtlas) {
            this._onBeforeAtlasRebuildObservable.notifyObservers(this._mrtAtlas);
        }

        // Dispose the tombstoned parts' proxies (their streams were already disposed when tombstoned).
        for (const i of this._tombstonedPartIndices) {
            this._partProxies[i]?.dispose();
        }

        // Tear the compound down to empty so _addPartsInternal recreates fresh (smaller) GPU textures.
        this._resetForRebuild();

        if (specs.length === 0) {
            // Everything was tombstoned — nothing to rebuild. Clear the streaming/atlas capability flags so that
            // reusing this now-empty compound for plain (non-streaming) content doesn't recreate render-target
            // atlases or restore a stale SH/rotation configuration. _refreshStreamingShState turns off SH/rotation
            // from the (empty) live states; the render-backed core atlas + RGBA covariants reset here.
            this._streamingStates.length = 0;
            this._hasStreamingPart = false;
            this._tombstonedPartIndices.clear();
            this._refreshStreamingShState();
            this._useMrtAtlas = false;
            // Restore the engine-derived default rather than a hardcoded `false`: WebGL 1 (no WebGPU) cannot render
            // the RG half-float covariance-B path and requires RGBA, so a reused compound must keep that default.
            this._useRGBACovariants = !this.getEngine().isWebGPU && this.getEngine().version === 1.0;
            this.setEnabled(false);
            this.onPartCountChangedObservable.notifyObservers(0);
            return;
        }

        // Recompute the SH-atlas state from the SURVIVING streaming parts BEFORE the rebuild: if the removed part
        // was the only SH stream, this turns the SH atlas off (degree 0) so the rebuild neither recreates a stale
        // SH atlas nor keeps SH_DEGREE high over now-unfilled (raw-0) texels; a lower surviving degree shrinks too.
        this._refreshStreamingShState();

        this._rebuilding = true;
        this._canPostToWorker = false;
        try {
            const { proxyMeshes: newProxies } = this._addPartsInternal(
                specs.map((s) => s.source),
                false
            );

            // Re-map the surviving proxies onto their new indices/offsets and relocate streaming state.
            for (let i = 0; i < specs.length; i++) {
                const spec = specs[i];
                const newProxy = newProxies[i];
                const newPartIndex = newProxy.partIndex;

                this.setWorldMatrixForPart(newPartIndex, spec.worldMatrix);
                this.setPartVisibility(newPartIndex, spec.visibility);
                const quaternion = new Quaternion();
                spec.worldMatrix.decompose(newProxy.scaling, quaternion, newProxy.position);
                newProxy.rotationQuaternion = quaternion;
                newProxy.computeWorldMatrix(true);

                spec.oldProxy.updatePartIndex(newPartIndex);
                spec.oldProxy.updatePartMetadata(newProxy._vertexCount, newProxy._splatsDataOffset, newProxy._shDataOffset);
                this._partProxies[newPartIndex] = spec.oldProxy;
                newProxy.dispose();

                if (spec.state) {
                    // Relocate: the usable base is the (aligned) source start + front pad. Update BEFORE the
                    // onAfter hook fires so the stream reads the new base from the handle.
                    spec.state.partIndex = newPartIndex;
                    spec.state.base = newProxy._splatsDataOffset + spec.frontPad;
                    // Re-post the region's active ranges at the new base so the union stays correct with no flicker.
                    this._partSplatRanges[newPartIndex] = spec.state.localRanges
                        ? spec.state.localRanges.map((r) => ({ offset: spec.state!.base + r.offset, count: r.count }))
                        : null;
                } else {
                    this._partSplatRanges[newPartIndex] = null; // static parts render fully
                }
            }

            // Rebind + restore every surviving streaming region into the new (smaller) atlas at its new base.
            if (this._mrtAtlas) {
                this._onAfterAtlasRebuildObservable.notifyObservers(this._mrtAtlas);
            }

            // Drop the states of tombstoned streaming parts; keep only surviving ones.
            this._streamingStates = specs.filter((s) => s.state).map((s) => s.state!);
            this._hasStreamingPart = this._streamingStates.length > 0;
            this._tombstonedPartIndices.clear();

            // Recompute bounds from the restored proxies (_addPartsInternal above used the zero-box placeholders),
            // else a static-transform compound keeps stale bounds and isInFrustum can cull it. Must run after the
            // tombstone set is cleared so a survivor reusing a tombstoned index isn't skipped by the filter.
            this._updateBoundingInfoFromProxies();

            this._rebuilding = false;
            this._canPostToWorker = true;
            // The streaming regions' CPU positions were restored into _splatPositions by the onAfter hook (after
            // _addPartsInternal had already posted the rebuild's zeros), so re-post the full merged set: positions
            // + part indices via _notifyWorkerNewData, then the per-part matrices (suppressed during _rebuilding),
            // refresh the union, and fire one sort — so the worker's positions/partIndices/partMatrices all agree.
            this._refreshPartRangeUnion();
            this._notifyWorkerNewData();
            const workerAfterRebuild = this._worker as Worker | null;
            workerAfterRebuild?.postMessage({
                command: GaussianSplattingSortWorkerCommand.PART_MATRICES,
                partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)),
            });
            this._postToWorker(true);
            this.onPartCountChangedObservable.notifyObservers(this.partCount);
        } catch (e) {
            this._rebuilding = false;
            this._canPostToWorker = true;
            throw e;
        }
    }

    /**
     * Remove a part from this compound mesh.
     * The remaining parts are rebuilt directly from the compound mesh's retained source buffers.
     * The current mesh is reset to a plain (single-part) state and then each remaining source is
     * re-added via addParts.
     * When a streaming part is reserved the part is tombstoned instead of compacted (see {@link _tombstonePart}).
     * @param index - The index of the part to remove
     * @deprecated Use {@link GaussianSplattingCompoundMesh.removePart} instead.
     */
    public removePart(index: number): void {
        if (index < 0 || index >= this.partCount) {
            throw new Error(`Part index ${index} is out of range [0, ${this.partCount})`);
        }

        // Streaming compounds can't compact (a reserved region has no CPU source and a fixed base offset).
        if (this._hasStreamingPart) {
            this._tombstonePart(index);
            return;
        }

        // Collect surviving proxy objects (sorted by current part index so part 0 is added first)
        const survivors: Array<{ proxyMesh: GaussianSplattingPartProxyMesh; source: IGaussianSplattingPartSource; oldIndex: number; worldMatrix: Matrix; visibility: number }> = [];
        for (let proxyIndex = 0; proxyIndex < this._partProxies.length; proxyIndex++) {
            const proxy = this._partProxies[proxyIndex];
            if (!proxy || proxyIndex === index) {
                continue;
            }
            const source = this._createRetainedPartSource(proxy);
            if (!source) {
                throw new Error(`Cannot remove part: the retained compound source data is not available for part "${proxy.name}".`);
            }
            survivors.push({ proxyMesh: proxy, source, oldIndex: proxyIndex, worldMatrix: proxy.getWorldMatrix().clone(), visibility: this._partVisibility[proxyIndex] ?? 1.0 });
        }
        survivors.sort((a, b) => a.oldIndex - b.oldIndex);

        // Validate every survivor still has its source data. If even one is missing we cannot rebuild.
        for (const { proxyMesh, source } of survivors) {
            if (!source._splatsData) {
                throw new Error(`Cannot remove part: the source data for part "${proxyMesh.name}" is not available.`);
            }
            if (source._shDegree > 0 && !source._shData) {
                throw new Error(`Cannot remove part: the SH data for part "${proxyMesh.name}" is not available.`);
            }
        }

        // Notify listeners before mutation so they can record state keyed on the original index.
        this.onPartRemovedObservable.notifyObservers(index);

        // Dispose the removed part's proxy, then reset to an empty state (survivors' proxy objects are held in
        // `survivors` and reused after the rebuild).
        this._partProxies[index]?.dispose();
        this._resetForRebuild();

        // Rebuild from surviving sources. _addPartsInternal assigns part indices in order 0, 1, 2, …
        // so the new index for each survivor is simply its position in the survivors array.
        if (survivors.length === 0) {
            // Nothing left — leave the mesh empty.
            this.setEnabled(false);
            this.onPartCountChangedObservable.notifyObservers(0);
            return;
        }

        // Gate the sort worker: suppress any sort request until the full rebuild is committed.
        this._rebuilding = true;
        this._canPostToWorker = false;
        try {
            const sources = survivors.map((s) => s.source);
            const { proxyMeshes: newProxies } = this._addPartsInternal(sources, false);

            // Restore world matrices and re-map proxies
            for (let i = 0; i < survivors.length; i++) {
                const oldProxy = survivors[i].proxyMesh;
                const newProxy = newProxies[i];
                const newPartIndex = newProxy.partIndex;

                // Restore the world matrix and visibility the user had set on the old proxy
                this.setWorldMatrixForPart(newPartIndex, survivors[i].worldMatrix);
                this.setPartVisibility(newPartIndex, survivors[i].visibility);
                const quaternion = new Quaternion();
                survivors[i].worldMatrix.decompose(newProxy.scaling, quaternion, newProxy.position);
                newProxy.rotationQuaternion = quaternion;
                newProxy.computeWorldMatrix(true);

                // Update the old proxy's index and metadata so existing user references still work.
                oldProxy.updatePartIndex(newPartIndex);
                oldProxy.updatePartMetadata(newProxy._vertexCount, newProxy._splatsDataOffset, newProxy._shDataOffset);
                this._partProxies[newPartIndex] = oldProxy;

                // newProxy is redundant — it was created inside _addPartsInternal; dispose it
                newProxy.dispose();
            }

            // Rebuild is complete: all partMatrices are now set correctly.
            // Post the final complete set and fire one sort.
            this._rebuilding = false;
            // Break TypeScript's flow narrowing — _addPartsInternal may have reinstantiated _worker.
            const workerAfterRebuild = this._worker as Worker | null;
            workerAfterRebuild?.postMessage({
                command: GaussianSplattingSortWorkerCommand.PART_MATRICES,
                partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)),
            });
            this._canPostToWorker = true;
            this._postToWorker(true);
        } catch (e) {
            // Ensure the gates are always restored so sorting is not permanently frozen.
            this._rebuilding = false;
            this._canPostToWorker = true;
            throw e;
        }
    }

    /**
     * Reserves a contiguous region of `capacity` splats in the compound as a new part for dynamic (streamed)
     * content. Unlike {@link addPart}, no source data is copied: the region is created as invisible padding
     * (zeroed) for a streaming engine to populate over time via the returned handle. The reserved part
     * participates in the compound's single shared depth sort and draw exactly like a static part — it has a
     * `partIndex`, a per-part world matrix (via its proxy), and a per-part visibility — so streamed splats are
     * sorted and rendered together in one pass with the static parts.
     *
     * Add the streaming part LAST (after all static parts). The returned handle drives which of the region's
     * splats render (LOD) and writes their data.
     * @param capacity number of splats to reserve
     * @param worldMatrix initial world matrix for the region's proxy (e.g. carrying a source's up-axis
     *   convention); defaults to identity
     * @param name name for the region's proxy mesh
     * @param shTextureCount number of packed-u32 higher-order SH textures to allocate as a shared render-target SH
     *   atlas the streaming engine bakes into (`ceil(coeffs*3/16)` for the stream's max SH degree); 0 = no SH
     * @param shDegree SH degree of the streamed content (drives the compound's `SH_DEGREE`); ignored when
     *   `shTextureCount` is 0. The compound keeps the MAX SH degree across its parts.
     * @param needsRotationScale when true, converts the compound's rotation/scale textures to a shared render-target
     *   half-float atlas the streaming engine decodes into, so the streamed splats participate in voxel-IBL shadows.
     * @returns a handle used to populate and control the reserved region
     */
    public reserveStreamingPart(
        capacity: number,
        worldMatrix: Matrix = Matrix.Identity(),
        name: string = this.name + "_streamingPart",
        shTextureCount: number = 0,
        shDegree: number = 0,
        needsRotationScale: boolean = false
    ): IGaussianSplattingStreamingPart {
        // Require a positive integer (reject e.g. 0.5, which would floor to a 0-capacity region), and cap at the
        // largest atlas the backend can allocate (a square texture at the max width) so an absurd value can't drive
        // an out-of-memory typed-array / MRT allocation.
        if (!Number.isSafeInteger(capacity) || capacity < 1) {
            throw new Error("reserveStreamingPart: capacity must be a positive integer");
        }

        // Validate the SH sizing parameters — they drive the SH_DEGREE define and the SH texture allocation, so a
        // fractional/negative/huge value would give an invalid layout or an unbounded allocation. The draw path
        // supports degree 0..4 (shTexture0..4); SH is all-or-nothing; the texture count must match the degree.
        const maxSupportedShDegree = 4;
        if (!Number.isSafeInteger(shDegree) || shDegree < 0 || shDegree > maxSupportedShDegree) {
            throw new Error(`reserveStreamingPart: shDegree must be an integer in [0, ${maxSupportedShDegree}]`);
        }
        if (!Number.isSafeInteger(shTextureCount) || shTextureCount < 0) {
            throw new Error("reserveStreamingPart: shTextureCount must be a non-negative integer");
        }
        if (shDegree > 0 !== shTextureCount > 0) {
            throw new Error("reserveStreamingPart: shDegree and shTextureCount must both be positive (SH) or both zero (no SH)");
        }
        if (shDegree > 0) {
            const expectedShTextureCount = Math.ceil((((shDegree + 1) * (shDegree + 1) - 1) * 3) / _GaussianSplattingBytesPerShTexel);
            if (shTextureCount !== expectedShTextureCount) {
                throw new Error(`reserveStreamingPart: shTextureCount ${shTextureCount} does not match shDegree ${shDegree} (expected ${expectedShTextureCount})`);
            }
        }

        const maxTextureSize = this._scene.getEngine().getCaps().maxTextureSize;
        const maxCapacity = maxTextureSize * maxTextureSize;

        // Row-align the region so a later GPU relayout (defrag under a memory budget) can be scoped to whole
        // atlas rows via scissor without ever touching a preceding part that shares a row.
        //   - Front alignment: start the usable region on the next row boundary. This only consumes the
        //     preceding parts' already-allocated last-row tail padding, so it costs no extra memory.
        //   - Capacity alignment: pad the region up to a whole number of rows so its end is a row boundary too
        //     (needed when another part follows, e.g. multiple streaming parts).
        const atlasWidth = this._getTextureSize(1).x;
        const startOffset = this._vertexCount; // first atlas index the reserved part occupies
        const alignedBase = Math.ceil(startOffset / atlasWidth) * atlasWidth;
        const frontPad = alignedBase - startOffset; // invisible padding that fills the preceding row
        const alignedCapacity = Math.ceil(capacity / atlasWidth) * atlasWidth;
        const regionSplats = frontPad + alignedCapacity;

        // Validate the RESULTING atlas, not just `capacity`: existing splats, row-alignment padding, and the trailing
        // empty sentinel slot (`+ 1`, see _getTextureSize) all count against the device's square-texture limit.
        // _getTextureSize would silently clamp and drop the sentinel past the limit, so reject here — before any
        // state is mutated below, so a rejected reservation leaves the compound intact.
        const projectedSplats = startOffset + regionSplats;
        if (projectedSplats + 1 > maxCapacity) {
            throw new Error(
                `reserveStreamingPart: capacity ${capacity} would grow the atlas to ${projectedSplats} splats (plus a sentinel), exceeding the maximum atlas capacity ${maxCapacity}`
            );
        }

        // Back the atlas with a render-targetable MRT so a streaming engine can GPU-decode into the reserved
        // region. Must be set before _addPartsInternal so the (forced) full rebuild builds MRT attachments and
        // allocates covariance B as RGBA. Harmless/no-op if a streaming part was already reserved.
        this._useMrtAtlas = true;
        this._useRGBACovariants = true;

        // Higher-order SH: convert the SH textures to render-targetable integer MRTs so the stream can bake SH into
        // its region, and set the compound's SH degree so the draw path lights the decoded splats. Sized for the
        // MAX SH texture count across parts (a later higher-degree part grows it; lower-degree parts neutral-fill).
        if (shTextureCount > 0 && shDegree > 0) {
            this._useShMrtAtlas = true;
            this._shMrtAtlasTextureCount = Math.max(this._shMrtAtlasTextureCount, shTextureCount);
            // Streaming SH degree is tracked separately from _maxShDegree (which folds in static parts too) and is
            // recomputed from the surviving states on removal — so it shrinks correctly. The _addPartsInternal
            // rebuild below folds it into _shDegree/_maxShDegree.
            this._streamingShDegree = Math.max(this._streamingShDegree, shDegree);
        }

        // Rotation/scale: convert the rotation textures to a render-targetable half-float atlas so the stream can
        // decode rotation/scale into its region for voxel-IBL shadows. `_needsRotationScaleTextures` makes _makeSplat
        // fill static parts' rotation data (CPU-uploaded into the shared atlas by the rebuild) too.
        if (needsRotationScale) {
            this._useRotMrtAtlas = true;
            this._needsRotationScaleTextures = true;
        }

        // Running local-space bounds of the region's written centers; grown as splats are populated.
        const boundsMin = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const boundsMax = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        // Synthetic placeholder source: no data, so _addPartsInternal leaves the region zeroed (invisible)
        // while still assigning a part index, filling _partIndices, growing the atlas + _splatPositions,
        // creating the proxy, and posting the (larger) position/interval set to the sort worker.
        const reservedSource: IGaussianSplattingPartSource = {
            name,
            _vertexCount: regionSplats,
            _splatsData: null,
            _shData: null,
            _shDegree: 0,
            isCompound: false,
            getWorldMatrix: () => worldMatrix,
            getBoundingInfo: () => new BoundingInfo(Vector3.ZeroReadOnly, Vector3.ZeroReadOnly),
            dispose: () => {},
            _isReservedEmpty: true,
        };

        const { proxyMeshes, assignedPartIndices } = this._addPartsInternal([reservedSource], false);
        const proxy = proxyMeshes[0];
        // Usable region starts at the row-aligned base (past the front padding) and spans the aligned capacity.
        // (proxy._splatsDataOffset === startOffset; the usable base is startOffset + frontPad === alignedBase.)
        // `base`/`partIndex` live in mutable state so compactAtlas can RELOCATE this region (new base/index) in
        // place; the handle's getters and closures read the state, so the streaming engine's handle stays valid.
        const state: IStreamingPartState = {
            proxy,
            base: alignedBase,
            partIndex: assignedPartIndices[0],
            capacity: alignedCapacity,
            boundsMin,
            boundsMax,
            localRanges: null,
            shTextureCount: shTextureCount > 0 && shDegree > 0 ? shTextureCount : 0,
            shDegree: shTextureCount > 0 && shDegree > 0 ? shDegree : 0,
            needsRotationScale,
            removed: false,
        };
        this._streamingStates.push(state);
        capacity = alignedCapacity;

        // The handle's live getters need a stable reference to this compound (its atlas textures can be
        // recreated on a later rebuild), so alias it for the closures below.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const compound = this;
        const applyBounds = () => {
            if (boundsMin.x <= boundsMax.x) {
                proxy.setBoundingInfo(new BoundingInfo(boundsMin.clone(), boundsMax.clone()));
                compound._updateBoundingInfoFromProxies();
            }
        };
        // Rejects any mutating call after the part was removed, so a retained stale handle can't touch a surviving
        // part that inherited this region's (now-reused) part index/base.
        const assertLive = (method: string) => {
            if (state.removed) {
                throw new Error(`${method}: this streaming part has been removed`);
            }
        };
        // Enforces the documented local part boundary [0, capacity) so a handle call can never address another
        // part's atlas region (the region base is added to these local coordinates before use).
        const assertLocalRange = (method: string, offset: number, count: number) => {
            if (!Number.isInteger(offset) || !Number.isInteger(count) || offset < 0 || count < 0 || offset + count > state.capacity) {
                throw new Error(`${method}: local range [${offset}, ${offset + count}) is outside the reserved region [0, ${state.capacity})`);
            }
        };

        const handle: IGaussianSplattingStreamingPart = {
            proxy,
            capacity,
            get partIndex() {
                return state.partIndex;
            },
            get base() {
                return state.base;
            },
            get centersTexture() {
                return compound.centersTexture;
            },
            get covariancesATexture() {
                return compound.covariancesATexture;
            },
            get covariancesBTexture() {
                return compound.covariancesBTexture;
            },
            get colorsTexture() {
                return compound.colorsTexture;
            },
            get splatPositions() {
                return compound._splatPositions;
            },
            get mrtAtlas() {
                return compound._mrtAtlas;
            },
            get shMrtAtlas() {
                return compound._shMrtAtlas;
            },
            get rotMrtAtlas() {
                return compound._rotMrtAtlas;
            },
            get atlasWidth() {
                return compound._getTextureSize(compound._vertexCount).x;
            },
            get isDepthSortSettled() {
                return compound._isDepthSortSettled;
            },
            setActiveRanges: (localRanges) => {
                assertLive("setActiveRanges");
                // Keep every range inside this part's region so it can never activate another part's splats.
                if (localRanges) {
                    for (const r of localRanges) {
                        assertLocalRange("setActiveRanges", r.offset, r.count);
                    }
                }
                // Remember the LOCAL ranges so compactAtlas can re-post them at the region's new base.
                state.localRanges = localRanges ? localRanges.map((r) => ({ offset: r.offset, count: r.count })) : null;
                const globalRanges = localRanges ? localRanges.map((r) => ({ offset: state.base + r.offset, count: r.count })) : null;
                compound.setPartSplatRanges(state.partIndex, globalRanges);
            },
            writeSplats: (localOffset, count, splatsData) => {
                assertLive("writeSplats");
                // Keep the write inside this part's region so it can never touch another part's atlas texels.
                assertLocalRange("writeSplats", localOffset, count);
                compound._writeStreamingSplats(state.base + localOffset, count, splatsData, boundsMin, boundsMax);
                applyBounds();
            },
            postPositionsRange: (localOffset, count) => {
                assertLive("postPositionsRange");
                assertLocalRange("postPositionsRange", localOffset, count);
                compound._postWorkerPositionsRange(state.base + localOffset, count);
            },
            expandBounds: (min, max) => {
                assertLive("expandBounds");
                boundsMin.minimizeInPlace(min);
                boundsMax.maximizeInPlace(max);
                applyBounds();
            },
            notifyDataChanged: () => {
                assertLive("notifyDataChanged");
                compound._notifyWorkerNewData();
            },
            onBeforeAtlasRebuild: (callback) => {
                const observer = compound._onBeforeAtlasRebuildObservable.add(callback);
                return () => compound._onBeforeAtlasRebuildObservable.remove(observer);
            },
            onAfterAtlasRebuild: (callback) => {
                const observer = compound._onAfterAtlasRebuildObservable.add(callback);
                return () => compound._onAfterAtlasRebuildObservable.remove(observer);
            },
        };
        // Mark AFTER the successful internal _addPartsInternal so its own call isn't blocked by the guard.
        this._hasStreamingPart = true;
        return handle;
    }

    /**
     * Serialize current GaussianSplattingMesh
     * @param serializationObject defines the object which will receive the serialization data
     * @param encoding the encoding of binary data, defaults to base64 for json serialize,
     * kept for future internal use like cloning where base64 encoding wastes cycles and memory
     * @returns the serialized object
     */
    public override serialize(serializationObject: any = {}, encoding: string = "base64"): any {
        serializationObject = super.serialize(serializationObject);
        serializationObject.subMeshes = [];
        serializationObject.geometryUniqueId = undefined;
        serializationObject.geometryId = undefined;
        serializationObject.materialUniqueId = undefined;
        serializationObject.materialId = undefined;
        serializationObject.instances = [];
        serializationObject.actions = undefined;
        serializationObject.type = this.getClassName();
        serializationObject.keepInRam = this._keepInRam;
        serializationObject.disableDepthSort = this._disableDepthSort;
        serializationObject.viewUpdateThreshold = this.viewUpdateThreshold;
        serializationObject._flipY = this._flipY;

        if (this._splatsData) {
            serializationObject.splatsData = encoding === "base64" ? EncodeArrayBufferToBase64(this._splatsData) : this._splatsData;
        }
        if (this._shData) {
            serializationObject.shData = encoding === "base64" ? this._shData.map(EncodeArrayBufferToBase64) : this._shData;
            serializationObject.shDegree = this._shDegree;
        }
        if (this._partIndices) {
            const compressedIndices = CompressPartIndices(this._partIndices.subarray(0, this._vertexCount));
            serializationObject.partIndices = encoding === "base64" ? EncodeArrayBufferToBase64(compressedIndices) : compressedIndices;
        }
        if (this._partProxies.length) {
            serializationObject.partProxies = this._partProxies.filter((proxy) => !!proxy).map((proxy) => proxy.serialize());
        }

        return serializationObject;
    }

    /**
     * Internal helper to parses a serialized GaussianSplattingMesh or GaussianSplattingCompoundMesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the GaussianSplattingMesh or GaussianSplattingCompoundMesh in
     * @param ctor the constructor of the mesh to create
     * @returns the created GaussianSplattingMesh
     * @internal
     */
    public static _ParseInternal<T extends GaussianSplattingMesh>(
        parsedMesh: any,
        scene: Scene,
        ctor: new (name: string, url: Nullable<string>, scene: Nullable<Scene>, keepInRam: boolean) => T
    ): T {
        const mesh = new ctor(parsedMesh.name, null, scene, parsedMesh.keepInRam);

        mesh.disableDepthSort = parsedMesh.disableDepthSort ?? false;
        mesh.viewUpdateThreshold = parsedMesh.viewUpdateThreshold ?? GaussianSplattingMeshBase._DefaultViewUpdateThreshold;

        let splatsData: ArrayBuffer | string | undefined = parsedMesh.splatsData;
        if (typeof splatsData === "string") {
            splatsData = DecodeBase64ToBinary(splatsData);
        }

        const shData: string[] | Uint8Array[] | undefined = parsedMesh.shData;
        let parsedShData: Uint8Array[] | undefined;
        if (Array.isArray(shData) && shData.length) {
            const newData: Uint8Array[] = [];
            for (let i = 0, length = shData.length; i < length; i++) {
                const data = shData[i];
                if (typeof data === "string") {
                    newData[i] = new Uint8Array(DecodeBase64ToBinary(data));
                } else {
                    newData[i] = data;
                }
            }
            parsedShData = newData;
        }

        let partIndices: string | Uint32Array | number[] | undefined = parsedMesh.partIndices;
        let parsedPartIndices: Uint8Array | undefined;
        if (typeof partIndices === "string") {
            partIndices = new Uint32Array(DecodeBase64ToBinary(partIndices));
        }
        if (partIndices) {
            parsedPartIndices = ParsePartIndices(partIndices);
        }

        if (splatsData) {
            const flipY = parsedMesh._flipY ?? false;
            mesh.updateData(splatsData, parsedShData, { flipY }, parsedPartIndices, parsedMesh.shDegree);
        }

        if (parsedMesh.partProxies) {
            for (const serializedPart of parsedMesh.partProxies) {
                const part = Object.assign({}, serializedPart);
                part.compoundSplatMesh = mesh;
                const proxyMesh = Mesh.Parse(part, scene, "") as GaussianSplattingPartProxyMesh;
                const newPartIndex = proxyMesh.partIndex;
                mesh._partProxies[newPartIndex] = proxyMesh;
                mesh.setWorldMatrixForPart(newPartIndex, proxyMesh.getWorldMatrix());
                mesh.setPartVisibility(newPartIndex, proxyMesh.isEnabled() ? proxyMesh.visibility : 0);
            }
        }

        return mesh;
    }

    /**
     * Parses a serialized GaussianSplattingMesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the GaussianSplattingMesh in
     * @returns the created GaussianSplattingMesh
     */
    public static override Parse(parsedMesh: any, scene: Scene): GaussianSplattingMesh {
        return GaussianSplattingMesh._ParseInternal(parsedMesh, scene, GaussianSplattingMesh);
    }
}

/**
 * True when `className` (from `AbstractMesh.getClassName()`) identifies a Gaussian Splatting mesh whose
 * `position.z` vertex attribute encodes a splat index rather than world-space Z: `"GaussianSplattingMesh"`
 * (also returned by {@link GaussianSplattingCompoundMesh}, which deliberately does not override
 * `getClassName()`) and `"GaussianSplattingStream"` (which does override it, to remain distinguishable for
 * other purposes). Rendering-pipeline code that must treat any Gaussian Splatting mesh differently from an
 * ordinary mesh (geometry buffer, depth pre-pass, GPU picking, IBL voxelization, snapshot rendering, ...)
 * should use this instead of a literal string comparison, so a future splat mesh subclass only needs to be
 * added here once.
 * @param className the mesh class name to test, e.g. from `AbstractMesh.getClassName()`
 * @returns true if the class name identifies a Gaussian Splatting mesh
 */
export function IsGaussianSplattingClassName(className: string): boolean {
    return className === "GaussianSplattingMesh" || className === "GaussianSplattingStream";
}

let _Registered = false;
/**
 * Register side effects for gaussianSplattingMesh.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterGaussianSplattingMesh(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Mesh._GaussianSplattingMeshParser = GaussianSplattingMesh.Parse;
}
