/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { type Matrix } from "core/Maths/math.vector.pure";
import { Constants } from "core/Engines/constants";
import { ComputeShader } from "core/Compute/computeShader.pure";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { type ComputeBindingMapping } from "core/Engines/Extensions/engine.computeShader.pure";

const WorkgroupSize = 256;
const ScanBlockSize = 512;
const MaxDispatchGroupsPerDimension = 65535;
const DepthClearSentinel = 0xffffffff;
// Must match GPS_PARTITION_BUCKETS in the shaders.
const PartitionBuckets = 65536;

/**
 * Whether projected depth depends on view-space x/y.
 * @param projection the camera projection
 * @returns whether depth must be evaluated separately at each sampled pixel
 * @internal
 */
export function _HasGaussianPointSplattingProjectedDepth(projection: Matrix): boolean {
    const m = projection.m;
    return m[2] !== 0 || m[6] !== 0 || m[3] !== 0 || m[7] !== 0;
}

/**
 * Bytes per Gaussian of the u32-packed 8-bit SH coefficients for an SH degree.
 * @param shDegree spherical-harmonics degree (0-4)
 * @returns packed SH bytes per Gaussian (0 at degree 0)
 * @internal
 */
export function _GetPackedShBytesPerSplat(shDegree: number): number {
    if (shDegree < 1) {
        return 0;
    }
    const shDim = shDegree === 1 ? 3 : shDegree === 2 ? 8 : shDegree === 3 ? 15 : 24;
    return Math.ceil((shDim * 3) / 4) * 4;
}

/**
 * Owns the WebGPU compute pipeline and GPU buffers for Gaussian Point Splatting (the stochastic,
 * sort-free point-splatting technique). Engine-focused: it knows nothing about the scene graph
 * beyond the camera matrices and viewport size handed to it.
 *
 * Per-frame pipeline (dispatched before the render pass):
 *   preprocess (1 thread/Gaussian: transform, cull, cache screen state, emit a point weight)
 *   scan (Blelloch prefix sum of the weights into a CDF + GPU-written indirect dispatch args)
 *   partition (bucketed point-to-Gaussian table that narrows the splat search)
 *   splat (indirect, 1 thread/point: find its Gaussian in the CDF, atomicMin its sample)
 *   resolve (accumulate the packed image buffer into the full-float buffer, reset it)
 *   hi-Z build (max-reduce this frame's depth into next frame's occlusion pyramid)
 *
 */
export class GaussianPointSplattingRenderer {
    private readonly _engine: AbstractEngine;

    private _preprocessCs!: ComputeShader;
    private _preprocessBindings!: ComputeBindingMapping;
    private _preprocessShDegree = -1;
    private _scanBlocksCs: ComputeShader;
    private _scanSumsCs: ComputeShader;
    private _scanAddCs: ComputeShader;
    private _partitionCs: ComputeShader;
    private _hiZBuildCs: ComputeShader;
    private _splatCs: ComputeShader;
    private _resolveCs: ComputeShader;

    private _uniforms: UniformBuffer;
    private _resolveParams: UniformBuffer;

    private _means: Nullable<StorageBuffer> = null;
    private _colorOpacity: Nullable<StorageBuffer> = null;
    private _cov3d: Nullable<StorageBuffer> = null;
    private _sh: Nullable<StorageBuffer> = null;
    private _shDegree = 0;
    private _weights: Nullable<StorageBuffer> = null;
    private _gsData: Nullable<StorageBuffer> = null;
    private _cdf: Nullable<StorageBuffer> = null;
    private _blockSums: Nullable<StorageBuffer> = null;
    private _gaussianCount = 0;
    private _numBlocks = 0;

    /** Sample-density multiplier on the (importance-calibrated) point count. Keep at 1 for exact
     * coverage = opacity*gaussian; other values trade noise for cost but bias the alpha. */
    public pointScale = 1.0;
    /** Low-pass antialiasing dilation, in the classic material's `kernelSize` units. */
    public kernelSize = 0.3;
    /** Classic material's `minPixelSize`: splats whose projected diameter is below this many output pixels are skipped (0 = off). */
    public minPixelSize = 0;
    /** Whether view-space forward is negative (right-handed scenes). */
    public rightHandedSystem = false;
    /** 1 when any per-part debug knob is active (drives the preprocess debug branch); 0 otherwise. */
    public debugActive = 0;
    /** Whether the active camera is orthographic (selects the ortho Jacobian in computeCov2D). */
    public isOrthographic = false;
    /** Whether the source material enables antialiasing opacity compensation (classic COMPENSATION). */
    public compensation = false;
    /**
     * Hi-Z occlusion culling: skip Gaussians fully behind the previous frame's nearest samples. Off by default
     * because those stochastic samples may be semi-transparent, so culling biases the converged image.
     */
    public occlusionCulling = false;

    private _pointCount: StorageBuffer;
    private _indirectArgs: StorageBuffer;
    private _partition: StorageBuffer;

