/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";
import { type Scene } from "core/scene.pure";
import { type Observer } from "core/Misc/observable";
import { Matrix, Quaternion } from "core/Maths/math.vector.pure";
import { type Material } from "core/Materials/material.pure";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial.pure";
import { Constants } from "core/Engines/constants";
import { Mesh } from "core/Meshes/mesh.pure";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { Logger } from "core/Misc/logger";
import { ToHalfFloat } from "core/Misc/textureTools";
import { GaussianPointSplattingRenderer, _GetPackedShBytesPerSplat, _HasGaussianPointSplattingProjectedDepth } from "./gaussianPointSplattingRenderer.pure";
import { GaussianPointSplattingBlitMaterial } from "core/Materials/GaussianSplatting/gaussianPointSplattingBlitMaterial.pure";
import { GaussianPointSplattingDepthBlitMaterial } from "core/Materials/GaussianSplatting/gaussianPointSplattingDepthBlitMaterial.pure";
import { type GaussianSplattingDebugMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin.pure";
import { type GaussianSplattingSolidColorMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingSolidColorMaterialPlugin.pure";
import { RegisterEnginesWebGPUExtensionsEngineComputeShader } from "core/Engines/WebGPU/Extensions/engine.computeShader.pure";
import {
    _SetGaussianPointSplattingControllerFactory,
    type GaussianSplattingMesh,
    type IGaussianPointSplattingController,
    type IGaussianPointSplattingProgress,
} from "./gaussianSplattingMesh.pure";

const _BytesPerSplat = 32;

// Loaded on demand to keep this module side-effect free; the wrapper imports them eagerly.
let _DependenciesReady = false;
let _DependenciesPromise: Nullable<Promise<void>> = null;

async function _LoadDependenciesAsync(): Promise<void> {
    try {
        await Promise.all([
            import("../../ShadersWGSL/gpsPreprocess.compute"),
            import("../../ShadersWGSL/gpsScanBlocks.compute"),
            import("../../ShadersWGSL/gpsScanSums.compute"),
            import("../../ShadersWGSL/gpsScanAdd.compute"),
            import("../../ShadersWGSL/gpsPartition.compute"),
            import("../../ShadersWGSL/gpsSplat.compute"),
            import("../../ShadersWGSL/gpsResolve.compute"),
            import("../../ShadersWGSL/gpsHiZBuild.compute"),
            import("../../ShadersWGSL/gaussianPointSplattingBlit.vertex"),
            import("../../ShadersWGSL/gaussianPointSplattingBlit.fragment"),
            import("../../ShadersWGSL/gaussianPointSplattingDepthBlit.fragment"),
        ]);
        _DependenciesReady = true;
    } catch (error) {
        _DependenciesPromise = null;
        Logger.Error(`GaussianSplattingMesh: failed to load point-splatting shaders: ${String(error)}`);
    }
}

function _LoadDependencies(): void {
    if (!_DependenciesReady && !_DependenciesPromise) {
        _DependenciesPromise = _LoadDependenciesAsync();
    }
}

const _F32Scratch = /*#__PURE__*/ new Float32Array(1);
const _U32Scratch = /*#__PURE__*/ new Uint32Array(_F32Scratch.buffer);

/**
 * Packs two floats as half-floats into one u32 (a in the low 16 bits).
 * @param a value for the low 16 bits
 * @param b value for the high 16 bits
 * @returns the packed u32
 */
function _Pack2HalfFloat(a: number, b: number): number {
    return (ToHalfFloat(a) | (ToHalfFloat(b) << 16)) >>> 0;
}

/**
 * Owns the WebGPU compute point-splatting path of one {@link GaussianSplattingMesh}: decode, dispatch,
 * auto render scale, and the compositors that blit the result into the scene.
 *
 * The mesh never imports this module, so bundles without point splatting do not include it. It is enabled
 * by {@link RegisterGaussianPointSplattingController}, which the side-effect wrapper calls.
 */
export class GaussianPointSplattingController implements IGaussianPointSplattingController {
    private readonly _mesh: GaussianSplattingMesh;
    private readonly _scene: Scene;

    /**
     * Creates a point-splatting controller for a Gaussian Splatting mesh.
     * @param mesh the mesh whose splat data this controller renders
     */
    public constructor(mesh: GaussianSplattingMesh) {
        this._mesh = mesh;
        this._scene = mesh.getScene();
    }

    private _colorMode = false;
    private _depthMode = false;
    private _scale = 1;
    private _renderScale: number | "auto" = "auto";
    // Auto scale: N is measured once per generation, on a non-reset frame (the reset frame has no Hi-Z cull
    // and over-counts), then frozen so a converged image never mixes two render scales.
    private _autoN = 2;
    private _autoMeasuredGeneration = -1;
    private _lastRenderedGeneration = -1;
    private _autoRequestId = 0;
    private _budgetReadPending = false;
    private _resultReady = false;
    /** Whether the latest compute run succeeded; unlike `_resultReady`, not cleared at frame start. */
    private _progressReady = false;
    private _computedWidth = 0;
    private _computedHeight = 0;
    // Counters of the last dispatch, surfaced by `progress`.
    private _progressFrameCount = 0;
    private _progressGeneration = -1;
    private _progressCycleLength = 0;
    private _streamingWarned = false;
    private _workloadWarned = false;
    private _invalidProjectionWarned = false;
    private _renderer: Nullable<GaussianPointSplattingRenderer> = null;
    private _blit: Nullable<GaussianPointSplattingBlitMaterial> = null;
    private _blitMesh: Nullable<Mesh> = null;
    private _depthBlit: Nullable<GaussianPointSplattingDepthBlitMaterial> = null;
    private _depthBlitMesh: Nullable<Mesh> = null;
    private _computeObserver: Nullable<Observer<Scene>> = null;
    private _splatCount = 0;
    private _partCount = 1;
    private _decodedPartCount = 0;
    private _decodedRevision = -1;
    private _decodedShDegree = -1;
    private _partLocalMin = new Float32Array(3);
    private _partLocalMax = new Float32Array(3);
    private _partScratch = new Float32Array(40);
    private _decodedSplatsData: Nullable<ArrayBuffer> = null;
    private readonly _vpMatrix = new Matrix();
    private readonly _inverseProjection = new Matrix();
    private readonly _outputSize = { width: 1, height: 1 };
    private readonly _depthSpan: [number, number] = [0, 0];

    /** {@inheritDoc IGaussianPointSplattingController.colorRenderMode} */
    public get colorRenderMode(): boolean {
        return this._colorMode;
    }
    public set colorRenderMode(value: boolean) {
        if (value === this._colorMode) {
            return;
        }
        if (value && !this._scene.getEngine().isWebGPU) {
            Logger.Warn("GaussianSplattingMesh: point-splatting render mode requires a WebGPU engine; ignoring.");
            return;
        }
        this._colorMode = value;
        if (value) {
            this._ensureCompute();
            this._enableColorBlit();
        } else {
            this._blitMesh?.setEnabled(false);
            this._releaseComputeIfIdle();
        }
    }

    /** {@inheritDoc IGaussianPointSplattingController.depthRenderMode} */
    public get depthRenderMode(): boolean {
        return this._depthMode;
    }
    public set depthRenderMode(value: boolean) {
        if (value === this._depthMode) {
            return;
        }
        if (value && !this._scene.getEngine().isWebGPU) {
            Logger.Warn("GaussianSplattingMesh: point-splatting depth render mode requires a WebGPU engine; ignoring.");
            return;
        }
        this._depthMode = value;
        if (value) {
            this._ensureCompute();
            this._enableDepthBlit();
        } else {
            this._depthBlitMesh?.setEnabled(false);
            this._releaseComputeIfIdle();
        }
    }

    /** {@inheritDoc IGaussianPointSplattingController.progress} */
    public get progress(): Nullable<IGaussianPointSplattingProgress> {
        if (!this._computeActive || !this._progressReady || !this._renderer) {
            return null;
        }
        return {
            renderedFrameCount: this._progressFrameCount,
            accumulationVersion: this._progressGeneration,
            pixelCycleLength: this._progressCycleLength,
        };
    }

    /** True while either point-splatting mode is on, i.e. while the shared compute must run. */
    private get _computeActive(): boolean {
        return (this._colorMode || this._depthMode) && !this._mesh._pointStreamingUnsupported;
    }

    /** {@inheritDoc IGaussianPointSplattingController.pointScale} */
    public get pointScale(): number {
        return this._scale;
    }
    public set pointScale(value: number) {
        if (value === this._scale) {
            return;
        }
        this._scale = value;
        if (this._renderer) {
            this._renderer.pointScale = value;
            this._renderer.resetAccumulation();
        }
    }

    /** Lazily builds the compute shared by the color and depth modes. Idempotent. */
    private _ensureCompute(): void {
        const engine = this._scene.getEngine();
        _LoadDependencies();
        if (!this._renderer) {
            // ComputeShader creates its compute context on construction, so the engine extension goes first.
            RegisterEnginesWebGPUExtensionsEngineComputeShader();
            this._renderer = new GaussianPointSplattingRenderer(engine);
            this._renderer.pointScale = this._scale;
            this._decodedSplatsData = null;
        }
        if (!this._mesh._pointStreamingUnsupported && this._isWorkloadSupported()) {
            this._syncData();
        }
        if (!this._computeObserver) {
            this._computeObserver = this._scene.onBeforeRenderObservable.add(() => {
                this._resultReady = false;
            });
        }
    }

    /** Tears down the shared compute once neither point-splatting mode needs it anymore. */
    private _releaseComputeIfIdle(): void {
        if (this._colorMode || this._depthMode) {
            return;
        }
        if (this._computeObserver) {
            this._scene.onBeforeRenderObservable.remove(this._computeObserver);
            this._computeObserver = null;
        }
        this._renderer?.dispose();
        this._renderer = null;
        this._decodedSplatsData = null;
        this._resultReady = false;
        this._progressReady = false;
        this._budgetReadPending = false;
        this._autoN = 2;
        this._autoMeasuredGeneration = -1;
        this._lastRenderedGeneration = -1;
    }

    /** Builds a fullscreen compositor triangle. It is disabled and drawn manually, so its clip-space
     * geometry never leaks into other geometry passes.
     * @param name the compositor mesh name
     * @param material the blit material to render it with
     * @returns the created compositor mesh
     */
    private _createBlitMesh(name: string, material: Material): Mesh {
        const blitMesh = new Mesh(name, this._scene);
        const vd = new VertexData();
        vd.positions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
        vd.indices = [0, 1, 2];
        vd.applyToMesh(blitMesh);
        blitMesh.material = material;
        blitMesh.doNotSerialize = true;
        blitMesh.isPickable = false;
        blitMesh.doNotSyncBoundingInfo = true;
        blitMesh.setEnabled(false);
        blitMesh.reservedDataStore = { hidden: true };
        blitMesh.computeWorldMatrix(true);
        return blitMesh;
    }

    /** Lazily builds the color compositor. */
    private _enableColorBlit(): void {
        if (!this._blit) {
            this._blit = new GaussianPointSplattingBlitMaterial(this._mesh.name + "_blit", this._scene);
            // Internal compositor bound to storage buffers, which cannot round-trip through serialization.
            this._blit.doNotSerialize = true;
        }
        if (!this._blitMesh) {
            this._blitMesh = this._createBlitMesh(this._mesh.name + "_blitMesh", this._blit);
        }
    }

    /** Lazily builds the depth compositor. */
    private _enableDepthBlit(): void {
        if (!this._depthBlit) {
            this._depthBlit = new GaussianPointSplattingDepthBlitMaterial(this._mesh.name + "_depthBlit", this._scene);
            // Internal compositor bound to storage buffers, which cannot round-trip through serialization.
            this._depthBlit.doNotSerialize = true;
        }
        if (!this._depthBlitMesh) {
            this._depthBlitMesh = this._createBlitMesh(this._mesh.name + "_depthBlitMesh", this._depthBlit);
        }
    }

    /**
     * Checks the mesh's current data and output size against the device buffer limits, before anything is
     * decoded or allocated. Warns once when they do not fit.
     * @returns whether the workload fits
     */
    private _isWorkloadSupported(): boolean {
        const data = this._mesh._splatsData;
        const count = data ? (data.byteLength / _BytesPerSplat) | 0 : 0;
        const shDegree = this._mesh._shData?.length ? this._mesh._shDegree : 0;
        const { width, height } = this._getOutputSize();
        if (this._renderer!.supportsWorkload(count, shDegree, width, height)) {
            return true;
        }
        if (!this._workloadWarned) {
            this._workloadWarned = true;
            Logger.Warn(
                `GaussianSplattingMesh: point splatting needs storage buffers larger than this device allows (${count} splats at ${width}x${height}); falling back to the classic renderer.`
            );
        }
        return false;
    }

    /** Re-decodes the splat data if it changed since the last decode. */
    private _syncData(): void {
        const data = this._mesh._splatsData;
        const vc = data ? (data.byteLength / _BytesPerSplat) | 0 : 0;
        const pc = this._mesh.isCompound ? this._mesh.partCount : 1;
        const revision = this._mesh._splatDataRevision;
        const shDegree = this._mesh._shDegree;
        if (
            data === this._decodedSplatsData &&
            vc === this._splatCount &&
            pc === this._decodedPartCount &&
            revision === this._decodedRevision &&
            shDegree === this._decodedShDegree
        ) {
            return;
        }
        this._decodedSplatsData = data;
        this._decodedPartCount = pc;
        this._decodedRevision = revision;
        this._decodedShDegree = shDegree;
        if (!data || vc === 0) {
            this._splatCount = 0;
            return;
        }
        this._decode(data);
    }

    /**
     * Decodes raw `.splat` bytes into local-space per-Gaussian buffers. Mirrors the classic `_makeSplat`,
     * including the `* 2` on the scale, which `gpsPreprocess` cancels on the projected covariance.
     * @param splatsData raw `.splat` bytes for this mesh's splats
     */
    private _decode(splatsData: ArrayBuffer): void {
        const bytes = new Uint8Array(splatsData);
        const floats = new Float32Array(splatsData);
        const count = (bytes.length / _BytesPerSplat) | 0;
        const inputs = this._mesh._getPointDecodeInputs();
        const flipY = inputs.flipY ? -1 : 1;
        const partIndices = this._mesh.isCompound ? inputs.partIndices : null;

        let partCount = this._mesh.isCompound ? this._mesh.partCount : 1;
        if (partIndices) {
            for (let i = 0; i < count; i++) {
                if (partIndices[i] + 1 > partCount) {
                    partCount = partIndices[i] + 1;
                }
            }
        }

        const means = new Float32Array(count * 4);
        const cov3d = new Uint32Array(count * 4);
        const colorOpacity = new Uint32Array(count);
        const sh = this._packSh(this._mesh._shData ?? undefined, this._mesh._shDegree, count);

        const quaternion = new Quaternion();
        const rotation = new Matrix();
        const scale = new Matrix();
        const rs = new Matrix();
        const pMin = new Float32Array(partCount * 3).fill(Infinity);
        const pMax = new Float32Array(partCount * 3).fill(-Infinity);
        const activeRanges = inputs.activeRanges;
        const activeMask = activeRanges ? new Uint8Array(count) : null;
        if (activeRanges && activeMask) {
            for (let r = 0; r < activeRanges.length; r += 2) {
                activeMask.fill(1, activeRanges[r], Math.min(count, activeRanges[r] + activeRanges[r + 1]));
            }
        }

        for (let i = 0; i < count; i++) {
            const active = !activeMask || activeMask[i] !== 0;
            const mx = floats[8 * i + 0];
            const my = floats[8 * i + 1] * flipY;
            const mz = floats[8 * i + 2];

            const qb = _BytesPerSplat * i + 28;
            quaternion.set((bytes[qb + 1] - 127.5) / 127.5, (bytes[qb + 2] - 127.5) / 127.5, (bytes[qb + 3] - 127.5) / 127.5, -(bytes[qb + 0] - 127.5) / 127.5);
            quaternion.normalize();
            quaternion.toRotationMatrix(rotation);
            Matrix.ScalingToRef(floats[8 * i + 3] * 2, floats[8 * i + 4] * 2, floats[8 * i + 5] * 2, scale);
            rotation.multiplyToRef(scale, rs);
            const m = rs.m;

            const part = partIndices ? partIndices[i] : 0;
            means[4 * i + 0] = mx;
            means[4 * i + 1] = my;
            means[4 * i + 2] = mz;
            means[4 * i + 3] = part;
            const b = part * 3;
            if (active && mx < pMin[b]) {
                pMin[b] = mx;
            }
            if (active && my < pMin[b + 1]) {
                pMin[b + 1] = my;
            }
            if (active && mz < pMin[b + 2]) {
                pMin[b + 2] = mz;
            }
            if (active && mx > pMax[b]) {
                pMax[b] = mx;
            }
            if (active && my > pMax[b + 1]) {
                pMax[b + 1] = my;
            }
            if (active && mz > pMax[b + 2]) {
                pMax[b + 2] = mz;
            }

            // Sigma = (R*S)(R*S)^T, stored as f16 divided by max|component| to keep precision at any scale.
            const s00 = m[0] * m[0] + m[1] * m[1] + m[2] * m[2];
            const s01 = m[0] * m[4] + m[1] * m[5] + m[2] * m[6];
            const s02 = m[0] * m[8] + m[1] * m[9] + m[2] * m[10];
            const s11 = m[4] * m[4] + m[5] * m[5] + m[6] * m[6];
            const s12 = m[4] * m[8] + m[5] * m[9] + m[6] * m[10];
            const s22 = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];
            let factor = Math.max(Math.abs(s00), Math.abs(s01), Math.abs(s02), Math.abs(s11), Math.abs(s12), Math.abs(s22));
            if (!(factor > 0)) {
                factor = 1;
            }
            const inv = 1 / factor;
            cov3d[4 * i + 0] = _Pack2HalfFloat(s00 * inv, s01 * inv);
            cov3d[4 * i + 1] = _Pack2HalfFloat(s02 * inv, s11 * inv);
            cov3d[4 * i + 2] = _Pack2HalfFloat(s12 * inv, s22 * inv);
            _F32Scratch[0] = factor;
            cov3d[4 * i + 3] = _U32Scratch[0];

            const cb = _BytesPerSplat * i + 24;
            colorOpacity[i] = bytes[cb] | (bytes[cb + 1] << 8) | (bytes[cb + 2] << 16) | ((active ? bytes[cb + 3] : 0) << 24);
        }

        this._splatCount = count;
        this._partCount = partCount;
        this._partLocalMin = pMin;
        this._partLocalMax = pMax;
        if (this._partScratch.length !== partCount * 40) {
            this._partScratch = new Float32Array(partCount * 40);
        }
        this._renderer!.updateSplats(means, cov3d, colorOpacity, sh, this._mesh._shDegree, count);
    }

    /**
     * Packs the loader's 8-bit SH bytes into u32 words per splat.
     * @param shData packed per-splat SH textures, one per 16 scalar components, or undefined
     * @param shDegree spherical-harmonics degree (0-4)
     * @param count number of splats
     * @returns u32-packed SH bytes, or null when SH is absent
     */
    private _packSh(shData: Uint8Array[] | undefined, shDegree: number, count: number): Nullable<Uint32Array> {
        if (!shData || shData.length === 0 || shDegree < 1) {
            return null;
        }
        const stride = _GetPackedShBytesPerSplat(shDegree);
        const scalars = (shDegree === 1 ? 3 : shDegree === 2 ? 8 : shDegree === 3 ? 15 : 24) * 3;
        const bytes = new Uint8Array(count * stride);
        for (let i = 0; i < count; i++) {
            const dst = i * stride;
            for (let k = 0; k < scalars; k++) {
                const tex = shData[(k / 16) | 0];
                bytes[dst + k] = tex[i * 16 + (k % 16)];
            }
        }
        return new Uint32Array(bytes.buffer);
    }

    /** Uploads this frame's per-part world matrix, visibility and debug-plugin rows. */
    private _uploadParts(): void {
        const count = this._partCount;
        if (this._partScratch.length !== count * 40) {
            this._partScratch = new Float32Array(count * 40);
        }
        const scratch = this._partScratch;
        const compound = this._mesh.isCompound;
        // Runs before the scene evaluates world matrices, so transforms changed this frame must be forced.
        const meshWorld = this._mesh.computeWorldMatrix(true);
        if (compound) {
            this._mesh._syncPartProxyWorldMatrices();
        }
        // The classic material multiplies every splat's opacity by material.alpha.
        const alpha = this._mesh.material?.alpha ?? 1;

        const plugin = this._mesh.material?.pluginManager?.getPlugin("GaussianSplattingDebug") as Nullable<GaussianSplattingDebugMaterialPlugin>;
        const debugActive = !!plugin && plugin.isDebugActive;
        let lut: Nullable<Float32Array> = null;
        let lutStride = 0;
        if (plugin && debugActive) {
            const resolved = plugin.getResolvedPartData(count, this._scene.getEngine());
            lut = resolved.data;
            lutStride = resolved.maxPartCount;
        }
        this._renderer!.debugActive = debugActive ? 1 : 0;

        for (let i = 0; i < count; i++) {
            const worldM = (compound ? this._mesh.getWorldMatrixForPart(i) : meshWorld).m;
            const vis = compound ? this._mesh.getPartVisibility(i) : this._mesh.visibility;
            const o = i * 40;
            scratch.set(worldM, o);
            scratch[o + 16] = vis * alpha;
            scratch[o + 17] = 0;
            scratch[o + 18] = 0;
            scratch[o + 19] = 0;
            // The LUT is row-major: row r, part i at (stride*r + i)*4.
            if (lut) {
                for (let r = 0; r < 5; r++) {
                    const src = (lutStride * r + i) * 4;
                    const dst = o + 20 + r * 4;
                    scratch[dst] = lut[src];
                    scratch[dst + 1] = lut[src + 1];
                    scratch[dst + 2] = lut[src + 2];
                    scratch[dst + 3] = lut[src + 3];
                }
            } else {
                scratch[o + 20] = -1e9;
                scratch[o + 21] = -1e9;
                scratch[o + 22] = -1e9;
                scratch[o + 23] = 1e9;
                scratch[o + 24] = 1e9;
                scratch[o + 25] = 1e9;
                scratch[o + 26] = 0;
                scratch[o + 27] = 1;
                scratch[o + 28] = 0;
                scratch[o + 29] = 1e9;
                scratch[o + 30] = 1;
                scratch[o + 31] = 0;
                scratch[o + 32] = 1;
                scratch[o + 33] = 1;
                scratch[o + 34] = 1;
                scratch[o + 35] = 1;
                scratch[o + 36] = 1;
                scratch[o + 37] = 0;
                scratch[o + 38] = 0;
                scratch[o + 39] = 0;
            }
        }
        this._renderer!.setPartData(scratch, count);
    }

    /**
     * Computes the model's view-depth span from its part AABB corners.
     * @param viewM column-major view matrix
     * @param near camera near plane
     * @param far camera far plane; 0 means infinite
     * @param clampToCamera whether to clamp the interval to the standard camera near/far planes
     * @returns the model's [viewZMin, viewZMax] this frame
     */
    private _viewZSpan(viewM: ArrayLike<number>, near: number, far: number, clampToCamera = true): [number, number] {
        let vzMin = Infinity;
        let vzMax = -Infinity;
        const scratch = this._partScratch;
        for (let p = 0; p < this._partCount; p++) {
            const wb = p * 40;
            const lb = p * 3;
            const minx = this._partLocalMin[lb];
            if (!isFinite(minx)) {
                continue;
            }
            const miny = this._partLocalMin[lb + 1];
            const minz = this._partLocalMin[lb + 2];
            const maxx = this._partLocalMax[lb];
            const maxy = this._partLocalMax[lb + 1];
            const maxz = this._partLocalMax[lb + 2];
            for (let c = 0; c < 8; c++) {
                const lx = c & 1 ? maxx : minx;
                const ly = c & 2 ? maxy : miny;
                const lz = c & 4 ? maxz : minz;
                const wx = scratch[wb + 0] * lx + scratch[wb + 4] * ly + scratch[wb + 8] * lz + scratch[wb + 12];
                const wy = scratch[wb + 1] * lx + scratch[wb + 5] * ly + scratch[wb + 9] * lz + scratch[wb + 13];
                const wz = scratch[wb + 2] * lx + scratch[wb + 6] * ly + scratch[wb + 10] * lz + scratch[wb + 14];
                // View-space forward depth is positive for both handedness conventions.
                const viewZ = viewM[2] * wx + viewM[6] * wy + viewM[10] * wz + viewM[14];
                const vz = this._scene.useRightHandedSystem ? -viewZ : viewZ;
                if (vz < vzMin) {
                    vzMin = vz;
                }
                if (vz > vzMax) {
                    vzMax = vz;
                }
            }
        }
        const minClip = clampToCamera ? near : -Infinity;
        const maxClip = clampToCamera && far > 0 ? far : Infinity;
        vzMin = Math.max(minClip, vzMin);
        vzMax = Math.min(maxClip, vzMax);
        if (!isFinite(vzMin) || vzMax < vzMin) {
            // Nothing visible; any finite span works.
            this._depthSpan[0] = near;
            this._depthSpan[1] = far > near ? far : near + 1;
        } else if (vzMax === vzMin) {
            // Flat or single-splat model: widen a band around the actual depth. Collapsing to [near, ...]
            // instead would place the surface at the near plane and break the depth test and depth map.
            const epsilon = Math.max(Math.abs(vzMin) * 1e-3, 1e-4);
            this._depthSpan[0] = Math.max(minClip, vzMin - epsilon);
            this._depthSpan[1] = vzMax + epsilon;
        } else {
            this._depthSpan[0] = vzMin;
            this._depthSpan[1] = vzMax;
        }
        return this._depthSpan;
    }

    /**
     * Returns a stride coprime to `total` near the golden ratio, so `i*stride % total` is a decorrelated permutation.
     * @param total the cycle length (number of sub-cells, N*N)
     * @returns a stride coprime to total
     */
    private _coprimeStride(total: number): number {
        if (total <= 2) {
            return 1;
        }
        let s = Math.max(1, Math.round(total * 0.6180339887));
        let a = s;
        let b = total;
        while (b !== 0) {
            const remainder = a % b;
            a = b;
            b = remainder;
        }
        while (a !== 1) {
            s++;
            a = s;
            b = total;
            while (b !== 0) {
                const remainder = a % b;
                a = b;
                b = remainder;
            }
        }
        return s;
    }

    /** Per-frame point target for the `"auto"` render scale: desktop 15M, iOS 9M, other mobile 6M.
     * @returns the target emitted-point count per frame */
    private _budget(): number {
        const isMobile = !!this._scene.getEngine().hostInformation?.isMobile;
        if (!isMobile) {
            return 15_000_000;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
            return 9_000_000;
        }
        return 6_000_000;
    }

    /**
     * Reads back the point count and derives the auto render factor N from the device budget.
     * @param currentN the render factor N used for the frame being measured
     * @param generation the accumulation generation the measured frame belongs to
     * @param freeze whether the measured frame had occlusion culling active, so N may be fixed for `generation`
     */
    private _updateAutoScale(currentN: number, generation: number, freeze: boolean): void {
        if (this._budgetReadPending || !this._renderer) {
            return;
        }
        this._budgetReadPending = true;
        void this._convergeAutoScaleAsync(currentN, generation, freeze, this._autoRequestId);
    }

    private async _convergeAutoScaleAsync(currentN: number, generation: number, freeze: boolean, requestId: number): Promise<void> {
        const renderer = this._renderer;
        if (!renderer) {
            return;
        }
        try {
            const total = await renderer.readPointCountAsync();
            if (renderer !== this._renderer || !this._computeActive || requestId !== this._autoRequestId || this._renderScale !== "auto") {
                return;
            }
            if (total > 0) {
                // Points scale as N^-2.
                const fullPoints = total * currentN * currentN;
                const target = Math.max(1, Math.min(8, Math.ceil(Math.sqrt(fullPoints / this._budget()))));
                // Evaluated before the reset below, which would make every sample look stale.
                const stale = !freeze || renderer.accumulationVersion !== generation;
                const factorChanged = target !== this._autoN;
                this._autoN = target;
                if (factorChanged) {
                    // N must not change within a generation.
                    renderer.resetAccumulation();
                }
                if (stale) {
                    return;
                }
                // Re-measuring would reproduce this estimate, so at most one corrective reset happens.
                this._autoMeasuredGeneration = renderer.accumulationVersion;
            }
        } catch (error) {
            if (renderer === this._renderer && this._computeActive) {
                Logger.Error(`GaussianSplattingMesh: point-splatting budget readback failed: ${String(error)}`);
            }
        } finally {
            if (renderer === this._renderer) {
                this._budgetReadPending = false;
            }
        }
    }

    /** Returns the size of the camera's color target: the first post-process target, the camera's output
     * render target, or the backbuffer. The returned object is reused between calls.
     * @returns The color target dimensions in pixels.
     */
    private _getOutputSize(): { width: number; height: number } {
        const engine = this._scene.getEngine();
        const camera = this._scene.activeCamera;
        const postProcess = this._scene.postProcessesEnabled ? camera?._getFirstPostProcess() : null;
        const outputRenderTarget = camera?.outputRenderTarget;
        let width: number;
        let height: number;
        if (postProcess && postProcess.width > 0 && postProcess.height > 0) {
            width = postProcess.width;
            height = postProcess.height;
        } else if (outputRenderTarget) {
            width = outputRenderTarget.getRenderWidth();
            height = outputRenderTarget.getRenderHeight();
        } else {
            width = engine.getRenderWidth(true);
            height = engine.getRenderHeight(true);
        }
        this._outputSize.width = Math.max(1, width);
        this._outputSize.height = Math.max(1, height);
        return this._outputSize;
    }

    /** Runs compute immediately before a point compositor and binds the result to both blit materials. */
    private _runCompute(): void {
        this._resultReady = false;
        this._progressReady = false;
        if ((this._colorMode || this._depthMode) && this._mesh._pointStreamingUnsupported && !this._streamingWarned) {
            this._streamingWarned = true;
            Logger.Warn(
                "GaussianSplattingMesh: point splatting does not support streamed parts (their splats are GPU-decoded and never reach the retained CPU splat data); falling back to the classic renderer."
            );
        }
        if (!this._computeActive || !this._mesh.isEnabled() || !this._renderer || !_DependenciesReady || this._hasUnsupportedView()) {
            return;
        }
        if (!this._isWorkloadSupported()) {
            return;
        }
        this._syncData();
        if (this._splatCount === 0) {
            return;
        }
        const camera = this._scene.activeCamera!;
        const engine = this._scene.getEngine();
        // Render at 1/N resolution and reconstruct full resolution over N^2 jittered frames.
        const { width: fullW, height: fullH } = this._getOutputSize();
        const scaleOpt = this._renderScale;
        const upsampleN = scaleOpt === "auto" ? this._autoN : Math.max(1, Math.min(8, Math.round(1 / Math.max(scaleOpt, 1e-3))));
        const width = Math.max(1, Math.ceil(fullW / upsampleN));
        const height = Math.max(1, Math.ceil(fullH / upsampleN));
        // Driven by the renderer's frame count, which also seeds sampling, so skipped frames cannot desync them.
        const total = upsampleN * upsampleN;
        const j = ((this._renderer.renderedFrameCount % total) * this._coprimeStride(total)) % total;
        const jitterX = j % upsampleN;
        const jitterY = Math.floor(j / upsampleN);

        const view = this._scene.getViewMatrix();
        const projection = this._scene.getProjectionMatrix();
        const determinant = projection.determinant();
        if (!Number.isFinite(determinant) || determinant === 0) {
            if (!this._invalidProjectionWarned) {
                this._invalidProjectionWarned = true;
                Logger.Error("GaussianSplattingMesh: point splatting requires a finite, invertible projection matrix.");
            }
            return;
        }
        this._invalidProjectionWarned = false;
        projection.invertToRef(this._inverseProjection);
        this._vpMatrix.copyFrom(this._scene.getTransformMatrix());
        const focalX = (fullW * projection.m[0]) / (2 * upsampleN);
        const focalY = (fullH * projection.m[5]) / (2 * upsampleN);
        const camPos = camera.globalPosition;
        this._renderer.rightHandedSystem = this._scene.useRightHandedSystem;
        this._renderer.isOrthographic = Math.abs(projection.m[15] - 1) < 0.001;
        const gsMaterial = this._mesh.material as Nullable<GaussianSplattingMaterial>;
        const kernelSize = gsMaterial?.kernelSize || GaussianSplattingMaterial.KernelSize;
        const minPixelSize = gsMaterial ? gsMaterial.minPixelSize : GaussianSplattingMaterial.MinPixelSize;
        const compensation = gsMaterial?.compensation ?? GaussianSplattingMaterial.Compensation;
        const renderer = this._renderer;
        if (renderer.kernelSize !== kernelSize || renderer.minPixelSize !== minPixelSize || renderer.compensation !== compensation) {
            renderer.kernelSize = kernelSize;
            renderer.minPixelSize = minPixelSize;
            renderer.compensation = compensation;
            renderer.resetAccumulation();
        }

        this._uploadParts();
        const farZ = camera.ignoreCameraMaxZ ? 0 : camera.maxZ;
        const [vzMin, vzMax] = this._viewZSpan(view.m, camera.minZ, farZ, !_HasGaussianPointSplattingProjectedDepth(projection));
        this._renderer.setCamera(view, this._vpMatrix, camera.minZ, farZ, focalX, focalY, camPos.x, camPos.y, camPos.z, vzMin, vzMax);
        this._renderer.setProjectionMatrix(projection, this._inverseProjection, engine.useReverseDepthBuffer);
        if (!this._renderer.renderToBuffer(width, height, fullW, fullH, upsampleN, jitterX, jitterY)) {
            return;
        }
        this._resultReady = true;
        this._progressReady = true;
        this._computedWidth = fullW;
        this._computedHeight = fullH;
        // Snapshot now: a later reset would pair a new generation with the old cycle length.
        this._progressFrameCount = this._renderer.renderedFrameCount;
        this._progressGeneration = this._renderer.accumulationVersion;
        this._progressCycleLength = this._renderer.pixelCycleLength;

        const generation = this._renderer.accumulationVersion;
        const wasMoving = generation !== this._lastRenderedGeneration;
        this._lastRenderedGeneration = generation;
        if (scaleOpt === "auto" && this._autoMeasuredGeneration !== generation) {
            this._updateAutoScale(upsampleN, generation, !wasMoving);
        }

        const accum = this._renderer.accumBuffer;
        const accumDepth = this._renderer.accumDepthBuffer;
        if (accum && accumDepth) {
            if (this._colorMode && this._blit) {
                this._blit.setAccumBuffer(accum);
                this._blit.setAccumDepthBuffer(accumDepth);
                this._blit.setResolution(this._renderer.outputWidth, this._renderer.outputHeight);
                this._blit.setInverseProjection(this._inverseProjection);
                // Match the classic material's log depth so the composite depth-tests like the classic path.
                this._blit.setLogarithmicDepthConstant(gsMaterial?.useLogarithmicDepth ? 2.0 / (Math.log(camera.maxZ + 1.0) / Math.LN2) : 0);
            }
            if (this._depthMode && this._depthBlit) {
                this._depthBlit.setAccumBuffer(accum);
                this._depthBlit.setAccumDepthBuffer(accumDepth);
                this._depthBlit.setResolution(this._renderer.outputWidth, this._renderer.outputHeight);
                this._depthBlit.setInverseProjection(this._inverseProjection);
                // Same normalization as GaussianSplattingMaterial._BindEffectUniforms.
                let minZ: number, maxZ: number;
                if (camera.mode === Constants.ORTHOGRAPHIC_CAMERA) {
                    minZ = !engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                    maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                } else {
                    minZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? camera.minZ : engine.isNDCHalfZRange ? 0 : camera.minZ;
                    maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : camera.maxZ;
                }
                this._depthBlit.setDepthValues(minZ, minZ + maxZ);
                this._depthBlit.setReverseDepth(engine.useReverseDepthBuffer);
            }
        }
    }

    /**
     * True when the frame renders a view the point path cannot reproduce: several active cameras, rig
     * cameras (stereo, XR, multiview), or scene/material clip planes.
     * The classic path renders those instead.
     * @returns whether point splatting must fall back to the classic path this frame
     */
    private _hasUnsupportedView(): boolean {
        const scene = this._scene;
        const camera = scene.activeCamera;
        if (!camera) {
            return true;
        }
        const material = this._mesh.material;
        return (
            (scene.activeCameras?.length ?? 0) > 1 ||
            camera._rigCameras.length > 0 ||
            !!(material?.clipPlane || material?.clipPlane2 || material?.clipPlane3 || material?.clipPlane4 || material?.clipPlane5 || material?.clipPlane6) ||
            !!(scene.clipPlane || scene.clipPlane2 || scene.clipPlane3 || scene.clipPlane4 || scene.clipPlane5 || scene.clipPlane6)
        );
    }

    /**
     * True only for the camera's main forward color pass.
     * @returns whether the current render pass is the camera's main forward color pass
     */
    private _isMainColorPass(): boolean {
        const engine = this._scene.getEngine();
        const cam = this._scene.activeCamera;
        const mainId = cam?.outputRenderTarget?.renderPassId ?? cam?.renderPassId ?? Constants.RENDERPASS_MAIN;
        return engine.currentRenderPassId === mainId && !this._mesh.getMaterialForRenderPass(engine.currentRenderPassId);
    }

    /**
     * True only while rendering the active camera's scene depth renderer; other depth passes use the classic path.
     * @returns whether the current render pass is the active camera's depth renderer pass
     */
    private _isDepthPass(): boolean {
        const depthRenderers = this._scene._depthRenderer;
        const camera = this._scene.activeCamera;
        if (!depthRenderers || !camera) {
            return false;
        }
        const renderer = depthRenderers[camera.uniqueId];
        if (!renderer || !renderer.enabled) {
            return false;
        }
        return renderer.getDepthMap().renderPassIds.indexOf(this._scene.getEngine().currentRenderPassId) !== -1;
    }

    /** {@inheritDoc IGaussianPointSplattingController.dispose} */
    public dispose(): void {
        if (this._computeObserver) {
            this._scene.onBeforeRenderObservable.remove(this._computeObserver);
            this._computeObserver = null;
        }
        this._renderer?.dispose();
        this._blit?.dispose();
        this._blitMesh?.dispose();
        this._depthBlit?.dispose();
        this._depthBlitMesh?.dispose();
        this._renderer = null;
        this._resultReady = false;
        this._progressReady = false;
        this._budgetReadPending = false;
        this._blit = null;
        this._blitMesh = null;
        this._depthBlit = null;
        this._depthBlitMesh = null;
        this._colorMode = false;
        this._depthMode = false;
    }
    /** {@inheritDoc IGaussianPointSplattingController.renderScale} */
    public get renderScale(): number | "auto" {
        return this._renderScale;
    }

    public set renderScale(value: number | "auto") {
        if (value === this._renderScale) {
            return;
        }
        this._renderScale = value;
        this._autoRequestId++;
        this._autoMeasuredGeneration = -1;
        this._renderer?.resetAccumulation();
    }

    /** {@inheritDoc IGaussianPointSplattingController.invalidateDecodedSplats} */
    public invalidateDecodedSplats(): void {
        this._decodedSplatsData = null;
        this._renderer?.resetAccumulation();
    }

    /**
     * Composites supported camera color or depth passes from the point-splatting result.
     * The pass waits without drawing classic splats while compute or compositor shaders are compiling.
     * @param enableAlphaMode whether the color compositor should enable alpha blending
     * @returns whether the point path handled the current pass, including waiting for shader readiness
     */
    public drawColorPass(enableAlphaMode: boolean): boolean {
        const solidColor = this._mesh.material?.pluginManager?.getPlugin("GaussianSplatSolidColor") as Nullable<GaussianSplattingSolidColorMaterialPlugin>;
        const colorPass = this._colorMode && !solidColor?.isEnabled && this._isMainColorPass();
        const depthPass = this._depthMode && this._isDepthPass();
        if ((!colorPass && !depthPass) || this._hasUnsupportedView()) {
            return false;
        }
        if (!this._computeActive) {
            this._runCompute();
            return false;
        }
        if (this._renderer && !this._isWorkloadSupported()) {
            return false;
        }
        const { width, height } = this._getOutputSize();
        // Compute only after the pass has established its actual matrices. Matching color/depth passes share it.
        if (!this._resultReady || !this._vpMatrix.equalsWithEpsilon(this._scene.getTransformMatrix(), 1e-5) || this._computedWidth !== width || this._computedHeight !== height) {
            this._runCompute();
        }
        if (!this._resultReady) {
            return true;
        }
        if (colorPass && this._blitMesh && this._blitMesh.subMeshes.length > 0 && this._blit?.isReady(this._blitMesh, false, this._blitMesh.subMeshes[0])) {
            const blitMesh = this._blitMesh;
            // Render in replacement mode so the disabled compositor still draws itself.
            blitMesh.render(blitMesh.subMeshes[0], enableAlphaMode, blitMesh);
            return true;
        }
        if (depthPass && this._depthBlitMesh) {
            const depthBlitMesh = this._depthBlitMesh;
            if (depthBlitMesh.subMeshes.length > 0 && this._depthBlit?.isReady(depthBlitMesh, false, depthBlitMesh.subMeshes[0])) {
                // The depth renderer may have left alpha blending on.
                this._scene.getEngine().setAlphaMode(Constants.ALPHA_DISABLE);
                depthBlitMesh.render(depthBlitMesh.subMeshes[0], false, depthBlitMesh);
                return true;
            }
        }
        return true;
    }
}

let _Registered = false;

/**
 * Enables the point-splatting properties of {@link GaussianSplattingMesh}. Idempotent.
 */
export function RegisterGaussianPointSplattingController(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;
    _SetGaussianPointSplattingControllerFactory((mesh) => new GaussianPointSplattingController(mesh));
}
