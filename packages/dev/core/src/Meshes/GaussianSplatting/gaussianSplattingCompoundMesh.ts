import type { Nullable } from "core/types";
import type { Scene } from "core/scene";
import type { Matrix, Vector2 } from "core/Maths/math.vector";
import type { Effect } from "core/Materials/effect";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import { GaussianSplattingMaxPartCount } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "./gaussianSplattingMesh";
import { GaussianSplattingPartProxyMesh } from "./gaussianSplattingPartProxyMesh";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Constants } from "../../Engines/constants";
import { RawTexture } from "../../Materials/Textures/rawTexture";

/**
 * Class used to render a compound gaussian splatting mesh made up of multiple independent parts.
 * Each part is a separate Gaussian Splatting mesh whose splat data is written directly into shared
 * GPU textures. Parts are added via addPart/addParts and removed via removePart.
 *
 * Use GaussianSplattingMesh for single-cloud rendering.
 * Use GaussianSplattingCompoundMesh when you need to compose multiple GS meshes into one draw call
 * while retaining per-part world-matrix control.
 */
export class GaussianSplattingCompoundMesh extends GaussianSplattingMesh {
    /**
     * Map from part index to proxy mesh. Maintained in sync with _partMatrices.
     */
    private _partProxies: Map<number, GaussianSplattingPartProxyMesh> = new Map();

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
     * Creates a new GaussianSplattingCompoundMesh
     * @param name the name of the mesh
     * @param url optional URL to load a Gaussian Splatting file from
     * @param scene the hosting scene
     * @param keepInRam whether to keep the raw splat data in RAM after uploading to GPU
     */
    constructor(name: string, url: Nullable<string> = null, scene: Nullable<Scene> = null, keepInRam: boolean = false) {
        super(name, url, scene, keepInRam);
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingCompoundMesh"
     */
    public override getClassName(): string {
        return "GaussianSplattingCompoundMesh";
    }

    /**
     * Disposes proxy meshes and clears part data in addition to the base class GPU resources.
     * @param doNotRecurse Set to true to not recurse into each children
     */
    public override dispose(doNotRecurse?: boolean): void {
        this._partProxies.forEach((proxy) => {
            proxy.dispose();
        });
        if (this._partIndicesTexture) {
            this._partIndicesTexture.dispose();
        }
        this._partProxies.clear();
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

    protected override _copyTextures(source: GaussianSplattingMesh): void {
        super._copyTextures(source);
        this._partIndicesTexture = (source as GaussianSplattingCompoundMesh)._partIndicesTexture?.clone()!;
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
    private _addPartsInternal(others: GaussianSplattingMesh[], disposeOthers: boolean): { proxyMeshes: GaussianSplattingPartProxyMesh[]; assignedPartIndices: number[] } {
        if (others.length === 0) {
            return { proxyMeshes: [], assignedPartIndices: [] };
        }

        // Validate
        for (const other of others) {
            if (!other._splatsData) {
                throw new Error(`To call addPart()/addParts(), each source mesh must be fully loaded`);
            }
            if (other.getClassName() === "GaussianSplattingCompoundMesh") {
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
        for (const other of others) {
            if (nextPartIndex >= GaussianSplattingMaxPartCount) {
                throw new Error(`Cannot add part, as the maximum part count (${GaussianSplattingMaxPartCount}) has been reached`);
            }
            const newPartIndex = nextPartIndex++;
            assignedPartIndices.push(newPartIndex);
            this._partIndices.fill(newPartIndex, dstOffset, dstOffset + other._vertexCount);
            dstOffset += other._vertexCount;
        }

        // --- Process source data ---
        if (!incremental) {
            // Full rebuild path: re-derive all existing splats from their source references.
            if (splatCountA > 0) {
                if (this._partProxies.size > 0) {
                    // Already compound: rebuild each existing part from its proxy's source mesh.
                    // Proxies are iterated in part-index order so dstOffsets are correct.
                    const sortedProxies = [...this._partProxies.entries()].sort(([a], [b]) => a - b);
                    let rebuildOffset = 0;
                    for (const [, proxy] of sortedProxies) {
                        this._appendSourceToArrays(proxy.proxiedMesh, rebuildOffset, covA, covB, colorArray, sh, minimum, maximum);
                        rebuildOffset += proxy.proxiedMesh._vertexCount;
                    }
                } else {
                    // Not yet compound: base mesh source is in _splatsData.
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

        // --- Upload to GPU ---
        if (incremental) {
            this._ensurePartIndicesTexture(textureSize, this._partIndices);
            this._updateSubTextures(this._splatPositions, covA, covB, colorArray, firstNewLine, textureSize.y - firstNewLine, sh, this._partIndices);
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

            this._partProxies.set(newPartIndex, proxyMesh);
            proxyMeshes.push(proxyMesh);
        }

        return { proxyMeshes, assignedPartIndices };
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
     */
    public addPart(other: GaussianSplattingMesh, disposeOther: boolean = true): GaussianSplattingPartProxyMesh {
        const { proxyMeshes } = this._addPartsInternal([other], disposeOther);
        return proxyMeshes[0];
    }

    /**
     * Add multiple meshes to this mesh as new parts in a single operation.
     * This makes the current mesh a compound, if not already.
     * Splat data is written directly into texture arrays without constructing a merged CPU buffer.
     * @param others - The meshes to add. Each must be fully loaded and must not be a compound.
     * @param disposeOthers - Whether to dispose the other meshes after adding them to the current mesh.
     * @returns an array of placeholder meshes that can be used to manipulate the part transforms
     */
    public addParts(others: GaussianSplattingMesh[], disposeOthers: boolean = true): GaussianSplattingPartProxyMesh[] {
        if (others.length === 0) {
            return [];
        }
        const { proxyMeshes } = this._addPartsInternal(others, disposeOthers);
        return proxyMeshes;
    }

    /**
     * Remove a part from this compound mesh.
     * The remaining parts are rebuilt directly from their stored source mesh references —
     * no merged CPU splat buffer is read back. The current mesh is reset to a plain (single-part)
     * state and then each remaining source is re-added via addParts.
     * @param index - The index of the part to remove
     */
    public removePart(index: number): void {
        if (index < 0 || index >= this.partCount) {
            throw new Error(`Part index ${index} is out of range [0, ${this.partCount})`);
        }

        // Collect surviving proxy objects (sorted by current part index so part 0 is added first)
        const survivors: Array<{ proxyMesh: GaussianSplattingPartProxyMesh; oldIndex: number; worldMatrix: Matrix }> = [];
        this._partProxies.forEach((proxy, proxyIndex) => {
            if (proxyIndex !== index) {
                survivors.push({ proxyMesh: proxy, oldIndex: proxyIndex, worldMatrix: proxy.getWorldMatrix().clone() });
            }
        });
        survivors.sort((a, b) => a.oldIndex - b.oldIndex);

        // Validate every survivor still has its source data. If even one is missing we cannot rebuild.
        for (const { proxyMesh } of survivors) {
            if (!proxyMesh.proxiedMesh._splatsData) {
                throw new Error(`Cannot remove part: the source mesh for part "${proxyMesh.name}" no longer has its splat data available.`);
            }
        }

        // --- Reset this mesh to an empty state ---
        // Dispose and null GPU textures so _updateTextures sees firstTime=true and creates
        // fresh GPU textures. The sort worker is kept alive (see _instantiateWorker override).
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
        const proxyToRemove = this._partProxies.get(index);
        if (proxyToRemove) {
            proxyToRemove.dispose();
        }
        this._partProxies.clear();

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
        const sources = survivors.map((s) => s.proxyMesh.proxiedMesh);
        const { proxyMeshes: newProxies } = this._addPartsInternal(sources, false);

        // Restore world matrices and re-map proxies
        for (let i = 0; i < survivors.length; i++) {
            const oldProxy = survivors[i].proxyMesh;
            const newProxy = newProxies[i];
            const newPartIndex = newProxy.partIndex;

            // Restore the world matrix the user had set on the old proxy
            this.setWorldMatrixForPart(newPartIndex, survivors[i].worldMatrix);
            const quaternion = new Quaternion();
            survivors[i].worldMatrix.decompose(newProxy.scaling, quaternion, newProxy.position);
            newProxy.rotationQuaternion = quaternion;
            newProxy.computeWorldMatrix(true);

            // Update the old proxy's index so any existing user references still work
            oldProxy.updatePartIndex(newPartIndex);
            this._partProxies.set(newPartIndex, oldProxy);

            // newProxy is redundant — it was created inside _addPartsInternal; dispose it
            newProxy.dispose();
        }

        // Rebuild is complete: all partMatrices are now set correctly.
        // Post the final complete set and fire one sort.
        this._rebuilding = false;
        if (this._worker) {
            this._worker.postMessage({ partMatrices: this._partMatrices.map((matrix) => new Float32Array(matrix.m)) });
        }
        this._canPostToWorker = true;
        this._postToWorker(true);
    }
}
