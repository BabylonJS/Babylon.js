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
const ScanBlockSize = 512; // elements per scan workgroup (256 threads x 2)
const DepthClearSentinel = 0xffffffff;

/**
 * Owns the WebGPU compute pipeline and GPU buffers for Gaussian Point Splatting (the stochastic,
 * sort-free point-splatting technique). Engine-focused: it knows nothing about the scene graph
 * beyond the camera matrices and viewport size handed to it.
 *
 * Per-frame pipeline (dispatched before the render pass):
 *   preprocess (1 thread/Gaussian: transform, cull, cache screen state, emit a point weight)
 *   -> scan (Blelloch prefix sum of weights -> CDF + GPU-written indirect dispatch args)
 *   -> splat (indirect, 1 thread/point: binary-search the CDF for its Gaussian, atomicMin its sample)
 *   -> resolve (unpack the packed image buffer into the full-float accumulation buffer, reset it).
 *
 * Per-Gaussian buffers are (re)built only on new splat data; per-pixel buffers only on resize.
 * Nothing reads back from the GPU on the render path — the point count reaches the splat dispatch via
 * a GPU-written indirect-args buffer.
 */
export class GaussianPointSplattingRenderer {
    private readonly _engine: AbstractEngine;

    // Preprocess is recompiled with a SH_DEGREE define so only the SH bands the asset has are evaluated
    // (like the classic rasterizer's #if SH_DEGREE). Created in the constructor via _createPreprocessCs.
    private _preprocessCs!: ComputeShader;
    private _preprocessBindings!: ComputeBindingMapping;
    private _preprocessShDegree = -1;
    private _scanBlocksCs: ComputeShader;
    private _scanSumsCs: ComputeShader;
    private _scanAddCs: ComputeShader;
    private _splatCs: ComputeShader;
    private _resolveCs: ComputeShader;

    private _uniforms: UniformBuffer;
    private _resolveParams: UniformBuffer;

    // Per-Gaussian buffers (rebuilt on updateSplats).
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
    /** 2D covariance dilation (sub-pixel antialiasing kernel), in pixels^2. */
    public kernelSize = 0.3;
    /** Whether the scene uses a reverse-Z depth buffer (near = large NDC z). */
    public reverseDepth = false;

    // Small GPU-resident scan outputs (allocated once).
    private _pointCount: StorageBuffer;
    private _indirectArgs: StorageBuffer;

    // Per-pixel buffers (rebuilt on resize).
    private _imageBuffer: Nullable<StorageBuffer> = null;
    private _accumBuffer: Nullable<StorageBuffer> = null;
    private _accumDepth: Nullable<StorageBuffer> = null;
    private _width = 0;
    private _height = 0;

    // Latest camera state, applied to the uniform buffer each frame.
    private _view: Nullable<Matrix> = null;
    private _viewProjection: Nullable<Matrix> = null;
    private _near = 0.1;
    private _far = 1000;
    private _focalX = 1000;
    private _focalY = 1000;
    private _camX = 0;
    private _camY = 0;
    private _camZ = 0;
    // The model's NDC-z span this frame; the depth key is normalized to it for full 16-bit ordering.
    private _ndczMin = 0;
    private _ndczMax = 1;
    private _frameIndex = 0;

    // Per-part live transforms (world matrix + visibility), uploaded each frame. A non-compound mesh
    // is a single part. The GPU buffer is rebuilt only when the part count changes; a copy of the last
    // uploaded values lets us restart accumulation when a part moves (otherwise stale frames ghost).
    private _parts: Nullable<StorageBuffer> = null;
    private _partCount = 0;
    private _prevPartData: Float32Array = new Float32Array(0);

    // Progressive accumulation state.
    private _accumFrame = 0;
    private _prevVp = new Float32Array(16);
    private _hasPrevVp = false;

    /** Maximum number of frames blended into the accumulation buffer (caps the running-mean weight). */
    public maxAccumFrames = 255;

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

