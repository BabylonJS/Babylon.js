import { MultiRenderTarget } from "core/Materials/Textures/multiRenderTarget";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { Color4 } from "core/Maths/math.color";
import { Vector3, Vector4 } from "core/Maths/math.vector";
import { type Texture } from "core/Materials/Textures/texture";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { type ISogTexturePack } from "./splatDefs";
import {
    GaussianSplattingWorkBufferVertexShaderGLSL,
    GaussianSplattingWorkBufferFragmentShaderGLSL,
    GaussianSplattingWorkBufferVertexShaderWGSL,
    GaussianSplattingWorkBufferFragmentShaderWGSL,
    GaussianSplattingWorkBufferRelayoutFragmentShaderGLSL,
    GaussianSplattingWorkBufferRelayoutFragmentShaderWGSL,
    GaussianSplattingWorkBufferRelayoutShaderName,
} from "./gaussianSplattingWorkBufferShaders";
import { RawTexture } from "core/Materials/Textures/rawTexture";

/**
 * A unified, GPU-decoded Gaussian Splatting work buffer.
 *
 * Holds a square MRT texture set (centers / covA / covB / colors) sized to a fixed splat capacity
 * (PlayCanvas-style: `ceil(sqrt(capacity))`). Each streamed SOG file is decoded directly on the GPU
 * (no CPU readback) into its allocated pixel range. The decoded textures are consumed unchanged by the
 * standard (non-SOG) Gaussian Splatting draw path.
 *
 * @experimental
 */
export class GaussianSplattingWorkBuffer {
    private readonly _scene: Scene;
    // Not readonly: a hosted work buffer is rebound to the compound's NEW atlas MRT after a grow (see rebindAtlas).
    private _mrt: MultiRenderTarget;
    private readonly _textureSize: number;
    private readonly _shaderLanguage: ShaderLanguage;
    private readonly _material: ShaderMaterial;
    private readonly _quad: Mesh;
    // When true this work buffer owns (and disposes) its MRT. False when it wraps an external atlas (a compound
    // mesh's MRT) it must not dispose. In the external case the MRT is wide (dstWidth x atlasHeight), decodes are
    // offset by _baseOffset (the reserved region's first splat), and _textureSize is the atlas WIDTH.
    private readonly _ownsMrt: boolean;
    private readonly _baseOffset: number;
    // Splat count this work buffer addresses. Standalone: the whole (square) buffer. Hosted: the reserved
    // region's (row-aligned) capacity — used to scope a relayout to the region's atlas rows.
    private readonly _capacity: number;
    // Relayout (defrag) copy material, created lazily on first relayout.
    private _copyMaterial: Nullable<ShaderMaterial> = null;
    // Reusable destination->source index map for the relayout pass (created lazily, sized to the work buffer).
    private _relayoutMapData: Nullable<Float32Array> = null;
    private _relayoutMapTexture: Nullable<RawTexture> = null;
    // Transient backup of a hosted region's four textures, held between backupRegion() and restoreRegion() so the
    // GPU-decoded data survives the compound recreating its atlas on a grow (adding a part / a second stream).
    private _backupMrt: Nullable<MultiRenderTarget> = null;
    private _disposed = false;
    // Reused WebGL framebuffer for the async centers readback (created lazily, freed in dispose).
    private _readFbo: Nullable<WebGLFramebuffer> = null;

    /**
     * True when the engine supports the non-blocking GPU readback used by {@link readCentersRangeAsync}:
     * WebGL2 (PBO + fence) or WebGPU (copyTextureToBuffer + mapAsync). When false (e.g. WebGL1), callers must
     * decode positions on the CPU instead.
     */
    public get supportsAsyncCentersReadback(): boolean {
        const engine = this._scene.getEngine();
        if (engine.isWebGPU) {
            return true;
        }
        const glEngine = engine as unknown as { _gl?: WebGL2RenderingContext; _readPixelsAsync?: unknown; webGLVersion?: number };
        return !!glEngine._gl && typeof glEngine._readPixelsAsync === "function" && (glEngine.webGLVersion ?? 0) >= 2;
    }

