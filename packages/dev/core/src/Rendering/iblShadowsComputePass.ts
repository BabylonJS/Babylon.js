import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { CustomProceduralTexture } from "../Materials/Textures/Procedurals/customProceduralTexture";
import type { ICustomProceduralTextureCreationOptions } from "../Materials/Textures/Procedurals/customProceduralTexture";
import { Matrix, Vector2, Vector4 } from "../Maths/math.vector";
// import { Logger } from "../Misc/logger";
import "../Shaders/iblShadowCompute.fragment";
import "../Shaders/iblShadowDebug.fragment";
import { PostProcess } from "../PostProcesses/postProcess";
import type { IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";

/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsComputePass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _renderPipeline: IblShadowsRenderPipeline;
    private _voxelShadowEnabled: boolean = true;
    private _sssEnabled: boolean = true;
    private _sssSamples: number = 16;
    private _sssStride: number = 8;
    private _sssMaxDist: number = 0.15;
    private _sssThickness: number = 0.01;
    public get sssEnabled(): boolean {
        return this._sssEnabled;
    }
    public set sssEnabled(value: boolean) {
        this._sssEnabled = value;
    }
    public get sssSamples(): number {
        return this._sssSamples;
    }
    public set sssSamples(value: number) {
        this._sssSamples = value;
    }
    public get sssStride(): number {
        return this._sssStride;
    }
    public set sssStride(value: number) {
        this._sssStride = value;
    }
    public get sssMaxDist(): number {
        return this._sssMaxDist;
    }
    public set sssMaxDist(value: number) {
        this._sssMaxDist = value;
    }
    public get sssThickness(): number {
        return this._sssThickness;
    }
    public set sssThickness(value: number) {
        this._sssThickness = value;
    }

    private _outputPT: CustomProceduralTexture;
    private _cameraInvView: Matrix = Matrix.Identity();
    private _cameraInvProj: Matrix = Matrix.Identity();
    private _invWorldScaleMatrix: Matrix = Matrix.Identity();
    private _frameId: number = 0;
    private _sampleDirections: number = 4;
    public get sampleDirections(): number {
        return this._sampleDirections;
    }
    public set sampleDirections(value: number) {
        this._sampleDirections = value;
    }
    public get envRotation(): number {
        return this._envRotation;
    }
    public set envRotation(value: number) {
        this._envRotation = value;
    }
    /** The default rotation of the environment map will align the shadows with the default lighting orientation */
    private _envRotation: number = -Math.PI / 2.0;
    private _downscale: number = 1.0;

    public getTexture(): CustomProceduralTexture {
        return this._outputPT;
    }
    public setWorldScaleMatrix(matrix: Matrix) {
        this._invWorldScaleMatrix = matrix;
    }

    private _debugPass: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    private _debugEnabled: boolean = false;

    public get debugEnabled(): boolean {
        return this._debugEnabled;
    }

    public set debugEnabled(enabled: boolean) {
        if (this._debugEnabled === enabled) {
            return;
        }
        this._debugEnabled = enabled;
        if (enabled) {
            this._debugPass = new PostProcess(
                "Shadow Compute Pass Debug",
                "iblShadowDebug",
                ["sizeParams"], // attributes
                ["debugSampler"], // textures
                1.0, // options
                this._scene.activeCamera, // camera
                Texture.BILINEAR_SAMPLINGMODE, // sampling
                this._engine // engine
            );
            this._debugPass.onApply = (effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTexture("debugSampler", this._outputPT);
                effect.setVector4("sizeParams", this._debugSizeParams);
            };
        }
    }

    /**
     * Instantiates the shadow compute pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The shadow compute pass
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }

    private _createTextures() {
        const outputOptions: ICustomProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            skipJson: true,
        };

        this._outputPT = new CustomProceduralTexture(
            "shadowPassTexture1",
            "iblShadowCompute",
            { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() },
            this._scene,
            outputOptions,
            false
        );
        this._outputPT.autoClear = false;
        this._outputPT.refreshRate = 0;
        this._scene.onAfterRenderCameraObservable.add(() => {
            if (this._outputPT.isReady()) {
                // this._outputPT.render();
            }
        });
    }

    public update() {
        if (!this._scene.activeCamera) {
            return;
        }
        this._outputPT.setMatrix("viewMtx", this._scene.activeCamera.getViewMatrix());
        this._outputPT.setMatrix("projMtx", this._scene.activeCamera.getProjectionMatrix());
        this._scene.activeCamera.getProjectionMatrix().invertToRef(this._cameraInvProj);
        this._scene.activeCamera.getViewMatrix().invertToRef(this._cameraInvView);
        this._outputPT.setMatrix("invProjMtx", this._cameraInvProj);
        this._outputPT.setMatrix("invViewMtx", this._cameraInvView);
        this._outputPT.setMatrix("wsNormalizationMtx", this._invWorldScaleMatrix);

        this._frameId++;

        const downscaleSquared = this._downscale * this._downscale;
        this._outputPT.setVector4("shadowParameters", new Vector4(this._sampleDirections, this._frameId / downscaleSquared, this._downscale, this._envRotation));
        const offset = new Vector2(0.0, 0.0);
        const voxelGrid = this._renderPipeline!.getVoxelGridTexture();
        const highestMip = Math.floor(Math.log2(voxelGrid!.getSize().width));
        this._outputPT.setVector4("offsetDataParameters", new Vector4(offset.x, offset.y, highestMip, 0.0));

        // SSS Options.
        const worldScale = (1.0 / this._invWorldScaleMatrix.m[0]) * 2.0;
        const maxDist = this._sssMaxDist * worldScale;
        const thickness = this._sssThickness * worldScale;
        this._outputPT.setVector4("sssParameters", new Vector4(this._sssSamples, this._sssStride, maxDist, thickness));
        this._outputPT.setVector4("shadowOpacity", new Vector4(this._voxelShadowEnabled ? 1.0 : 0.0, this._sssEnabled ? 1.0 : 0.0, 0.0, 0.0));
        this._outputPT.setTexture("voxelGridSampler", voxelGrid);
        this._outputPT.setTexture("icdfySampler", this._renderPipeline!.getIcdfyTexture());
        this._outputPT.setTexture("icdfxSampler", this._renderPipeline!.getIcdfxTexture());
        this._outputPT.defines = "#define VOXEL_MARCHING_NUM_MIPS " + Math.log2(voxelGrid!.getSize().width).toFixed(0) + "u\n";
        this._outputPT.defines += "#define VOXEL_GRID_RESOLUTION " + voxelGrid!.getSize().width.toFixed(0) + "u\n";
        if (this._debugEnabled) {
            this._outputPT.defines += "#define VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION 1u\n";
        }

        const prePassRenderer = this._scene.prePassRenderer;
        if (prePassRenderer) {
            const wnormalIndex = prePassRenderer.getIndex(Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE);
            const depthIndex = prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
            const clipDepthIndex = prePassRenderer.getIndex(Constants.PREPASS_CLIPSPACE_DEPTH_TEXTURE_TYPE);
            const wPositionIndex = prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE);
            if (wnormalIndex >= 0) this._outputPT.setTexture("worldNormalSampler", prePassRenderer.getRenderTarget().textures[wnormalIndex]);
            if (depthIndex >= 0) this._outputPT.setTexture("linearDepthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
            if (clipDepthIndex >= 0) this._outputPT.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[clipDepthIndex]);
            if (wPositionIndex >= 0) this._outputPT.setTexture("worldPositionSampler", prePassRenderer.getRenderTarget().textures[wPositionIndex]);
        }
    }

    private _disposeTextures() {
        this._outputPT.dispose();
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return this._outputPT.isReady();
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._disposeTextures();
    }
}
