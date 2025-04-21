import { Constants } from "../../Engines/constants";
import { Engine } from "../../Engines/engine";
import { ShaderMaterial } from "../../Materials/shaderMaterial";
import { MultiRenderTarget } from "../../Materials/Textures/multiRenderTarget";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { RenderTargetTextureOptions } from "../../Materials/Textures/renderTargetTexture";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { Color4 } from "../../Maths/math.color";
import { Matrix, Vector3, Vector4 } from "../../Maths/math.vector";
import type { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "../../Materials/Textures/Procedurals/proceduralTexture";
import { EffectRenderer, EffectWrapper } from "../../Materials/effectRenderer";
import type { IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";
import type { RenderTargetWrapper } from "core/Engines";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 * @see https://playground.babylonjs.com/#8R5SSE#222
 */
export class _IblShadowsVoxelRenderer {
    private _scene: Scene;
    private _engine: Engine;
    private _voxelGridRT: ProceduralTexture;
    private _voxelGridXaxis: RenderTargetTexture;
    private _voxelGridYaxis: RenderTargetTexture;
    private _voxelGridZaxis: RenderTargetTexture;
    private _voxelMrtsXaxis: MultiRenderTarget[] = [];
    private _voxelMrtsYaxis: MultiRenderTarget[] = [];
    private _voxelMrtsZaxis: MultiRenderTarget[] = [];
    private _isVoxelGrid3D: boolean = true;
    private _voxelMaterial: ShaderMaterial;
    private _voxelSlabDebugMaterial: ShaderMaterial;

    /**
     * Return the voxel grid texture.
     * @returns The voxel grid texture.
     */
    public getVoxelGrid(): ProceduralTexture | RenderTargetTexture {
        if (this._triPlanarVoxelization) {
            return this._voxelGridRT;
        } else {
            return this._voxelGridZaxis;
        }
    }

    /**
     * Observable that triggers when the voxelization is complete
     */
    public onVoxelizationCompleteObservable: Observable<void> = new Observable<void>();

    /**
     * The debug pass post process
     * @returns The debug pass post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._voxelDebugPass) {
            this._createDebugPass();
        }
        return this._voxelDebugPass;
    }

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
    private _mipArray: ProceduralTexture[] = [];

    private _voxelSlabDebugRT: RenderTargetTexture;
    private _voxelDebugPass: PostProcess;
    private _voxelDebugEnabled: boolean = false;

    /**
     * Shows only the voxels that were rendered along a particular axis (while using triPlanarVoxelization).
     * If not set, the combined voxel grid will be shown.
     * Note: This only works when the debugMipNumber is set to 0 because we don't generate mips for each axis.
     * @param axis The axis to show (0 = x, 1 = y, 2 = z)
     */
    public set voxelDebugAxis(axis: number) {
        this._voxelDebugAxis = axis;
    }

    public get voxelDebugAxis(): number {
        return this._voxelDebugAxis;
    }
    private _voxelDebugAxis: number = -1;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    private _includedMeshes: Mesh[] = [];

    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    private _debugMipNumber: number = 0;
    /**
     * The mip level to show in the debug display
     * @param mipNum The mip level to show in the debug display
     */
    public setDebugMipNumber(mipNum: number) {
        this._debugMipNumber = mipNum;
    }
    private _debugPassName: string = "Voxelization Debug Pass";
    /**
     * Sets the name of the debug pass
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }

    /**
     * Enable or disable the debug view for this pass
     */
    public get voxelDebugEnabled(): boolean {
        return this._voxelDebugEnabled;
    }

    public set voxelDebugEnabled(enabled: boolean) {
        if (this._voxelDebugEnabled === enabled) {
            return;
        }
        this._voxelDebugEnabled = enabled;
        if (enabled) {
            this._voxelSlabDebugRT = new RenderTargetTexture("voxelSlabDebug", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this._scene, {
                generateDepthBuffer: true,
                generateMipMaps: false,
                type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                format: Constants.TEXTUREFORMAT_RGBA,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            });
            this._voxelSlabDebugRT.noPrePassRenderer = true;
        }
        if (this._voxelSlabDebugRT) {
            this._removeVoxelRTs([this._voxelSlabDebugRT]);
        }
        // Add the slab debug RT if needed.
        if (this._voxelDebugEnabled) {
            this._addRTsForRender([this._voxelSlabDebugRT], this._includedMeshes, this._voxelDebugAxis, 1, true);
            this._setDebugBindingsBound = this._setDebugBindings.bind(this);
            this._scene.onBeforeRenderObservable.add(this._setDebugBindingsBound);
        } else {
            this._scene.onBeforeRenderObservable.removeCallback(this._setDebugBindingsBound);
        }
    }

    private _setDebugBindingsBound: () => void;
    /**
     * Creates the debug post process effect for this pass
     */
    private _createDebugPass() {
        const isWebGPU = this._engine.isWebGPU;
        if (!this._voxelDebugPass) {
            const debugOptions: PostProcessOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                textureFormat: Constants.TEXTUREFORMAT_RGBA,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                uniforms: ["sizeParams", "mipNumber"],
                samplers: ["voxelTexture", "voxelSlabTexture"],
                engine: this._engine,
                reusable: false,
                shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
                extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                    if (this._isVoxelGrid3D) {
                        if (useWebGPU) {
                            list.push(import("../../ShadersWGSL/iblVoxelGrid3dDebug.fragment"));
                        } else {
                            list.push(import("../../Shaders/iblVoxelGrid3dDebug.fragment"));
                        }
                        return;
                    }
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblVoxelGrid2dArrayDebug.fragment"));
                    } else {
                        list.push(import("../../Shaders/iblVoxelGrid2dArrayDebug.fragment"));
                    }
                },
            };
            this._voxelDebugPass = new PostProcess(this.debugPassName, this._isVoxelGrid3D ? "iblVoxelGrid3dDebug" : "iblVoxelGrid2dArrayDebug", debugOptions);
            this._voxelDebugPass.onApplyObservable.add((effect) => {
                if (this._voxelDebugAxis === 0) {
                    effect.setTexture("voxelTexture", this._voxelGridXaxis);
                } else if (this._voxelDebugAxis === 1) {
                    effect.setTexture("voxelTexture", this._voxelGridYaxis);
                } else if (this._voxelDebugAxis === 2) {
                    effect.setTexture("voxelTexture", this._voxelGridZaxis);
                } else {
                    effect.setTexture("voxelTexture", this.getVoxelGrid());
                }
                effect.setTexture("voxelSlabTexture", this._voxelSlabDebugRT);
                effect.setVector4("sizeParams", this._debugSizeParams);
                effect.setFloat("mipNumber", this._debugMipNumber);
            });
        }
    }

    /**
     * Instanciates the voxel renderer
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The render pipeline this pass is associated with
     * @param resolutionExp Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     * @param triPlanarVoxelization Whether to use tri-planar voxelization. More expensive, but can help with artifacts.
     * @returns The voxel renderer
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline, resolutionExp: number = 6, triPlanarVoxelization: boolean = true) {
        this._scene = scene;
        this._engine = scene.getEngine() as Engine;
        this._triPlanarVoxelization = triPlanarVoxelization;
        if (!this._engine.getCaps().drawBuffersExtension) {
            Logger.Error("Can't do voxel rendering without the draw buffers extension.");
        }

        const isWebGPU = this._engine.isWebGPU;
        this._maxDrawBuffers = this._engine.getCaps().maxDrawBuffers || 0;

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
        // TODO - this currently isn't working. "textureSampler" isn't being properly set to mipTarget.
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
            const bindSize = mipTarget.getSize().width;

            // Render to each layer of the voxel grid.
            for (let layer = 0; layer < bindSize; layer++) {
                this._engine.bindFramebuffer(rt, 0, bindSize, bindSize, true, lodLevel, layer);
                this._copyMipEffectRenderer.applyEffectWrapper(this._copyMipEffectWrapper);
                this._copyMipEffectWrapper.effect.setTexture("textureSampler", mipTarget);
                this._copyMipEffectWrapper.effect.setInt("layerNum", layer);
                this._copyMipEffectRenderer.draw();
                this._engine.unBindFramebuffer(rt, true);
            }
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
            layers: this._isVoxelGrid3D ? undefined : this._voxelResolution,
            depth: this._isVoxelGrid3D ? this._voxelResolution : undefined,
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
        if (this._triPlanarVoxelization) {
            this._voxelGridXaxis = new RenderTargetTexture("voxelGridXaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridYaxis = new RenderTargetTexture("voxelGridYaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelAxisOptions);
            this._voxelMrtsXaxis = this._createVoxelMRTs("x_axis_", this._voxelGridXaxis, numSlabs);
            this._voxelMrtsYaxis = this._createVoxelMRTs("y_axis_", this._voxelGridYaxis, numSlabs);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);

            this._voxelGridRT = new ProceduralTexture("combinedVoxelGrid", size, "iblCombineVoxelGrids", this._scene, voxelCombinedOptions, false);
            this._scene.proceduralTextures.splice(this._scene.proceduralTextures.indexOf(this._voxelGridRT), 1);
            this._voxelGridRT.setFloat("layer", 0.0);
            this._voxelGridRT.setTexture("voxelXaxisSampler", this._voxelGridXaxis);
            this._voxelGridRT.setTexture("voxelYaxisSampler", this._voxelGridYaxis);
            this._voxelGridRT.setTexture("voxelZaxisSampler", this._voxelGridZaxis);
            // We will render this only after voxelization is completed for the 3 axes.
            this._voxelGridRT.autoClear = false;
            this._voxelGridRT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._voxelGridRT.wrapV = Texture.CLAMP_ADDRESSMODE;
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
        const targetTypes = new Array(this._maxDrawBuffers).fill(this._isVoxelGrid3D ? Constants.TEXTURE_3D : Constants.TEXTURE_2D_ARRAY);

        for (let mrt_index = 0; mrt_index < numSlabs; mrt_index++) {
            let layerIndices = new Array(this._maxDrawBuffers).fill(0);
            layerIndices = layerIndices.map((value, index) => mrt_index * this._maxDrawBuffers + index);

            let textureNames = new Array(this._maxDrawBuffers).fill("");
            textureNames = textureNames.map((value, index) => "voxel_grid_" + name + (mrt_index * this._maxDrawBuffers + index));

            const mrt = new MultiRenderTarget(
                "mrt_" + name + mrt_index,
                { width: this._voxelResolution, height: this._voxelResolution, depth: this._isVoxelGrid3D ? this._voxelResolution : undefined },
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
            this._voxelGridRT?.dispose();
        }
        this._voxelGridZaxis?.dispose();
        for (const mip of this._mipArray) {
            mip.dispose();
        }
        this._voxelMaterial?.dispose();
        this._voxelSlabDebugMaterial?.dispose();
        this._mipArray = [];
        this._voxelMrtsXaxis = [];
        this._voxelMrtsYaxis = [];
        this._voxelMrtsZaxis = [];
    }

    private _createVoxelMaterials(): void {
        const isWebGPU = this._engine.isWebGPU;
        this._voxelMaterial = new ShaderMaterial("voxelization", this._scene, "iblVoxelGrid", {
            uniforms: ["world", "viewMatrix", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
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
        this._voxelMaterial.depthFunction = Engine.ALWAYS;

        this._voxelSlabDebugMaterial = new ShaderMaterial("voxelSlabDebug", this._scene, "iblVoxelSlabDebug", {
            uniforms: ["world", "viewMatrix", "cameraViewMatrix", "projection", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
            defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblVoxelSlabDebug.fragment"), import("../../ShadersWGSL/iblVoxelSlabDebug.vertex")]);
                } else {
                    await Promise.all([import("../../Shaders/iblVoxelSlabDebug.fragment"), import("../../Shaders/iblVoxelSlabDebug.vertex")]);
                }
            },
        });
    }

    private _setDebugBindings() {
        this._voxelSlabDebugMaterial.setMatrix("projection", this._scene.activeCamera!.getProjectionMatrix());
        this._voxelSlabDebugMaterial.setMatrix("cameraViewMatrix", this._scene.activeCamera!.getViewMatrix());
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
    }

    private _removeVoxelRTs(rts: RenderTargetTexture[]) {
        // const currentRTs = this._scene.customRenderTargets;
        const rtIdx = this._renderTargets.findIndex((rt) => {
            if (rt === rts[0]) return true;
            return false;
        });
        if (rtIdx >= 0) {
            this._renderTargets.splice(rtIdx, rts.length);
        } else {
            const rtIdx = this._scene.customRenderTargets.findIndex((rt) => {
                if (rt === rts[0]) return true;
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
     */
    public updateVoxelGrid(includedMeshes: Mesh[]) {
        this._stopVoxelization();
        this._includedMeshes = includedMeshes;
        this._voxelizationInProgress = true;

        if (this._triPlanarVoxelization) {
            this._addRTsForRender(this._voxelMrtsXaxis, includedMeshes, 0);
            this._addRTsForRender(this._voxelMrtsYaxis, includedMeshes, 1);
            this._addRTsForRender(this._voxelMrtsZaxis, includedMeshes, 2);
        } else {
            this._addRTsForRender(this._voxelMrtsZaxis, includedMeshes, 2);
        }
        if (this._voxelDebugEnabled) {
            this._addRTsForRender([this._voxelSlabDebugRT], includedMeshes, this._voxelDebugAxis, 1, true);
        }
        this._renderVoxelGridBound = this._renderVoxelGrid.bind(this);
        this._scene.onAfterRenderObservable.add(this._renderVoxelGridBound);
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
            if (allReady) {
                for (const rt of this._renderTargets) {
                    rt.render();
                }
                this._stopVoxelization();

                if (this._triPlanarVoxelization) {
                    this._voxelGridRT.render();
                }
                this._generateMipMaps();
                this._copyMipEffectWrapper.effect.whenCompiledAsync().then(() => {
                    this._copyMipMaps();
                    this._scene.onAfterRenderObservable.removeCallback(this._renderVoxelGridBound);
                    this._voxelizationInProgress = false;
                    this.onVoxelizationCompleteObservable.notifyObservers();
                });
            }
        }
    }

    private _addRTsForRender(mrts: RenderTargetTexture[], includedMeshes: Mesh[], axis: number, shaderType: number = 0, continuousRender: boolean = false) {
        const slabSize = 1.0 / this._computeNumberOfSlabs();
        let voxelMaterial: ShaderMaterial;
        if (shaderType === 0) {
            voxelMaterial = this._voxelMaterial;
        } else {
            voxelMaterial = this._voxelSlabDebugMaterial;
        }

        // We need to update the world scale uniform for every mesh being rendered to the voxel grid.
        for (let mrtIndex = 0; mrtIndex < mrts.length; mrtIndex++) {
            const mrt = mrts[mrtIndex];
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
            mrt.onBeforeRenderObservable.add(() => {
                voxelMaterial.setMatrix("viewMatrix", Matrix.LookAtLH(cameraPosition, targetPosition, upDirection));
                voxelMaterial.setMatrix("invWorldScale", this._invWorldScaleMatrix);
                voxelMaterial.setFloat("nearPlane", nearPlane);
                voxelMaterial.setFloat("farPlane", farPlane);
                voxelMaterial.setFloat("stepSize", stepSize);
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

        // Add the MRT's to render.
        if (continuousRender) {
            for (const mrt of mrts) {
                if (this._scene.customRenderTargets.indexOf(mrt) === -1) {
                    this._scene.customRenderTargets.push(mrt);
                }
            }
        } else {
            this._renderTargets = this._renderTargets.concat(mrts);
        }
    }

    /**
     * Called by the pipeline to resize resources.
     */
    public resize() {
        this._voxelSlabDebugRT?.resize({ width: this._scene.getEngine().getRenderWidth(), height: this._scene.getEngine().getRenderHeight() });
    }

    /**
     * Disposes the voxel renderer and associated resources
     */
    public dispose() {
        this._disposeVoxelTextures();
        if (this._voxelSlabDebugRT) {
            this._removeVoxelRTs([this._voxelSlabDebugRT]);
            this._voxelSlabDebugRT.dispose();
        }
        if (this._voxelDebugPass) {
            this._voxelDebugPass.dispose();
        }
        // TODO - dispose all created voxel materials.
    }
}
