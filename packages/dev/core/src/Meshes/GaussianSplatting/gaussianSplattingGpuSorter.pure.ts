/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";
import { type Matrix } from "core/Maths/math.vector.pure";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { ComputeShader } from "core/Compute/computeShader.pure";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { Constants } from "core/Engines/constants";
import { PrefixSumCompute } from "core/Compute/prefixSumCompute.pure";

const WorkgroupSize = 256;
// Bit patterns of +Infinity / -Infinity used to seed the atomic depth-range reduction each sort.
const RangeInit = /* #__PURE__ */ new Int32Array(new Float32Array([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]).buffer);

/**
 * @internal
 * WebGPU compute driver that produces the depth-sorted per-splat `splatIndex` order buffer for a
 * {@link GaussianSplattingMeshBase} entirely on the GPU, with no CPU readback.
 *
 * The sort is a single-pass counting sort by camera-forward depth (matching the CPU worker's algorithm):
 *  1. depth pass     - compute each active splat's signed depth and reduce the min/max range
 *  2. histogram pass - map depth to a bucket and count per bucket
 *  3. prefix sum     - exclusive-scan the histogram into per-bucket start offsets
 *  4. scatter pass   - place each source index at the next free slot of its bucket
 *
 * The resulting sorted-index buffer is bound directly as the `splatIndex` instanced vertex buffer.
 * The farthest splat gets bucket 0, so the ascending scatter yields back-to-front order for correct
 * alpha blending.
 */
export class GaussianSplattingGpuSorter {
    private readonly _engine: AbstractEngine;

    private _clear: Nullable<ComputeShader> = null;
    private _depth: Nullable<ComputeShader> = null;
    private _histogram: Nullable<ComputeShader> = null;
    private _scatter: Nullable<ComputeShader> = null;
    private _cull: Nullable<ComputeShader> = null;
    private _compact: Nullable<ComputeShader> = null;
    private _finalize: Nullable<ComputeShader> = null;
    private _prefixSum: Nullable<PrefixSumCompute> = null;
    private _cullPrefixSum: Nullable<PrefixSumCompute> = null;
    private _params: Nullable<UniformBuffer> = null;
    private _cullParams: Nullable<UniformBuffer> = null;
    private _compactParams: Nullable<UniformBuffer> = null;
    private _finalizeParams: Nullable<UniformBuffer> = null;

    private _positions: Nullable<StorageBuffer> = null;
    private _seed: Nullable<StorageBuffer> = null;
    private _depthBuffer: Nullable<StorageBuffer> = null;
    private _bucket: Nullable<StorageBuffer> = null;
    private _range: Nullable<StorageBuffer> = null;
    private _histogramBuffer: Nullable<StorageBuffer> = null;
    private _sortedIndexBuffer: Nullable<StorageBuffer> = null;
    // Culling buffers.
    private _flag: Nullable<StorageBuffer> = null;
    private _offsets: Nullable<StorageBuffer> = null;
    private _drawList: Nullable<StorageBuffer> = null;
    private _count: Nullable<StorageBuffer> = null;
    private _cullCapacity = 0;
    // Draw-indexed-indirect arguments [indexCount, instanceCount, firstIndex, baseVertex, firstInstance].
    // Fixed 5-u32 buffer (never grows), so cached render bundles referencing it stay valid while its contents update.
    private _indirectArgs: Nullable<StorageBuffer> = null;
    private _indirectArgsData = new Uint32Array(5);

    private _positionCapacity = 0;
    private _paddedCapacity = 0;
    private _histCapacity = 0;
    private _renderedCount = 0;
    private _paddedCount = 0;
    private _numBuckets = 0;
    private _hasSource = false;

    /**
     * Whether the running engine supports the WebGPU compute sort path.
     * @param engine the engine to test
     * @returns true when compute shaders are available
     */
    public static IsSupported(engine: AbstractEngine): boolean {
        return !!engine.getCaps().supportComputeShaders;
    }