        const splatBindings: ComputeBindingMapping = {
            cdf: { group: 0, binding: 0 },
            gsData: { group: 0, binding: 1 },
            imageBuffer: { group: 0, binding: 2 },
            uniforms: { group: 0, binding: 3 },
            pointCount: { group: 0, binding: 4 },
        };
        this._splatCs = new ComputeShader("gpsSplat", engine, "gpsSplat", { bindingsMapping: splatBindings });

        const resolveBindings: ComputeBindingMapping = {
            accumBuffer: { group: 0, binding: 0 },
            params: { group: 0, binding: 1 },
            imageBuffer: { group: 0, binding: 2 },
            accumDepth: { group: 0, binding: 3 },
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

        this._resolveParams = new UniformBuffer(engine);
        this._resolveParams.addUniform("resolution", 2);
        this._resolveParams.addUniform("accumFrame", 1);
        this._resolveParams.addUniform("pad0", 1);
        this._resolveParams.addUniform("depthNorm", 2);
        this._resolveParams.addUniform("pad1", 2);

        // pointCount: [totalPoints, indirectGroups, ...]. indirectArgs: [gx, gy, gz] for dispatchIndirect.
        this._pointCount = new StorageBuffer(engine as WebGPUEngine, 4 * Uint32Array.BYTES_PER_ELEMENT);
        // STORAGE (written by the scan) | INDIRECT (consumed by dispatchIndirect) | WRITE (CopyDst,
        // so the buffer's initial zero-fill is valid). Never read back on the CPU.
        this._indirectArgs = new StorageBuffer(
            engine as WebGPUEngine,
            3 * Uint32Array.BYTES_PER_ELEMENT,
            Constants.BUFFER_CREATIONFLAG_STORAGE | Constants.BUFFER_CREATIONFLAG_INDIRECT | Constants.BUFFER_CREATIONFLAG_WRITE
        );
    }