    // imageBuffer and hiZ are at render resolution; accum* are at output resolution.
    private _imageBuffer: Nullable<StorageBuffer> = null;
    private _accumBuffer: Nullable<StorageBuffer> = null;
    private _accumDepth: Nullable<StorageBuffer> = null;
    // Per output pixel: (generation << 16) | sample count.
    private _accumCount: Nullable<StorageBuffer> = null;
    // All max-view-z mip levels concatenated; level 0 = render resolution.
    private _hiZ: Nullable<StorageBuffer> = null;
    private _hiZLevels: { offset: number; w: number; h: number }[] = [];
    // One buffer per level: all level dispatches share one command encoder, so a single buffer updated
    // in the loop would leave every dispatch reading the last level's values.
    private _hiZBuildParams: UniformBuffer[] = [];
    private _width = 0;
    private _height = 0;
    private _outWidth = 0;
    private _outHeight = 0;
    private _upsampleN = 1;
    private _jitterX = 0;
    private _jitterY = 0;

    private _view: Nullable<Matrix> = null;
    private _viewProjection: Nullable<Matrix> = null;
    private _projection: Nullable<Matrix> = null;
    private _inverseProjection: Nullable<Matrix> = null;
    private _projectedDepth = false;
    private _reverseDepth = false;
    private readonly _projectedDepthSpan = new Float32Array([0, 1]);
    private _near = 0.1;
    private _far = 1000;
    private _focalX = 1000;
    private _focalY = 1000;
    private _camX = 0;
    private _camY = 0;
    private _camZ = 0;
    // The 16-bit depth key is normalized over the model's view-depth span.
    private _viewZMin = 0.1;
    private _viewZMax = 1000;
    private _projZ = new Float32Array([0, 1, 0, 0]);
    private _frameIndex = 0;

    private _parts: Nullable<StorageBuffer> = null;
    private _partCount = 0;
    private _prevPartData: Float32Array = new Float32Array(0);

    // Bumped on reset; invalidates the per-pixel counts in _accumCount without clearing it.
    private _accumGeneration = 0;
    private _lastRenderedGeneration = -1;
    private _prevVp = new Float32Array(16);
    private _hasPrevVp = false;

    /** Cap on each output pixel's accumulated sample count (clamped to 1..65535). Past the cap later
     * samples blend in at 1/(cap+1), so the image keeps refreshing instead of freezing. */
    public maxAccumFrames = 255;

    /**
     * Largest storage buffer this device can allocate and bind, in bytes. Both the per-Gaussian screen
     * data and the accumulation buffers scale linearly with the workload and can exceed it.
     * @returns the effective storage buffer size limit in bytes
     */
    private _getMaxStorageBufferSize(): number {
        // WebGPU's guaranteed minimum, used when the engine does not expose its device limits.
        const defaultLimit = 134217728;
        const limits = (this._engine as WebGPUEngine).currentLimits;
        if (!limits) {
            return defaultLimit;
        }
        return Math.min(limits.maxStorageBufferBindingSize || defaultLimit, limits.maxBufferSize || defaultLimit);
    }

    /**
     * True when the storage buffers required by the given workload fit in the device limits. Callers must
     * fall back to another renderer when it is false, otherwise buffer creation raises a validation error.
     * @param gaussianCount number of Gaussians to render
     * @param shDegree spherical-harmonics degree of the data (0-4)
     * @param outWidth output (full) width in pixels
     * @param outHeight output (full) height in pixels
     * @returns whether the workload can be allocated on this device
     */
    public supportsWorkload(gaussianCount: number, shDegree: number, outWidth: number, outHeight: number): boolean {
        const limit = this._getMaxStorageBufferSize();
        // Largest per-Gaussian buffer: sizeof(GpsScreen), or the packed SH bytes.
        const perGaussian = Math.max(64, _GetPackedShBytesPerSplat(shDegree));
        return gaussianCount * perGaussian <= limit && outWidth * outHeight * 4 * Float32Array.BYTES_PER_ELEMENT <= limit;
    }

