/* eslint-disable @typescript-eslint/naming-convention */
import { Logger } from "../../../Misc/logger";
import { serialize } from "../../../Misc/decorators";
import { SerializationHelper } from "../../../Misc/decorators.serialization";
import type { Camera } from "../../../Cameras/camera";
import type { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import { PostProcess } from "../../../PostProcesses/postProcess";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { PassPostProcess } from "../../../PostProcesses/passPostProcess";
import type { Scene } from "../../../scene";
import { RegisterClass } from "../../../Misc/typeStore";
import { EngineStore } from "../../../Engines/engineStore";
import { SSAO2Configuration } from "../../../Rendering/ssao2Configuration";
import type { PrePassRenderer } from "../../../Rendering/prePassRenderer";
import { GeometryBufferRenderer } from "../../../Rendering/geometryBufferRenderer";
import { Constants } from "../../../Engines/constants";
import type { Nullable } from "../../../types";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { ThinSSAO2RenderingPipeline } from "./thinSSAO2RenderingPipeline";
import { ThinSSAO2PostProcess } from "../../thinSSAO2PostProcess";
import type { ISize } from "../../../Maths/math.size";
import { ThinSSAO2BlurPostProcess } from "../../thinSSAO2BlurPostProcess";
import { ThinSSAO2CombinePostProcess } from "../../thinSSAO2CombinePostProcess";

/**
 * Render pipeline to produce ssao effect
 */
export class SSAO2RenderingPipeline extends PostProcessRenderPipeline {
    // Members

    /**
     * @ignore
     * The PassPostProcess id in the pipeline that contains the original scene color
     */
    public SSAOOriginalSceneColorEffect: string = "SSAOOriginalSceneColorEffect";
    /**
     * @ignore
     * The SSAO PostProcess id in the pipeline
     */
    public SSAORenderEffect: string = "SSAORenderEffect";
    /**
     * @ignore
     * The horizontal blur PostProcess id in the pipeline
     */
    public SSAOBlurHRenderEffect: string = "SSAOBlurHRenderEffect";
    /**
     * @ignore
     * The vertical blur PostProcess id in the pipeline
     */
    public SSAOBlurVRenderEffect: string = "SSAOBlurVRenderEffect";
    /**
     * @ignore
     * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
     */
    public SSAOCombineRenderEffect: string = "SSAOCombineRenderEffect";

    private _thinSSAORenderingPipeline: ThinSSAO2RenderingPipeline;

    /**
     * The output strength of the SSAO post-process. Default value is 1.0.
     */
    @serialize()
    public get totalStrength() {
        return this._thinSSAORenderingPipeline.totalStrength;
    }

    public set totalStrength(value: number) {
        this._thinSSAORenderingPipeline.totalStrength = value;
    }

    /**
     * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
     */
    @serialize()
    public get maxZ() {
        return this._thinSSAORenderingPipeline.maxZ;
    }

    public set maxZ(value: number) {
        this._thinSSAORenderingPipeline.maxZ = value;
    }

    /**
     * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much.
     */
    @serialize()
    public get minZAspect() {
        return this._thinSSAORenderingPipeline.minZAspect;
    }

    public set minZAspect(value: number) {
        this._thinSSAORenderingPipeline.minZAspect = value;
    }

    /**
     * Used in SSAO calculations to compensate for accuracy issues with depth values. Default 0.02.
     *
     * Normally you do not need to change this value, but you can experiment with it if you get a lot of in false self-occlusion on flat surfaces when using fewer than 16 samples. Useful range is normally [0..0.1] but higher values is allowed.
     */
    @serialize("epsilon")
    public set epsilon(n: number) {
        this._thinSSAORenderingPipeline.epsilon = n;
    }
    public get epsilon(): number {
        return this._thinSSAORenderingPipeline.epsilon;
    }

    /**
     * Number of samples used for the SSAO calculations. Default value is 8.
     */
    @serialize("samples")
    public set samples(n: number) {
        this._thinSSAORenderingPipeline.samples = n;
    }
    public get samples(): number {
        return this._thinSSAORenderingPipeline.samples;
    }

    @serialize("textureSamples")
    private _textureSamples: number = 1;
    /**
     * Number of samples to use for antialiasing.
     */
    public set textureSamples(n: number) {
        this._textureSamples = n;

        if (this._prePassRenderer) {
            this._prePassRenderer.samples = n;
        } else {
            this._originalColorPostProcess.samples = n;
        }
    }
    public get textureSamples(): number {
        return this._textureSamples;
    }

    private _forcedGeometryBuffer: Nullable<GeometryBufferRenderer> = null;
    /**
     * Force rendering the geometry through geometry buffer.
     */
    @serialize()
    private _forceGeometryBuffer: boolean = false;
    private get _geometryBufferRenderer(): Nullable<GeometryBufferRenderer> {
        if (!this._forceGeometryBuffer) {
            return null;
        }
        return this._forcedGeometryBuffer ?? this._scene.geometryBufferRenderer;
    }
    private get _prePassRenderer(): Nullable<PrePassRenderer> {
        if (this._forceGeometryBuffer) {
            return null;
        }
        return this._scene.prePassRenderer;
    }

    /**
     * Ratio object used for SSAO ratio and blur ratio
     */
    @serialize()
    private _ratio: any;

    /*
     * The texture type used by the different post processes created by SSAO
     */
    @serialize()
    private _textureType: number;

    /**
     * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
     */
    @serialize()
    public get radius() {
        return this._thinSSAORenderingPipeline.radius;
    }

    public set radius(value: number) {
        this._thinSSAORenderingPipeline.radius = value;
    }

    /**
     * The base color of the SSAO post-process
     * The final result is "base + ssao" between [0, 1]
     */
    @serialize()
    public get base() {
        return this._thinSSAORenderingPipeline.base;
    }

    public set base(value: number) {
        this._thinSSAORenderingPipeline.base = value;
    }

    /**
     * Skips the denoising (blur) stage of the SSAO calculations.
     *
     * Useful to temporarily set while experimenting with the other SSAO2 settings.
     */
    @serialize("bypassBlur")
    public set bypassBlur(b: boolean) {
        this._thinSSAORenderingPipeline.bypassBlur = b;
    }
    public get bypassBlur(): boolean {
        return this._thinSSAORenderingPipeline.bypassBlur;
    }

    /**
     * Enables the configurable bilateral denoising (blurring) filter. Default is true.
     * Set to false to instead use a legacy bilateral filter that can't be configured.
     *
     * The denoising filter runs after the SSAO calculations and is a very important step. Both options results in a so called bilateral being used, but the "expensive" one can be
     * configured in several ways to fit your scene.
     */
    @serialize("expensiveBlur")
    public set expensiveBlur(b: boolean) {
        this._thinSSAORenderingPipeline.expensiveBlur = b;
    }
    public get expensiveBlur(): boolean {
        return this._thinSSAORenderingPipeline.expensiveBlur;
    }

    /**
     * The number of samples the bilateral filter uses in both dimensions when denoising the SSAO calculations. Default value is 16.
     *
     * A higher value should result in smoother shadows but will use more processing time in the shaders.
     *
     * A high value can cause the shadows to get to blurry or create visible artifacts (bands) near sharp details in the geometry. The artifacts can sometimes be mitigated by increasing the bilateralSoften setting.
     */
    @serialize()
    public get bilateralSamples(): number {
        return this._thinSSAORenderingPipeline.bilateralSamples;
    }

    public set bilateralSamples(n: number) {
        this._thinSSAORenderingPipeline.bilateralSamples = n;
    }

    /**
     * Controls the shape of the denoising kernel used by the bilateral filter. Default value is 0.
     *
     * By default the bilateral filter acts like a box-filter, treating all samples on the same depth with equal weights. This is effective to maximize the denoising effect given a limited set of samples. However, it also often results in visible ghosting around sharp shadow regions and can spread out lines over large areas so they are no longer visible.
     *
     * Increasing this setting will make the filter pay less attention to samples further away from the center sample, reducing many artifacts but at the same time increasing noise.
     *
     * Useful value range is [0..1].
     */
    @serialize()
    public get bilateralSoften(): number {
        return this._thinSSAORenderingPipeline.bilateralSoften;
    }

    public set bilateralSoften(n: number) {
        this._thinSSAORenderingPipeline.bilateralSoften = n;
    }

    /**
     * How forgiving the bilateral denoiser should be when rejecting samples. Default value is 0.
     *
     * A higher value results in the bilateral filter being more forgiving and thus doing a better job at denoising slanted and curved surfaces, but can lead to shadows spreading out around corners or between objects that are close to each other depth wise.
     *
     * Useful value range is normally [0..1], but higher values are allowed.
     */
    @serialize()
    public get bilateralTolerance(): number {
        return this._thinSSAORenderingPipeline.bilateralTolerance;
    }

    public set bilateralTolerance(n: number) {
        this._thinSSAORenderingPipeline.bilateralTolerance = n;
    }

    /**
     *  Support test.
     */
    public static get IsSupported(): boolean {
        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }
        return engine._features.supportSSAO2;
    }

    /**
     * Indicates that the combine stage should use the current camera viewport to render the SSAO result on only a portion of the output texture (default: true).
     */
    public get useViewportInCombineStage() {
        return this._thinSSAORenderingPipeline.useViewportInCombineStage;
    }

    public set useViewportInCombineStage(b: boolean) {
        this._thinSSAORenderingPipeline.useViewportInCombineStage = b;
    }

    /**
     * Checks if all the post processes in the pipeline are ready.
     * @returns True if all the post processes in the pipeline are ready
     */
    public isReady() {
        return this._thinSSAORenderingPipeline.isReady();
    }

    private _scene: Scene;
    private _originalColorPostProcess: PassPostProcess;
    private _ssaoPostProcess: PostProcess;
    private _blurHPostProcess: PostProcess;
    private _blurVPostProcess: PostProcess;
    private _ssaoCombinePostProcess: PostProcess;
    private _currentCameraMode = -1;

    /**
     * Gets active scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Creates the SSAO2 rendering pipeline.
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param ratio The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, blurRatio: 1.0 }
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     * @param forceGeometryBuffer Set to true if you want to use the legacy geometry buffer renderer. You can also pass an existing instance of GeometryBufferRenderer if you want to use your own geometry buffer renderer.
     * @param textureType The texture type used by the different post processes created by SSAO (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    constructor(
        name: string,
        scene: Scene,
        ratio: any,
        cameras?: Camera[],
        forceGeometryBuffer: boolean | GeometryBufferRenderer = false,
        textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        super(scene.getEngine(), name);

        this._thinSSAORenderingPipeline = new ThinSSAO2RenderingPipeline(name, scene);

        this._scene = scene;
        this._ratio = ratio;
        this._textureType = textureType;
        if (forceGeometryBuffer instanceof GeometryBufferRenderer) {
            this._forceGeometryBuffer = true;
            this._forcedGeometryBuffer = forceGeometryBuffer;
        } else {
            this._forceGeometryBuffer = forceGeometryBuffer;
        }

        if (!this.isSupported) {
            Logger.Error("The current engine does not support SSAO 2.");
            return;
        }

        const ssaoRatio = this._ratio.ssaoRatio || ratio;
        const blurRatio = this._ratio.blurRatio || ratio;

        // Set up assets
        if (this._forceGeometryBuffer) {
            if (!this._forcedGeometryBuffer) {
                scene.enableGeometryBufferRenderer();
            }
            if (scene.geometryBufferRenderer?.generateNormalsInWorldSpace) {
                Logger.Error("SSAO2RenderingPipeline does not support generateNormalsInWorldSpace=true for the geometry buffer renderer!");
            }
        } else {
            scene.enablePrePassRenderer();
            if (scene.prePassRenderer?.generateNormalsInWorldSpace) {
                Logger.Error("SSAO2RenderingPipeline does not support generateNormalsInWorldSpace=true for the prepass renderer!");
            }
        }

        this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), undefined, this._textureType);
        this._originalColorPostProcess.onBeforeRenderObservable.add(() => {
            const camera = this._scene.activeCamera;
            this._thinSSAORenderingPipeline._ssaoPostProcess.camera = camera;
            if (camera && this._currentCameraMode !== camera.mode) {
                this._currentCameraMode = camera.mode;
                this._thinSSAORenderingPipeline._ssaoPostProcess.updateEffect();
            }
        });
        this._originalColorPostProcess.samples = this.textureSamples;
        this._createSSAOPostProcess(1.0, textureType);
        this._createBlurPostProcess(ssaoRatio, blurRatio, this._textureType);
        this._createSSAOCombinePostProcess(blurRatio, this._textureType);

        // Set up pipeline
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOOriginalSceneColorEffect,
                () => {
                    return this._originalColorPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAORenderEffect,
                () => {
                    return this._ssaoPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOBlurHRenderEffect,
                () => {
                    return this._blurHPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOBlurVRenderEffect,
                () => {
                    return this._blurVPostProcess;
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                this.SSAOCombineRenderEffect,
                () => {
                    return this._ssaoCombinePostProcess;
                },
                true
            )
        );

        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        if (cameras) {
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }
    }

    // Public Methods

    /**
     * Get the class name
     * @returns "SSAO2RenderingPipeline"
     */
    public override getClassName(): string {
        return "SSAO2RenderingPipeline";
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableGeometryBufferRenderer Set to true if you want to disable the Geometry Buffer renderer
     */
    public override dispose(disableGeometryBufferRenderer: boolean = false): void {
        for (let i = 0; i < this._scene.cameras.length; i++) {
            const camera = this._scene.cameras[i];

            this._originalColorPostProcess.dispose(camera);
            this._ssaoPostProcess.dispose(camera);
            this._blurHPostProcess.dispose(camera);
            this._blurVPostProcess.dispose(camera);
            this._ssaoCombinePostProcess.dispose(camera);
        }

        if (disableGeometryBufferRenderer && !this._forcedGeometryBuffer) {
            this._scene.disableGeometryBufferRenderer();
        }

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

        this._scene.postProcessRenderPipelineManager.removePipeline(this._name);

        this._thinSSAORenderingPipeline.dispose();

        super.dispose();
    }

    // Private Methods

    /** @internal */
    public override _rebuild() {
        super._rebuild();
    }

    private _createBlurPostProcess(ssaoRatio: number, blurRatio: number, textureType: number): void {
        this._blurHPostProcess = this._createBlurFilter("BlurH", ssaoRatio, textureType, true);
        this._blurVPostProcess = this._createBlurFilter("BlurV", blurRatio, textureType, false);
    }

    private _createBlurFilter(name: string, ratio: number, textureType: number, horizontal: boolean): PostProcess {
        const blurFilter = new PostProcess(name, ThinSSAO2BlurPostProcess.FragmentUrl, {
            size: ratio,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            textureType: this._textureType,
            effectWrapper: horizontal ? this._thinSSAORenderingPipeline._ssaoBlurXPostProcess : this._thinSSAORenderingPipeline._ssaoBlurYPostProcess,
        });

        blurFilter.onApply = (effect: Effect) => {
            const ratio = this._ratio.blurRatio || this._ratio;
            const ssaoCombineSize = horizontal ? this._originalColorPostProcess.width * ratio : this._originalColorPostProcess.height * ratio;
            const originalColorSize = horizontal ? this._originalColorPostProcess.width : this._originalColorPostProcess.height;

            this._thinSSAORenderingPipeline._ssaoBlurXPostProcess.textureSize = ssaoCombineSize > 0 ? ssaoCombineSize : originalColorSize;
            this._thinSSAORenderingPipeline._ssaoBlurYPostProcess.textureSize = ssaoCombineSize > 0 ? ssaoCombineSize : originalColorSize;

            if (this._geometryBufferRenderer) {
                effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[0]);
            } else if (this._prePassRenderer) {
                effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
            }
        };

        blurFilter.samples = this.textureSamples;
        blurFilter.autoClear = false;
        return blurFilter;
    }

    private _getTextureSize() {
        const engine = this._scene.getEngine();
        const prePassRenderer = this._prePassRenderer;

        let textureSize: ISize = { width: engine.getRenderWidth(), height: engine.getRenderHeight() };

        if (prePassRenderer && this._scene.activeCamera?._getFirstPostProcess() === this._ssaoPostProcess) {
            const renderTarget = prePassRenderer.getRenderTarget();

            if (renderTarget && renderTarget.textures) {
                textureSize = renderTarget.textures[prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE)].getSize();
            }
        } else if (this._ssaoPostProcess.inputTexture) {
            textureSize.width = this._ssaoPostProcess.inputTexture.width;
            textureSize.height = this._ssaoPostProcess.inputTexture.height;
        }

        return textureSize;
    }

    private _createSSAOPostProcess(ratio: number, textureType: number): void {
        this._ssaoPostProcess = new PostProcess("ssao", ThinSSAO2PostProcess.FragmentUrl, {
            size: ratio,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            textureType,
            effectWrapper: this._thinSSAORenderingPipeline._ssaoPostProcess,
        });
        this._ssaoPostProcess.autoClear = false;

        this._ssaoPostProcess.onApply = (effect: Effect) => {
            if (this._geometryBufferRenderer) {
                effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[0]);
                effect.setTexture("normalSampler", this._geometryBufferRenderer.getGBuffer().textures[1]);
            } else if (this._prePassRenderer) {
                effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
                effect.setTexture("normalSampler", this._prePassRenderer.getRenderTarget().textures[this._prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE)]);
            }

            const textureSize = this._getTextureSize();

            this._thinSSAORenderingPipeline._ssaoPostProcess.textureWidth = textureSize.width;
            this._thinSSAORenderingPipeline._ssaoPostProcess.textureHeight = textureSize.height;
        };
        this._ssaoPostProcess.samples = this.textureSamples;

        if (!this._forceGeometryBuffer) {
            this._ssaoPostProcess._prePassEffectConfiguration = new SSAO2Configuration();
        }
    }

    private _createSSAOCombinePostProcess(ratio: number, textureType: number): void {
        this._ssaoCombinePostProcess = new PostProcess("ssaoCombine", ThinSSAO2CombinePostProcess.FragmentUrl, {
            size: ratio,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            textureType,
            effectWrapper: this._thinSSAORenderingPipeline._ssaoCombinePostProcess,
        });

        this._ssaoCombinePostProcess.onApply = (effect: Effect) => {
            this._thinSSAORenderingPipeline._ssaoCombinePostProcess.camera = this._scene.activeCamera;

            effect.setTextureFromPostProcessOutput("originalColor", this._originalColorPostProcess);
        };
        this._ssaoCombinePostProcess.autoClear = false;
        this._ssaoCombinePostProcess.samples = this.textureSamples;
    }

    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "SSAO2RenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): SSAO2RenderingPipeline {
        return SerializationHelper.Parse(
            () => new SSAO2RenderingPipeline(source._name, scene, source._ratio, undefined, source._forceGeometryBuffer, source._textureType),
            source,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.SSAO2RenderingPipeline", SSAO2RenderingPipeline);