    /**
     * (Re)creates the preprocess compute shader with a SH_DEGREE define, so only the spherical-harmonics
     * bands the asset actually has are compiled and evaluated (matching the classic rasterizer). Cheap
     * and rare — called only when the loaded data's SH degree changes.
     * @param shDegree the asset's SH degree (0 = view-independent color)
     */
    private _createPreprocessCs(shDegree: number): void {
        this._preprocessShDegree = shDegree;
        this._preprocessCs = new ComputeShader("gpsPreprocess", this._engine, "gpsPreprocess", {
            bindingsMapping: this._preprocessBindings,
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

    /** Current internal render width, in pixels. */
    public get width(): number {
        return this._width;
    }

    /** Current internal render height, in pixels. */
    public get height(): number {
        return this._height;
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
            this._splatCs.isReady() &&
            this._resolveCs.isReady()
        );
    }

    /**
     * Uploads decoded splat data into per-Gaussian GPU buffers, replacing any previous data.
     * @param means packed positions, 4 floats per Gaussian (x, y, z, unused)
     * @param cov3d packed 3D covariance, 8 floats per Gaussian ((S00,S01,S02,S11),(S12,S22,-,-))
     * @param colorOpacity packed RGBA8 base color + opacity, 1 u32 per Gaussian
     * @param sh dequantized SH coefficients (interleaved RGB, shDim*3 floats per Gaussian), or null
     * @param shDegree spherical-harmonics degree (0 = view-independent color)
     * @param count number of Gaussians
     */
    public updateSplats(means: Float32Array, cov3d: Float32Array, colorOpacity: Uint32Array, sh: Nullable<Float32Array>, shDegree: number, count: number): void {
        this._disposeGaussianBuffers();
        this._gaussianCount = count;
        this._shDegree = sh ? shDegree : 0;
        // Recompile the preprocess shader if this asset's SH degree differs, so only its bands are built.
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

        // 3D covariance: 2 vec4 per Gaussian — (S00,S01,S02,S11),(S12,S22,-,-).
        this._cov3d = new StorageBuffer(engine, count * 8 * Float32Array.BYTES_PER_ELEMENT);
        this._cov3d.update(cov3d);

        // SH coefficients (view-dependent color). A tiny placeholder keeps the binding valid at degree 0.
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
        // GpsScreen is 4 vec4 = 64 bytes per Gaussian.
        this._gsData = new StorageBuffer(engine, count * 64);

        this.resetAccumulation();
    }

    /** Restarts progressive accumulation (e.g. after a camera move, resize, or new data). */
    public resetAccumulation(): void {
        this._accumFrame = 0;
        this._hasPrevVp = false;
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
     * @param ndczMin the model's minimum NDC z this frame (depth-key normalization range)
     * @param ndczMax the model's maximum NDC z this frame
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
        ndczMin: number,
        ndczMax: number
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
        this._ndczMin = ndczMin;
        this._ndczMax = ndczMax;
    }

    /**
     * Uploads the live per-part transforms consumed by the preprocess shader. Each part contributes 20
     * floats: 16 for its column-major world matrix followed by [visibility, 0, 0, 0]. Called every
     * frame so runtime transforms (gizmo) and part visibility take effect without re-baking; the GPU
     * buffer is only reallocated when the part count changes.
     * @param packed part records, `count * 20` floats (world matrix + visibility per part)
     * @param count number of parts (at least 1)
     */
    public setPartData(packed: Float32Array, count: number): void {
        const engine = this._engine as WebGPUEngine;
        const floats = count * 20;
        // Restart accumulation whenever a part moved, changed visibility, or the part set changed —
        // otherwise the progressive buffer blends pre-move frames into the new pose (a ghost trail).
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
            // GpsPart is mat4x4f + vec4f = 80 bytes (20 floats) per part in std430.
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

    private _ensurePixelBuffers(width: number, height: number): void {
        if (width === this._width && height === this._height && this._accumBuffer) {
            return;
        }
        this._width = width;
        this._height = height;

        const engine = this._engine as WebGPUEngine;
        const pixelCount = width * height;

        this._imageBuffer?.dispose();
        this._imageBuffer = new StorageBuffer(engine, pixelCount * Uint32Array.BYTES_PER_ELEMENT);
        // Seed the packed image buffer to the depth-clear sentinel; resolve keeps it seeded thereafter.
        const seed = new Uint32Array(pixelCount);
        seed.fill(DepthClearSentinel);
        this._imageBuffer.update(seed);

        // accum: premultiplied color (rgb) + accumulated coverage (w).
        this._accumBuffer?.dispose();
        this._accumBuffer = new StorageBuffer(engine, pixelCount * 4 * Float32Array.BYTES_PER_ELEMENT);

        // accumDepth: resolved surface depth (NDC z), one float per pixel, for fragDepth compositing.
        this._accumDepth?.dispose();
        this._accumDepth = new StorageBuffer(engine, pixelCount * Float32Array.BYTES_PER_ELEMENT);

        this.resetAccumulation();
    }

    /**
     * Runs the per-frame GPS compute pipeline for the given viewport, leaving the result in
     * {@link accumBuffer}. Allocates/resizes buffers on demand.
     * @param width internal render width in pixels
     * @param height internal render height in pixels
     * @returns true if the pipeline dispatched, false if it was not ready / had nothing to draw
     */
    public renderToBuffer(width: number, height: number): boolean {
        if (width <= 0 || height <= 0) {
            return false;
        }
        this._ensurePixelBuffers(width, height);

        if (this._gaussianCount === 0 || !this._parts || !this._view || !this._viewProjection || !this.isReady()) {
            return false;
        }

        // Restart accumulation when the view changed (camera move / projection change). A still view
        // keeps converging; a moving one shows the current (noisy) frame without ghosting.
        const vp = this._viewProjection.m;
        let moved = !this._hasPrevVp;
        for (let k = 0; k < 16; k++) {
            if (Math.abs(vp[k] - this._prevVp[k]) > 1e-5) {
                moved = true;
                break;
            }
        }
        if (moved) {
            this._accumFrame = 0;
            this._prevVp.set(vp);
            this._hasPrevVp = true;
        }

        this._uniforms.updateMatrix("view", this._view);
        this._uniforms.updateMatrix("viewProjection", this._viewProjection);
        this._uniforms.updateFloat4("resNearFar", width, height, this._near, this._far);
        // frameSeed wraps to stay exact as a float and to vary the stochastic sampling each frame.
        this._uniforms.updateFloat4("params0", this._gaussianCount, this.kernelSize, this.pointScale, this._frameIndex % 65536);
        const reverseZ = this.reverseDepth ? 1 : 0;
        this._uniforms.updateFloat4("focal", this._focalX, this._focalY, reverseZ, 0);
        this._uniforms.updateFloat4("camPosDeg", this._camX, this._camY, this._camZ, this._shDegree);
        this._uniforms.updateFloat4("depthNorm", this._ndczMin, this._ndczMax, 0, 0);
        this._uniforms.update();

        this._resolveParams.updateFloat2("resolution", width, height);
        this._resolveParams.updateFloat("accumFrame", this._accumFrame);
        this._resolveParams.updateFloat("pad0", reverseZ);
        this._resolveParams.updateFloat2("depthNorm", this._ndczMin, this._ndczMax);
        this._resolveParams.updateFloat2("pad1", 0, 0);
        this._resolveParams.update();

        const groupsG = Math.ceil(this._gaussianCount / WorkgroupSize);

        this._preprocessCs.setStorageBuffer("means", this._means!);
        this._preprocessCs.setStorageBuffer("colorOpacity", this._colorOpacity!);
        this._preprocessCs.setStorageBuffer("weights", this._weights!);
        this._preprocessCs.setStorageBuffer("gsData", this._gsData!);
        this._preprocessCs.setUniformBuffer("uniforms", this._uniforms);
        this._preprocessCs.setStorageBuffer("cov3d", this._cov3d!);
        this._preprocessCs.setStorageBuffer("sh", this._sh!);
        this._preprocessCs.setStorageBuffer("parts", this._parts!);
        this._preprocessCs.dispatch(groupsG, 1, 1);

        this._scanBlocksCs.setStorageBuffer("weights", this._weights!);
        this._scanBlocksCs.setStorageBuffer("cdf", this._cdf!);
        this._scanBlocksCs.setStorageBuffer("blockSums", this._blockSums!);
        this._scanBlocksCs.dispatch(this._numBlocks, 1, 1);

        this._scanSumsCs.setStorageBuffer("blockSums", this._blockSums!);
        this._scanSumsCs.setStorageBuffer("pointCount", this._pointCount);
        this._scanSumsCs.setStorageBuffer("indirectArgs", this._indirectArgs);
        this._scanSumsCs.dispatch(1, 1, 1);

        this._scanAddCs.setStorageBuffer("cdf", this._cdf!);
        this._scanAddCs.setStorageBuffer("blockSums", this._blockSums!);
        this._scanAddCs.dispatch(groupsG, 1, 1);

        this._splatCs.setStorageBuffer("cdf", this._cdf!);
        this._splatCs.setStorageBuffer("gsData", this._gsData!);
        this._splatCs.setStorageBuffer("imageBuffer", this._imageBuffer!);
        this._splatCs.setUniformBuffer("uniforms", this._uniforms);
        this._splatCs.setStorageBuffer("pointCount", this._pointCount);
        this._splatCs.dispatchIndirect(this._indirectArgs);

        this._resolveCs.setStorageBuffer("accumBuffer", this._accumBuffer!);
        this._resolveCs.setStorageBuffer("accumDepth", this._accumDepth!);
        this._resolveCs.setUniformBuffer("params", this._resolveParams);
        this._resolveCs.setStorageBuffer("imageBuffer", this._imageBuffer!);
        this._resolveCs.dispatch(Math.ceil(width / 8), Math.ceil(height / 8), 1);

        this._frameIndex++;
        if (this._accumFrame < this.maxAccumFrames) {
            this._accumFrame++;
        }
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
        this._accumDepth = null;
        this._imageBuffer = null;
        this._accumBuffer = null;
        this._parts?.dispose();
        this._parts = null;
        this._partCount = 0;
        this._pointCount.dispose();
        this._indirectArgs.dispose();
        this._uniforms.dispose();
        this._resolveParams.dispose();
        this._width = 0;
        this._height = 0;
    }
}