    /**
     * Creates a new Gaussian Point Splatting renderer.
     * @param engine the (WebGPU) engine to allocate compute resources on
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;

        this._preprocessBindings = {
            means: { group: 0, binding: 0 },
            colorOpacity: { group: 0, binding: 1 },
            weights: { group: 0, binding: 2 },
            gsData: { group: 0, binding: 3 },
            uniforms: { group: 0, binding: 4 },
            cov3d: { group: 0, binding: 5 },
            sh: { group: 0, binding: 6 },
            parts: { group: 0, binding: 7 },
            hiZ: { group: 0, binding: 8 },
        };
        this._createPreprocessCs(0);

        this._scanBlocksCs = new ComputeShader("gpsScanBlocks", engine, "gpsScanBlocks", {
            bindingsMapping: { weights: { group: 0, binding: 0 }, cdf: { group: 0, binding: 1 }, blockSums: { group: 0, binding: 2 } },
        });
        this._scanSumsCs = new ComputeShader("gpsScanSums", engine, "gpsScanSums", {
            bindingsMapping: { blockSums: { group: 0, binding: 0 }, pointCount: { group: 0, binding: 1 }, indirectArgs: { group: 0, binding: 2 } },
        });
        this._scanAddCs = new ComputeShader("gpsScanAdd", engine, "gpsScanAdd", {
            bindingsMapping: { cdf: { group: 0, binding: 0 }, blockSums: { group: 0, binding: 1 } },
        });
        this._partitionCs = new ComputeShader("gpsPartition", engine, "gpsPartition", {
            bindingsMapping: { cdf: { group: 0, binding: 0 }, pointCount: { group: 0, binding: 1 }, partTable: { group: 0, binding: 2 } },
        });
        this._hiZBuildCs = new ComputeShader("gpsHiZBuild", engine, "gpsHiZBuild", {
            bindingsMapping: { hiZ: { group: 0, binding: 0 }, params: { group: 0, binding: 1 } },
        });

        const splatBindings: ComputeBindingMapping = {
            cdf: { group: 0, binding: 0 },
            gsData: { group: 0, binding: 1 },
            imageBuffer: { group: 0, binding: 2 },
            uniforms: { group: 0, binding: 3 },
            pointCount: { group: 0, binding: 4 },
            partTable: { group: 0, binding: 5 },
        };
        this._splatCs = new ComputeShader("gpsSplat", engine, "gpsSplat", { bindingsMapping: splatBindings });

        const resolveBindings: ComputeBindingMapping = {
            accumBuffer: { group: 0, binding: 0 },
            params: { group: 0, binding: 1 },
            imageBuffer: { group: 0, binding: 2 },
            accumDepth: { group: 0, binding: 3 },
            hiZ: { group: 0, binding: 4 },
            accumCount: { group: 0, binding: 5 },
        };
        this._resolveCs = new ComputeShader("gpsResolve", engine, "gpsResolve", { bindingsMapping: resolveBindings });

        this._uniforms = new UniformBuffer(engine);
        this._uniforms.addUniform("view", 16);
        this._uniforms.addUniform("viewProjection", 16);
        this._uniforms.addUniform("resNearFar", 4);
        this._uniforms.addUniform("params0", 4);
        this._uniforms.addUniform("focal", 4);
        this._uniforms.addUniform("camPosDeg", 4);
        this._uniforms.addUniform("depthNorm", 4);
        this._uniforms.addUniform("hiZInfo", 4);
        this._uniforms.addUniform("misc", 4); // x = N, y = minPixelSize, z = color tie-break mask
        this._uniforms.addUniform("pixelMap", 4); // NDC -> render-pixel scale (xy) and jittered offset (zw)
        this._uniforms.addUniform("projection", 16);
        this._uniforms.addUniform("inverseProjection", 16);
        this._uniforms.addUniform("projectedDepth", 4);

        this._resolveParams = new UniformBuffer(engine);
        this._resolveParams.addUniform("resolution", 2);
        this._resolveParams.addUniform("outResolution", 2);
        this._resolveParams.addUniform("depthNorm", 2);
        this._resolveParams.addUniform("colorMask", 2); // x = color tie-break mask
        this._resolveParams.addUniform("upsample", 4); // N, jitterX, jitterY, generation
        this._resolveParams.addUniform("misc2", 4); // x = maxAccum, y = moving flag
        this._resolveParams.addUniform("projZ", 4);
        this._resolveParams.addUniform("inverseProjection", 16);

        this._pointCount = new StorageBuffer(engine as WebGPUEngine, 4 * Uint32Array.BYTES_PER_ELEMENT);
        // WRITE (CopyDst) makes the initial zero-fill valid.
        this._indirectArgs = new StorageBuffer(
            engine as WebGPUEngine,
            3 * Uint32Array.BYTES_PER_ELEMENT,
            Constants.BUFFER_CREATIONFLAG_STORAGE | Constants.BUFFER_CREATIONFLAG_INDIRECT | Constants.BUFFER_CREATIONFLAG_WRITE
        );
        this._partition = new StorageBuffer(engine as WebGPUEngine, (PartitionBuckets + 1) * Uint32Array.BYTES_PER_ELEMENT);
    }

    /**
     * (Re)creates the preprocess shader so only the asset's SH bands are compiled.
     * @param shDegree the asset's SH degree
     */
    private _createPreprocessCs(shDegree: number): void {
        this._preprocessShDegree = shDegree;
        // SH_DEGREE 0 compiles out the sh binding.
        const bindings: ComputeBindingMapping = { ...this._preprocessBindings };
        if (shDegree <= 0) {
            delete bindings.sh;
        }
        this._preprocessCs = new ComputeShader("gpsPreprocess", this._engine, "gpsPreprocess", {
            bindingsMapping: bindings,
            defines: ["#define SH_DEGREE " + shDegree],
        });
    }

    /**
     * The resolved, full-float accumulation buffer (`array<vec4f>`, row-major, y * width + x). Bound
     * read-only by the blit material's fragment shader. Null until the first render.
     */
    public get accumBuffer(): Nullable<StorageBuffer> {
        return this._accumBuffer;
    }

