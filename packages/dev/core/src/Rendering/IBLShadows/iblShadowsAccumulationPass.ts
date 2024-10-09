import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { RenderTargetCreationOptions } from "../../Materials/Textures/textureCreationOptions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { GeometryBufferRenderer } from "../../Rendering/geometryBufferRenderer";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";

/**
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsAccumulationPass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _renderPipeline: IblShadowsRenderPipeline;

    // First, render the accumulation pass with both position buffers, motion buffer, shadow buffer, and the previous accumulation buffer
    private _outputTexture: ProceduralTexture;
    private _oldAccumulationRT: RenderTargetTexture;
    private _oldLocalPositionRT: RenderTargetTexture;

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;

    /**
     * Returns the output texture of the pass.
     * @returns The output texture.
     */
    public getOutputTexture(): ProceduralTexture {
        return this._outputTexture;
    }

    /**
     * Gets the debug pass post process
     * @returns The post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._debugPassPP) {
            this._createDebugPass();
        }
        return this._debugPassPP;
    }

    private _debugPassName: string = "Shadow Accumulation Debug Pass";

    /**
     * Gets the name of the debug pass
     * @returns The name of the debug pass
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }

    /**
     * A value that controls how much of the previous frame's accumulation to keep.
     * The higher the value, the faster the shadows accumulate but the more potential ghosting you'll see.
     */
    public get remenance(): number {
        return this._remenance;
    }

    /**
     * A value that controls how much of the previous frame's accumulation to keep.
     * The higher the value, the faster the shadows accumulate but the more potential ghosting you'll see.
     */
    public set remenance(value: number) {
        this._remenance = value;
    }
    private _remenance: number = 0.9;

    /**
     * Reset the accumulation.
     */
    public get reset(): boolean {
        return this._reset;
    }
    /**
     * Reset the accumulation.
     */
    public set reset(value: boolean) {
        this._reset = value;
    }
    private _reset: boolean = true;
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
        if (!this._debugPassPP) {
            const isWebGPU = this._engine.isWebGPU;
            const debugOptions: PostProcessOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                textureFormat: Constants.TEXTUREFORMAT_RG,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
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
                effect.setTexture("debugSampler", this._outputTexture);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }

    /**
     * Instantiates the accumulation pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The accumulation pass
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }

    private _createTextures() {
        const isWebGPU = this._engine.isWebGPU;
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
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/pass.fragment"));
                } else {
                    list.push(import("../../Shaders/pass.fragment"));
                }
            },
        };
        const localPositionCopyPP = new PostProcess("Copy Local Position Texture", "pass", localPositionCopyOptions);
        localPositionCopyPP.autoClear = false;
        localPositionCopyPP.onApplyObservable.add((effect) => {
            const geometryBufferRenderer = this._scene.geometryBufferRenderer;
            const index = geometryBufferRenderer!.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
            effect.setTexture("textureSampler", geometryBufferRenderer!.getGBuffer().textures[index]);
        });
        this._oldLocalPositionRT.addPostProcess(localPositionCopyPP);
        this._oldLocalPositionRT.skipInitialClear = true;
        this._oldLocalPositionRT.noPrePassRenderer = true;

        this._scene.customRenderTargets.push(this._oldLocalPositionRT);

        // Create the accumulation texture for the previous frame.
        // We'll copy the output of the accumulation pass to this texture at the start of every frame.
        const accumulationOptions: RenderTargetCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RG,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
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
            textureFormat: Constants.TEXTUREFORMAT_RG,
            textureType: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            engine: this._engine,
            reusable: false,
            defines: "#define PASS_SAMPLER sampler",
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/pass.fragment"));
                } else {
                    list.push(import("../../Shaders/pass.fragment"));
                }
            },
        };
        const accumulationCopyPP = new PostProcess("Copy Accumulation Texture", "pass", accumulationCopyOptions);
        accumulationCopyPP.autoClear = false;
        accumulationCopyPP.onApplyObservable.add((effect) => {
            // if (this._outputTexture?._texture) {
            effect.setTexture("textureSampler", this._outputTexture);
            // } else {
            //     // We must set a texture. It's not the right one, but we must set something before the right one is available (see above), probably on next frame.
            //     effect._bindTexture("textureSampler", this._outputTexture);
            // }
        });
        this._oldAccumulationRT.addPostProcess(accumulationCopyPP);
        this._oldAccumulationRT.skipInitialClear = true;
        this._oldAccumulationRT.noPrePassRenderer = true;
        this._scene.customRenderTargets.push(this._oldAccumulationRT);

        const textureOptions: IProceduralTextureCreationOptions = {
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowAccumulation.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/iblShadowAccumulation.fragment")]);
                }
            },
        };
        this._outputTexture = new ProceduralTexture(
            "shadowAccumulationPass",
            {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
            },
            "iblShadowAccumulation",
            this._scene,
            textureOptions,
            false,
            false,
            Constants.TEXTURETYPE_UNSIGNED_INT
        );
        this._outputTexture.refreshRate = -1;
        this._outputTexture.autoClear = false;

        // Need to set all the textures first so that the effect gets created with the proper uniforms.
        this._update();

        this._scene.onBeforeCameraRenderObservable.add(() => {
            this._scene.onAfterRenderTargetsRenderObservable.addOnce(() => {
                if (this._outputTexture.isReady()) {
                    this._update();
                    this._outputTexture.render();
                }
            });
        });
        // Now, create the accumulation pass
        // const ppOptions: PostProcessOptions = {
        //     width: this._engine.getRenderWidth(),
        //     height: this._engine.getRenderHeight(),
        //     textureFormat: Constants.TEXTUREFORMAT_RG,
        //     textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        //     samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        //     uniforms: ["accumulationParameters"],
        //     samplers: ["oldAccumulationSampler", "prevLocalPositionSampler", "localPositionSampler", "motionSampler"],
        //     engine: this._engine,
        //     reusable: false,
        //     shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        //     extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
        //         if (useWebGPU) {
        //             list.push(import("../../ShadersWGSL/iblShadowAccumulation.fragment"));
        //         } else {
        //             list.push(import("../../Shaders/iblShadowAccumulation.fragment"));
        //         }
        //     },
        // };
        // this._outputTexture = new PostProcess("accumulationPassPP", "iblShadowAccumulation", ppOptions);
        // this._outputTexture.autoClear = true;
        // this._outputTexture.resize(this._engine.getRenderWidth(), this._engine.getRenderHeight()); // make sure that _outputPP.inputTexture.texture is created right away
        // this._outputTexture.onApplyObservable.add((effect) => {
        //     this._updatePostProcess(effect);
        // });
    }

    public _update() {
        this._outputTexture.setTexture("spatialBlurSampler", this._renderPipeline.getSpatialBlurTexture());
        this._outputTexture.setVector4("accumulationParameters", new Vector4(this.remenance, this.reset ? 1.0 : 0.0, 0.0, 0.0));
        this._outputTexture.setTexture("oldAccumulationSampler", this._oldAccumulationRT);
        this._outputTexture.setTexture("prevLocalPositionSampler", this._oldLocalPositionRT);

        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        if (!geometryBufferRenderer) {
            return;
        }
        const velocityIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE);
        this._outputTexture.setTexture("motionSampler", geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
        const wPositionIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
        this._outputTexture.setTexture("localPositionSampler", geometryBufferRenderer.getGBuffer().textures[wPositionIndex]);

        this.reset = false;
    }

    /** Called by render pipeline when canvas resized. */
    public resize() {
        this._oldAccumulationRT.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() });
        this._oldLocalPositionRT.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() });
        this._outputTexture.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, false);
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
        return (
            this._oldAccumulationRT &&
            this._oldAccumulationRT.isReadyForRendering() &&
            this._oldLocalPositionRT &&
            this._oldLocalPositionRT.isReadyForRendering() &&
            this._outputTexture.isReady() &&
            !(this._debugPassPP && !this._debugPassPP.isReady())
        );
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._disposeTextures();
        this._outputTexture.dispose();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
