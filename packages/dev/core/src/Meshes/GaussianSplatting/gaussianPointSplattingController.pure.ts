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
import { GaussianPointSplattingRenderer } from "./gaussianPointSplattingRenderer.pure";
import { GaussianPointSplattingBlitMaterial } from "core/Materials/GaussianSplatting/gaussianPointSplattingBlitMaterial.pure";
import { GaussianPointSplattingDepthBlitMaterial } from "core/Materials/GaussianSplatting/gaussianPointSplattingDepthBlitMaterial.pure";
import { type GaussianSplattingDebugMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin.pure";
import { RegisterEnginesWebGPUExtensionsEngineComputeShader } from "core/Engines/WebGPU/Extensions/engine.computeShader.pure";
import {
    _SetGaussianPointSplattingControllerFactory,
    type GaussianSplattingMesh,
    type IGaussianPointSplattingController,
    type IGaussianPointSplattingProgress,
} from "./gaussianSplattingMesh.pure";

const _BytesPerSplat = 32;

// Point splatting needs its WGSL shaders in the shader store before its first dispatch. They are loaded on
// demand so the pure module stays side-effect free; the side-effect wrapper imports them eagerly.
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

// Scratch for bit-casting a float to its u32 bits (the point renderer's per-splat covariance factor).
const _F32Scratch = /*#__PURE__*/ new Float32Array(1);
const _U32Scratch = /*#__PURE__*/ new Uint32Array(_F32Scratch.buffer);

/**
 * Packs two floats as half-floats into one u32 (low 16 bits = a, high 16 bits = b), for the point
 * renderer's f16 covariance storage.
 * @param a value for the low 16 bits
 * @param b value for the high 16 bits
 * @returns the packed u32
 */
function _Pack2HalfFloat(a: number, b: number): number {
    return (ToHalfFloat(a) | (ToHalfFloat(b) << 16)) >>> 0;
}

/**
 * Owns the entire WebGPU compute point-splatting ("GPS") render path for one {@link GaussianSplattingMesh}:
 * the compute renderer, the CPU splat decode that feeds it, the per-frame dispatch, the budget-driven auto
 * render scale, and the internal compositor meshes that blit the resolved color/depth back into the scene.
 *
 * This lives outside `gaussianSplattingMesh.pure.ts` on purpose. Point splatting is an opt-in, WebGPU-only
 * extension of the classic rasterized path, and the mesh must stay usable without it: a bundle that only
 * imports {@link GaussianSplattingMesh} must not pull in this controller, the compute renderer, the two blit
 * materials, or the eight GPS compute shaders. The mesh therefore never imports this module; it reaches the
 * controller through a factory registered by {@link RegisterGaussianPointSplattingController}. Import the
 * `gaussianPointSplattingController.ts` side-effect wrapper (directly or via `@babylonjs/core`), or call that
 * function from pure code, to turn the mesh's point-splatting properties from no-ops into a working path.
 */
export class GaussianPointSplattingController implements IGaussianPointSplattingController {
    private readonly _mesh: GaussianSplattingMesh;
    private readonly _scene: Scene;

    /**
     * Creates a point-splatting controller bound to a Gaussian Splatting mesh. Created lazily by the mesh
     * the first time one of its point-splatting modes is enabled; nothing is allocated on the GPU until
     * {@link colorRenderMode} or {@link depthRenderMode} is turned on.
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
    // Budget-driven auto scale state. The factor N is measured once per accumulation generation, from its
    // second frame, then frozen for the rest of it so a converged image is never a blend of two render scales.
    // The reset frame is skipped because Hi-Z occlusion culling (when enabled) is off on it, so it over-counts.
    // `_autoMeasuredGeneration` is the generation N is already fixed for (-1 = none); `_lastRenderedGeneration`
    // is the previous frame's generation, used to spot the reset frame. `_autoRequestId` invalidates in-flight
    // readbacks when `renderScale` changes.
    private _autoN = 2;
    private _autoMeasuredGeneration = -1;
    private _lastRenderedGeneration = -1;
    private _autoRequestId = 0;
    private _budgetReadPending = false;
    private _resultReady = false;
    // Counters of the most recent successful compute dispatch, surfaced by `progress`. Kept as separate
    // fields (rather than an object rebuilt every frame) to avoid a per-frame allocation.
    private _progressFrameCount = 0;
    private _progressGeneration = -1;
    private _progressCycleLength = 0;
    // Set once the streaming-unsupported warning has been emitted, so it is not repeated every frame.
    private _streamingWarned = false;
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
    private readonly _depthSpan: [number, number] = [0, 0];

    /** @inheritdoc */
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

    /** @inheritdoc */
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

    /** @inheritdoc */
    public get progress(): Nullable<IGaussianPointSplattingProgress> {
        if (!this._computeActive || !this._resultReady || !this._renderer) {
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

    /** @inheritdoc */
    public get pointScale(): number {
        return this._scale;
    }
    public set pointScale(value: number) {
        this._scale = value;
        if (this._renderer) {
            this._renderer.pointScale = value;
            this._renderer.resetAccumulation();
        }
    }

    /** Lazily builds the compute renderer, hooks the per-frame compute, and decodes the current splat
     * data. Shared by the color and depth point-splatting modes (one compute produces both buffers), so
     * it is idempotent and called from both setters. */
    private _ensureCompute(): void {
        const engine = this._scene.getEngine();
        _LoadDependencies();
        if (!this._renderer) {
            // ComputeShader creates its compute context on construction, so the engine extension goes first.
            RegisterEnginesWebGPUExtensionsEngineComputeShader();
            this._renderer = new GaussianPointSplattingRenderer(engine);
            this._renderer.pointScale = this._scale;
        }
        this._decodedSplatsData = null; // force a decode
        this._syncData();
        if (!this._computeObserver) {
            this._computeObserver = this._scene.onBeforeRenderObservable.add(() => this._runCompute());
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
        this._budgetReadPending = false;
        this._autoN = 2;
        this._autoMeasuredGeneration = -1;
        this._lastRenderedGeneration = -1;
    }

    /** Builds the internal fullscreen compositor mesh used by a blit pass. It is an internal fullscreen
     * triangle rendered manually from this mesh's own passes (see _drawColorPass), and is kept DISABLED
     * so the scene never selects it as an active mesh — otherwise its raw clip-space geometry would leak
     * into every geometry pass (depth renderer, IBL G-buffer) as a giant triangle.
     * @param name the compositor mesh name
     * @param material the blit material to render it with
     * @returns the created compositor mesh
     */
    private _createBlitMesh(name: string, material: Material): Mesh {
        const blitMesh = new Mesh(name, this._scene);
        const vd = new VertexData();
        // Fullscreen clip-space triangle; the blit vertex shader passes it through unchanged.
        vd.positions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
        vd.indices = [0, 1, 2];
        vd.applyToMesh(blitMesh);
        blitMesh.material = material;
        blitMesh.doNotSerialize = true;
        blitMesh.isPickable = false;
        blitMesh.doNotSyncBoundingInfo = true;
        // Disabled: rendered only via _drawColorPass, never selected by the scene (no depth/GBR leak).
        blitMesh.setEnabled(false);
        blitMesh.reservedDataStore = { hidden: true };
        blitMesh.computeWorldMatrix(true);
        return blitMesh;
    }

    /** Lazily builds the color blit material + compositor mesh (main color pass only). */
    private _enableColorBlit(): void {
        if (!this._blit) {
            this._blit = new GaussianPointSplattingBlitMaterial(this._mesh.name + "_blit", this._scene);
        }
        if (!this._blitMesh) {
            this._blitMesh = this._createBlitMesh(this._mesh.name + "_blitMesh", this._blit);
        }
    }

    /** Lazily builds the depth blit material + compositor mesh (DepthRenderer pass only). */
    private _enableDepthBlit(): void {
        if (!this._depthBlit) {
            this._depthBlit = new GaussianPointSplattingDepthBlitMaterial(this._mesh.name + "_depthBlit", this._scene);
        }
        if (!this._depthBlitMesh) {
            this._depthBlitMesh = this._createBlitMesh(this._mesh.name + "_depthBlitMesh", this._depthBlit);
        }
    }

    /** Re-decodes the compute buffers from this mesh's retained splat data when it changed (part
     * add/remove, a reload or in-place update, or an SH degree change). A no-op when nothing changed, so it
     * is safe to call every frame. */
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
     * Decodes raw `.splat` bytes into the compute renderer's per-Gaussian buffers, in LOCAL space (the
     * per-part world transform is applied per frame in the shader). Mirrors the classic `_makeSplat`
     * decode exactly, including the `* 2` on the scale, so both paths produce the same Sigma and the
     * same `splatSizeRange` units. The classic rasterizer cancels that doubling at render time through
     * the quad's `invViewport`; this path has no quad, so `gpsPreprocess` cancels it on the projected
     * cov2d instead. Part index is carried in means.w.
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
        // 4 u32/Gaussian: 3 f16 pairs of (Sigma / factor) + the f32 factor (see the covariance write).
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

            // Local 3D covariance Sigma = (R*S)(R*S)^T, 6 unique components. Store as f16 normalized by
            // a per-splat factor = max|component| so f16 keeps full precision at any splat scale (the
            // shader rescales by the factor). Matches the classic covA/covB + center.w scheme.
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
     * Repacks the loader's 8-bit SH bytes tightly into u32 words (4 bytes/word, GPS_SH_WORDS per splat),
     * keeping the classic's 8-bit quantization — the shader dequantizes (b*2/255 - 1) on read. This
     * matches the classic's VRAM footprint instead of expanding to f32. Null when SH is absent.
     * @param shData packed per-splat SH textures, one per 16 scalar components, or undefined
     * @param shDegree spherical-harmonics degree (0-4)
     * @param count number of splats
     * @returns u32-packed SH bytes, or null when SH is absent
     */
    private _packSh(shData: Uint8Array[] | undefined, shDegree: number, count: number): Nullable<Uint32Array> {
        if (!shData || shData.length === 0 || shDegree < 1) {
            return null;
        }
        const shDim = shDegree === 1 ? 3 : shDegree === 2 ? 8 : shDegree === 3 ? 15 : 24;
        const scalars = shDim * 3;
        const words = Math.ceil(scalars / 4);
        // Zero-padded so each splat occupies exactly `words` u32; the padding bytes are never read.
        const bytes = new Uint8Array(count * words * 4);
        for (let i = 0; i < count; i++) {
            const dst = i * words * 4;
            for (let k = 0; k < scalars; k++) {
                const tex = shData[(k / 16) | 0];
                bytes[dst + k] = tex[i * 16 + (k % 16)];
            }
        }
        return new Uint32Array(bytes.buffer);
    }

    /** Packs this frame's live per-part records (world matrix + visibility + debug-LUT rows) and uploads
     * them to the renderer, mirroring the classic `partWorld` / `partVisibility` and the debugger's
     * `dbgPartData`. Debug knobs are read live from the shared GaussianSplattingDebugMaterialPlugin (the
     * same one the classic renderer and the viewer already drive), so point mode honors them identically. */
    private _uploadParts(): void {
        const count = this._partCount;
        if (this._partScratch.length !== count * 40) {
            this._partScratch = new Float32Array(count * 40);
        }
        const scratch = this._partScratch;
        const compound = this._mesh.isCompound;
        if (compound) {
            this._mesh._syncPartProxyWorldMatrices();
        }
        // The classic material multiplies every splat's opacity by material.alpha.
        const alpha = this._mesh.material?.alpha ?? 1;

        // Resolve debug state from the shared debug plugin on this mesh's material (if attached & active).
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
            const worldM = (compound ? this._mesh.getWorldMatrixForPart(i) : this._mesh.getWorldMatrix()).m;
            const vis = compound ? this._mesh.getPartVisibility(i) : this._mesh.visibility;
            const o = i * 40;
            scratch.set(worldM, o);
            scratch[o + 16] = vis * alpha;
            scratch[o + 17] = 0;
            scratch[o + 18] = 0;
            scratch[o + 19] = 0;
            // Debug rows 0..4 (o+20 .. o+39). LUT is row-major (row r, part i at (stride*r + i)*4).
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
                // Pass-through defaults: no clip, no cull, opacityScale 1, no saturate, SH weights all 1.
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
     * Computes the model's VIEW-SPACE depth extent this frame (each part's local AABB transformed by its
     * live part matrix, then by the view matrix), clamped to the camera's [near, far]. The depth key is
     * normalized linearly over this range — robust when the camera is inside/close to the model, unlike
     * projecting to NDC-z (which drops the near extent because corners behind the camera can't be
     * projected). The extreme view-z of an oriented AABB is always at a corner, so 8 corners suffice.
     * @param viewM column-major view matrix (Matrix.m); row 2 (m[2],m[6],m[10],m[14]) gives view-space z
     * @param near camera near plane
     * @param far camera far plane; 0 means infinite
     * @returns the model's [viewZMin, viewZMax] this frame, clamped to [near, far]
     */
    private _viewZSpan(viewM: ArrayLike<number>, near: number, far: number): [number, number] {
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
        // Clamp to the visible frustum: when the camera is inside the model the nearest corner sits behind
        // the near plane, so the nearest visible splats start at `near`.
        vzMin = Math.max(near, vzMin);
        vzMax = Math.min(far > 0 ? far : Infinity, vzMax);
        if (!(vzMax > vzMin)) {
            // Nothing visible; any finite span works.
            this._depthSpan[0] = near;
            this._depthSpan[1] = far > near ? far : near + 1;
        } else {
            this._depthSpan[0] = vzMin;
            this._depthSpan[1] = vzMax;
        }
        return this._depthSpan;
    }

    /**
     * A stride coprime to `total` near the golden ratio, so `i*stride % total` is a complete but decorrelated
     * (blue-noise-ish) permutation of [0,total) — used to order the jitter sub-cell visits so partial frames
     * are spread out rather than swept in raster order.
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

    /** Device-tiered per-frame point target for the `"auto"` render scale: desktop 15M, iOS 9M, other
     * mobile 6M. A fixed device-class heuristic (not derived from actual VRAM/GPU).
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
     * Kicks an async readback of the current point count and derives the auto render factor N so the
     * per-frame emitted points approach the device budget (scale = sqrt(budget / fullResPoints)).
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
                // Points scale as N^-2, so the full-res estimate is measured * N^2. One sample suffices: the
                // relative Poisson noise over millions of points is negligible. N is capped at 8, so this is a
                // best-effort target rather than a hard point-count cap.
                const fullPoints = total * currentN * currentN;
                const target = Math.max(1, Math.min(8, Math.ceil(Math.sqrt(fullPoints / this._budget()))));
                // The sample is stale when it came from the reset frame or when accumulation moved on
                // mid-readback. Evaluate it before the reset below, which would
                // otherwise make every sample look stale.
                const stale = !freeze || renderer.accumulationVersion !== generation;
                const factorChanged = target !== this._autoN;
                this._autoN = target;
                if (factorChanged) {
                    // Frames so far used the previous factor; restart so the converged image comes from
                    // `target` alone rather than a mix of two render scales. `pixelCycleLength` must never
                    // change inside a generation, so this reset is required for a stale sample too.
                    renderer.resetAccumulation();
                }
                if (stale) {
                    // Keep the factor as a hint for the next frame, but leave the generation unmeasured so the
                    // image that settles is always sized from a non-reset frame of its own generation.
                    return;
                }
                // Mark the now-current generation (the reset above created a new one) measured: re-measuring
                // would only reproduce this estimate. Bounds the whole procedure to one corrective reset.
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

    /** Returns the size of the camera's color target. Compute runs before the first post-process
     * target is bound, so engine.getRenderWidth() alone would use the full backbuffer even when
     * the camera is rendering into a lower-resolution post-process target.
     * @returns The color target dimensions in pixels.
     */
    private _getOutputSize(): { width: number; height: number } {
        const engine = this._scene.getEngine();
        const postProcess = this._scene.postProcessesEnabled ? this._scene.activeCamera?._getFirstPostProcess() : null;
        return {
            width: postProcess && postProcess.width > 0 ? postProcess.width : engine.getRenderWidth(true),
            height: postProcess && postProcess.height > 0 ? postProcess.height : engine.getRenderHeight(true),
        };
    }

    /** Runs the compute pipeline before the render pass (compute cannot run inside an active pass) and
     * binds the resolved buffers to the blit material for the color pass. */
    private _runCompute(): void {
        this._resultReady = false;
        if ((this._colorMode || this._depthMode) && this._mesh._pointStreamingUnsupported && !this._streamingWarned) {
            this._streamingWarned = true;
            Logger.Warn(
                "GaussianSplattingMesh: point splatting does not support streamed parts (their splats are GPU-decoded and never reach the retained CPU splat data); falling back to the classic renderer."
            );
        }
        if (!this._computeActive || !this._mesh.isEnabled() || !this._renderer || !_DependenciesReady || this._hasUnsupportedView()) {
            return;
        }
        this._syncData();
        if (this._splatCount === 0) {
            return;
        }
        const camera = this._scene.activeCamera!;
        const engine = this._scene.getEngine();
        // Render the point pipeline at a reduced internal resolution (integer factor N = round(1/scale)):
        // fewer pixels shrink each splat's footprint (~1/N^2 emitted points), the unbiased cost lever. Full
        // resolution is reconstructed over N^2 frames by jittering the low-res grid across the full-res
        // sub-cells and accumulating per full-res pixel (temporal upsampling). The low-res grid covers
        // ceil(full / N) cells of N output pixels, so focalX/Y are the full-res focal lengths divided by N.
        const { width: fullW, height: fullH } = this._getOutputSize();
        const scaleOpt = this._renderScale;
        const upsampleN = scaleOpt === "auto" ? this._autoN : Math.max(1, Math.min(8, Math.round(1 / Math.max(scaleOpt, 1e-3))));
        const width = Math.max(1, Math.ceil(fullW / upsampleN));
        const height = Math.max(1, Math.ceil(fullH / upsampleN));
        // This frame's sub-cell offset in [0,N)^2, cycled so N^2 frames cover every full-res pixel. A
        // coprime-stride permutation decorrelates the visit order (blue-noise-ish) vs a raster sweep. Driven
        // by the renderer's dispatched-frame count, which also seeds the sampling, so skipped frames cannot
        // desynchronize the two.
        const total = upsampleN * upsampleN;
        const j = ((this._renderer.renderedFrameCount % total) * this._coprimeStride(total)) % total;
        const jitterX = j % upsampleN;
        const jitterY = Math.floor(j / upsampleN);

        const view = camera.getViewMatrix();
        const projection = camera.getProjectionMatrix();
        view.multiplyToRef(projection, this._vpMatrix);
        const focalX = (fullW * projection.m[0]) / (2 * upsampleN);
        const focalY = (fullH * projection.m[5]) / (2 * upsampleN);
        const camPos = camera.globalPosition;
        this._renderer.rightHandedSystem = this._scene.useRightHandedSystem;
        // Orthographic when projection[3][3] == 1 (matches the classic shader's isOrtho test).
        this._renderer.isOrthographic = Math.abs(projection.m[15] - 1) < 0.001;
        // Antialiasing kernel, compensation and minimum size follow the source material, as in the classic path.
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
        const [vzMin, vzMax] = this._viewZSpan(view.m, camera.minZ, camera.maxZ);
        this._renderer.setCamera(view, this._vpMatrix, camera.minZ, camera.maxZ, focalX, focalY, camPos.x, camPos.y, camPos.z, vzMin, vzMax);
        // Projection z-row (column-major m[10],m[11],m[14],m[15]) so resolve reconstructs ndc.z from the
        // view-z key for fragDepth — it encodes the reverse-Z / half-Z convention automatically.
        this._renderer.setProjectionZ(projection.m[10], projection.m[11], projection.m[14], projection.m[15]);
        if (!this._renderer.renderToBuffer(width, height, fullW, fullH, upsampleN, jitterX, jitterY)) {
            return;
        }
        this._resultReady = true;
        // Snapshot the counters of this successful dispatch: `pointSplattingProgress` must describe the frame
        // that was actually rendered, not renderer state that a later accumulation reset has already moved on
        // from (which would pair a brand-new generation with the previous generation's cycle length).
        this._progressFrameCount = this._renderer.renderedFrameCount;
        this._progressGeneration = this._renderer.accumulationVersion;
        this._progressCycleLength = this._renderer.pixelCycleLength;

        // The reset frame's sample is only a hint for the next frame (see `_autoN`); a single later
        // measurement fixes N for the whole generation.
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
            }
            if (this._depthMode && this._depthBlit) {
                this._depthBlit.setAccumBuffer(accum);
                this._depthBlit.setAccumDepthBuffer(accumDepth);
                this._depthBlit.setResolution(this._renderer.outputWidth, this._renderer.outputHeight);
                // Same projection z-row the resolve used, so the blit inverts accumDepth back to clip-space z.
                this._depthBlit.setProjectionZ(projection.m[10], projection.m[11], projection.m[14], projection.m[15]);
                // (minZ, minZ + maxZ) normalization, computed exactly as the classic Gaussian Splatting depth
                // material does (GaussianSplattingMaterial._BindEffectUniforms), so both paths emit the same metric.
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
     * cameras (stereo, XR, multiview), or scene clip planes. The classic path renders those instead.
     * @returns whether point splatting must fall back to the classic path this frame
     */
    private _hasUnsupportedView(): boolean {
        const scene = this._scene;
        const camera = scene.activeCamera;
        return (
            !camera ||
            (scene.activeCameras?.length ?? 0) > 1 ||
            camera._rigCameras.length > 0 ||
            !!(scene.clipPlane || scene.clipPlane2 || scene.clipPlane3 || scene.clipPlane4 || scene.clipPlane5 || scene.clipPlane6)
        );
    }

    /**
     * True only for the main forward color pass (not depth/picking RTTs, which carry a render-pass
     * material override, nor IBL voxelization, which uses its own renderList).
     * @returns whether the current render pass is the camera's main forward color pass
     */
    private _isMainColorPass(): boolean {
        const engine = this._scene.getEngine();
        const cam = this._scene.activeCamera;
        const mainId = cam?.outputRenderTarget?.renderPassId ?? cam?.renderPassId ?? Constants.RENDERPASS_MAIN;
        return engine.currentRenderPassId === mainId && !this._mesh.getMaterialForRenderPass(engine.currentRenderPassId);
    }

    /**
     * True only while rendering into an enabled DepthRenderer owned by the ACTIVE camera. The compute's
     * accumDepth is only valid for the active camera, so depth renderers attached to any other camera (and
     * DepthRenderers constructed directly, which are not registered in scene._depthRenderer) fall back to
     * the classic rasterized depth.
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

    /** @inheritdoc */
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
        this._budgetReadPending = false;
        this._blit = null;
        this._blitMesh = null;
        this._depthBlit = null;
        this._depthBlitMesh = null;
        this._colorMode = false;
        this._depthMode = false;
    }
    /** @inheritdoc */
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

    /** @inheritdoc */
    public invalidateDecodedSplats(): void {
        this._decodedSplatsData = null;
        this._renderer?.resetAccumulation();
    }

    /** @inheritdoc */
    public drawColorPass(enableAlphaMode: boolean): boolean {
        // In point mode, the internal compositor draws the camera-view color for the main color pass
        // only; the classic quads are skipped. Every other pass (GPU picking, prepass, IBL voxelization —
        // identified by a render-pass material override or a non-main render pass id) still rasterizes the
        // classic geometry, so shadows are unaffected. The compositor is rendered here (not as an active
        // scene mesh) so its geometry never leaks into those passes; its effect is prepared explicitly
        // because the scene's active-mesh flow never touches it.
        if (
            this._colorMode &&
            this._resultReady &&
            this._blitMesh &&
            this._blitMesh.subMeshes.length > 0 &&
            this._blit?.isReady(this._blitMesh, false, this._blitMesh.subMeshes[0]) &&
            this._isMainColorPass()
        ) {
            const blitMesh = this._blitMesh;
            // Render in replacement mode so the disabled compositor still draws itself.
            blitMesh.render(blitMesh.subMeshes[0], enableAlphaMode, blitMesh);
            return true;
        }
        // Independently of the color mode, the depth compositor writes the resolved point-splat depth into
        // the active camera's depth map. Until its effect compiles we fall through to the classic depth
        // rasterization rather than leaving a hole in the map.
        if (this._depthMode && this._resultReady && this._depthBlitMesh && this._isDepthPass()) {
            const depthBlitMesh = this._depthBlitMesh;
            if (depthBlitMesh.subMeshes.length > 0 && this._depthBlit?.isReady(depthBlitMesh, false, depthBlitMesh.subMeshes[0])) {
                // The depth renderer may have left ALPHA_COMBINE set (alphaBlendedDepth); the point-splat
                // depth is a single resolved opaque surface, so blending must be off.
                this._scene.getEngine().setAlphaMode(Constants.ALPHA_DISABLE);
                depthBlitMesh.render(depthBlitMesh.subMeshes[0], false, depthBlitMesh);
                return true;
            }
        }
        return false;
    }
}

let _Registered = false;

/**
 * Registers the point-splatting controller factory on {@link GaussianSplattingMesh}, turning its
 * point-splatting properties from warn-and-ignore no-ops into the working WebGPU compute path. The WebGPU
 * compute extension and shaders are loaded on first use. Idempotent.
 */
export function RegisterGaussianPointSplattingController(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;
    _SetGaussianPointSplattingControllerFactory((mesh) => new GaussianPointSplattingController(mesh));
}