    /**
     * Per-pixel resolved surface depth (NDC z in the scene's convention), bound read-only by the blit
     * material to write fragDepth for compositing. Null until the first render.
     */
    public get accumDepthBuffer(): Nullable<StorageBuffer> {
        return this._accumDepth;
    }

    /**
     * Number of compute frames successfully dispatched since this renderer was created.
     * This does not reset when accumulated samples are invalidated.
     * @returns the lifetime successful-dispatch count
     */
    public get renderedFrameCount(): number {
        return this._frameIndex;
    }

    /**
     * Changes whenever accumulated samples are invalidated (camera, parts, data, density or output size).
     * A change of the upscale factor alone does not bump it; callers must reset accumulation. Wraps at 65536.
     * @returns the current accumulation generation
     */
    public get accumulationVersion(): number {
        return this._accumGeneration;
    }

    /**
     * Number of frames required to visit every output pixel once at the current render scale.
     * @returns the current jitter-cycle length, `N * N`
     */
    public get pixelCycleLength(): number {
        return this._upsampleN * this._upsampleN;
    }

    /**
     * Reads back the total emitted point count from the last dispatched frame (async GPU readback). Used by
     * the budget-driven auto render-scale controller.
     * @returns the emitted point count (0 if never dispatched)
     */
    public async readPointCountAsync(): Promise<number> {
        const data = await this._pointCount.read(0, Uint32Array.BYTES_PER_ELEMENT);
        return new Uint32Array(data.buffer, data.byteOffset, 1)[0];
    }

    /** Current internal render width, in pixels. */
    public get width(): number {
        return this._width;
    }

    /** Current internal render height, in pixels. */
    public get height(): number {
        return this._height;
    }

    /** Output (full) width the accumulation buffer is sized to (what the blit samples). */
    public get outputWidth(): number {
        return this._outWidth;
    }

    /** Output (full) height the accumulation buffer is sized to. */
    public get outputHeight(): number {
        return this._outHeight;
    }

    /** Number of Gaussians currently loaded. */
    public get gaussianCount(): number {
        return this._gaussianCount;
    }

    /**
     * Whether the whole compute pipeline is compiled and ready to dispatch.
     * @returns true once every compute shader is ready
     */
    public isReady(): boolean {
        return (
            this._preprocessCs.isReady() &&
            this._scanBlocksCs.isReady() &&
            this._scanSumsCs.isReady() &&
            this._scanAddCs.isReady() &&
            this._partitionCs.isReady() &&
            this._splatCs.isReady() &&
            this._resolveCs.isReady() &&
            this._hiZBuildCs.isReady()
        );
    }

    /**
     * Uploads decoded splat data into per-Gaussian GPU buffers, replacing any previous data.
     * @param means packed positions, 4 floats per Gaussian (x, y, z, unused)
     * @param cov3d packed 3D covariance, 4 u32 per Gaussian (3 f16 pairs of Sigma/factor + f32 factor)
     * @param colorOpacity packed RGBA8 base color + opacity, 1 u32 per Gaussian
     * @param sh 8-bit-quantized SH coefficients packed 4 bytes/u32 (GPS_SH_WORDS per Gaussian), or null
     * @param shDegree spherical-harmonics degree (0 = view-independent color)
     * @param count number of Gaussians
     */
    public updateSplats(means: Float32Array, cov3d: Uint32Array, colorOpacity: Uint32Array, sh: Nullable<Uint32Array>, shDegree: number, count: number): void {
        this._disposeGaussianBuffers();
        this._gaussianCount = count;
        this._shDegree = sh ? shDegree : 0;
        if (this._shDegree !== this._preprocessShDegree) {
            this._createPreprocessCs(this._shDegree);
        }
        if (count === 0) {
            return;
        }
        this._numBlocks = Math.ceil(count / ScanBlockSize);

        const engine = this._engine as WebGPUEngine;
        this._means = new StorageBuffer(engine, count * 4 * Float32Array.BYTES_PER_ELEMENT);
        this._means.update(means);

        this._cov3d = new StorageBuffer(engine, count * 4 * Uint32Array.BYTES_PER_ELEMENT);
        this._cov3d.update(cov3d);

        // Placeholder keeps the binding valid at degree 0.
        if (sh && this._shDegree > 0) {
            this._sh = new StorageBuffer(engine, sh.byteLength);
            this._sh.update(sh);
        } else {
            this._sh = new StorageBuffer(engine, Float32Array.BYTES_PER_ELEMENT);
        }

        this._colorOpacity = new StorageBuffer(engine, count * Uint32Array.BYTES_PER_ELEMENT);
        this._colorOpacity.update(colorOpacity);

        this._weights = new StorageBuffer(engine, count * Uint32Array.BYTES_PER_ELEMENT);
        this._cdf = new StorageBuffer(engine, count * Uint32Array.BYTES_PER_ELEMENT);
        this._blockSums = new StorageBuffer(engine, this._numBlocks * Uint32Array.BYTES_PER_ELEMENT);
        // sizeof(GpsScreen)
        this._gsData = new StorageBuffer(engine, count * 64);

        this.resetAccumulation();
    }

