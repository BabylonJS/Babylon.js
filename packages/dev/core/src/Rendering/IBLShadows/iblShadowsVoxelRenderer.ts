import { Constants } from "../../Engines/constants";
import { type Engine } from "../../Engines/engine";
import { ShaderMaterial } from "../../Materials/shaderMaterial";
import { MultiRenderTarget } from "../../Materials/Textures/multiRenderTarget";
import { RenderTargetTexture, type RenderTargetTextureOptions } from "../../Materials/Textures/renderTargetTexture";
import { type TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { Color4 } from "../../Maths/math.color";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { type Mesh } from "../../Meshes/mesh";
import { type Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import { ProceduralTexture, type IProceduralTextureCreationOptions } from "../../Materials/Textures/Procedurals/proceduralTexture";
import { EffectRenderer, EffectWrapper } from "../../Materials/effectRenderer";
import { type IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";
import { type RenderTargetWrapper } from "core/Engines";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import "../../Engines/Extensions/engine.multiRender";

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 * @see https://playground.babylonjs.com/#8R5SSE#222
 */
export class _IblShadowsVoxelRenderer {
    private _scene: Scene;
    private _engine: Engine;

    // WebGPU, single-pass voxelization.
    // See https://playground.babylonjs.com/#XSNYAU#133
    private _voxelGrid: RenderTargetTexture;
    private _voxelGridRT: RenderTargetTexture;

    // WebGL voxelization, including tri-planar voxelization.
    private _combinedVoxelGridPT: ProceduralTexture;
    private _voxelGridXaxis: RenderTargetTexture;
    private _voxelGridYaxis: RenderTargetTexture;
    private _voxelGridZaxis: RenderTargetTexture;
    private _voxelMrtsXaxis: MultiRenderTarget[] = [];
    private _voxelMrtsYaxis: MultiRenderTarget[] = [];
    private _voxelMrtsZaxis: MultiRenderTarget[] = [];

    private _voxelMaterial: ShaderMaterial;
    private _voxelClearColor: Color4 = new Color4(0, 0, 0, 1);

    /**
     * Return the voxel grid texture.
     * @returns The voxel grid texture.
     */
    public getVoxelGrid(): ProceduralTexture | RenderTargetTexture {
        if (this._engine.isWebGPU) {
            return this._voxelGrid;
        } else if (this._triPlanarVoxelization) {
            return this._combinedVoxelGridPT;
        } else {
            return this._voxelGridZaxis;
        }
    }

    /**
     * Return the voxel render target used during voxelization.
     * @returns The voxel render target.
     */
    public getRT(): ProceduralTexture | RenderTargetTexture {
        if (this._engine.isWebGPU) {
            return this._voxelGridRT;
        } else if (this._triPlanarVoxelization) {
            return this._combinedVoxelGridPT;
        } else {
            return this._voxelGridZaxis;
        }
    }

    /**
     * Observable that triggers when the voxelization is complete
     */
    public onVoxelizationCompleteObservable: Observable<void> = new Observable<void>();

    private _maxDrawBuffers: number;
    private _renderTargets: RenderTargetTexture[] = [];

    private _triPlanarVoxelization: boolean = true;

    /**
     * Whether to use tri-planar voxelization. More expensive, but can help with artifacts.
     */
    public get triPlanarVoxelization(): boolean {
        return this._triPlanarVoxelization;
    }

    /**
     * Whether to use tri-planar voxelization. More expensive, but can help with artifacts.
     */
    public set triPlanarVoxelization(enabled: boolean) {
        if (this._engine.isWebGPU) {
            // WebGPU only supports tri-planar voxelization.
            this._triPlanarVoxelization = true;
            return;
        }
        if (this._triPlanarVoxelization === enabled) {
            return;
        }
        this._triPlanarVoxelization = enabled;
        this._disposeVoxelTextures();
        this._createTextures();
    }

    private _voxelizationInProgress: boolean = false;
    private _invWorldScaleMatrix: Matrix = Matrix.Identity();

    /**
     * Set the matrix to use for scaling the world space to voxel space
     * @param matrix The matrix to use for scaling the world space to voxel space
     */
    public setWorldScaleMatrix(matrix: Matrix) {
        this._invWorldScaleMatrix = matrix;
    }

    /**
     * @returns Whether voxelization is currently happening.
     */
    public isVoxelizationInProgress(): boolean {
        return this._voxelizationInProgress;
    }

    private _voxelResolution: number = 64;
    private _voxelResolutionExp: number = 6;

    /**
     * Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     */
    public get voxelResolutionExp(): number {
        return this._voxelResolutionExp;
    }

    /**
     * Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     */
    public set voxelResolutionExp(resolutionExp: number) {
        if (this._voxelResolutionExp === resolutionExp && this._voxelGridZaxis) {
            return;
        }
        this._voxelResolutionExp = Math.round(Math.min(Math.max(resolutionExp, 3), 9));
        this._voxelResolution = Math.pow(2.0, this._voxelResolutionExp);
        this._disposeVoxelTextures();
        this._createTextures();
    }

    private _copyMipEffectRenderer: EffectRenderer;
    private _copyMipEffectWrapper: EffectWrapper;
    private _copyMipSourceTexture?: ProceduralTexture;
    private _copyMipLayer = 0;
    private _mipArray: ProceduralTexture[] = [];

    /**
     * Instanciates the voxel renderer
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The render pipeline this pass is associated with
     * @param resolutionExp Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     * @param triPlanarVoxelization Whether to use tri-planar voxelization. Only applies to WebGL. Voxelization will take longer but will reduce missing geometry.
     * @returns The voxel renderer
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline, resolutionExp: number = 6, triPlanarVoxelization: boolean = true) {
        this._scene = scene;
        this._engine = scene.getEngine() as Engine;
        this._triPlanarVoxelization = this._engine.isWebGPU || triPlanarVoxelization;
        if (!this._engine.getCaps().drawBuffersExtension) {
            Logger.Error("Can't do voxel rendering without the draw buffers extension.");
        }

        const isWebGPU = this._engine.isWebGPU;
        // Round down to a power of 2 so it evenly divides the power-of-2 voxel resolution,
        // preventing out-of-bounds layer indices in the last MRT slab.
        // This shader implementation writes up to 16 MRT outputs, so clamp to 16 to keep
        // active draw buffers aligned with declared/written fragment outputs.
        const rawMaxDrawBuffers = this._engine.getCaps().maxDrawBuffers || 0;
        const cappedMaxDrawBuffers = Math.min(rawMaxDrawBuffers, 16);
        this._maxDrawBuffers = cappedMaxDrawBuffers >= 1 ? 1 << Math.floor(Math.log2(cappedMaxDrawBuffers)) : 0;

        this._copyMipEffectRenderer = new EffectRenderer(this._engine);
        this._copyMipEffectWrapper = new EffectWrapper({
            engine: this._engine,
            fragmentShader: "copyTexture3DLayerToTexture",
            useShaderStore: true,
            uniformNames: ["layerNum"],
            samplerNames: ["textureSampler"],
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../../ShadersWGSL/copyTexture3DLayerToTexture.fragment");
                } else {
                    await import("../../Shaders/copyTexture3DLayerToTexture.fragment");
                }
            },
        });
        this._copyMipEffectWrapper.onApplyObservable.add(() => {
            const effect = this._copyMipEffectWrapper.effect;
            if (!effect || !this._copyMipSourceTexture) {
                return;
            }

            effect.setTexture("textureSampler", this._copyMipSourceTexture);
            effect.setInt("layerNum", this._copyMipLayer);
        });

        this.voxelResolutionExp = resolutionExp;
    }

    private _generateMipMaps() {
        const iterations = Math.ceil(Math.log2(this._voxelResolution));
        for (let i = 1; i < iterations + 1; i++) {
            this._generateMipMap(i);
        }
    }

    private _generateMipMap(lodLevel: number) {
        // Generate a mip map for the given level by triggering the render of the procedural mip texture.
        const mipTarget = this._mipArray[lodLevel - 1];
        if (!mipTarget) {
            return;
        }

        mipTarget.setTexture("srcMip", lodLevel === 1 ? this.getVoxelGrid() : this._mipArray[lodLevel - 2]);
        mipTarget.render();
    }

    private _copyMipMaps() {
        const iterations = Math.ceil(Math.log2(this._voxelResolution));
        for (let i = 1; i < iterations + 1; i++) {
            this._copyMipMap(i);
        }
    }

    private _copyMipMap(lodLevel: number) {
        // Now, copy this mip into the mip chain of the voxel grid.
        const mipTarget = this._mipArray[lodLevel - 1];
        if (!mipTarget) {
            return;
        }
        const voxelGrid = this.getVoxelGrid();
        let rt: RenderTargetWrapper;
        if (voxelGrid instanceof RenderTargetTexture && voxelGrid.renderTarget) {
            rt = voxelGrid.renderTarget;
        } else {
            rt = (voxelGrid as any)._rtWrapper;
        }
        if (rt) {
            this._copyMipEffectRenderer.saveStates();
            const previousColorWrite = this._engine.getColorWrite();
            const previousDepthBuffer = this._engine.getDepthBuffer();
            const previousDepthWrite = this._engine.getDepthWrite();
            const previousAlphaMode = this._engine.getAlphaMode();
            this._engine.setColorWrite(true);
            this._engine.setDepthBuffer(false);
            this._engine.setDepthWrite(false);
            this._engine.setAlphaMode(Constants.ALPHA_DISABLE);
            const bindSize = mipTarget.getSize().width;
            let sourceDepth = mipTarget.getInternalTexture()?.depth;
            sourceDepth = Math.max(1, sourceDepth || bindSize);
            const destinationMipDepth = Math.max(1, this._voxelResolution >> lodLevel);
            const layersToCopy = Math.min(sourceDepth, destinationMipDepth);
            const destinationTexture = rt.texture;
            const previousGenerateMipMaps = destinationTexture?.generateMipMaps;

            if (destinationTexture) {
                destinationTexture.generateMipMaps = false;
            }

            try {
                // Render to each layer of the voxel grid.
                for (let layer = 0; layer < layersToCopy; layer++) {
                    this._engine.bindFramebuffer(rt, 0, bindSize, bindSize, true, lodLevel, layer);
                    this._copyMipSourceTexture = mipTarget;
                    this._copyMipLayer = layer;
                    this._copyMipEffectRenderer.applyEffectWrapper(this._copyMipEffectWrapper);
                    this._copyMipEffectRenderer.draw();
                    this._engine.unBindFramebuffer(rt, true);
                }

                if (!this._engine.isWebGPU) {
                    this._engine.unbindAllTextures();
                }
            } finally {
                if (destinationTexture && previousGenerateMipMaps !== undefined) {
                    destinationTexture.generateMipMaps = previousGenerateMipMaps;
                }
                this._engine.setAlphaMode(previousAlphaMode);
                this._engine.setDepthWrite(previousDepthWrite);
                this._engine.setDepthBuffer(previousDepthBuffer);
                this._engine.setColorWrite(previousColorWrite);
            }

            this._copyMipSourceTexture = undefined;
            this._copyMipEffectRenderer.restoreStates();
        }
    }

    private _computeNumberOfSlabs(): number {
        return Math.ceil(this._voxelResolution / this._maxDrawBuffers);
    }

    private _createTextures() {
        const isWebGPU = this._engine.isWebGPU;
        const size: TextureSize = {
            width: this._voxelResolution,
            height: this._voxelResolution,
            depth: this._voxelResolution,
        };
        const voxelAxisOptions: RenderTargetTextureOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_R,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        };

        // We can render up to maxDrawBuffers voxel slices of the grid per render.
        // We call this a slab.
        const numSlabs = this._computeNumberOfSlabs();
        const voxelCombinedOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: true,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_R,
            samplingMode: Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../../ShadersWGSL/iblCombineVoxelGrids.fragment");
                } else {
                    await import("../../Shaders/iblCombineVoxelGrids.fragment");
                }
            },
        };
        if (this._engine.isWebGPU) {
            this._voxelGrid = new RenderTargetTexture("voxelGrid", size, this._scene, {
                ...voxelCombinedOptions,
                format: Constants.TEXTUREFORMAT_R,
                creationFlags: Constants.TEXTURE_CREATIONFLAG_STORAGE,
            });
            this._voxelGridRT = new RenderTargetTexture(
                "voxelGridRT",
                { width: Math.min(size.width * 2.0, 2048), height: Math.min(size.height * 2.0, 2048) },
                this._scene,
                voxelAxisOptions
            );
        } else if (this._triPlanarVoxelization) {
            this._voxelGridXaxis = new RenderTargetTexture("voxelGridXaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridYaxis = new RenderTargetTexture("voxelGridYaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelAxisOptions);
            this._voxelMrtsXaxis = this._createVoxelMRTs("x_axis_", this._voxelGridXaxis, numSlabs);
            this._voxelMrtsYaxis = this._createVoxelMRTs("y_axis_", this._voxelGridYaxis, numSlabs);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);

            this._combinedVoxelGridPT = new ProceduralTexture("combinedVoxelGrid", size, "iblCombineVoxelGrids", this._scene, voxelCombinedOptions, false);
            this._scene.proceduralTextures.splice(this._scene.proceduralTextures.indexOf(this._combinedVoxelGridPT), 1);
            this._combinedVoxelGridPT.setFloat("layer", 0.0);
            this._combinedVoxelGridPT.setTexture("voxelXaxisSampler", this._voxelGridXaxis);
            this._combinedVoxelGridPT.setTexture("voxelYaxisSampler", this._voxelGridYaxis);
            this._combinedVoxelGridPT.setTexture("voxelZaxisSampler", this._voxelGridZaxis);
            // We will render this only after voxelization is completed for the 3 axes.
            this._combinedVoxelGridPT.autoClear = false;
            this._combinedVoxelGridPT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._combinedVoxelGridPT.wrapV = Texture.CLAMP_ADDRESSMODE;
        } else {
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelCombinedOptions);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);
        }

        const generateVoxelMipOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_R,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../../ShadersWGSL/iblGenerateVoxelMip.fragment");
                } else {
                    await import("../../Shaders/iblGenerateVoxelMip.fragment");
                }
            },
        };
        this._mipArray = new Array(Math.ceil(Math.log2(this._voxelResolution)));
        for (let mipIdx = 1; mipIdx <= this._mipArray.length; mipIdx++) {
            const mipDim = this._voxelResolution >> mipIdx;
            const mipSize: TextureSize = { width: mipDim, height: mipDim, depth: mipDim };
            this._mipArray[mipIdx - 1] = new ProceduralTexture("voxelMip" + mipIdx, mipSize, "iblGenerateVoxelMip", this._scene, generateVoxelMipOptions, false);
            this._scene.proceduralTextures.splice(this._scene.proceduralTextures.indexOf(this._mipArray[mipIdx - 1]), 1);

            const mipTarget = this._mipArray[mipIdx - 1];
            mipTarget.autoClear = false;
            mipTarget.wrapU = Texture.CLAMP_ADDRESSMODE;
            mipTarget.wrapV = Texture.CLAMP_ADDRESSMODE;
            mipTarget.setTexture("srcMip", mipIdx > 1 ? this._mipArray[mipIdx - 2] : this.getVoxelGrid());
            mipTarget.setInt("layerNum", 0);
        }

        this._createVoxelMaterials();
    }

    private _createVoxelMRTs(name: string, voxelRT: RenderTargetTexture, numSlabs: number): MultiRenderTarget[] {
        voxelRT.wrapU = Texture.CLAMP_ADDRESSMODE;
        voxelRT.wrapV = Texture.CLAMP_ADDRESSMODE;
        voxelRT.noPrePassRenderer = true;
        const mrtArray: MultiRenderTarget[] = [];
        const targetTypes = new Array(this._maxDrawBuffers).fill(Constants.TEXTURE_3D);

        for (let mrtIndex = 0; mrtIndex < numSlabs; mrtIndex++) {
            let layerIndices = new Array(this._maxDrawBuffers).fill(0);
            layerIndices = layerIndices.map((value, index) => mrtIndex * this._maxDrawBuffers + index);

            let textureNames = new Array(this._maxDrawBuffers).fill("");
            textureNames = textureNames.map((value, index) => "voxel_grid_" + name + (mrtIndex * this._maxDrawBuffers + index));

            const mrt = new MultiRenderTarget(
                "mrt_" + name + mrtIndex,
                { width: this._voxelResolution, height: this._voxelResolution, depth: this._voxelResolution },
                this._maxDrawBuffers, // number of draw buffers
                this._scene,
                {
                    types: new Array(this._maxDrawBuffers).fill(Constants.TEXTURETYPE_UNSIGNED_BYTE),
                    samplingModes: new Array(this._maxDrawBuffers).fill(Constants.TEXTURE_TRILINEAR_SAMPLINGMODE),
                    generateMipMaps: false,
                    targetTypes,
                    formats: new Array(this._maxDrawBuffers).fill(Constants.TEXTUREFORMAT_R),
                    faceIndex: new Array(this._maxDrawBuffers).fill(0),
                    layerIndex: layerIndices,
                    layerCounts: new Array(this._maxDrawBuffers).fill(this._voxelResolution),
                    generateDepthBuffer: false,
                    generateStencilBuffer: false,
                },
                textureNames
            );

            mrt.clearColor = new Color4(0, 0, 0, 1);
            mrt.noPrePassRenderer = true;
            for (let i = 0; i < this._maxDrawBuffers; i++) {
                mrt.setInternalTexture(voxelRT.getInternalTexture()!, i);
            }

            mrtArray.push(mrt);
        }
        return mrtArray;
    }

    private _disposeVoxelTextures() {
        this._stopVoxelization();
        for (let i = 0; i < this._voxelMrtsZaxis.length; i++) {
            if (this._triPlanarVoxelization) {
                this._voxelMrtsXaxis[i].dispose(true);
                this._voxelMrtsYaxis[i].dispose(true);
            }
            this._voxelMrtsZaxis[i].dispose(true);
        }
        if (this._triPlanarVoxelization) {
            this._voxelGridXaxis?.dispose();
            this._voxelGridYaxis?.dispose();
            this._combinedVoxelGridPT?.dispose();
        }
        this._voxelGridZaxis?.dispose();
        for (const mip of this._mipArray) {
            mip.dispose();
        }
        this._voxelMaterial?.dispose();
        this._mipArray = [];
        this._voxelMrtsXaxis = [];
        this._voxelMrtsYaxis = [];
        this._voxelMrtsZaxis = [];
    }

    private _createVoxelMaterials(): void {
        const isWebGPU = this._engine.isWebGPU;
        this._voxelMaterial = new ShaderMaterial("voxelization", this._scene, "iblVoxelGrid", {
            uniforms: ["world", "viewMatrix", "invTransWorld", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
            defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblVoxelGrid.fragment"), import("../../ShadersWGSL/iblVoxelGrid.vertex")]);
                } else {
                    await Promise.all([import("../../Shaders/iblVoxelGrid.fragment"), import("../../Shaders/iblVoxelGrid.vertex")]);
                }
            },
        });

        this._voxelMaterial.cullBackFaces = false;
        this._voxelMaterial.backFaceCulling = false;
        this._voxelMaterial.depthFunction = Constants.ALWAYS;
    }

    /**
     * Checks if the voxel renderer is ready to voxelize scene
     * @returns true if the voxel renderer is ready to voxelize scene
     */
    public isReady() {
        let allReady = this.getVoxelGrid().isReady();
        for (let i = 0; i < this._mipArray.length; i++) {
            const mipReady = this._mipArray[i].isReady();
            allReady &&= mipReady;
        }

        if (!allReady || this._voxelizationInProgress) {
            return false;
        }

        return true;
    }

    /**
     * If the MRT's are already in the list of render targets, this will
     * remove them so that they don't get rendered again.
     */
    private _stopVoxelization() {
        // If the MRT's are already in the list of render targets, remove them.
        this._removeVoxelRTs(this._voxelMrtsXaxis);
        this._removeVoxelRTs(this._voxelMrtsYaxis);
        this._removeVoxelRTs(this._voxelMrtsZaxis);
        this._removeVoxelRTs([this._voxelGridRT]);
    }

    private _removeVoxelRTs(rts: RenderTargetTexture[]) {
        // const currentRTs = this._scene.customRenderTargets;
        const rtIdx = this._renderTargets.findIndex((rt) => {
            if (rt === rts[0]) {
                return true;
            }
            return false;
        });
        if (rtIdx >= 0) {
            this._renderTargets.splice(rtIdx, rts.length);
        } else {
            const rtIdx = this._scene.customRenderTargets.findIndex((rt) => {
                if (rt === rts[0]) {
                    return true;
                }
                return false;
            });
            if (rtIdx >= 0) {
                this._scene.customRenderTargets.splice(rtIdx, rts.length);
            }
        }
    }

    /**
     * Renders voxel grid of scene for IBL shadows
     * @param includedMeshes
     * @param registerAfterRenderObservable Whether to register scene onAfterRender callback (legacy path).
     */
    public updateVoxelGrid(includedMeshes: Mesh[], registerAfterRenderObservable: boolean = true) {
        if (this._voxelizationInProgress) {
            return;
        }
        this._stopVoxelization();
        this._voxelizationInProgress = true;

        if (this._engine.isWebGPU) {
            this._voxelGridRT.renderList = includedMeshes;
            this._addRTsForRender([this._voxelGridRT], includedMeshes, 0);
        } else if (this._triPlanarVoxelization) {
            this._addRTsForRender(this._voxelMrtsXaxis, includedMeshes, 0);
            this._addRTsForRender(this._voxelMrtsYaxis, includedMeshes, 1);
            this._addRTsForRender(this._voxelMrtsZaxis, includedMeshes, 2);
        } else {
            this._addRTsForRender(this._voxelMrtsZaxis, includedMeshes, 2);
        }
        if (registerAfterRenderObservable) {
            this._renderVoxelGridBound = this._renderVoxelGrid.bind(this);
            this._scene.onAfterRenderObservable.add(this._renderVoxelGridBound);
        }
    }

    /**
     * Advances voxelization work when running in custom render loops (for example FrameGraph tasks)
     * where scene onAfterRender timing may differ from classic pipeline flow.
     */
    public processVoxelization(): void {
        this._renderVoxelGrid();
    }

    private _renderVoxelGridBound: () => void;

    private _renderVoxelGrid() {
        if (this._voxelizationInProgress) {
            let allReady = this.getVoxelGrid().isReady();
            for (let i = 0; i < this._mipArray.length; i++) {
                const mipReady = this._mipArray[i].isReady();
                allReady &&= mipReady;
            }
            for (let i = 0; i < this._renderTargets.length; i++) {
                const rttReady = this._renderTargets[i].isReadyForRendering();
                allReady &&= rttReady;
            }
            if (!allReady) {
                return;
            }

            const copyMipEffect = this._copyMipEffectWrapper.effect;
            if (!copyMipEffect.isReady()) {
                return;
            }

            if (this._engine.isWebGPU) {
                // Clear the voxel grid storage texture.
                // Need to clear each layer individually.
                // Would a compute shader be faster here to clear all layers in one go?
                if (this._voxelGrid && this._voxelGrid.renderTarget) {
                    for (let layer = 0; layer < this._voxelResolution; layer++) {
                        this._engine.bindFramebuffer(this._voxelGrid.renderTarget, 0, undefined, undefined, true, 0, layer);
                        this._engine.clear(this._voxelClearColor, true, false, false);
                        this._engine.unBindFramebuffer(this._voxelGrid.renderTarget, true);
                    }
                }
            }

            for (const rt of this._renderTargets) {
                rt.render();
            }
            this._stopVoxelization();

            if (this._triPlanarVoxelization && !this._engine.isWebGPU) {
                this._combinedVoxelGridPT.render();
            }
            this._generateMipMaps();
            this._copyMipMaps();
            this._scene.onAfterRenderObservable.removeCallback(this._renderVoxelGridBound);
            this._voxelizationInProgress = false;
            this.onVoxelizationCompleteObservable.notifyObservers();
        }
    }

    private _addRTsForRender(mrts: RenderTargetTexture[], includedMeshes: Mesh[], axis: number) {
        const slabSize = 1.0 / this._computeNumberOfSlabs();
        const voxelMaterial = this._voxelMaterial;

        // We need to update the world scale uniform for every mesh being rendered to the voxel grid.
        for (let mrtIndex = 0; mrtIndex < mrts.length; mrtIndex++) {
            const mrt = mrts[mrtIndex];
            mrt._disableEngineStages = true;
            mrt.useCameraPostProcesses = false;
            mrt.renderParticles = false;
            mrt.renderSprites = false;
            mrt.enableOutlineRendering = false;

            mrt.customRenderFunction = (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes) => {
                const buckets = [depthOnlySubMeshes, opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes];
                for (const bucket of buckets) {
                    for (let index = 0; index < bucket.length; index++) {
                        const subMesh = bucket.data[index];
                        if (subMesh.getMaterial() !== voxelMaterial) {
                            continue;
                        }
                        subMesh.render(false);
                    }
                }
            };

            mrt.renderList = [];
            const nearPlane = mrtIndex * slabSize;
            const farPlane = (mrtIndex + 1) * slabSize;
            const stepSize = slabSize / this._maxDrawBuffers;

            const cameraPosition = new Vector3(0, 0, 0);
            let targetPosition = new Vector3(0, 0, 1);
            if (axis === 0) {
                targetPosition = new Vector3(1, 0, 0);
            } else if (axis === 1) {
                targetPosition = new Vector3(0, 1, 0);
            }
            let upDirection = new Vector3(0, 1, 0);
            if (axis === 1) {
                upDirection = new Vector3(1, 0, 0);
            }
            mrt.onBeforeRenderObservable.clear();
            mrt.onBeforeRenderObservable.add(() => {
                voxelMaterial.setMatrix("viewMatrix", Matrix.LookAtLH(cameraPosition, targetPosition, upDirection));
                voxelMaterial.setMatrix("invWorldScale", this._invWorldScaleMatrix);
                voxelMaterial.setFloat("nearPlane", nearPlane);
                voxelMaterial.setFloat("farPlane", farPlane);
                voxelMaterial.setFloat("stepSize", stepSize);
                if (this._engine.isWebGPU) {
                    this._voxelMaterial.useVertexPulling = true;
                    this._voxelMaterial.setTexture("voxel_storage", this.getVoxelGrid());
                }
            });

            // Set this material on every mesh in the scene (for this RT)
            if (includedMeshes.length === 0) {
                return;
            }
            for (const mesh of includedMeshes) {
                if (mesh) {
                    if (mesh.subMeshes && mesh.subMeshes.length > 0) {
                        mrt.renderList?.push(mesh);
                        mrt.setMaterialForRendering(mesh, voxelMaterial);
                    }
                    const meshes = mesh.getChildMeshes();
                    for (const childMesh of meshes) {
                        if (childMesh.subMeshes && childMesh.subMeshes.length > 0) {
                            mrt.renderList?.push(childMesh);
                            mrt.setMaterialForRendering(childMesh, voxelMaterial);
                        }
                    }
                }
            }
        }

        this._renderTargets = this._renderTargets.concat(mrts);
    }

    /**
     * Called by the pipeline to resize resources.
     */
    public resize() {}

    /**
     * Disposes the voxel renderer and associated resources
     */
    public dispose() {
        this._disposeVoxelTextures();
        // TODO - dispose all created voxel materials.
    }
}
