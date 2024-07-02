import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
// import { Logger } from "../Misc/logger";
import "../../Shaders/iblShadowAccumulation.fragment";
import "../../Shaders/iblShadowDebug.fragment";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import type { Effect } from "../../Materials/effect";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { RenderTargetCreationOptions } from "../../Materials/Textures/textureCreationOptions";

/**
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsAccumulationPass {
    private _scene: Scene;
    private _engine: AbstractEngine;

    // First, render the accumulation pass with both position buffers, motion buffer, shadow buffer, and the previous accumulation buffer
    private _outputPP: PostProcess;
    private _oldAccumulationRT: RenderTargetTexture;
    private _oldLocalPositionRT: RenderTargetTexture;

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
     * Gets the debug pass post process
     * @returns The post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._debugPass) {
            this._createDebugPass();
        }
        return this._debugPass;
    }

    private _debugPassName: string = "Shadow Accumulation Debug Pass";
    public get debugPassName(): string {
        return this._debugPassName;
    }

    private _remenance: number = 0.9;
    public get remenance(): number {
        return this._remenance;
    }
    public set remenance(value: number) {
        this._remenance = value;
    }
    private _reset: boolean = true;
    public get reset(): boolean {
        return this._reset;
    }
    public set reset(value: boolean) {
        this._reset = value;
    }

    private _debugPass: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }

    /**
     * Creates the debug post process effect for this pass
     */
    private _createDebugPass() {
        if (!this._debugPass) {
            const debugOptions: PostProcessOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                textureFormat: Constants.TEXTUREFORMAT_RGBA,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                uniforms: ["sizeParams"],
                samplers: ["debugSampler"],
                engine: this._engine,
                reusable: false,
            };
            this._debugPass = new PostProcess(this.debugPassName, "iblShadowDebug", debugOptions);
            this._debugPass.autoClear = false;
            this._debugPass.onApply = (effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTextureFromPostProcessOutput("debugSampler", this._outputPP);
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
        // Create the local position texture for the previous frame.
        // We'll copy the previous local position texture to this texture at the start of every frame.
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

        const localPositionCopyOptions: PostProcessOptions = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
            textureFormat: Constants.TEXTUREFORMAT_RGBA,
            textureType: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            engine: this._engine,
            reusable: false,
            defines: "#define PASS_SAMPLER sampler",
        };
        const localPositionCopyPP = new PostProcess("Copy Local Position Texture", "pass", localPositionCopyOptions);
        localPositionCopyPP.autoClear = false;
        localPositionCopyPP.onApply = (effect) => {
            const prePassRenderer = this._scene!.prePassRenderer;
            const index = prePassRenderer!.getIndex(Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE);
            if (index >= 0) effect.setTexture("textureSampler", prePassRenderer!.getRenderTarget().textures[index]);
        };
        this._oldLocalPositionRT.addPostProcess(localPositionCopyPP);
        this._oldLocalPositionRT.skipInitialClear = true;
        this._oldLocalPositionRT.noPrePassRenderer = true;

        this._scene.customRenderTargets.push(this._oldLocalPositionRT);

        // Create the accumulation texture for the previous frame.
        // We'll copy the output of the accumulation pass to this texture at the start of every frame.
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
        const accumulationCopyOptions: PostProcessOptions = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
            textureFormat: Constants.TEXTUREFORMAT_RGBA,
            textureType: Constants.TEXTURETYPE_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            engine: this._engine,
            reusable: false,
            defines: "#define PASS_SAMPLER sampler",
        };
        const accumulationCopyPP = new PostProcess("Copy Accumulation Texture", "pass", accumulationCopyOptions);
        accumulationCopyPP.autoClear = false;
        accumulationCopyPP.onApply = (effect) => {
            effect.setTextureFromPostProcessOutput("textureSampler", this._outputPP);
        };
        this._oldAccumulationRT.addPostProcess(accumulationCopyPP);
        this._oldAccumulationRT.skipInitialClear = true;
        this._oldAccumulationRT.noPrePassRenderer = true;
        this._scene.customRenderTargets.push(this._oldAccumulationRT);

        // Now, create the accumulation pass
        const ppOptions: PostProcessOptions = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
            textureFormat: Constants.TEXTUREFORMAT_RGBA,
            textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            uniforms: ["accumulationParameters"],
            samplers: ["oldAccumulationSampler", "prevLocalPositionSampler", "localPositionSampler", "motionSampler"],
            engine: this._engine,
            reusable: false,
        };
        this._outputPP = new PostProcess("accumulationPassPP", "iblShadowAccumulation", ppOptions);
        this._outputPP.autoClear = false;
        this._outputPP.onApply = (effect) => {
            this._updatePostProcess(effect);
        };
    }

    public _updatePostProcess(effect: Effect) {
        effect.setVector4("accumulationParameters", new Vector4(this.remenance, this.reset ? 1.0 : 0.0, 0.0, 0.0));
        effect.setTexture("oldAccumulationSampler", this._oldAccumulationRT);
        effect.setTexture("prevLocalPositionSampler", this._oldLocalPositionRT);
        // effect.setTexture("shadowSampler", this._renderPipeline.getBlurShadowTexture()!);

        const prePassRenderer = this._scene.prePassRenderer;
        if (prePassRenderer) {
            // prePassRenderer.getRenderTarget().skipInitialClear = true;
            const localPositionIndex = prePassRenderer.getIndex(Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE);
            if (localPositionIndex >= 0) effect.setTexture("localPositionSampler", prePassRenderer.getRenderTarget().textures[localPositionIndex]);
            const velocityIndex = prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE);
            if (velocityIndex >= 0) effect.setTexture("motionSampler", prePassRenderer.getRenderTarget().textures[velocityIndex]);
        }

        this.reset = false;
    }

    /** Called by render pipeline when canvas resized. */
    public resize() {
        this._oldAccumulationRT.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() });
        this._oldLocalPositionRT.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() });
    }

    private _disposeTextures() {
        this._oldAccumulationRT.dispose();
        this._oldLocalPositionRT.dispose();
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return this._outputPP.isReady();
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._disposeTextures();
        this._outputPP.dispose();
        if (this._debugPass) {
            this._debugPass.dispose();
        }
    }
}