    /** Restarts progressive accumulation; each output pixel is overwritten on its next visit. The cached
     * view-projection is kept, otherwise the next {@link renderToBuffer} would detect a move and reset again. */
    public resetAccumulation(): void {
        this._accumGeneration = (this._accumGeneration + 1) & 0xffff;
    }

    /**
     * Sets the camera state used to project Gaussians on the next render.
     * @param view world-to-view matrix
     * @param viewProjection world-to-clip matrix
     * @param near near plane distance
     * @param far far plane distance
     * @param focalX horizontal focal length in pixels
     * @param focalY vertical focal length in pixels
     * @param camX camera world position x
     * @param camY camera world position y
     * @param camZ camera world position z
     * @param viewZMin the model's minimum view-space depth this frame (depth-key normalization range)
     * @param viewZMax the model's maximum view-space depth this frame
     */
    public setCamera(
        view: Matrix,
        viewProjection: Matrix,
        near: number,
        far: number,
        focalX: number,
        focalY: number,
        camX: number,
        camY: number,
        camZ: number,
        viewZMin: number,
        viewZMax: number
    ): void {
        this._view = view;
        this._viewProjection = viewProjection;
        this._near = near;
        this._far = far;
        this._focalX = focalX;
        this._focalY = focalY;
        this._camX = camX;
        this._camY = camY;
        this._camZ = camZ;
        this._viewZMin = viewZMin;
        this._viewZMax = viewZMax;
    }

    /**
     * Sets the projection matrix's z-row (column-major m10, m11, m14, m15), used by resolve to map the
     * view-z depth key back to ndc.z for fragDepth (it encodes the reverse-Z / half-Z convention).
     * @param m10 projection.m[10]
     * @param m11 projection.m[11]
     * @param m14 projection.m[14]
     * @param m15 projection.m[15]
     */
    public setProjectionZ(m10: number, m11: number, m14: number, m15: number): void {
        this._projZ[0] = m10;
        this._projZ[1] = m11;
        this._projZ[2] = m14;
        this._projZ[3] = m15;
        this._projection = null;
        this._inverseProjection = null;
        this._projectedDepth = false;
    }

    /**
     * Sets the full projection for covariance, per-pixel depth and oblique clipping.
     * @param projection camera projection matrix
     * @param inverseProjection inverse of the projection matrix
     * @param reverseDepth whether larger NDC depth values are nearer
     */
    public setProjectionMatrix(projection: Matrix, inverseProjection: Matrix, reverseDepth = false): void {
        const m = projection.m;
        this.setProjectionZ(m[10], m[11], m[14], m[15]);
        this._projection = projection;
        this._inverseProjection = inverseProjection;
        this._projectedDepth = _HasGaussianPointSplattingProjectedDepth(projection);
        this._reverseDepth = reverseDepth;
    }

    /** Bounds projected depth over the model's view-z interval and padded jitter grid, reusing the result.
     * @param maxX maximum NDC x covered by the grid
     * @param maxY maximum NDC y covered by the grid
     * @returns the nearest-first projected depth range for quantization
     */
    private _getProjectedDepthSpan(maxX = 1, maxY = 1): Float32Array {
        const m = this._inverseProjection!.m;
        const sign = this.rightHandedSystem ? -1 : 1;
        const z0 = sign * this._viewZMin;
        const z1 = sign * this._viewZMax;
        const d0 = m[10] - z0 * m[11];
        const d1 = m[10] - z1 * m[11];
        // A horizon within the interval can cover the entire clipped depth range.
        if (d0 * d1 <= 0) {
            this._projectedDepthSpan[0] = 0;
            this._projectedDepthSpan[1] = 1;
            return this._projectedDepthSpan;
        }
        let min = 1;
        let max = 0;
        for (let corner = 0; corner < 8; corner++) {
            const x = corner & 1 ? maxX : -1;
            const y = corner & 2 ? maxY : -1;
            const z = corner & 4 ? z1 : z0;
            const depth = (z * (m[3] * x + m[7] * y + m[15]) - (m[2] * x + m[6] * y + m[14])) / (m[10] - z * m[11]);
            const ordered = Math.max(0, Math.min(1, this._reverseDepth ? 1 - depth : depth));
            min = Math.min(min, ordered);
            max = Math.max(max, ordered);
        }
        this._projectedDepthSpan[0] = min;
        this._projectedDepthSpan[1] = Math.max(min + 1e-6, max);
        return this._projectedDepthSpan;
    }

