import { Constants } from "../Engines/constants";
import { Engine } from "../Engines/engine";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { RenderTargetTextureOptions } from "../Materials/Textures/renderTargetTexture";
import type { TextureSize } from "../Materials/Textures/textureCreationOptions";
import { Color4 } from "../Maths/math.color";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { Mesh } from "../Meshes/mesh";
import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { Logger } from "../Misc/logger";
import "../Shaders/voxelGrid.fragment";
import "../Shaders/voxelGrid.vertex";
import "../Shaders/voxelGrid2dArrayDebug.fragment";
import "../Shaders/voxelGrid3dDebug.fragment";
import { PostProcess } from "../PostProcesses/postProcess";
import { Vector4 } from "../Maths/math.vector";

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsVoxelRenderer {
    private _scene: Scene;
    private _engine: Engine;

    private _voxelGridRT: RenderTargetTexture;
    private _voxelGridXaxis: RenderTargetTexture;
    private _voxelGridYaxis: RenderTargetTexture;
    private _voxelGridZaxis: RenderTargetTexture;
    private _voxelMrtsXaxis: MultiRenderTarget[] = [];
    private _voxelMrtsYaxis: MultiRenderTarget[] = [];
    private _voxelMrtsZaxis: MultiRenderTarget[] = [];
    private _isVoxelGrid3D: boolean = true;
    public getVoxelGrid(): RenderTargetTexture {
        return this._voxelGridZaxis;
    }
    private _maxDrawBuffers: number;

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

    private _voxelResolution: number;

    public get voxelResolution(): number {
        return this._voxelResolution;
    }

    public set voxelResolution(resolution: number) {
        if (this._voxelResolution === resolution) {
            return;
        }
        this._voxelResolution = resolution;
        this._disposeTextures();
        this._createTextures();
    }

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
                ["voxelTexture"], // textures
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
                    effect.setTexture("voxelTexture", this._voxelGridRT);
                }
                effect.setVector4("sizeParams", this._debugSizeParams);
                effect.setFloat("mipNumber", this._debugMipNumber);
            };
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

        this._maxDrawBuffers = (this._engine as Engine)._gl.getParameter((this._engine as Engine)._gl.MAX_DRAW_BUFFERS);

        this._createTextures();
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
        const options: RenderTargetTextureOptions = {
            generateDepthBuffer: false,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_R,
            samplingMode: Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST,
            generateMipMaps: true,
        };

        this._voxelGridRT = new RenderTargetTexture("voxelGrid", size, this._scene, options);
        this._voxelGridXaxis = new RenderTargetTexture("voxelGridXaxis", size, this._scene, options);
        this._voxelGridYaxis = new RenderTargetTexture("voxelGridYaxis", size, this._scene, options);
        this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, options);

        // We can render up to maxDrawBuffers voxel slices of the grid per render.
        // We call this a slab.
        const numSlabs = this._computeNumberOfSlabs();
        this._voxelMrtsXaxis = this._createVoxelMRTs("x_axis_", this._voxelGridXaxis, numSlabs);
        this._voxelMrtsYaxis = this._createVoxelMRTs("y_axis_", this._voxelGridYaxis, numSlabs);
        this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);
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

    private _disposeTextures() {
        this._stopVoxelization();
        for (let i = 0; i < this._voxelMrtsXaxis.length; i++) {
            this._voxelMrtsXaxis[i].dispose(true);
            this._voxelMrtsYaxis[i].dispose(true);
            this._voxelMrtsZaxis[i].dispose(true);
        }
        this._voxelGridXaxis.dispose();
        this._voxelGridYaxis.dispose();
        this._voxelGridZaxis.dispose();
        this._voxelGridRT.dispose();
        this._voxelMrtsXaxis = [];
        this._voxelMrtsYaxis = [];
        this._voxelMrtsZaxis = [];
    }

    private _createVoxelMaterial(): ShaderMaterial {
        return new ShaderMaterial("voxelization", this._scene, "voxelGrid", {
            uniforms: ["world", "viewMatrix", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
            defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
        });
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
        this._removeVoxelMRTs(this._voxelMrtsXaxis);
        this._removeVoxelMRTs(this._voxelMrtsYaxis);
        this._removeVoxelMRTs(this._voxelMrtsZaxis);
    }

    private _removeVoxelMRTs(mrts: MultiRenderTarget[]) {
        const currentRTs = this._scene.customRenderTargets;
        const mrtIdx = currentRTs.findIndex((rt) => {
            if (rt === mrts[0]) return true;
            return false;
        });
        if (mrtIdx >= 0) {
            this._scene.customRenderTargets = this._scene.customRenderTargets.slice(0, -mrts.length);
        }
    }

    /**
     * Renders voxel grid of scene for IBL shadows
     * @param excludedMeshes
     */
    public updateVoxelGrid(excludedMeshes: number[]) {
        this._stopVoxelization();

        this._voxelizationInProgress = true;

        this._addMRTsForRender(this._voxelMrtsXaxis, excludedMeshes, 0);
        this._addMRTsForRender(this._voxelMrtsYaxis, excludedMeshes, 1);
        this._addMRTsForRender(this._voxelMrtsZaxis, excludedMeshes, 2);

        this._scene.onAfterRenderTargetsRenderObservable.addOnce(() => {
            // Remove the MRTs from the array so they don't get rendered again.
            // TODO - this seems to be removing the MRT's too early??
            setTimeout(() => {
                this._stopVoxelization();
                this._voxelizationInProgress = false;
                if (this._voxelGridRT.getInternalTexture()) {
                    this._engine.generateMipmaps(this._voxelGridRT.getInternalTexture()!);
                }
            }, 5000);
        });
    }

    private _addMRTsForRender(mrts: MultiRenderTarget[], excludedMeshes: number[], axis: number) {
        const slabSize = 1.0 / this._computeNumberOfSlabs();
        const meshes = this._scene.meshes;

        // We need to update the world scale uniform for every mesh being rendered to the voxel grid.
        mrts.forEach((mrt, mrtIndex) => {
            mrt.renderList = [];
            const nearPlane = mrtIndex * slabSize;
            const farPlane = (mrtIndex + 1) * slabSize;
            const stepSize = slabSize / this._maxDrawBuffers;
            // Logger.Log("Near plane for slab " + mrtIndex + " is " + nearPlane);
            // Logger.Log("Far plane for slab " + mrtIndex + " is " + farPlane);
            // Logger.Log("Size of slab " + mrtIndex + " is " + slabSize);
            const voxelMaterial = this._createVoxelMaterial();
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
            voxelMaterial.cullBackFaces = false;
            voxelMaterial.backFaceCulling = false;
            voxelMaterial.depthFunction = Engine.ALWAYS;

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
        this._disposeTextures();
        // TODO - dispose all created voxel materials.
    }
}
