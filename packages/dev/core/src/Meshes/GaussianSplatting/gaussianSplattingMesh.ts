import { type Nullable } from "core/types";
import { type Scene } from "core/scene";
import { type Matrix, type Vector2, Quaternion, Vector3 } from "core/Maths/math.vector";
import { type Effect } from "core/Materials/effect";

import { GetGaussianSplattingMaxPartCount } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMeshBase } from "./gaussianSplattingMeshBase";

import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import "core/Meshes/thinInstanceMesh";
import { GaussianSplattingPartProxyMesh } from "./gaussianSplattingPartProxyMesh";
import { type BaseTexture } from "../../Materials/Textures/baseTexture";

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

    private _partIndicesTexture: Nullable<BaseTexture> = null;
    private _partIndices: Nullable<Uint8Array> = null;

    /**
     * Creates a new GaussianSplattingMesh
     * @param name the name of the mesh
     * @param url optional URL to load a Gaussian Splatting file from
     * @param scene the hosting scene
     * @param keepInRam whether to keep the raw splat data in RAM after uploading to GPU
     */
    constructor(name: string, url: Nullable<string> = null, scene: Nullable<Scene> = null, keepInRam: boolean = false) {
        super(name, url, scene, keepInRam);
        // Ensure _splatsData is retained once compound mode is entered — addPart/addParts need
        // the source data for full-texture rebuilds. Set after super() so it is visible to
        // _updateData when the async load completes.
        this._alwaysRetainSplatsData = true;
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingMesh"
     */
    public override getClassName(): string {
        return "GaussianSplattingMesh";
    }

    /**
     * Disposes proxy meshes and clears part data in addition to the base class GPU resources.
     * @param doNotRecurse Set to true to not recurse into each children
     */
    public override dispose(doNotRecurse?: boolean): void {
        for (const proxy of this._partProxies) {
            proxy.dispose();
        }
        if (this._partIndicesTexture) {
            this._partIndicesTexture.dispose();
        }
        this._partProxies = [];
        this._partMatrices = [];
        this._partVisibility = [];
        this._partIndicesTexture = null;
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
        worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
        worker.postMessage({ partIndices: this._partIndices ? new Uint8Array(this._partIndices) : null });
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
            this._worker.postMessage({ partIndices: this._partIndices ?? null });
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
        this._partMatrices[partIndex].copyFrom(worldMatrix);
        // During a batch rebuild suppress intermediate posts — the final correct set is posted
        // once the full rebuild completes (at the end of removePart).
        if (!this._rebuilding) {
            if (this._worker) {
                this._worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
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
                this._worker.postMessage({ partIndices: partIndices });
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
            this._worker.postMessage({ partIndices: partIndices ?? null });
        }
    }

    /**
     * Core implementation for adding one or more external GaussianSplattingMesh objects as new
     * parts. Writes directly into texture-sized CPU arrays and uploads in one pass — no merged
     * CPU splat buffer is ever constructed.
     *
     * @param others - Source meshes to append (must each be non-compound and fully loaded)
     * @param disposeOthers - Dispose source meshes after appending
     * @returns Proxy meshes and their assigned part indices
     */
    protected _addPartsInternal(others: GaussianSplattingMesh[], disposeOthers: boolean): { proxyMeshes: GaussianSplattingPartProxyMesh[]; assignedPartIndices: number[] } {
        if (others.length === 0) {
            return { proxyMeshes: [], assignedPartIndices: [] };
        }

        // Validate
        for (const other of others) {
            if (!other._splatsData) {
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

        // Determine merged SH degree
        const hasSH = this._shData !== null && others.every((o) => o._shData !== null);
        const shDegreeNew = hasSH ? Math.max(this._shDegree, ...others.map((o) => o._shDegree)) : 0;
        let sh: Uint8Array[] | undefined = undefined;
        if (hasSH && shDegreeNew > 0) {
            const bytesPerTexel = 16;
            sh = [];
            for (let i = 0; i < shDegreeNew; i++) {
                sh.push(new Uint8Array(textureLength * bytesPerTexel));
            }
        }

        // --- Incremental path: can we reuse the already-committed GPU region? ---
        const incremental = this._canReuseCachedData(splatCountA, totalCount);
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
        let dstOffset = splatCountA;
        const maxPartCount = GetGaussianSplattingMaxPartCount(this._scene.getEngine());
        for (const other of others) {
            if (nextPartIndex >= maxPartCount) {
                throw new Error(`Cannot add part, as the maximum part count (${maxPartCount}) has been reached`);
            }
            const newPartIndex = nextPartIndex++;
            assignedPartIndices.push(newPartIndex);
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
                        const proxyVertexCount = this._partProxies.reduce((sum, proxy) => sum + (proxy ? proxy.proxiedMesh._vertexCount : 0), 0);
                        const part0Count = splatCountA - proxyVertexCount;
                        if (part0Count > 0) {
                            const uBufA = new Uint8Array(this._splatsData);
                            const fBufA = new Float32Array(this._splatsData);
                            for (let i = 0; i < part0Count; i++) {
                                this._makeSplat(i, fBufA, uBufA, covA, covB, colorArray, minimum, maximum, false);
                            }
                            if (sh && this._shData) {
                                const bytesPerTexel = 16;
                                for (let texIdx = 0; texIdx < sh.length; texIdx++) {
                                    if (texIdx < this._shData.length) {
                                        sh[texIdx].set(this._shData[texIdx].subarray(0, part0Count * bytesPerTexel), 0);
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
                        if (!proxy || !proxy.proxiedMesh) {
                            continue;
                        }
                        this._appendSourceToArrays(proxy.proxiedMesh, rebuildOffset, covA, covB, colorArray, sh, minimum, maximum);
                        rebuildOffset += proxy.proxiedMesh._vertexCount;
                    }
                } else {
                    // No proxies yet: this is the very first addPart call on a mesh that loaded
                    // its own splat data (scenario A legacy path). Re-process that own data so
                    // it occupies the start of the new texture before the incoming part is appended.
                    // In the preferred scenario B (empty composer) splatCountA is 0 and this
                    // entire branch is skipped by the outer `if (splatCountA > 0)` guard.
                    if (this._splatsData) {
                        const uBufA = new Uint8Array(this._splatsData);
                        const fBufA = new Float32Array(this._splatsData);
                        for (let i = 0; i < splatCountA; i++) {
                            this._makeSplat(i, fBufA, uBufA, covA, covB, colorArray, minimum, maximum, false);
                        }
                        if (sh && this._shData) {
                            const bytesPerTexel = 16;
                            for (let texIdx = 0; texIdx < sh.length; texIdx++) {
                                if (texIdx < this._shData.length) {
                                    sh[texIdx].set(this._shData[texIdx].subarray(0, splatCountA * bytesPerTexel), 0);
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
        if (incremental) {
            const firstNewTexel = firstNewLine * textureSize.x;
            if (firstNewTexel < splatCountA) {
                if (this._partProxies.length === 0) {
                    // No proxies: the mesh loaded its own splat data and this is the first
                    // addPart call (scenario A legacy path). Re-process the partial boundary
                    // row so it is not clobbered by stale zeros during the sub-texture upload.
                    if (this._splatsData) {
                        const uBufA = new Uint8Array(this._splatsData);
                        const fBufA = new Float32Array(this._splatsData);
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
                    const proxyTotal = this._partProxies.reduce((s, p) => s + (p ? p.proxiedMesh._vertexCount : 0), 0);
                    const part0Count = splatCountA - proxyTotal; // > 0 only in legacy scenario A
                    const srcUBufs: (Uint8Array | null)[] = new Array(this._partProxies.length).fill(null);
                    const srcFBufs: (Float32Array | null)[] = new Array(this._partProxies.length).fill(null);
                    const partStarts: number[] = new Array(this._partProxies.length).fill(0);
                    // Legacy scenario A: part 0 is the mesh's own loaded data.
                    if (!this._partProxies[0] && this._splatsData && part0Count > 0) {
                        srcUBufs[0] = new Uint8Array(this._splatsData);
                        srcFBufs[0] = new Float32Array(this._splatsData);
                        partStarts[0] = 0;
                    }
                    // All proxied parts — start from pi=0 to cover preferred scenario B.
                    let cumOffset = part0Count;
                    for (let pi = 0; pi < this._partProxies.length; pi++) {
                        const proxy = this._partProxies[pi];
                        if (!proxy?.proxiedMesh) {
                            continue;
                        }
                        const srcData = proxy.proxiedMesh._splatsData ?? null;
                        srcUBufs[pi] = srcData ? new Uint8Array(srcData) : null;
                        srcFBufs[pi] = srcData ? new Float32Array(srcData) : null;
                        partStarts[pi] = cumOffset;
                        cumOffset += proxy.proxiedMesh._vertexCount;
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
            this._appendSourceToArrays(other, dstOffset, covA, covB, colorArray, sh, minimum, maximum);
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
        this._vertexCount = totalCount;
        this._shDegree = shDegreeNew;

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
                // Update the part-indices texture (handles both create and update-in-place).
                // _ensurePartIndicesTexture is a no-op when the texture already exists, so on the
                // second+ addPart the partIndices would be stale without this call.
                this._onUpdateTextures(textureSize);
                this._updateSubTextures(this._splatPositions, covA, covB, colorArray, firstNewLine, textureSize.y - firstNewLine, sh);
            } else {
                this._updateTextures(covA, covB, colorArray, sh);
            }

            this.getBoundingInfo().reConstruct(minimum, maximum, this.getWorldMatrix());
            this.setEnabled(true);
            this._cachedBoundingMin = minimum.clone();
            this._cachedBoundingMax = maximum.clone();
            this._notifyWorkerNewData();

            // --- Create proxy meshes ---
            const proxyMeshes: GaussianSplattingPartProxyMesh[] = [];
            for (let i = 0; i < others.length; i++) {
                const other = others[i];
                const newPartIndex = assignedPartIndices[i];

                const partWorldMatrix = other.getWorldMatrix();
                this.setWorldMatrixForPart(newPartIndex, partWorldMatrix);

                const proxyMesh = new GaussianSplattingPartProxyMesh(other.name, this.getScene(), this, other, newPartIndex);

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

            // Restore the rebuild gate and post the now-complete partMatrices in one message, then trigger a single sort pass.
            // This ensures the worker sees a consistent partMatrices array that matches the partIndices for every splat.
            if (needsWorkerGate) {
                this._rebuilding = false;
                if (this._worker) {
                    this._worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
                }
                this._canPostToWorker = true;
                this._postToWorker(true);
            }

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
     * The source mesh's splat data is read directly — no merged CPU buffer is constructed.
     * @param other - The other mesh to add. Must be fully loaded before calling this method.
     * @param disposeOther - Whether to dispose the other mesh after adding it to the current mesh.
     * @returns a placeholder mesh that can be used to manipulate the part transform
     * @deprecated Use {@link GaussianSplattingCompoundMesh.addPart} instead.
     */
    public addPart(other: GaussianSplattingMesh, disposeOther: boolean = true): GaussianSplattingPartProxyMesh {
        const { proxyMeshes } = this._addPartsInternal([other], disposeOther);
        return proxyMeshes[0];
    }

    /**
     * Remove a part from this compound mesh.
     * The remaining parts are rebuilt directly from their stored source mesh references —
     * no merged CPU splat buffer is read back. The current mesh is reset to a plain (single-part)
     * state and then each remaining source is re-added via addParts.
     * @param index - The index of the part to remove
     * @deprecated Use {@link GaussianSplattingCompoundMesh.removePart} instead.
     */
    public removePart(index: number): void {
        if (index < 0 || index >= this.partCount) {
            throw new Error(`Part index ${index} is out of range [0, ${this.partCount})`);
        }

        // Collect surviving proxy objects (sorted by current part index so part 0 is added first)
        const survivors: Array<{ proxyMesh: GaussianSplattingPartProxyMesh; oldIndex: number; worldMatrix: Matrix; visibility: number }> = [];
        for (let proxyIndex = 0; proxyIndex < this._partProxies.length; proxyIndex++) {
            const proxy = this._partProxies[proxyIndex];
            if (proxy && proxyIndex !== index) {
                survivors.push({ proxyMesh: proxy, oldIndex: proxyIndex, worldMatrix: proxy.getWorldMatrix().clone(), visibility: this._partVisibility[proxyIndex] ?? 1.0 });
            }
        }
        survivors.sort((a, b) => a.oldIndex - b.oldIndex);

        // Validate every survivor still has its source data. If even one is missing we cannot rebuild.
        for (const { proxyMesh } of survivors) {
            if (!proxyMesh.proxiedMesh._splatsData) {
                throw new Error(`Cannot remove part: the source mesh for part "${proxyMesh.name}" no longer has its splat data available.`);
            }
        }

        // --- Reset this mesh to an empty state ---
        // Terminate the sort worker before zeroing _vertexCount. The worker's onmessage handler
        // compares depthMix.length against (_vertexCount + 15) & ~0xf; with _vertexCount = 0 that
        // becomes 16, which causes a forced re-sort loop on stale data and resets _canPostToWorker
        // to true, defeating the gate below. The worker will be re-instantiated naturally after
        // the rebuild via the first _postToWorker call.
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        // Dispose and null GPU textures so _updateTextures sees firstTime=true and creates
        // fresh GPU textures.
        this._covariancesATexture?.dispose();
        this._covariancesBTexture?.dispose();
        this._centersTexture?.dispose();
        this._colorsTexture?.dispose();
        this._covariancesATexture = null;
        this._covariancesBTexture = null;
        this._centersTexture = null;
        this._colorsTexture = null;
        if (this._shTextures) {
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

        // Remove the proxy for the removed part and dispose it
        const proxyToRemove = this._partProxies[index];
        if (proxyToRemove) {
            proxyToRemove.dispose();
        }
        this._partProxies = [];

        // Rebuild from surviving sources. _addPartsInternal assigns part indices in order 0, 1, 2, …
        // so the new index for each survivor is simply its position in the survivors array.
        if (survivors.length === 0) {
            // Nothing left — leave the mesh empty.
            this.setEnabled(false);
            return;
        }

        // Gate the sort worker: suppress any sort request until the full rebuild is committed.
        this._rebuilding = true;
        this._canPostToWorker = false;
        try {
            const sources = survivors.map((s) => s.proxyMesh.proxiedMesh);
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

                // Update the old proxy's index so any existing user references still work
                oldProxy.updatePartIndex(newPartIndex);
                this._partProxies[newPartIndex] = oldProxy;

                // newProxy is redundant — it was created inside _addPartsInternal; dispose it
                newProxy.dispose();
            }

            // Rebuild is complete: all partMatrices are now set correctly.
            // Post the final complete set and fire one sort.
            this._rebuilding = false;
            // Break TypeScript's flow narrowing — _addPartsInternal may have reinstantiated _worker.
            const workerAfterRebuild = this._worker as Worker | null;
            workerAfterRebuild?.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
            this._canPostToWorker = true;
            this._postToWorker(true);
        } catch (e) {
            // Ensure the gates are always restored so sorting is not permanently frozen.
            this._rebuilding = false;
            this._canPostToWorker = true;
            throw e;
        }
    }
}