    /**
     * Uploads the per-part records (see GpsPart) and restarts accumulation when they changed.
     * @param packed part records, `count * 40` floats (world matrix + visibility + 5 debug rows per part)
     * @param count number of parts (at least 1)
     */
    public setPartData(packed: Float32Array, count: number): void {
        const engine = this._engine as WebGPUEngine;
        const floats = count * 40;
        let changed = !this._parts || this._partCount !== count || this._prevPartData.length !== floats;
        if (!changed) {
            for (let i = 0; i < floats; i++) {
                if (this._prevPartData[i] !== packed[i]) {
                    changed = true;
                    break;
                }
            }
        }
        if (!this._parts || this._partCount !== count) {
            this._parts?.dispose();
            this._parts = new StorageBuffer(engine, floats * Float32Array.BYTES_PER_ELEMENT);
            this._partCount = count;
        }
        if (changed) {
            if (this._prevPartData.length !== floats) {
                this._prevPartData = new Float32Array(floats);
            }
            this._prevPartData.set(packed);
            this.resetAccumulation();
        }
        this._parts.update(packed);
    }

    private _ensurePixelBuffers(width: number, height: number, outWidth: number, outHeight: number): void {
        const engine = this._engine as WebGPUEngine;
        const renderChanged = width !== this._width || height !== this._height || !this._imageBuffer;
        const outChanged = outWidth !== this._outWidth || outHeight !== this._outHeight || !this._accumBuffer;

        if (renderChanged) {
            this._width = width;
            this._height = height;
            const pixelCount = width * height;

            this._imageBuffer?.dispose();
            this._imageBuffer = new StorageBuffer(engine, pixelCount * Uint32Array.BYTES_PER_ELEMENT);
            // Resolve re-clears it after each frame.
            const seed = new Uint32Array(pixelCount);
            seed.fill(DepthClearSentinel);
            this._imageBuffer.update(seed);

            this._hiZLevels = [];
            let hiZOffset = 0;
            const numLevels = Math.floor(Math.log2(Math.max(width, height))) + 1;
            for (let l = 0; l < numLevels; l++) {
                const lw = Math.max(1, width >> l);
                const lh = Math.max(1, height >> l);
                this._hiZLevels.push({ offset: hiZOffset, w: lw, h: lh });
                hiZOffset += lw * lh;
            }
            this._hiZ?.dispose();
            this._hiZ = new StorageBuffer(engine, hiZOffset * Float32Array.BYTES_PER_ELEMENT);
            this._hiZ.update(new Float32Array(hiZOffset).fill(1e30));

            for (const ub of this._hiZBuildParams) {
                ub.dispose();
            }
            this._hiZBuildParams = [];
            for (let l = 1; l < numLevels; l++) {
                const src = this._hiZLevels[l - 1];
                const dst = this._hiZLevels[l];
                const ub = new UniformBuffer(engine);
                ub.addUniform("src", 4);
                ub.addUniform("dst", 4);
                ub.updateUInt4("src", src.offset, src.w, src.h, 0);
                ub.updateUInt4("dst", dst.offset, dst.w, dst.h, 0);
                ub.update();
                this._hiZBuildParams.push(ub);
            }
        }

        if (outChanged) {
            this._outWidth = outWidth;
            this._outHeight = outHeight;
            const outCount = outWidth * outHeight;

            // Premultiplied color + coverage.
            this._accumBuffer?.dispose();
            this._accumBuffer = new StorageBuffer(engine, outCount * 4 * Float32Array.BYTES_PER_ELEMENT);
            this._accumDepth?.dispose();
            this._accumDepth = new StorageBuffer(engine, outCount * Float32Array.BYTES_PER_ELEMENT);
            this._accumCount?.dispose();
            this._accumCount = new StorageBuffer(engine, outCount * Uint32Array.BYTES_PER_ELEMENT);

            this.resetAccumulation();
        }
    }