    /**
     * Number of depth buckets to use for a given active splat count.
     * Mirrors the CPU worker: round(log2(n/4)) clamped to [10, 20].
     * @param renderedCount active splat count
     * @returns the bucket count (a power of two)
     */
    private static _BucketCount(renderedCount: number): number {
        const bits = Math.max(10, Math.min(20, Math.round(Math.log2(Math.max(1, renderedCount) / 4))));
        return 2 ** bits;
    }

    /**
     * Creates a new GPU sorter.
     * @param engine the (WebGPU) engine to run the compute passes on
     */
    public constructor(engine: AbstractEngine) {
        this._engine = engine;
    }

    private _ensureShaders(): void {
        if (this._clear) {
            return;
        }
        this._clear = new ComputeShader("gaussianSplattingSortClear", this._engine, "gaussianSplattingSortClear", {
            bindingsMapping: { histogram: { group: 0, binding: 0 }, params: { group: 0, binding: 1 } },
        });
        this._depth = new ComputeShader("gaussianSplattingSortDepth", this._engine, "gaussianSplattingSortDepth", {
            bindingsMapping: {
                positions: { group: 0, binding: 0 },
                seed: { group: 0, binding: 1 },
                depth: { group: 0, binding: 2 },
                range: { group: 0, binding: 3 },
                params: { group: 0, binding: 4 },
            },
        });
        this._histogram = new ComputeShader("gaussianSplattingSortHistogram", this._engine, "gaussianSplattingSortHistogram", {
            bindingsMapping: {
                depth: { group: 0, binding: 0 },
                range: { group: 0, binding: 1 },
                bucket: { group: 0, binding: 2 },
                histogram: { group: 0, binding: 3 },
                params: { group: 0, binding: 4 },
            },
        });
        this._scatter = new ComputeShader("gaussianSplattingSortScatter", this._engine, "gaussianSplattingSortScatter", {
            bindingsMapping: {
                bucket: { group: 0, binding: 0 },
                seed: { group: 0, binding: 1 },
                offsets: { group: 0, binding: 2 },
                sortedIndex: { group: 0, binding: 3 },
                params: { group: 0, binding: 4 },
            },
        });
        this._prefixSum = new PrefixSumCompute(this._engine);
        // The cull owns a separate prefix-sum instance from the sort. Sharing one ring made the cull's scan reuse a
        // UBO the sort had just written with a different element count; combined with the one-dispatch compute-UBO
        // upload lag, the cull then scanned with the wrong count. A dedicated ring always holds the cull's count.
        this._cullPrefixSum = new PrefixSumCompute(this._engine);
        // trackUBOsInFrame=false: these UBOs are updated once and dispatched immediately during mesh render; the
        // default per-frame buffer rotation left the compute reading a stale buffer, freezing the sort/cull data.
        this._params = new UniformBuffer(this._engine, undefined, undefined, "GaussianSplattingGpuSorterParams", false, false);
        this._params.addUniform("count", 1);
        this._params.addUniform("paddedCount", 1);
        this._params.addUniform("numBuckets", 1);
        this._params.addUniform("pad", 1);
        this._params.addUniform("coeff", 4);

        this._cull = new ComputeShader("gaussianSplattingCull", this._engine, "gaussianSplattingCull", {
            bindingsMapping: {
                positions: { group: 0, binding: 0 },
                sortedIndex: { group: 0, binding: 1 },
                flag: { group: 0, binding: 2 },
                offsets: { group: 0, binding: 3 },
                params: { group: 0, binding: 4 },
            },
        });
        this._compact = new ComputeShader("gaussianSplattingCullCompact", this._engine, "gaussianSplattingCullCompact", {
            bindingsMapping: {
                sortedIndex: { group: 0, binding: 0 },
                flag: { group: 0, binding: 1 },
                offsets: { group: 0, binding: 2 },
                drawList: { group: 0, binding: 3 },
                params: { group: 0, binding: 4 },
            },
        });
        this._finalize = new ComputeShader("gaussianSplattingCullFinalize", this._engine, "gaussianSplattingCullFinalize", {
            bindingsMapping: {
                flag: { group: 0, binding: 0 },
                offsets: { group: 0, binding: 1 },
                countOut: { group: 0, binding: 2 },
                indirectArgs: { group: 0, binding: 3 },
                drawList: { group: 0, binding: 4 },
                params: { group: 0, binding: 5 },
            },
        });
        this._compactParams = new UniformBuffer(this._engine, undefined, undefined, "GaussianSplattingCompactParams", false, false);
        this._compactParams.addUniform("count", 1);
        this._cullParams = new UniformBuffer(this._engine, undefined, undefined, "GaussianSplattingCullParams", false, false);
        this._cullParams.addUniform("count", 1);
        this._cullParams.addUniform("pad0", 1);
        this._cullParams.addUniform("pad1", 1);
        this._cullParams.addUniform("pad2", 1);
        this._cullParams.addUniform("clip0", 4);
        this._cullParams.addUniform("clip1", 4);
        this._cullParams.addUniform("clip2", 4);
        this._cullParams.addUniform("clip3", 4);
        this._finalizeParams = new UniformBuffer(this._engine, undefined, undefined, "GaussianSplattingCullFinalizeParams", false, false);
        this._finalizeParams.addUniform("count", 1);
        this._finalizeParams.addUniform("indexCount", 1);
        this._finalizeParams.addUniform("pad0", 1);
        this._finalizeParams.addUniform("pad1", 1);

        // Fixed-size indirect draw-args buffer (also compute-writable in the culling path).
        this._indirectArgs = this._createStorage(5 * Uint32Array.BYTES_PER_ELEMENT, Constants.BUFFER_CREATIONFLAG_INDIRECT, "GaussianSplattingSortIndirectArgs");
        this._count = this._createStorage(Uint32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingCullCount");
    }

    /**
     * The GPU indirect draw-args buffer to bind as the mesh's indirect draw buffer.
     */
    public get indirectArgsBuffer(): Nullable<DataBuffer> {
        return this._indirectArgs ? this._indirectArgs.getBuffer() : null;
    }

    /**
     * Writes the draw-indexed-indirect arguments from the CPU.
     * @param indexCount indices per instance (subMesh.indexCount)
     * @param instanceCount number of instances to draw
     */
    public setIndirectArgs(indexCount: number, instanceCount: number): void {
        this._ensureShaders();
        this._indirectArgsData[0] = indexCount;
        this._indirectArgsData[1] = instanceCount;
        this._indirectArgsData[2] = 0;
        this._indirectArgsData[3] = 0;
        this._indirectArgsData[4] = 0;
        this._indirectArgs!.update(this._indirectArgsData);
    }

    private _createStorage(byteLength: number, extraFlags: number, label: string): StorageBuffer {
        return new StorageBuffer(this._engine as WebGPUEngine, byteLength, Constants.BUFFER_CREATIONFLAG_READWRITE | extraFlags, label);
    }

    /**
     * Uploads the source splat data. Call whenever the positions or the active source-index set change.
     * @param positions splat centers, stride 4 (xyz + 1)
     * @param seedIndices packed active source indices, one f32 per slot, padded to a multiple of 16
     * @param renderedCount number of active (non-padding) slots
     */
    public setSource(positions: Float32Array, seedIndices: Float32Array, renderedCount: number): void {
        this._ensureShaders();

        this._renderedCount = renderedCount;
        this._paddedCount = seedIndices.length;
        this._numBuckets = GaussianSplattingGpuSorter._BucketCount(renderedCount);

        if (positions.length > this._positionCapacity) {
            this._positions?.dispose();
            this._positions = this._createStorage(positions.length * Float32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingSortPositions");
            this._positionCapacity = positions.length;
        }

        if (this._paddedCount > this._paddedCapacity) {
            this._seed?.dispose();
            this._depthBuffer?.dispose();
            this._bucket?.dispose();
            this._sortedIndexBuffer?.dispose();
            const f32Bytes = this._paddedCount * Float32Array.BYTES_PER_ELEMENT;
            this._seed = this._createStorage(f32Bytes, 0, "GaussianSplattingSortSeed");
            this._depthBuffer = this._createStorage(f32Bytes, 0, "GaussianSplattingSortDepth");
            this._bucket = this._createStorage(this._paddedCount * Uint32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingSortBucket");
            // The sorted-index buffer is consumed as an instanced vertex buffer, so it also needs the VERTEX usage flag.
            this._sortedIndexBuffer = this._createStorage(f32Bytes, Constants.BUFFER_CREATIONFLAG_VERTEX, "GaussianSplattingSortSorted");
            this._paddedCapacity = this._paddedCount;
        }

        // Histogram/offsets buffer, padded to a workgroup multiple so the scan never reads out of bounds.
        const histCapacity = Math.ceil(this._numBuckets / WorkgroupSize) * WorkgroupSize;
        if (histCapacity > this._histCapacity) {
            this._histogramBuffer?.dispose();
            this._histogramBuffer = this._createStorage(histCapacity * Uint32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingSortHistogram");
            this._histCapacity = histCapacity;
        }

        if (!this._range) {
            this._range = this._createStorage(2 * Int32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingSortRange");
        }

        // Culling buffers: flag/offsets padded to a workgroup multiple so the compaction scan stays in bounds;
        // drawList is the compacted (visible, sorted) index buffer consumed as the instanced vertex buffer.
        const cullCapacity = Math.ceil(this._paddedCount / WorkgroupSize) * WorkgroupSize;
        if (cullCapacity > this._cullCapacity) {
            this._flag?.dispose();
            this._offsets?.dispose();
            this._drawList?.dispose();
            this._flag = this._createStorage(cullCapacity * Uint32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingCullFlag");
            this._offsets = this._createStorage(cullCapacity * Uint32Array.BYTES_PER_ELEMENT, 0, "GaussianSplattingCullOffsets");
            this._drawList = this._createStorage(cullCapacity * Float32Array.BYTES_PER_ELEMENT, Constants.BUFFER_CREATIONFLAG_VERTEX, "GaussianSplattingCullDrawList");
            this._cullCapacity = cullCapacity;
        }

        this._positions!.update(positions);
        this._seed!.update(seedIndices);
        this._hasSource = true;
    }

    /**
     * Whether the culling compute shaders are compiled and ready to dispatch.
     * @returns true when a cull pass can run
     */
    public isCullReady(): boolean {
        return !!this._cull && !!this._cull.isReady() && !!this._compact!.isReady() && !!this._finalize!.isReady() && !!this._cullPrefixSum!.isReady();
    }

    /**
     * Runs a post-sort frustum cull + compaction. Uses a dedicated clip-matrix UBO and prefix-sum instance so it
     * can run every frame independently of {@link sort}. Produces the compacted visible draw list
     * ({@link culledDrawBuffer}) and writes the draw-indexed-indirect arguments with a GPU-computed instance count.
     * @param indexCount indices per instance (subMesh.indexCount)
     * @param clipMatrix local->clip transform (world * view * projection) used for the frustum test
     * @returns true when the cull passes were dispatched; false when shaders are not ready
     */
    public cull(indexCount: number, clipMatrix: Matrix): boolean {
        if (!this._hasSource || this._renderedCount === 0 || !this.isCullReady()) {
            return false;
        }

        // The cull owns its clip-matrix UBO and uploads it immediately before dispatching (mirroring sort()'s
        // update-then-dispatch adjacency). Sharing sort()'s params UBO left the cull reading a frame-1 snapshot.
        const cm = clipMatrix.m;
        this._cullParams!.updateUInt("count", this._renderedCount);
        this._cullParams!.updateUInt("pad0", 0);
        this._cullParams!.updateUInt("pad1", 0);
        this._cullParams!.updateUInt("pad2", 0);
        this._cullParams!.updateFloat4("clip0", cm[0], cm[1], cm[2], cm[3]);
        this._cullParams!.updateFloat4("clip1", cm[4], cm[5], cm[6], cm[7]);
        this._cullParams!.updateFloat4("clip2", cm[8], cm[9], cm[10], cm[11]);
        this._cullParams!.updateFloat4("clip3", cm[12], cm[13], cm[14], cm[15]);
        this._cullParams!.update();

        this._compactParams!.updateUInt("count", this._renderedCount);
        this._compactParams!.update();

        this._finalizeParams!.updateUInt("count", this._renderedCount);
        this._finalizeParams!.updateUInt("indexCount", indexCount);
        this._finalizeParams!.update();

        const groups = Math.ceil(this._renderedCount / WorkgroupSize);

        this._cull!.setStorageBuffer("positions", this._positions!);
        this._cull!.setStorageBuffer("sortedIndex", this._sortedIndexBuffer!);
        this._cull!.setStorageBuffer("flag", this._flag!);
        this._cull!.setStorageBuffer("offsets", this._offsets!);
        this._cull!.setUniformBuffer("params", this._cullParams!);
        this._cull!.dispatch(groups);

        // Cull-owned prefix-sum ring (see constructor): reset and scan on the dedicated instance so it never
        // collides with the sort's ring and always scans the cull's element count.
        this._cullPrefixSum!.resetForFrame();
        this._cullPrefixSum!.scanExclusive(this._offsets!, this._renderedCount);

        this._compact!.setStorageBuffer("sortedIndex", this._sortedIndexBuffer!);
        this._compact!.setStorageBuffer("flag", this._flag!);
        this._compact!.setStorageBuffer("offsets", this._offsets!);
        this._compact!.setStorageBuffer("drawList", this._drawList!);
        this._compact!.setUniformBuffer("params", this._compactParams!);
        this._compact!.dispatch(groups);

        this._finalize!.setStorageBuffer("flag", this._flag!);
        this._finalize!.setStorageBuffer("offsets", this._offsets!);
        this._finalize!.setStorageBuffer("countOut", this._count!);
        this._finalize!.setStorageBuffer("indirectArgs", this._indirectArgs!);
        this._finalize!.setStorageBuffer("drawList", this._drawList!);
        this._finalize!.setUniformBuffer("params", this._finalizeParams!);
        this._finalize!.dispatch(1);

        return true;
    }

    /**
     * The compacted visible draw list to bind as the `splatIndex` instanced vertex buffer when culling is active.
     */
    public get culledDrawBuffer(): Nullable<DataBuffer> {
        return this._drawList ? this._drawList.getBuffer() : null;
    }

    /**
     * Whether all compute shaders are compiled and ready to dispatch.
     * @returns true when a sort can run
     */
    public isReady(): boolean {
        if (!this._clear) {
            return false;
        }
        return !!this._clear.isReady() && !!this._depth!.isReady() && !!this._histogram!.isReady() && !!this._scatter!.isReady() && !!this._prefixSum!.isReady();
    }

    /**
     * Runs a depth sort for a camera view. The depth coefficients (a,b,c,d) must already fold in the
     * world matrix, camera forward, camera position, and the right-handed depth sign, so that
     * depth = a*x + b*y + c*z + d matches the CPU worker's convention.
     * @param a depth coefficient for x
     * @param b depth coefficient for y
     * @param c depth coefficient for z
     * @param d constant depth offset
     * @returns true when the sort was dispatched; false when shaders are not ready or no source is set
     */
    public sort(a: number, b: number, c: number, d: number): boolean {
        if (!this._hasSource || this._renderedCount === 0) {
            return false;
        }
        if (!this.isReady()) {
            return false;
        }

        this._params!.updateUInt("count", this._renderedCount);
        this._params!.updateUInt("paddedCount", this._paddedCount);
        this._params!.updateUInt("numBuckets", this._numBuckets);
        this._params!.updateUInt("pad", 0);
        this._params!.updateFloat4("coeff", a, b, c, d);
        this._params!.update();

        // Seed the atomic depth range with (+Inf, -Inf) before the reduction.
        this._range!.update(RangeInit);

        const renderGroups = Math.ceil(this._renderedCount / WorkgroupSize);
        const paddedGroups = Math.ceil(this._paddedCount / WorkgroupSize);

        this._clear!.setStorageBuffer("histogram", this._histogramBuffer!);
        this._clear!.setUniformBuffer("params", this._params!);
        this._clear!.dispatch(Math.ceil(this._numBuckets / WorkgroupSize));

        this._depth!.setStorageBuffer("positions", this._positions!);
        this._depth!.setStorageBuffer("seed", this._seed!);
        this._depth!.setStorageBuffer("depth", this._depthBuffer!);
        this._depth!.setStorageBuffer("range", this._range!);
        this._depth!.setUniformBuffer("params", this._params!);
        this._depth!.dispatch(renderGroups);

        this._histogram!.setStorageBuffer("depth", this._depthBuffer!);
        this._histogram!.setStorageBuffer("range", this._range!);
        this._histogram!.setStorageBuffer("bucket", this._bucket!);
        this._histogram!.setStorageBuffer("histogram", this._histogramBuffer!);
        this._histogram!.setUniformBuffer("params", this._params!);
        this._histogram!.dispatch(renderGroups);

        this._prefixSum!.resetForFrame();
        this._prefixSum!.scanExclusive(this._histogramBuffer!, this._numBuckets);

        this._scatter!.setStorageBuffer("bucket", this._bucket!);
        this._scatter!.setStorageBuffer("seed", this._seed!);
        this._scatter!.setStorageBuffer("offsets", this._histogramBuffer!);
        this._scatter!.setStorageBuffer("sortedIndex", this._sortedIndexBuffer!);
        this._scatter!.setUniformBuffer("params", this._params!);
        this._scatter!.dispatch(paddedGroups);

        return true;
    }

    /**
     * The GPU data buffer to bind as the `splatIndex` instanced vertex buffer, or null before allocation.
     */
    public get sortedDataBuffer(): Nullable<DataBuffer> {
        return this._sortedIndexBuffer ? this._sortedIndexBuffer.getBuffer() : null;
    }

    /**
     * Releases all GPU resources held by the sorter.
     */
    public dispose(): void {
        this._positions?.dispose();
        this._seed?.dispose();
        this._depthBuffer?.dispose();
        this._bucket?.dispose();
        this._range?.dispose();
        this._histogramBuffer?.dispose();
        this._sortedIndexBuffer?.dispose();
        this._indirectArgs?.dispose();
        this._flag?.dispose();
        this._offsets?.dispose();
        this._drawList?.dispose();
        this._count?.dispose();
        this._params?.dispose();
        this._compactParams?.dispose();
        this._cullParams?.dispose();
        this._finalizeParams?.dispose();
        this._prefixSum?.dispose();
        this._cullPrefixSum?.dispose();
        this._positions = null;
        this._seed = null;
        this._depthBuffer = null;
        this._bucket = null;
        this._range = null;
        this._histogramBuffer = null;
        this._sortedIndexBuffer = null;
        this._indirectArgs = null;
        this._flag = null;
        this._offsets = null;
        this._drawList = null;
        this._count = null;
        this._params = null;
        this._compactParams = null;
        this._cullParams = null;
        this._finalizeParams = null;
        this._prefixSum = null;
        this._cullPrefixSum = null;
        this._clear = null;
        this._depth = null;
        this._histogram = null;
        this._scatter = null;
        this._cull = null;
        this._compact = null;
        this._finalize = null;
        this._positionCapacity = 0;
        this._paddedCapacity = 0;
        this._histCapacity = 0;
        this._cullCapacity = 0;
        this._hasSource = false;
    }
}