    /**
     * Square edge length (in pixels) of the work-buffer textures.
     */
    public get textureSize(): number {
        return this._textureSize;
    }

    /**
     * The decoded work-buffer textures: [centers, covA, covB, colors].
     */
    public get textures(): Texture[] {
        return this._mrt.textures;
    }

    /**
     * Creates a work buffer sized to hold `capacity` splats.
     *
     * Standalone (default): the work buffer creates and owns a square MRT sized `ceil(sqrt(capacity))`, with
     * decodes addressed from splat 0.
     *
     * Hosted (`externalAtlas` provided): the work buffer decodes/reads back into an externally-owned MRT (a
     * compound mesh's shared atlas) instead of creating its own. Decodes are placed at `externalAtlas.baseOffset`
     * (the reserved region's first splat) and addressed over `externalAtlas.width` (the wide atlas width), so the
     * streamed splats land in the compound's atlas and sort/draw together with the static parts.
     * @param scene hosting scene
     * @param capacity total number of splats the work buffer must address
     * @param externalAtlas optional external atlas to decode into instead of creating an owned square MRT
     */
    constructor(scene: Scene, capacity: number, externalAtlas?: { mrt: MultiRenderTarget; width: number; baseOffset: number }) {
        this._scene = scene;
        this._shaderLanguage = scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;
        this._capacity = Math.max(1, capacity);

        if (externalAtlas) {
            this._mrt = externalAtlas.mrt;
            this._textureSize = externalAtlas.width;
            this._baseOffset = externalAtlas.baseOffset;
            this._ownsMrt = false;
        } else {
            this._textureSize = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, capacity))));
            this._baseOffset = 0;
            this._ownsMrt = true;
            // The decode buffer accumulates (clear disabled) so each decode preserves previously-decoded files.
            this._mrt = this._createMrt("gsWorkBuffer", true);
        }

        // One persistent decode material + fullscreen-triangle quad, reused (with per-file uniforms)
        // for every decode so the shader is compiled only once.
        this._material = this._createMaterial();
        this._quad = this._createQuad();
        this._quad.material = this._material;

        // Hosted: start compiling the copy shader now so backupRegion()/restoreRegion() are ready by the time
        // the compound grows its atlas (a synchronous, non-frame-driven event we can't wait on).
        if (!this._ownsMrt) {
            this.isRelayoutReady();
        }
    }

    /**
     * Rebinds a hosted work buffer to a new atlas MRT (after the compound recreated it on a grow). No-op for a
     * standalone work buffer, which owns its MRT.
     * @param mrt the compound's new shared atlas
     */
    public rebindAtlas(mrt: MultiRenderTarget): void {
        if (!this._ownsMrt) {
            this._mrt = mrt;
        }
    }

    /**
     * Copies this hosted region's four decoded textures out of the shared atlas into an internal backup MRT so
     * they survive the compound recreating the atlas on a grow. Call immediately before the atlas is recreated,
     * then {@link rebindAtlas} + {@link restoreRegion} after. No-op if the copy shader isn't ready yet.
     */
    public backupRegion(): void {
        if (this._disposed || this._ownsMrt || !this.isRelayoutReady()) {
            return;
        }
        const width = this._textureSize;
        const regionRows = Math.max(1, Math.floor(this._capacity / width));
        const baseRow = Math.floor(this._baseOffset / width);
        if (!this._backupMrt) {
            this._backupMrt = this._createMrt("gsAtlasBackup", false, width, regionRows);
        }
        // Identity copy of the region out of the atlas: with useMap=0 and dstBaseRow=-baseRow the shader reads
        // atlas texel ((p.y + baseRow) * width + p.x) — the region's global texel — into backup texel p.
        this._renderRelayoutPass(this._backupMrt, this._mrt.textures, this._mrt.textures[0], 0, width, width, 0, -baseRow);
        this._quad.material = this._material;
    }

    /**
     * Restores the backed-up region into the (new) atlas, confined by a scissor to the region's rows so no other
     * part is touched. Call {@link rebindAtlas} to the new atlas first. Frees the backup afterwards.
     */
    public restoreRegion(): void {
        if (this._disposed || this._ownsMrt || !this._backupMrt || !this._copyMaterial) {
            return;
        }
        const width = this._textureSize;
        const regionRows = Math.max(1, Math.floor(this._capacity / width));
        const baseRow = Math.floor(this._baseOffset / width);
        const engine = this._scene.getEngine();
        engine.enableScissor(0, baseRow, width, regionRows);
        try {
            // useMap=0 identity with dstBaseRow=baseRow: atlas texel p reads backup texel ((p.y - baseRow)*width + p.x).
            this._renderRelayoutPass(this._mrt, this._backupMrt.textures, this._backupMrt.textures[0], 0, width, width, 0, baseRow);
        } finally {
            engine.disableScissor();
            this._quad.material = this._material;
        }
        this._backupMrt.dispose();
        this._backupMrt = null;
    }

    /**
     * Creates a 4-attachment MRT (centers F32 / covA / covB / colors U8) sized to the work buffer. covA/covB
     * use HALF_FLOAT when the engine can render to it, matching the precision the non-streamed
     * GaussianSplattingMesh path already uses for these same two textures (see
     * `gaussianSplattingMeshBase.pure.ts`'s `createTextureFromDataF16` covA/covB textures); centers stays F32
     * and colors stays U8 in both paths.
     * @param name MRT and attachment base name
     * @param disableClear when true, clearing is suppressed so renders accumulate (the decode buffer); when
     *   false the MRT clears to zero on each render (the temporary relayout buffer, so gaps stay zeroed)
     * @param width texture width (defaults to the work-buffer size; the region row width for a scoped relayout)
     * @param height texture height (defaults to the work-buffer size; the region row count for a scoped relayout)
     * @returns the created MRT
     */
    private _createMrt(name: string, disableClear: boolean, width: number = this._textureSize, height: number = this._textureSize): MultiRenderTarget {
        const covType = this._scene.getEngine()._caps.textureHalfFloatRender ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_FLOAT;
        const mrt = new MultiRenderTarget(
            name,
            { width, height },
            4,
            this._scene,
            {
                types: [Constants.TEXTURETYPE_FLOAT, covType, covType, Constants.TEXTURETYPE_UNSIGNED_BYTE],
                samplingModes: [
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                ],
                formats: [Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA],
                generateDepthBuffer: false,
                generateDepthTexture: false,
                generateMipMaps: false,
            },
            [`${name}Centers`, `${name}CovA`, `${name}CovB`, `${name}Colors`]
        );
        mrt.clearColor = new Color4(0, 0, 0, 0);
        mrt.renderList = [];
        if (disableClear) {
            mrt.onClearObservable.add(() => {});
        }
        return mrt;
    }

    /**
     * Decodes one SOG file into the work buffer at the given splat offset (accumulating; previously
     * decoded files are preserved). Resolves once the GPU decode has been issued. The caller may
     * dispose the source pack textures after this resolves.
     * @param pack the SOG texture pack (GPU source textures + per-file decode parameters)
     * @param offset first splat index (pixel offset) for this file in the work buffer
     */
    public async decodeAsync(pack: ISogTexturePack, offset: number): Promise<void> {
        if (this._disposed) {
            return;
        }
        this._applyPack(pack, offset);
        // Render the decode pass at the start of a frame (the safe point for custom render targets),
        // once the shader is compiled — never re-entrantly from a promise/observable continuation.
        await new Promise<void>((resolve) => {
            const attempt = () => {
                if (this._disposed) {
                    resolve();
                    return;
                }
                if (!this._material.isReady(this._quad)) {
                    this._scene.onBeforeRenderObservable.addOnce(attempt);
                    return;
                }
                this._mrt.renderList = [this._quad];
                this._mrt.render();
                resolve();
            };
            this._scene.onBeforeRenderObservable.addOnce(attempt);
        });
    }

    /**
     * Whether the relayout copy shader is compiled and ready. Lazily creates the copy material on first call.
     * Callers should poll this before {@link relayoutSync} (which must only run when ready).
     * @returns true when {@link relayoutSync} can run this frame
     */
    public isRelayoutReady(): boolean {
        if (this._disposed) {
            return false;
        }
        if (!this._copyMaterial) {
            this._copyMaterial = this._createCopyMaterial();
        }
        return this._copyMaterial.isReady(this._quad);
    }

    /**
     * Relayouts the decoded work-buffer textures to a new (defragmented) splat layout, keeping the same
     * texture instances so the consuming mesh does not need to re-bind. `srcIndexByDst[d]` is the source splat
     * index whose decoded data should end up at destination index `d`, or a negative value for a gap (left
     * zeroed). Uses a temporary MRT ping-pong (old -> temp via the map, then temp -> old identity) so
     * overlapping moves stay correct. Must be called at a frame-safe point (inside `onBeforeRender`) and only
     * when {@link isRelayoutReady} returns true.
     * @param srcIndexByDst per-destination source splat index (negative = gap)
     */
    public relayoutSync(srcIndexByDst: Float32Array): void {
        if (this._disposed || !this._copyMaterial) {
            return;
        }
        // Map dimensions: standalone maps the whole square buffer; hosted maps just the region's rows.
        const width = this._textureSize;
        const mapW = width;
        const mapH = this._ownsMrt ? width : Math.max(1, Math.floor(this._capacity / width));
        // Reuse the map buffer + its GPU texture across relayouts (dimensions are fixed for a work buffer).
        if (!this._relayoutMapData) {
            this._relayoutMapData = new Float32Array(mapW * mapH);
        }
        const mapData = this._relayoutMapData;
        mapData.fill(-1);
        mapData.set(srcIndexByDst.subarray(0, Math.min(srcIndexByDst.length, mapData.length)));
        if (!this._relayoutMapTexture) {
            this._relayoutMapTexture = new RawTexture(
                mapData,
                mapW,
                mapH,
                Constants.TEXTUREFORMAT_R,
                this._scene,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
        } else {
            this._relayoutMapTexture.update(mapData);
        }
        const mapTexture = this._relayoutMapTexture;

        if (this._ownsMrt) {
            // Standalone: the work buffer owns the whole square texture, so a full ping-pong is safe.
            const temp = this._createMrt("gsRelayoutTemp", false);
            try {
                this._renderRelayoutPass(temp, this._mrt.textures, mapTexture, 1); // old -> temp via map (gaps cleared)
                this._renderRelayoutPass(this._mrt, temp.textures, mapTexture, 0); // temp -> old, identity full overwrite
            } finally {
                temp.dispose();
                this._quad.material = this._material;
            }
            return;
        }

        // Hosted (shared compound atlas): scope the ping-pong to THIS region's row band so other parts are never
        // touched. `_baseOffset` and `_capacity` are row-aligned (reserveStreamingPart), so the band is exact.
        const baseRow = Math.floor(this._baseOffset / width);
        const regionRows = mapH;
        const engine = this._scene.getEngine();
        // Region-sized temp (width x regionRows) — memory stays proportional to the region, not the whole atlas.
        const temp = this._createMrt("gsRelayoutTemp", false, width, regionRows);
        try {
            // Pass 1: atlas region -> temp via map. The map is region-local; uSrcBaseOffset shifts each source
            // index to its GLOBAL atlas texel (uSrcWidth = atlas width). Temp is exactly the band, so no scissor.
            this._renderRelayoutPass(temp, this._mrt.textures, mapTexture, 1, /*dstWidth*/ width, /*srcWidth*/ width, /*srcBaseOffset*/ this._baseOffset, /*dstBaseRow*/ 0);
            // Pass 2: temp -> atlas region, identity within the band. uDstBaseRow maps the atlas destination row
            // back into the region-local temp; the scissor confines writes to the band so static parts are safe.
            engine.enableScissor(0, baseRow, width, regionRows);
            try {
                this._renderRelayoutPass(this._mrt, temp.textures, mapTexture, 0, /*dstWidth*/ width, /*srcWidth*/ width, /*srcBaseOffset*/ 0, /*dstBaseRow*/ baseRow);
            } finally {
                engine.disableScissor();
            }
        } finally {
            temp.dispose();
            this._quad.material = this._material;
        }
    }

    /**
     * Renders one relayout copy pass into the target MRT, sampling the given source textures.
     * @param target destination MRT
     * @param sources the four source work-buffer textures
     * @param mapTexture the R32F destination-to-source index map (only sampled when `useMap` is 1; any bound texture otherwise)
     * @param useMap 1 to read source indices from the map (gaps discarded), 0 for an identity copy
     * @param dstWidth destination width used to linearize the destination texel (defaults to the work-buffer size)
     * @param srcWidth source width used to convert a linear source index to a texel (defaults to the work-buffer size)
     * @param srcBaseOffset added to each mapped source index so a region-local map reads the correct global atlas texel (hosted relayout)
     * @param dstBaseRow subtracted from the destination row so an identity copy reads the region-local temp (hosted relayout)
     */
    private _renderRelayoutPass(
        target: MultiRenderTarget,
        sources: Texture[],
        mapTexture: BaseTexture,
        useMap: number,
        dstWidth: number = this._textureSize,
        srcWidth: number = this._textureSize,
        srcBaseOffset: number = 0,
        dstBaseRow: number = 0
    ): void {
        const material = this._copyMaterial!;
        material.setTexture("uMapTex", mapTexture);
        material.setTexture("uSrc0", sources[0]);
        material.setTexture("uSrc1", sources[1]);
        material.setTexture("uSrc2", sources[2]);
        material.setTexture("uSrc3", sources[3]);
        material.setInt("uDstWidth", dstWidth);
        material.setInt("uSrcWidth", srcWidth);
        material.setInt("uUseMap", useMap);
        material.setInt("uSrcBaseOffset", srcBaseOffset);
        material.setInt("uDstBaseRow", dstBaseRow);
        this._quad.material = material;
        target.renderList = [this._quad];
        target.render();
    }

    private _createCopyMaterial(): ShaderMaterial {
        const isWGSL = this._shaderLanguage === ShaderLanguage.WGSL;
        const material = new ShaderMaterial(
            GaussianSplattingWorkBufferRelayoutShaderName,
            this._scene,
            {
                vertexSource: isWGSL ? GaussianSplattingWorkBufferVertexShaderWGSL : GaussianSplattingWorkBufferVertexShaderGLSL,
                fragmentSource: isWGSL ? GaussianSplattingWorkBufferRelayoutFragmentShaderWGSL : GaussianSplattingWorkBufferRelayoutFragmentShaderGLSL,
            },
            {
                attributes: ["position"],
                uniforms: ["uDstWidth", "uSrcWidth", "uUseMap", "uSrcBaseOffset", "uDstBaseRow"],
                samplers: ["uMapTex", "uSrc0", "uSrc1", "uSrc2", "uSrc3"],
                shaderLanguage: this._shaderLanguage,
            }
        );
        material.backFaceCulling = false;
        material.disableDepthWrite = true;
        return material;
    }

    /**
     * Asynchronously reads back the decoded splat centers (stride-4 xyzw, w=1) for a contiguous splat range
     * from the work buffer's centers texture, using a non-blocking GPU readback (WebGL2 PBO + fence, or WebGPU
     * copyTextureToBuffer + mapAsync) so it never stalls the frame the way a CPU image decode does. The centers
     * texture already holds the GPU-decoded positions (identical to the CPU decode), so this replaces decoding
     * positions on the CPU from the means images. Returns null when async readback is unsupported (caller should
     * fall back to CPU decoding).
     * @param splatOffset first splat index of the range
     * @param splatCount number of splats in the range
     * @returns a stride-4 Float32Array of length `splatCount * 4`, or null when unsupported/failed
     */
    public async readCentersRangeAsync(splatOffset: number, splatCount: number): Promise<Nullable<Float32Array>> {
        if (this._disposed || splatCount <= 0 || !this.supportsAsyncCentersReadback) {
            return null;
        }

        const width = this._textureSize;
        // Shift the region-local offset by the atlas base so the readback targets the same global texels the
        // decode wrote (0 base for a standalone work buffer).
        const globalOffset = this._baseOffset + splatOffset;
        // The range maps to whole texel rows [rowStart, rowEnd); read that rectangle and slice the exact range.
        // Splat i lives at texel (i % width, floor(i / width)) in both decode and draw, so the readback (which
        // indexes the same texture storage directly, with no UV/flip) yields splat i at buffer position
        // i - rowStart * width on every backend.
        const rowStart = Math.floor(globalOffset / width);
        const rowEnd = Math.ceil((globalOffset + splatCount) / width);
        const rowCount = rowEnd - rowStart;
        const startInBuffer = (globalOffset - rowStart * width) * 4;
        const sliceEnd = startInBuffer + splatCount * 4;
        const centers = this._mrt.textures[0];

        const engine = this._scene.getEngine();

        if (engine.isWebGPU) {
            // WebGPU: copyTextureToBuffer of the row span + mapAsync (genuinely non-blocking). noDataConversion
            // returns the raw RGBA32F floats tightly packed (the 256-byte row alignment is removed internally).
            const result = await centers.readPixels(0, 0, null, true, true, 0, rowStart, width, rowCount);
            if (this._disposed || !result) {
                return null;
            }
            const floats = result instanceof Float32Array ? result : new Float32Array(result.buffer, result.byteOffset, result.byteLength / 4);
            return floats.length >= sliceEnd ? (floats.subarray(startInBuffer, sliceEnd) as Float32Array) : null;
        }

        // WebGL2: read directly from the centers texture via a reused FBO + async PBO readback.
        const glEngine = engine as unknown as {
            _gl: WebGL2RenderingContext;
            _currentFramebuffer: Nullable<WebGLFramebuffer>;
            _readPixelsAsync(x: number, y: number, w: number, h: number, format: number, type: number, o: ArrayBufferView): Nullable<Promise<ArrayBufferView>>;
        };
        const gl = glEngine._gl;
        const hardware = centers.getInternalTexture()?._hardwareTexture?.underlyingResource as Nullable<WebGLTexture>;
        if (!hardware) {
            return null;
        }
        const buffer = new Float32Array(width * rowCount * 4);
        if (!this._readFbo) {
            this._readFbo = gl.createFramebuffer();
        }
        const previousFbo = glEngine._currentFramebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._readFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hardware, 0);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);

        // _readPixelsAsync issues the readPixels into a PBO synchronously, then resolves once the GPU fence
        // signals — so the framebuffer can be restored immediately while the transfer completes off-thread.
        const promise = glEngine._readPixelsAsync(0, rowStart, width, rowCount, gl.RGBA, gl.FLOAT, buffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, previousFbo);
        // gl.readBuffer is global state: restore the default-framebuffer read source (BACK) so later
        // readPixels on the default framebuffer aren't left pointing at COLOR_ATTACHMENT0. When restoring to
        // another FBO, COLOR_ATTACHMENT0 is the correct default read buffer, so only reset for the default one.
        if (!previousFbo) {
            gl.readBuffer(gl.BACK);
        }
        if (!promise) {
            return null;
        }
        await promise;
        if (this._disposed || buffer.length < sliceEnd) {
            return null;
        }
        return buffer.subarray(startInBuffer, sliceEnd) as Float32Array;
    }

    /**
     * Disposes the work buffer and its decode resources.
     */
    public dispose(): void {
        this._disposed = true;
        if (this._readFbo) {
            (this._scene.getEngine() as unknown as { _gl?: WebGL2RenderingContext })._gl?.deleteFramebuffer(this._readFbo);
            this._readFbo = null;
        }
        this._quad.dispose();
        this._material.dispose(true, false);
        this._copyMaterial?.dispose(true, false);
        this._relayoutMapTexture?.dispose();
        this._backupMrt?.dispose();
        this._backupMrt = null;
        // Only dispose the MRT when we own it; an external atlas belongs to the hosting compound mesh.
        if (this._ownsMrt) {
            this._mrt.dispose();
        }
    }

    private _createQuad(): Mesh {
        const quad = new Mesh("gsWorkBufferQuad", this._scene);
        const vertexData = new VertexData();
        // Fullscreen triangle in clip space (the vertex shader passes positions straight through).
        vertexData.positions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
        vertexData.indices = [0, 1, 2];
        vertexData.applyToMesh(quad);
        // Render only inside the work-buffer MRT, never in the main scene pass.
        this._scene.removeMesh(quad);
        return quad;
    }

    private _createMaterial(): ShaderMaterial {
        const isWGSL = this._shaderLanguage === ShaderLanguage.WGSL;
        const material = new ShaderMaterial(
            "gsSogDecode",
            this._scene,
            {
                vertexSource: isWGSL ? GaussianSplattingWorkBufferVertexShaderWGSL : GaussianSplattingWorkBufferVertexShaderGLSL,
                fragmentSource: isWGSL ? GaussianSplattingWorkBufferFragmentShaderWGSL : GaussianSplattingWorkBufferFragmentShaderGLSL,
            },
            {
                attributes: ["position"],
                uniforms: ["sogMeansMin", "sogMeansMax", "sogScalesMin", "sogScalesMax", "sogSh0Min", "sogSh0Max", "uVersion", "uOffset", "uCount", "uDestWidth", "uSrcWidth"],
                samplers: ["sogMeansLTex", "sogMeansUTex", "sogScalesTex", "sogQuatsTex", "sogSh0Tex", "sogCodebookTex"],
                shaderLanguage: this._shaderLanguage,
            }
        );
        material.backFaceCulling = false;
        material.disableDepthWrite = true;
        return material;
    }

    private _applyPack(pack: ISogTexturePack, offset: number): void {
        const material = this._material;
        const srcWidth = (pack.meansTextureL as Texture).getSize().width;

        material.setTexture("sogMeansLTex", pack.meansTextureL);
        material.setTexture("sogMeansUTex", pack.meansTextureU);
        material.setTexture("sogScalesTex", pack.scalesTexture);
        material.setTexture("sogQuatsTex", pack.quatsTexture);
        material.setTexture("sogSh0Tex", pack.sh0Texture);
        // Codebook only used for v2; bind a harmless placeholder otherwise so the sampler is always set.
        material.setTexture("sogCodebookTex", pack.codebookTexture ?? pack.sh0Texture);

        material.setVector3("sogMeansMin", new Vector3(pack.meansMin[0], pack.meansMin[1], pack.meansMin[2]));
        material.setVector3("sogMeansMax", new Vector3(pack.meansMax[0], pack.meansMax[1], pack.meansMax[2]));
        const sMin = pack.scalesMin ?? [0, 0, 0];
        const sMax = pack.scalesMax ?? [0, 0, 0];
        material.setVector3("sogScalesMin", new Vector3(sMin[0], sMin[1], sMin[2]));
        material.setVector3("sogScalesMax", new Vector3(sMax[0], sMax[1], sMax[2]));
        const c0Min = pack.sh0Min ?? [0, 0, 0, 0];
        const c0Max = pack.sh0Max ?? [0, 0, 0, 0];
        material.setVector4("sogSh0Min", new Vector4(c0Min[0], c0Min[1], c0Min[2], c0Min[3]));
        material.setVector4("sogSh0Max", new Vector4(c0Max[0], c0Max[1], c0Max[2], c0Max[3]));

        material.setInt("uVersion", pack.version);
        // Place the file at its region-local offset shifted by the atlas base (0 for a standalone work buffer).
        material.setInt("uOffset", this._baseOffset + offset);
        material.setInt("uCount", pack.splatCount);
        material.setInt("uDestWidth", this._textureSize);
        material.setInt("uSrcWidth", srcWidth);
    }
}