    /**
     * Runs the per-frame GPS compute pipeline for the given viewport, leaving the result in
     * {@link accumBuffer}. Allocates/resizes buffers on demand.
     * @param width internal render (low) width in pixels; must be `ceil(outWidth / upsampleN)`
     * @param height internal render (low) height in pixels; must be `ceil(outHeight / upsampleN)`
     * @param outWidth output (full) width the accumulation is reconstructed at
     * @param outHeight output (full) height
     * @param upsampleN integer upscale factor; 1 = no upsampling
     * @param jitterX this frame's sub-cell offset x in [0, N)
     * @param jitterY this frame's sub-cell offset y in [0, N)
     * @returns true if the pipeline dispatched, false if it was not ready / had nothing to draw
     */
    public renderToBuffer(width: number, height: number, outWidth = width, outHeight = height, upsampleN = 1, jitterX = 0, jitterY = 0): boolean {
        if (width <= 0 || height <= 0 || outWidth <= 0 || outHeight <= 0) {
            return false;
        }
        this._upsampleN = Math.max(1, Math.round(upsampleN));
        this._jitterX = jitterX;
        this._jitterY = jitterY;
        this._ensurePixelBuffers(width, height, outWidth, outHeight);

        if (this._gaussianCount === 0 || !this._parts || !this._view || !this._viewProjection || !this.isReady()) {
            return false;
        }

        const vp = this._viewProjection.m;
        let moved = !this._hasPrevVp;
        for (let k = 0; k < 16; k++) {
            if (Math.abs(vp[k] - this._prevVp[k]) > 1e-5) {
                moved = true;
                break;
            }
        }
        if (moved) {
            this.resetAccumulation();
            this._prevVp.set(vp);
            this._hasPrevVp = true;
        }

        // On a reset frame resolve fills every output pixel, so unvisited pixels cannot trail.
        const moving = this._accumGeneration !== this._lastRenderedGeneration;
        this._lastRenderedGeneration = this._accumGeneration;

        // Render pixel (lx,ly) samples output pixel (lx*N+jitterX, ly*N+jitterY); resolve crops the padding.
        const n = this._upsampleN;
        const pixelOffsetX = (n / 2 - this._jitterX - 0.5) / n;
        const pixelOffsetY = (n / 2 - this._jitterY - 0.5) / n;
        // XORed into packed colors so equal-depth ties do not favor low RGB values.
        const colorMask = (Math.imul(this._frameIndex + 1, 0x9e3779b1) >>> 16) & 0xffff;
        // Quantized degree-4 SH has 24 coefficients in [-1,1]; the addition theorem bounds radiance below 8.
        const colorRange = this._shDegree > 0 ? 8 : 1;

        this._uniforms.updateMatrix("view", this._view);
        this._uniforms.updateMatrix("viewProjection", this._viewProjection);
        this._uniforms.updateFloat4("resNearFar", width, height, this._near, this._far);
        // The classic kernel applies to a 4x covariance in output pixels; preprocess uses physical render pixels.
        this._uniforms.updateFloat4("params0", this._gaussianCount, (this.kernelSize * 0.25) / (n * n), this.pointScale, this._frameIndex % 65536);
        this._uniforms.updateFloat4("focal", this._focalX, this._focalY, this.rightHandedSystem ? 1 : 0, this.isOrthographic ? 1 : 0);
        this._uniforms.updateFloat4("camPosDeg", this._camX, this._camY, this._camZ, this._shDegree);
        this._uniforms.updateFloat4("depthNorm", this._viewZMin, this._viewZMax, this.debugActive, this.compensation ? 1 : 0);
        this._uniforms.updateFloat4("hiZInfo", width, height, this._hiZLevels.length, this.occlusionCulling && !moving ? 1 : 0);
        const projectionMode = (this._projection ? 1 : 0) | (this._projectedDepth ? 2 : 0) | (this._reverseDepth ? 4 : 0);
        const depthSpan = this._projectedDepth
            ? this._getProjectedDepthSpan(Math.max(1, (2 * width * n) / this._outWidth - 1), Math.max(1, (2 * height * n) / this._outHeight - 1))
            : null;
        this._uniforms.updateFloat4("misc", n, this.minPixelSize, colorMask, projectionMode);
        this._uniforms.updateFloat4("pixelMap", this._outWidth / n, this._outHeight / n, pixelOffsetX, pixelOffsetY);
        if (this._projection && this._inverseProjection) {
            this._uniforms.updateMatrix("projection", this._projection);
            this._uniforms.updateMatrix("inverseProjection", this._inverseProjection);
        }
        this._uniforms.updateFloat4("projectedDepth", depthSpan?.[0] ?? 0, depthSpan?.[1] ?? 1, colorRange, 0);
        this._uniforms.update();

        this._resolveParams.updateFloat2("resolution", width, height);
        this._resolveParams.updateFloat2("outResolution", this._outWidth, this._outHeight);
        this._resolveParams.updateFloat2("depthNorm", depthSpan?.[0] ?? this._viewZMin, depthSpan?.[1] ?? this._viewZMax);
        this._resolveParams.updateFloat2("colorMask", colorMask, colorRange);
        this._resolveParams.updateFloat4("upsample", n, this._jitterX, this._jitterY, this._accumGeneration);
        this._resolveParams.updateFloat4(
            "misc2",
            Math.max(1, Math.min(65535, Math.floor(this.maxAccumFrames))),
            moving ? 1 : 0,
            this._reverseDepth ? 1 : 0,
            this._projectedDepth ? 1 : 0
        );
        const zSign = this.rightHandedSystem ? -1 : 1;
        this._resolveParams.updateFloat4("projZ", this._projZ[0] * zSign, this._projZ[1] * zSign, this._projZ[2], this._projZ[3]);
        if (this._inverseProjection) {
            this._resolveParams.updateMatrix("inverseProjection", this._inverseProjection);
        }
        this._resolveParams.update();

        const groupsG = Math.ceil(this._gaussianCount / WorkgroupSize);

        this._preprocessCs.setStorageBuffer("means", this._means!);
        this._preprocessCs.setStorageBuffer("colorOpacity", this._colorOpacity!);
        this._preprocessCs.setStorageBuffer("weights", this._weights!);
        this._preprocessCs.setStorageBuffer("gsData", this._gsData!);
        this._preprocessCs.setUniformBuffer("uniforms", this._uniforms);
        this._preprocessCs.setStorageBuffer("cov3d", this._cov3d!);
        // Binding an unused sh buffer would not match the auto-layout at degree 0.
        if (this._shDegree > 0) {
            this._preprocessCs.setStorageBuffer("sh", this._sh!);
        }
        this._preprocessCs.setStorageBuffer("parts", this._parts!);
        this._preprocessCs.setStorageBuffer("hiZ", this._hiZ!);
        this._preprocessCs.dispatch(Math.min(groupsG, MaxDispatchGroupsPerDimension), Math.ceil(groupsG / MaxDispatchGroupsPerDimension), 1);

        this._scanBlocksCs.setStorageBuffer("weights", this._weights!);
        this._scanBlocksCs.setStorageBuffer("cdf", this._cdf!);
        this._scanBlocksCs.setStorageBuffer("blockSums", this._blockSums!);
        this._scanBlocksCs.dispatch(Math.min(this._numBlocks, MaxDispatchGroupsPerDimension), Math.ceil(this._numBlocks / MaxDispatchGroupsPerDimension), 1);

        this._scanSumsCs.setStorageBuffer("blockSums", this._blockSums!);
        this._scanSumsCs.setStorageBuffer("pointCount", this._pointCount);
        this._scanSumsCs.setStorageBuffer("indirectArgs", this._indirectArgs);
        this._scanSumsCs.dispatch(1, 1, 1);

        this._scanAddCs.setStorageBuffer("cdf", this._cdf!);
        this._scanAddCs.setStorageBuffer("blockSums", this._blockSums!);
        this._scanAddCs.dispatch(Math.min(groupsG, MaxDispatchGroupsPerDimension), Math.ceil(groupsG / MaxDispatchGroupsPerDimension), 1);

        this._partitionCs.setStorageBuffer("cdf", this._cdf!);
        this._partitionCs.setStorageBuffer("pointCount", this._pointCount);
        this._partitionCs.setStorageBuffer("partTable", this._partition);
        this._partitionCs.dispatch(Math.ceil((PartitionBuckets + 1) / WorkgroupSize), 1, 1);

        this._splatCs.setStorageBuffer("cdf", this._cdf!);
        this._splatCs.setStorageBuffer("gsData", this._gsData!);
        this._splatCs.setStorageBuffer("imageBuffer", this._imageBuffer!);
        this._splatCs.setUniformBuffer("uniforms", this._uniforms);
        this._splatCs.setStorageBuffer("pointCount", this._pointCount);
        this._splatCs.setStorageBuffer("partTable", this._partition);
        this._splatCs.dispatchIndirect(this._indirectArgs);

        this._resolveCs.setStorageBuffer("accumBuffer", this._accumBuffer!);
        this._resolveCs.setStorageBuffer("accumDepth", this._accumDepth!);
        this._resolveCs.setUniformBuffer("params", this._resolveParams);
        this._resolveCs.setStorageBuffer("imageBuffer", this._imageBuffer!);
        this._resolveCs.setStorageBuffer("hiZ", this._hiZ!);
        this._resolveCs.setStorageBuffer("accumCount", this._accumCount!);
        this._resolveCs.dispatch(Math.ceil(width / 8), Math.ceil(height / 8), 1);

        // Level 0 is written by resolve; max-reduce the rest for next frame's cull.
        if (this.occlusionCulling) {
            for (let l = 1; l < this._hiZLevels.length; l++) {
                const dst = this._hiZLevels[l];
                this._hiZBuildCs.setStorageBuffer("hiZ", this._hiZ!);
                this._hiZBuildCs.setUniformBuffer("params", this._hiZBuildParams[l - 1]);
                this._hiZBuildCs.dispatch(Math.ceil(dst.w / 8), Math.ceil(dst.h / 8), 1);
            }
        }

        this._frameIndex++;
        return true;
    }

