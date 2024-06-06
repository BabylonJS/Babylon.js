import { Constants } from "../../Engines/constants";
import { Engine } from "../../Engines/engine";
import { WebGPUEngine } from "../../Engines/webgpuEngine";
import { ShaderMaterial } from "../../Materials/shaderMaterial";
import { MultiRenderTarget } from "../../Materials/Textures/multiRenderTarget";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { RenderTargetTextureOptions } from "../../Materials/Textures/renderTargetTexture";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { Color4 } from "../../Maths/math.color";
import { Matrix, Vector3, Vector4 } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import { Logger } from "../../Misc/logger";
import "../../Shaders/voxelGrid.fragment";
import "../../Shaders/voxelGrid.vertex";
import "../../Shaders/voxelGrid2dArrayDebug.fragment";
import "../../Shaders/voxelGrid3dDebug.fragment";
import "../../Shaders/voxelSlabDebug.vertex";
import "../../Shaders/voxelSlabDebug.fragment";
import "../../Shaders/combineVoxelGrids.fragment";
import "../../Shaders/generateVoxelMip.fragment";

import { PostProcess } from "../../PostProcesses/postProcess";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture";
import { EffectRenderer, EffectWrapper } from "../../Materials/effectRenderer";
import { BaseTexture } from "../../Materials/Textures/baseTexture";

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsVoxelRenderer {
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
    public getVoxelGrid(): ProceduralTexture | RenderTargetTexture {
        if (this._threeWayVoxelization) {
            return this._voxelGridRT;
        } else {
            return this._voxelGridZaxis;
        }
    }
    private _maxDrawBuffers: number;

    private _threeWayVoxelization: boolean = true;
    private _voxelizationInProgress: boolean = false;
    private _invWorldScaleMatrix: Matrix;
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

    public get voxelResolution(): number {
        return this._voxelResolution;
    }

    public set voxelResolution(resolution: number) {
        if (this._voxelResolution === resolution) {
            return;
        }
        this._voxelResolution = resolution;
        this._disposeVoxelTextures();
        this._createTextures();
    }

    private _mipRT: BaseTexture;
    private _mipEffectRenderer: EffectRenderer;
    private _mipEffectWrapper: EffectWrapper;
    private _mipArray: ProceduralTexture[] = [];

    private _voxelSlabDebugRT: RenderTargetTexture;
    private _voxelDebugPass: PostProcess;
    private _voxelDebugEnabled: boolean = false;
    private _voxelDebugAxis: number = -1;
    public set voxelDebugAxis(axis: number) {
        this._voxelDebugAxis = axis;
    }
    public get voxelDebugAxis(): number {
        return this._voxelDebugAxis;
    }
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    private _debugMipNumber: number = 0;
    public setDebugMipNumber(mipNum: number) {
        this._debugMipNumber = mipNum;
    }
    public get voxelDebugEnabled(): boolean {
        return this._voxelDebugEnabled;
    }

    public set voxelDebugEnabled(enabled: boolean) {
        if (this._voxelDebugEnabled === enabled) {
            return;
        }
        this._voxelDebugEnabled = enabled;
        if (enabled) {
            this._voxelDebugPass = new PostProcess(
                "Final compose shader",
                this._isVoxelGrid3D ? "voxelGrid3dDebug" : "voxelGrid2dArrayDebug",
                ["sizeParams", "mipNumber"], // attributes
                ["voxelTexture", "voxelSlabTexture"], // textures
                1.0, // options
                this._scene.activeCamera, // camera
                Texture.NEAREST_SAMPLINGMODE, // sampling
                this._engine, // engine,
                true
            );
            this._voxelDebugPass.onApply = (effect) => {
                // update the caustic texture with what we just rendered.
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
            };
            this._voxelSlabDebugRT = new RenderTargetTexture("voxelSlabDebug", { ratio: 1 }, this._scene, {
                generateDepthBuffer: true,
                generateMipMaps: false,
                type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                format: Constants.TEXTUREFORMAT_RGBA,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            });
        } else {
            if (this._voxelSlabDebugRT) {
                this._removeVoxelRTs([this._voxelSlabDebugRT]);
            }
        }
    }

    /**
     * Instanciates the voxel renderer
     * @param scene Scene to attach to
     * @param resolution Number of depth layers to peel
     * @returns The voxel renderer
     */
    constructor(scene: Scene, resolution: number = 256) {
        this._scene = scene;
        this._engine = scene.getEngine() as Engine;
        this._voxelResolution = resolution;

        if (!this._engine.getCaps().drawBuffersExtension) {
            Logger.Error("Can't do voxel rendering without the draw buffers extension.");
        }

        if (this._engine instanceof WebGPUEngine) {
            this._maxDrawBuffers = 8; // TODO - get this from the WebGPU engine?
        } else {
            this._maxDrawBuffers = (this._engine as Engine)._gl.getParameter((this._engine as Engine)._gl.MAX_DRAW_BUFFERS);
        }

        this._mipEffectRenderer = new EffectRenderer(this._engine);
        this._mipEffectWrapper = new EffectWrapper({
            engine: this._engine,
            fragmentShader: "pass",
            useShaderStore: true,
            samplerNames: ["textureSampler"],
        });

        this._createTextures();
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

        // Now, copy this mip into the mip chain of the voxel grid.
        // TODO - this currently isn't working. "textureSampler" isn't being properly set to mipTarget.
        const rt = (this.getVoxelGrid() as any)._rtWrapper;
        if (rt) {
            this._mipEffectRenderer.saveStates();
            const bindSize = mipTarget.getSize().width;
            // Render to each layer of the voxel grid.
            for (let layer = 0; layer < bindSize; layer++) {
                this._mipEffectWrapper.effect.setTexture("textureSampler", mipTarget);
                this._engine.bindFramebuffer(rt, 0, bindSize, bindSize, true, lodLevel, layer);
                this._mipEffectRenderer.applyEffectWrapper(this._mipEffectWrapper);
                this._mipEffectRenderer.draw();
            }
            this._mipEffectRenderer.restoreStates();
            this._engine.unBindFramebuffer(rt, true);
        }
    }

    private _computeNumberOfSlabs(): number {
        return Math.ceil(this._voxelResolution / this._maxDrawBuffers);
    }

    private _createTextures() {
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
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        };

        // We can render up to maxDrawBuffers voxel slices of the grid per render.
        // We call this a slab.
        const numSlabs = this._computeNumberOfSlabs();
        const voxelCombinedOptions: RenderTargetTextureOptions = {
            generateDepthBuffer: false,
            generateMipMaps: true,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST,
        };
        if (this._threeWayVoxelization) {
            this._voxelGridXaxis = new RenderTargetTexture("voxelGridXaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridYaxis = new RenderTargetTexture("voxelGridYaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelAxisOptions);
            this._voxelMrtsXaxis = this._createVoxelMRTs("x_axis_", this._voxelGridXaxis, numSlabs);
            this._voxelMrtsYaxis = this._createVoxelMRTs("y_axis_", this._voxelGridYaxis, numSlabs);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);

            this._voxelGridRT = new ProceduralTexture("combinedVoxelGrid", size, "combineVoxelGrids", this._scene, voxelCombinedOptions, true);
            this._voxelGridRT.setFloat("layer", 0.0);
            this._voxelGridRT.setTexture("voxelXaxisSampler", this._voxelGridXaxis);
            this._voxelGridRT.setTexture("voxelYaxisSampler", this._voxelGridYaxis);
            this._voxelGridRT.setTexture("voxelZaxisSampler", this._voxelGridZaxis);
            // We will render this only after voxelization is completed for the 3 axes.
            this._voxelGridRT.autoClear = false;
            this._voxelGridRT.refreshRate = 0;
            this._voxelGridRT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._voxelGridRT.wrapV = Texture.CLAMP_ADDRESSMODE;

            this._mipRT = new BaseTexture(this._scene, this._voxelGridRT.getInternalTexture());
            this._mipRT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._mipRT.wrapV = Texture.CLAMP_ADDRESSMODE;
        } else {
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelCombinedOptions);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);
            this._mipRT = new BaseTexture(this._scene, this._voxelGridZaxis.getInternalTexture());
        }

        this._mipArray = new Array(Math.ceil(Math.log2(this._voxelResolution)));
        for (let mipIdx = 1; mipIdx <= this._mipArray.length; mipIdx++) {
            const mipDim = this._voxelResolution >> mipIdx;
            const mipSize: TextureSize = { width: mipDim, height: mipDim, depth: mipDim };
            this._mipArray[mipIdx - 1] = new ProceduralTexture("voxelMip" + mipIdx, mipSize, "generateVoxelMip", this._scene, voxelAxisOptions);

            const mipTarget = this._mipArray[mipIdx - 1];
            mipTarget.refreshRate = 0;
            mipTarget.autoClear = false;
            mipTarget.wrapU = Texture.CLAMP_ADDRESSMODE;
            mipTarget.wrapV = Texture.CLAMP_ADDRESSMODE;
            mipTarget.setTexture("srcMip", mipIdx > 1 ? this._mipArray[mipIdx - 2] : this._voxelGridRT);
            mipTarget.setInt("layerNum", 0);
        }
        // this._voxelGridRT.onGeneratedObservable.add(() => {
        //     this._generateMipMaps();
        // });
    }

    private _createVoxelMRTs(name: string, voxelRT: RenderTargetTexture, numSlabs: number): MultiRenderTarget[] {
        const mrtArray: MultiRenderTarget[] = [];
        const targetTypes = new Array(this._maxDrawBuffers).fill(-1);
        targetTypes[0] = this._isVoxelGrid3D ? Constants.TEXTURE_3D : Constants.TEXTURE_2D_ARRAY;

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
            if (this._threeWayVoxelization) {
                this._voxelMrtsXaxis[i].dispose(true);
                this._voxelMrtsYaxis[i].dispose(true);
            }
            this._voxelMrtsZaxis[i].dispose(true);
        }
        if (this._threeWayVoxelization) {
            this._voxelGridXaxis.dispose();
            this._voxelGridYaxis.dispose();
            this._voxelGridRT.dispose();
        }
        this._voxelGridZaxis.dispose();
        this._mipArray.forEach((mip) => {
            mip.dispose();
        });
        this._mipArray = [];
        this._voxelMrtsXaxis = [];
        this._voxelMrtsYaxis = [];
        this._voxelMrtsZaxis = [];
    }

    private _createVoxelMaterial(): ShaderMaterial {
        const voxelMaterial = new ShaderMaterial("voxelization", this._scene, "voxelGrid", {
            uniforms: ["world", "viewMatrix", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
            defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
        });
        voxelMaterial.cullBackFaces = false;
        voxelMaterial.backFaceCulling = false;
        voxelMaterial.depthFunction = Engine.ALWAYS;
        return voxelMaterial;
    }

    /**
     * Checks if the voxel renderer is ready to voxelize scene
     * @returns true if the voxel renderer is ready to voxelize scene
     */
    public isReady() {
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
        const currentRTs = this._scene.customRenderTargets;
        const rtIdx = currentRTs.findIndex((rt) => {
            if (rt === rts[0]) return true;
            return false;
        });
        if (rtIdx >= 0) {
            this._scene.customRenderTargets.splice(rtIdx, rts.length);
        }
    }

    /**
     * Renders voxel grid of scene for IBL shadows
     * @param excludedMeshes
     */
    public updateVoxelGrid(excludedMeshes: number[]) {
        this._stopVoxelization();

        this._voxelizationInProgress = true;

        if (this._threeWayVoxelization) {
            this._addRTsForRender(this._voxelMrtsXaxis, excludedMeshes, 0);
            this._addRTsForRender(this._voxelMrtsYaxis, excludedMeshes, 1);
            this._addRTsForRender(this._voxelMrtsZaxis, excludedMeshes, 2);
        } else {
            this._addRTsForRender(this._voxelMrtsZaxis, excludedMeshes, 2);
        }

        // Add the slab debug RT if needed.
        if (this._voxelDebugEnabled) {
            this._addRTsForRender([this._voxelSlabDebugRT], [], this._voxelDebugAxis, 1);
        }

        this._scene.onAfterRenderTargetsRenderObservable.addOnce(() => {
            // Remove the MRTs from the array so they don't get rendered again.
            // TODO - we seem to be removing the MRT's too early if we don't have a timeout here. Why?
            setTimeout(() => {
                this._stopVoxelization();

                if (this._threeWayVoxelization) {
                    // TODO - is this actually preventing WebGL from generating mipmaps? It doesn't seem to be.
                    this._voxelGridRT._generateMipMaps = false;
                    this._voxelGridRT.render();
                }
                this._generateMipMaps();

                this._voxelizationInProgress = false;
            }, 1000);
        });
    }

    private _addRTsForRender(mrts: RenderTargetTexture[], excludedMeshes: number[], axis: number, shaderType: number = 0) {
        const slabSize = 1.0 / this._computeNumberOfSlabs();
        const meshes = this._scene.meshes;

        // We need to update the world scale uniform for every mesh being rendered to the voxel grid.
        mrts.forEach((mrt, mrtIndex) => {
            mrt.renderList = [];
            const nearPlane = mrtIndex * slabSize;
            const farPlane = (mrtIndex + 1) * slabSize;
            const stepSize = slabSize / this._maxDrawBuffers;

            let voxelMaterial: ShaderMaterial;
            if (shaderType === 0) {
                voxelMaterial = this._createVoxelMaterial();
            } else {
                voxelMaterial = new ShaderMaterial("voxelSlabDebug", this._scene, "voxelSlabDebug", {
                    uniforms: ["world", "viewMatrix", "cameraViewMatrix", "projection", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
                    defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
                });
                this._scene.onBeforeRenderObservable.add((effect) => {
                    voxelMaterial.setMatrix("projection", this._scene.activeCamera!.getProjectionMatrix());
                    voxelMaterial.setMatrix("cameraViewMatrix", this._scene.activeCamera!.getViewMatrix());
                });
            }
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
            voxelMaterial.setMatrix("viewMatrix", Matrix.LookAtLH(cameraPosition, targetPosition, upDirection));
            voxelMaterial.setMatrix("invWorldScale", this._invWorldScaleMatrix);
            voxelMaterial.setFloat("nearPlane", nearPlane);
            voxelMaterial.setFloat("farPlane", farPlane);
            voxelMaterial.setFloat("stepSize", stepSize);

            // Set this material on every mesh in the scene (for this RT)
            meshes.forEach((mesh) => {
                if (mesh instanceof Mesh && mesh.material && excludedMeshes.indexOf(mesh.uniqueId) === -1) {
                    mrt.renderList?.push(mesh);

                    // TODO - if the mesh already has a voxel material applied, don't create a new one.
                    // mesh.getMaterialForRenderPass(mrt.renderPassIds)
                    mrt.setMaterialForRendering(mesh, voxelMaterial);
                }
            });
        });

        // Add the MRT's to render.
        this._scene.customRenderTargets = this._scene.customRenderTargets.concat(mrts);
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
        // TODO - dispose all created voxel materials.
    }
}
