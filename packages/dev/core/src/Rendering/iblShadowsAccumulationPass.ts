import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { CustomProceduralTexture } from "../Materials/Textures/Procedurals/customProceduralTexture";
import type { ICustomProceduralTextureCreationOptions } from "../Materials/Textures/Procedurals/customProceduralTexture";
import { Vector4 } from "../Maths/math.vector";
// import { Logger } from "../Misc/logger";
import "../Shaders/iblShadowAccumulation.fragment";
import "../Shaders/iblShadowDebug.fragment";
import { PostProcess } from "../PostProcesses/postProcess";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { RenderTargetCreationOptions } from "../Materials/Textures/textureCreationOptions";

/**
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsAccumulationPass {
    private _scene: Scene;
    private _engine: AbstractEngine;

    // We need two accumulation targets, each RG32F. One will be the procedural texture and the other will have this copied to it.
    // We need one local position target and then another from the prepass renderer
    // We'll access the motion buffer from the prepass renderer

    // First, render the accumulation pass with both position buffers, motion buffer, shadow buffer, and the previous accumulation buffer
    private _outputPT: CustomProceduralTexture;
    private _oldAccumulationRT: RenderTargetTexture;
    private _oldLocalPositionRT: RenderTargetTexture;

    public getTexture(): CustomProceduralTexture {
        return this._outputPT;
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
                "Shadow Accumulation Pass Debug",
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
     * Instantiates the accumulation pass
     * @param scene Scene to attach to
     * @returns The accumulation pass
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._createTextures();
    }

    private _createTextures() {
        const outputOptions: ICustomProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            skipJson: true,
        };

        this._outputPT = new CustomProceduralTexture(
            "accumulationPassTexture",
            "iblShadowAccumulation",
            { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() },
            this._scene,
            outputOptions,
            false
        );
        this._outputPT.autoClear = false;

        const accumulationOptions: RenderTargetCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        };

        this._oldAccumulationRT = new RenderTargetTexture(
            "oldAccumulationRT",
            { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() },
            this._scene,
            accumulationOptions
        );

        const localPositionOptions: RenderTargetCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        };

        this._oldLocalPositionRT = new RenderTargetTexture(
            "oldLocalPositionRT",
            { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() },
            this._scene,
            localPositionOptions
        );

        const localPositionCopyPP = new PostProcess(
            "Copy Local Position Texture",
            "pass", // Use the "pass" shader which just outputs the input texture
            null,
            null,
            1.0,
            null,
            Texture.NEAREST_SAMPLINGMODE,
            this._engine,
            false,
            "#define PASS_SAMPLER sampler"
        );

        localPositionCopyPP.onApply = (effect) => {
            const prePassRenderer = this._scene!.prePassRenderer;
            const index = prePassRenderer!.getIndex(Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE);
            if (index >= 0) effect.setTexture("textureSampler", prePassRenderer!.getRenderTarget().textures[index]);
        };
        this._oldLocalPositionRT.addPostProcess(localPositionCopyPP);
        this._oldLocalPositionRT.skipInitialClear = true;
        this._oldLocalPositionRT.noPrePassRenderer = true;
        this._scene.customRenderTargets.push(this._oldLocalPositionRT);

        const accumulationCopyPP = new PostProcess(
            "Copy Accumulation Texture",
            "pass", // Use the "pass" shader which just outputs the input texture
            null,
            null,
            1.0,
            null,
            Texture.NEAREST_SAMPLINGMODE,
            this._engine,
            false,
            "#define PASS_SAMPLER sampler"
        );

        accumulationCopyPP.onApply = (effect) => {
            effect.setTexture("textureSampler", this._outputPT);
        };
        this._oldAccumulationRT.addPostProcess(accumulationCopyPP);
        this._oldAccumulationRT.skipInitialClear = true;
        this._oldAccumulationRT.noPrePassRenderer = true;
        this._scene.customRenderTargets.push(this._oldAccumulationRT);
    }

    public update() {
        if (!this._scene.activeCamera) {
            return;
        }

        const remenance = 1;
        this._outputPT.setVector4("accumulationParameters", new Vector4(remenance, 0.0, 0.0, 0.0));
        this._outputPT.setTexture("oldAccumulationSampler", this._oldAccumulationRT);
        this._outputPT.setTexture("prevLocalPositionSampler", this._oldLocalPositionRT);
        this._outputPT.setTexture("shadowSampler", this._scene.iblShadowsRenderer!.getBlurShadowTexture()!);

        const prePassRenderer = this._scene.prePassRenderer;
        if (prePassRenderer) {
            // prePassRenderer.getRenderTarget().skipInitialClear = true;
            const localPositionIndex = prePassRenderer.getIndex(Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE);
            if (localPositionIndex >= 0) this._outputPT.setTexture("localPositionSampler", prePassRenderer.getRenderTarget().textures[localPositionIndex]);
            const velocityIndex = prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE);
            if (velocityIndex >= 0) this._outputPT.setTexture("motionSampler", prePassRenderer.getRenderTarget().textures[velocityIndex]);
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
