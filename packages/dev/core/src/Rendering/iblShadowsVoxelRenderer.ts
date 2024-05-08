import { Constants } from "../Engines/constants";
import { Engine } from "../Engines/engine";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Color4 } from "../Maths/math.color";
import type { Matrix } from "../Maths/math.vector";
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
    private _voxelMrts: MultiRenderTarget[] = [];
    private _isVoxelGrid3D: boolean = true;
    public getVoxelGrid(): RenderTargetTexture {
        return this._voxelGridRT;
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
                ["sizeParams"], // attributes
                ["voxelTexture"], // textures
                1.0, // options
                this._scene.activeCamera, // camera
                Texture.NEAREST_SAMPLINGMODE, // sampling
                this._engine, // engine,
                true,
                "#define MIP_NUMBER " + this._debugMipNumber
            );
            this._voxelDebugPass.onApply = (effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTexture("voxelTexture", this._voxelGridRT);
                effect.setVector4("sizeParams", this._debugSizeParams);
                effect.setFloat("mipNumber", this._debugMipNumber);
                effect.defines = "#define MIP_NUMBER " + this._debugMipNumber;
            };
        }
    }

    /**
     * Instanciates the voxel renderer
     * @param scene Scene to attach to
     * @param resolution Number of depth layers to peel
     * @returns The voxel renderer
     */
    constructor(scene: Scene, resolution: number = 64) {
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
        this._voxelGridRT = new RenderTargetTexture(
            "voxelGrid",
            {
                width: this._voxelResolution,
                height: this._voxelResolution,
                layers: this._isVoxelGrid3D ? undefined : this._voxelResolution,
                depth: this._isVoxelGrid3D ? this._voxelResolution : undefined,
            },
            this._scene,
            {
                generateDepthBuffer: false,
                type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                format: Constants.TEXTUREFORMAT_R,
                samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
                generateMipMaps: true,
            }
        );

        // We can render up to maxDrawBuffers voxel slices of the grid per render.
        // We call this a slab.
        const numSlabs = this._computeNumberOfSlabs();
        const targetTypes = new Array(this._maxDrawBuffers).fill(-1);
        targetTypes[0] = this._isVoxelGrid3D ? Constants.TEXTURE_3D : Constants.TEXTURE_2D_ARRAY;

        for (let mrt_index = 0; mrt_index < numSlabs; mrt_index++) {
            let layerIndices = new Array(this._maxDrawBuffers).fill(0);
            layerIndices = layerIndices.map((value, index) => mrt_index * this._maxDrawBuffers + index);

            let textureNames = new Array(this._maxDrawBuffers).fill("");
            textureNames = textureNames.map((value, index) => "voxel_grid_" + (mrt_index * this._maxDrawBuffers + index));

            const mrt = new MultiRenderTarget(
                "mrt" + mrt_index,
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
                mrt.setInternalTexture(this._voxelGridRT.getInternalTexture()!, i);
            }

            this._voxelMrts.push(mrt);
        }
    }

    private _disposeTextures() {
        for (let i = 0; i < this._voxelMrts.length; i++) {
            this._voxelMrts[i].dispose(true);
        }
        this._voxelGridRT.dispose();
        this._voxelMrts = [];
    }

    private _createVoxelMaterial(): ShaderMaterial {
        return new ShaderMaterial("voxelization", this._scene, "voxelGrid", {
            uniforms: ["world", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
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
     * Renders voxel grid of scene for IBL shadows
     * @param excludedMeshes
     */
    public updateVoxelGrid(excludedMeshes: number[]) {
        // If the MRT's are already in the list of render targets, remove them.
        const currentRTs = this._scene.customRenderTargets;
        const mrtIdx = currentRTs.findIndex((rt) => {
            if (rt === this._voxelMrts[0]) return true;
            return false;
        });
        if (mrtIdx >= 0) {
            this._scene.customRenderTargets = this._scene.customRenderTargets.slice(0, -this._voxelMrts.length);
        }

        this._voxelizationInProgress = true;

        const slabSize = 1.0 / this._computeNumberOfSlabs();
        const meshes = this._scene.meshes;

        // We need to update the world scale uniform for every mesh being rendered to the voxel grid.
        this._voxelMrts.forEach((mrt, mrtIndex) => {
            mrt.renderList = [];
            const nearPlane = mrtIndex * slabSize;
            const farPlane = (mrtIndex + 1) * slabSize;
            const stepSize = slabSize / this._maxDrawBuffers;
            // Logger.Log("Near plane for slab " + mrtIndex + " is " + nearPlane);
            // Logger.Log("Far plane for slab " + mrtIndex + " is " + farPlane);
            // Logger.Log("Size of slab " + mrtIndex + " is " + slabSize);
            const voxelMaterial = this._createVoxelMaterial();
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
        this._scene.customRenderTargets = currentRTs.concat(this._voxelMrts);

        this._scene.onAfterRenderTargetsRenderObservable.addOnce(() => {
            // Remove the MRTs from the array so they don't get rendered again.
            // TODO - this seems to be removing the MRT's too early??
            setTimeout(() => {
                this._scene.customRenderTargets = this._scene.customRenderTargets.slice(0, -this._voxelMrts.length);
                this._voxelizationInProgress = false;
                if (this._voxelGridRT.getInternalTexture()) {
                    this._engine.generateMipmaps(this._voxelGridRT.getInternalTexture()!);
                }
            }, 5000);
        });
    }

    /**
     * Disposes the voxel renderer and associated resources
     */
    public dispose() {
        this._disposeTextures();
        // TODO - dispose all created voxel materials.
    }
}