    private _disposeGaussianBuffers(): void {
        this._means?.dispose();
        this._colorOpacity?.dispose();
        this._cov3d?.dispose();
        this._sh?.dispose();
        this._weights?.dispose();
        this._gsData?.dispose();
        this._cdf?.dispose();
        this._blockSums?.dispose();
        this._means = null;
        this._colorOpacity = null;
        this._cov3d = null;
        this._sh = null;
        this._weights = null;
        this._gsData = null;
        this._cdf = null;
        this._blockSums = null;
        this._gaussianCount = 0;
        this._numBlocks = 0;
    }

    /** Releases all GPU resources owned by the renderer. */
    public dispose(): void {
        this._disposeGaussianBuffers();
        this._imageBuffer?.dispose();
        this._accumBuffer?.dispose();
        this._accumDepth?.dispose();
        this._accumCount?.dispose();
        this._accumDepth = null;
        this._imageBuffer = null;
        this._accumBuffer = null;
        this._accumCount = null;
        this._hiZ?.dispose();
        this._hiZ = null;
        this._hiZLevels = [];
        for (const ub of this._hiZBuildParams) {
            ub.dispose();
        }
        this._hiZBuildParams = [];
        this._parts?.dispose();
        this._parts = null;
        this._partCount = 0;
        this._pointCount.dispose();
        this._indirectArgs.dispose();
        this._partition.dispose();
        this._uniforms.dispose();
        this._resolveParams.dispose();
        this._width = 0;
        this._height = 0;
        this._outWidth = 0;
        this._outHeight = 0;
    }
}
