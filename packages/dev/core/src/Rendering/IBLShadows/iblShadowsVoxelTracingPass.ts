import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { Scene } from "../../scene";
import { Matrix, Vector2, Vector4 } from "../../Maths/math.vector";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import type { IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";
import type { Effect } from "../../Materials/effect";
import type { Camera } from "../../Cameras/camera";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsVoxelTracingPass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _renderPipeline: IblShadowsRenderPipeline;
    private _voxelShadowOpacity: number = 1.0;
    /**
     * The opacity of the shadow cast from the voxel grid
     */
    public get voxelShadowOpacity(): number {
        return this._voxelShadowOpacity;
    }
    /**
     * The opacity of the shadow cast from the voxel grid
     */
    public set voxelShadowOpacity(value: number) {
        this._voxelShadowOpacity = value;
    }
    private _sssSamples: number = 16;
    private _sssStride: number = 8;
    private _sssMaxDist: number = 0.05;
    private _sssThickness: number = 0.5;

    private _ssShadowOpacity: number = 1.0;
    /**
     * The opacity of the screen-space shadow
     */
    public get ssShadowOpacity(): number {
        return this._ssShadowOpacity;
    }
    /**
     * The opacity of the screen-space shadow
     */
    public set ssShadowOpacity(value: number) {
        this._ssShadowOpacity = value;
    }

    /**
     * The number of samples used in the screen space shadow pass.
     */
    public get sssSamples(): number {
        return this._sssSamples;
    }

    /**
     * The number of samples used in the screen space shadow pass.
     */
    public set sssSamples(value: number) {
        this._sssSamples = value;
    }

    /**
     * The stride used in the screen space shadow pass. This controls the distance between samples.
     */
    public get sssStride(): number {
        return this._sssStride;
    }

    /**
     * The stride used in the screen space shadow pass. This controls the distance between samples.
     */
    public set sssStride(value: number) {
        this._sssStride = value;
    }

    /**
     * The maximum distance that the screen-space shadow will be able to occlude.
     */
    public get sssMaxDist(): number {
        return this._sssMaxDist;
    }

    /**
     * The maximum distance that the screen-space shadow will be able to occlude.
     */
    public set sssMaxDist(value: number) {
        this._sssMaxDist = value;
    }

    /**
     * The thickness of the screen-space shadow
     */
    public get sssThickness(): number {
        return this._sssThickness;
    }

    /**
     * The thickness of the screen-space shadow
     */
    public set sssThickness(value: number) {
        this._sssThickness = value;
    }

    private _outputPP: PostProcess;
    private _cameraInvView: Matrix = Matrix.Identity();
    private _cameraInvProj: Matrix = Matrix.Identity();
    private _invWorldScaleMatrix: Matrix = Matrix.Identity();
    private _frameId: number = 0;
    private _sampleDirections: number = 4;

    /**
     * The number of directions to sample for the voxel tracing.
     */
    public get sampleDirections(): number {
        return this._sampleDirections;
    }

    /**
     * The number of directions to sample for the voxel tracing.
     */
    public set sampleDirections(value: number) {
        this._sampleDirections = value;
    }

    /**
     * The current rotation of the environment map, in radians.
     */
    public get envRotation(): number {
        return this._envRotation;
    }

    /**
     * The current rotation of the environment map, in radians.
     */
    public set envRotation(value: number) {
        this._envRotation = value;
    }

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;

    /**
     * Gets the pass post process
     * @returns The post process
     */
    public getPassPP(): PostProcess {
        return this._outputPP;
    }

    /**
     * Gets the debug pass post process. This will create the resources for the pass
     * if they don't already exist.
     * @returns The post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._debugPassPP) {
            this._createDebugPass();
        }
        return this._debugPassPP;
    }

    private _debugPassName: string = "Voxel Tracing Debug Pass";

    /**
     * The name of the debug pass
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }

    /** The default rotation of the environment map will align the shadows with the default lighting orientation */
    private _envRotation: number = 0.0;
    private _downscale: number = 1.0;

    /**
     * Set the matrix to use for scaling the world space to voxel space
     * @param matrix The matrix to use for scaling the world space to voxel space
     */
    public setWorldScaleMatrix(matrix: Matrix) {
        this._invWorldScaleMatrix = matrix;
    }

    private _debugVoxelMarchEnabled: boolean = false;
    private _debugPassPP: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

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

    /**
     * Creates the debug post process effect for this pass
     */
    private _createDebugPass() {
        const isWebGPU = this._engine.isWebGPU;
        if (!this._debugPassPP) {
            const debugOptions: PostProcessOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                uniforms: ["sizeParams"],
                samplers: ["debugSampler"],
                engine: this._engine,
                reusable: false,
                shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
                extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblShadowDebug.fragment"));
                    } else {
                        list.push(import("../../Shaders/iblShadowDebug.fragment"));
                    }
                },
            };
            this._debugPassPP = new PostProcess(this.debugPassName, "iblShadowDebug", debugOptions);
            this._debugPassPP.autoClear = false;
            this._debugPassPP.onApplyObservable.add((effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTextureFromPostProcessOutput("debugSampler", this._outputPP);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }

    /**
     * Instantiates the shadow voxel-tracing pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The shadow voxel-tracing pass
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }

    private _createTextures() {
        let defines = "";
        if (this._scene.useRightHandedSystem) {
            defines += "#define RIGHT_HANDED\n";
        }
        if (this._debugVoxelMarchEnabled) {
            defines += "#define VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION 1u\n";
        }
        const isWebGPU = this._engine.isWebGPU;
        const ppOptions: PostProcessOptions = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
            textureFormat: Constants.TEXTUREFORMAT_RG,
            textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            uniforms: ["viewMtx", "projMtx", "invProjMtx", "invViewMtx", "wsNormalizationMtx", "shadowParameters", "offsetDataParameters", "sssParameters", "shadowOpacity"],
            samplers: ["voxelGridSampler", "icdfySampler", "icdfxSampler", "blueNoiseSampler", "worldNormalSampler", "depthSampler", "worldPositionSampler"],
            defines: defines,
            engine: this._engine,
            reusable: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/iblShadowVoxelTracing.fragment"));
                } else {
                    list.push(import("../../Shaders/iblShadowVoxelTracing.fragment"));
                }
            },
        };
        this._outputPP = new PostProcess("voxelTracingPass", "iblShadowVoxelTracing", ppOptions);
        this._outputPP.autoClear = false;
        this._outputPP.onApplyObservable.add((effect) => {
            this._updatePostProcess(effect, this._scene.activeCamera!);
        });
    }

    private _updatePostProcess(effect: Effect, camera: Camera) {
        if (this._scene.useRightHandedSystem) {
            effect.defines = "#define RIGHT_HANDED\n";
        }
        effect.setMatrix("viewMtx", camera.getViewMatrix());
        effect.setMatrix("projMtx", camera.getProjectionMatrix());
        camera.getProjectionMatrix().invertToRef(this._cameraInvProj);
        camera.getViewMatrix().invertToRef(this._cameraInvView);
        effect.setMatrix("invProjMtx", this._cameraInvProj);
        effect.setMatrix("invViewMtx", this._cameraInvView);
        effect.setMatrix("wsNormalizationMtx", this._invWorldScaleMatrix);

        this._frameId++;

        const downscaleSquared = this._downscale * this._downscale;
        let rotation = this._scene.useRightHandedSystem ? -(this._envRotation + 0.5 * Math.PI) : this._envRotation - 0.5 * Math.PI;
        rotation = rotation % (2.0 * Math.PI);
        effect.setVector4("shadowParameters", new Vector4(this._sampleDirections, this._frameId / downscaleSquared, this._downscale, rotation));
        const offset = new Vector2(0.0, 0.0);
        const voxelGrid = this._renderPipeline!.getVoxelGridTexture();
        const highestMip = Math.floor(Math.log2(voxelGrid!.getSize().width));
        effect.setVector4("offsetDataParameters", new Vector4(offset.x, offset.y, highestMip, 0.0));

        // SSS Options.
        effect.setVector4("sssParameters", new Vector4(this._sssSamples, this._sssStride, this._sssMaxDist, this._sssThickness));
        effect.setVector4("shadowOpacity", new Vector4(this._voxelShadowOpacity, this._ssShadowOpacity, 0.0, 0.0));
        effect.setTexture("voxelGridSampler", voxelGrid);
        effect.setTexture("blueNoiseSampler", (this._renderPipeline as any)._noiseTexture);
        effect.setTexture("icdfySampler", this._renderPipeline!.getIcdfyTexture());
        effect.setTexture("icdfxSampler", this._renderPipeline!.getIcdfxTexture());
        if (this._debugVoxelMarchEnabled) {
            effect.defines += "#define VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION 1u\n";
        }

        const prePassRenderer = this._scene.prePassRenderer;
        if (prePassRenderer) {
            const wnormalIndex = prePassRenderer.getIndex(Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE);
            const clipDepthIndex = prePassRenderer.getIndex(Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE);
            const wPositionIndex = prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE);
            if (wnormalIndex >= 0) effect.setTexture("worldNormalSampler", prePassRenderer.getRenderTarget().textures[wnormalIndex]);
            if (clipDepthIndex >= 0) effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[clipDepthIndex]);
            if (wPositionIndex >= 0) effect.setTexture("worldPositionSampler", prePassRenderer.getRenderTarget().textures[wPositionIndex]);
        }
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return (
            this._outputPP.isReady() &&
            !(this._debugPassPP && !this._debugPassPP.isReady()) &&
            this._renderPipeline!.getIcdfyTexture().isReady() &&
            this._renderPipeline!.getIcdfxTexture().isReady() &&
            this._renderPipeline!.getVoxelGridTexture().isReady()
        );
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._outputPP.dispose();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
