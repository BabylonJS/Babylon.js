import { Nullable } from "../../../types";
import { serialize, SerializationHelper } from "../../../Misc/decorators";
import { Observer } from "../../../Misc/observable";
import { IAnimatable } from '../../../Animations/animatable.interface';
import { Logger } from "../../../Misc/logger";
import { Camera } from "../../../Cameras/camera";
import { ImageProcessingConfiguration } from "../../../Materials/imageProcessingConfiguration";
import { Texture } from "../../../Materials/Textures/texture";
import { Engine } from "../../../Engines/engine";
import { Constants } from "../../../Engines/constants";
import { IDisposable } from "../../../scene";
import { GlowLayer } from "../../../Layers/glowLayer";
import { Scene } from "../../../scene";
import { PostProcess } from "../../../PostProcesses/postProcess";
import { SharpenPostProcess } from "../../../PostProcesses/sharpenPostProcess";
import { ImageProcessingPostProcess } from "../../../PostProcesses/imageProcessingPostProcess";
import { ChromaticAberrationPostProcess } from "../../../PostProcesses/chromaticAberrationPostProcess";
import { GrainPostProcess } from "../../../PostProcesses/grainPostProcess";
import { FxaaPostProcess } from "../../../PostProcesses/fxaaPostProcess";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { DepthOfFieldEffect, DepthOfFieldEffectBlurLevel } from "../../../PostProcesses/depthOfFieldEffect";
import { BloomEffect } from "../../../PostProcesses/bloomEffect";
import { _TypeStore } from '../../../Misc/typeStore';
import { EngineStore } from "../../../Engines/engineStore";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

declare type Animation = import("../../../Animations/animation").Animation;

/**
 * The default rendering pipeline can be added to a scene to apply common post processing effects such as anti-aliasing or depth of field.
 * See https://doc.babylonjs.com/how_to/using_default_rendering_pipeline
 */
export class DefaultRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
    private _scene: Scene;
    private _camerasToBeAttached: Array<Camera> = [];
    /**
     * ID of the sharpen post process,
     */
    private readonly SharpenPostProcessId: string = "SharpenPostProcessEffect";
    /**
     * @ignore
     * ID of the image processing post process;
     */
    readonly ImageProcessingPostProcessId: string = "ImageProcessingPostProcessEffect";
    /**
     * @ignore
     * ID of the Fast Approximate Anti-Aliasing post process;
     */
    readonly FxaaPostProcessId: string = "FxaaPostProcessEffect";
    /**
     * ID of the chromatic aberration post process,
     */
    private readonly ChromaticAberrationPostProcessId: string = "ChromaticAberrationPostProcessEffect";
    /**
     * ID of the grain post process
     */
    private readonly GrainPostProcessId: string = "GrainPostProcessEffect";

    // Post-processes
    /**
     * Sharpen post process which will apply a sharpen convolution to enhance edges
     */
    public sharpen: SharpenPostProcess;
    private _sharpenEffect: PostProcessRenderEffect;
    private bloom: BloomEffect;
    /**
     * Depth of field effect, applies a blur based on how far away objects are from the focus distance.
     */
    public depthOfField: DepthOfFieldEffect;
    /**
     * The Fast Approximate Anti-Aliasing post process which attemps to remove aliasing from an image.
     */
    public fxaa: FxaaPostProcess;
    /**
     * Image post processing pass used to perform operations such as tone mapping or color grading.
     */
    public imageProcessing: ImageProcessingPostProcess;
    /**
     * Chromatic aberration post process which will shift rgb colors in the image
     */
    public chromaticAberration: ChromaticAberrationPostProcess;
    private _chromaticAberrationEffect: PostProcessRenderEffect;
    /**
     * Grain post process which add noise to the image
     */
    public grain: GrainPostProcess;
    private _grainEffect: PostProcessRenderEffect;
    /**
     * Glow post process which adds a glow to emissive areas of the image
     */
    private _glowLayer: Nullable<GlowLayer> = null;

    /**
     * Animations which can be used to tweak settings over a period of time
     */
    public animations: Animation[] = [];

    private _imageProcessingConfigurationObserver: Nullable<Observer<ImageProcessingConfiguration>> = null;
    // Values
    private _sharpenEnabled: boolean = false;
    private _bloomEnabled: boolean = false;
    private _depthOfFieldEnabled: boolean = false;
    private _depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Low;
    private _fxaaEnabled: boolean = false;
    private _imageProcessingEnabled: boolean = true;
    private _defaultPipelineTextureType: number;
    private _bloomScale: number = 0.5;
    private _chromaticAberrationEnabled: boolean = false;
    private _grainEnabled: boolean = false;

    private _buildAllowed = true;

    /**
     * Gets active scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Enable or disable the sharpen process from the pipeline
     */
    public set sharpenEnabled(enabled: boolean) {
        if (this._sharpenEnabled === enabled) {
            return;
        }
        this._sharpenEnabled = enabled;

        this._buildPipeline();
    }

    @serialize()
    public get sharpenEnabled(): boolean {
        return this._sharpenEnabled;
    }

    private _resizeObserver: Nullable<Observer<Engine>> = null;
    private _hardwareScaleLevel = 1.0;
    private _bloomKernel: number = 64;
    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    @serialize()
    public get bloomKernel(): number {
        return this._bloomKernel;
    }
    public set bloomKernel(value: number) {
        this._bloomKernel = value;
        this.bloom.kernel = value / this._hardwareScaleLevel;
    }

    /**
     * Specifies the weight of the bloom in the final rendering
     */
    @serialize()
    private _bloomWeight: number = 0.15;
    /**
     * Specifies the luma threshold for the area that will be blurred by the bloom
     */
    @serialize()
    private _bloomThreshold: number = 0.9;

    @serialize()
    private _hdr: boolean;

    /**
     * The strength of the bloom.
     */
    public set bloomWeight(value: number) {
        if (this._bloomWeight === value) {
            return;
        }
        this.bloom.weight = value;

        this._bloomWeight = value;
    }

    @serialize()
    public get bloomWeight(): number {
        return this._bloomWeight;
    }

    /**
     * The strength of the bloom.
     */
    public set bloomThreshold(value: number) {
        if (this._bloomThreshold === value) {
            return;
        }
        this.bloom.threshold = value;
        this._bloomThreshold = value;
    }

    @serialize()
    public get bloomThreshold(): number {
        return this._bloomThreshold;
    }

    /**
     * The scale of the bloom, lower value will provide better performance.
     */
    public set bloomScale(value: number) {
        if (this._bloomScale === value) {
            return;
        }
        this._bloomScale = value;

        // recreate bloom and dispose old as this setting is not dynamic
        this._rebuildBloom();

        this._buildPipeline();
    }

    @serialize()
    public get bloomScale(): number {
        return this._bloomScale;
    }

    /**
     * Enable or disable the bloom from the pipeline
     */
    public set bloomEnabled(enabled: boolean) {
        if (this._bloomEnabled === enabled) {
            return;
        }
        this._bloomEnabled = enabled;

        this._buildPipeline();
    }

    @serialize()
    public get bloomEnabled(): boolean {
        return this._bloomEnabled;
    }

    private _rebuildBloom() {
        // recreate bloom and dispose old as this setting is not dynamic
        var oldBloom = this.bloom;
        this.bloom = new BloomEffect(this._scene, this.bloomScale, this._bloomWeight, this.bloomKernel, this._defaultPipelineTextureType, false);
        this.bloom.threshold = oldBloom.threshold;
        for (var i = 0; i < this._cameras.length; i++) {
            oldBloom.disposeEffects(this._cameras[i]);
        }
    }

    /**
     * If the depth of field is enabled.
     */
    @serialize()
    public get depthOfFieldEnabled(): boolean {
        return this._depthOfFieldEnabled;
    }

    public set depthOfFieldEnabled(enabled: boolean) {
        if (this._depthOfFieldEnabled === enabled) {
            return;
        }
        this._depthOfFieldEnabled = enabled;

        this._buildPipeline();
    }

    /**
     * Blur level of the depth of field effect. (Higher blur will effect performance)
     */
    @serialize()
    public get depthOfFieldBlurLevel(): DepthOfFieldEffectBlurLevel {
        return this._depthOfFieldBlurLevel;
    }

    public set depthOfFieldBlurLevel(value: DepthOfFieldEffectBlurLevel) {
        if (this._depthOfFieldBlurLevel === value) {
            return;
        }
        this._depthOfFieldBlurLevel = value;

        // recreate dof and dispose old as this setting is not dynamic
        var oldDof = this.depthOfField;

        this.depthOfField = new DepthOfFieldEffect(this._scene, null, this._depthOfFieldBlurLevel, this._defaultPipelineTextureType, false);
        this.depthOfField.focalLength = oldDof.focalLength;
        this.depthOfField.focusDistance = oldDof.focusDistance;
        this.depthOfField.fStop = oldDof.fStop;
        this.depthOfField.lensSize = oldDof.lensSize;

        for (var i = 0; i < this._cameras.length; i++) {
            oldDof.disposeEffects(this._cameras[i]);
        }

        this._buildPipeline();
    }

    /**
     * If the anti aliasing is enabled.
     */
    public set fxaaEnabled(enabled: boolean) {
        if (this._fxaaEnabled === enabled) {
            return;
        }
        this._fxaaEnabled = enabled;

        this._buildPipeline();
    }

    @serialize()
    public get fxaaEnabled(): boolean {
        return this._fxaaEnabled;
    }

    private _samples = 1;
    /**
     * MSAA sample count, setting this to 4 will provide 4x anti aliasing. (default: 1)
     */
    public set samples(sampleCount: number) {
        if (this._samples === sampleCount) {
            return;
        }
        this._samples = sampleCount;

        this._buildPipeline();
    }

    @serialize()
    public get samples(): number {
        return this._samples;
    }

    /**
     * If image processing is enabled.
     */
    public set imageProcessingEnabled(enabled: boolean) {
        if (this._imageProcessingEnabled === enabled) {
            return;
        }
        this._imageProcessingEnabled = enabled;

        this._buildPipeline();
    }

    @serialize()
    public get imageProcessingEnabled(): boolean {
        return this._imageProcessingEnabled;
    }

    /**
     * If glow layer is enabled. (Adds a glow effect to emmissive materials)
     */
    public set glowLayerEnabled(enabled: boolean) {
        if (enabled && !this._glowLayer) {
            this._glowLayer = new GlowLayer("", this._scene);
        } else if (!enabled && this._glowLayer) {
            this._glowLayer.dispose();
            this._glowLayer = null;
        }
    }

    @serialize()
    public get glowLayerEnabled(): boolean {
        return this._glowLayer != null;
    }

    /**
     * Gets the glow layer (or null if not defined)
     */
    public get glowLayer() {
        return this._glowLayer;
    }

    /**
     * Enable or disable the chromaticAberration process from the pipeline
     */
    public set chromaticAberrationEnabled(enabled: boolean) {
        if (this._chromaticAberrationEnabled === enabled) {
            return;
        }
        this._chromaticAberrationEnabled = enabled;

        this._buildPipeline();
    }

    @serialize()
    public get chromaticAberrationEnabled(): boolean {
        return this._chromaticAberrationEnabled;
    }
    /**
     * Enable or disable the grain process from the pipeline
     */
    public set grainEnabled(enabled: boolean) {
        if (this._grainEnabled === enabled) {
            return;
        }
        this._grainEnabled = enabled;

        this._buildPipeline();
    }

    @serialize()
    public get grainEnabled(): boolean {
        return this._grainEnabled;
    }

    /**
     * @constructor
     * @param name - The rendering pipeline name (default: "")
     * @param hdr - If high dynamic range textures should be used (default: true)
     * @param scene - The scene linked to this pipeline (default: the last created scene)
     * @param cameras - The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param automaticBuild - if false, you will have to manually call prepare() to update the pipeline (default: true)
     */
    constructor(name: string = "", hdr: boolean = true, scene: Scene = EngineStore.LastCreatedScene!, cameras?: Camera[], automaticBuild = true) {
        super(scene.getEngine(), name);
        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();

        this._buildAllowed = automaticBuild;

        // Initialize
        this._scene = scene;
        var caps = this._scene.getEngine().getCaps();
        this._hdr = hdr && (caps.textureHalfFloatRender || caps.textureFloatRender);

        // Misc
        if (this._hdr) {
            if (caps.textureHalfFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            }
            else if (caps.textureFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        } else {
            this._defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_INT;
        }

        // Attach
        scene.postProcessRenderPipelineManager.addPipeline(this);

        var engine = this._scene.getEngine();
        // Create post processes before hand so they can be modified before enabled.
        // Block compilation flag is set to true to avoid compilation prior to use, these will be updated on first use in build pipeline.
        this.sharpen = new SharpenPostProcess("sharpen", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, true);
        this._sharpenEffect = new PostProcessRenderEffect(engine, this.SharpenPostProcessId, () => { return this.sharpen; }, true);

        this.depthOfField = new DepthOfFieldEffect(this._scene, null, this._depthOfFieldBlurLevel, this._defaultPipelineTextureType, true);

        this.bloom = new BloomEffect(this._scene, this._bloomScale, this._bloomWeight, this.bloomKernel, this._defaultPipelineTextureType, true);

        this.chromaticAberration = new ChromaticAberrationPostProcess("ChromaticAberration", engine.getRenderWidth(), engine.getRenderHeight(), 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, true);
        this._chromaticAberrationEffect = new PostProcessRenderEffect(engine, this.ChromaticAberrationPostProcessId, () => { return this.chromaticAberration; }, true);

        this.grain = new GrainPostProcess("Grain", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType, true);
        this._grainEffect = new PostProcessRenderEffect(engine, this.GrainPostProcessId, () => { return this.grain; }, true);

        this._resizeObserver = engine.onResizeObservable.add(() => {
            this._hardwareScaleLevel = engine.getHardwareScalingLevel();
            this.bloomKernel = this.bloomKernel;
        });

        this._imageProcessingConfigurationObserver = this._scene.imageProcessingConfiguration.onUpdateParameters.add(() => {
            this.bloom._downscale._exposure = this._scene.imageProcessingConfiguration.exposure;
        });

        this.imageProcessing = new ImageProcessingPostProcess("imageProcessing", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);

        this._buildPipeline();
    }

    /**
     * Get the class name
     * @returns "DefaultRenderingPipeline"
     */
    public getClassName(): string {
        return "DefaultRenderingPipeline";
    }

    /**
     * Force the compilation of the entire pipeline.
     */
    public prepare(): void {
        let previousState = this._buildAllowed;
        this._buildAllowed = true;
        this._buildPipeline();
        this._buildAllowed = previousState;
    }

    private _hasCleared = false;
    private _prevPostProcess: Nullable<PostProcess> = null;
    private _prevPrevPostProcess: Nullable<PostProcess> = null;

    private _setAutoClearAndTextureSharing(postProcess: PostProcess, skipTextureSharing = false) {
        if (this._hasCleared) {
            postProcess.autoClear = false;
        } else {
            postProcess.autoClear = true;
            this._scene.autoClear = false;
            this._hasCleared = true;
        }

        if (!skipTextureSharing) {
            if (this._prevPrevPostProcess) {
                postProcess.shareOutputWith(this._prevPrevPostProcess);
            } else {
                postProcess.useOwnOutput();
            }

            if (this._prevPostProcess) {
                this._prevPrevPostProcess = this._prevPostProcess;
            }
            this._prevPostProcess = postProcess;
        }
    }

    private _depthOfFieldSceneObserver: Nullable<Observer<Scene>> = null;

    private _buildPipeline() {
        if (!this._buildAllowed) {
            return;
        }
        this._scene.autoClear = true;

        var engine = this._scene.getEngine();

        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();
        this._prevPostProcess = null;
        this._prevPrevPostProcess = null;
        this._hasCleared = false;

        if (this.depthOfFieldEnabled) {
            // Multi camera suport
            if (this._cameras.length > 1) {
                for (let camera of this._cameras) {
                    const depthRenderer = this._scene.enableDepthRenderer(camera);
                    depthRenderer.useOnlyInActiveCamera = true;
                }

                this._depthOfFieldSceneObserver = this._scene.onAfterRenderTargetsRenderObservable.add((scene) => {
                    if (this._cameras.indexOf(scene.activeCamera!) > -1) {
                        this.depthOfField.depthTexture = scene.enableDepthRenderer(scene.activeCamera).getDepthMap();
                    }
                });
            }
            else {
                this._scene.onAfterRenderTargetsRenderObservable.remove(this._depthOfFieldSceneObserver);
                const depthRenderer = this._scene.enableDepthRenderer(this._cameras[0]);
                this.depthOfField.depthTexture = depthRenderer.getDepthMap();
            }

            if (!this.depthOfField._isReady()) {
                this.depthOfField._updateEffects();
            }
            this.addEffect(this.depthOfField);
            this._setAutoClearAndTextureSharing(this.depthOfField._effects[0], true);
        }
        else {
            this._scene.onAfterRenderTargetsRenderObservable.remove(this._depthOfFieldSceneObserver);
        }

        if (this.bloomEnabled) {
            if (!this.bloom._isReady()) {
                this.bloom._updateEffects();
            }
            this.addEffect(this.bloom);
            this._setAutoClearAndTextureSharing(this.bloom._effects[0], true);
        }

        this.imageProcessing.imageProcessingConfiguration.isEnabled = this._imageProcessingEnabled;
        if (this._imageProcessingEnabled) {
            if (this._hdr) {
                this.addEffect(new PostProcessRenderEffect(engine, this.ImageProcessingPostProcessId, () => { return this.imageProcessing; }, true));
                this._setAutoClearAndTextureSharing(this.imageProcessing);
            } else {
                this._scene.imageProcessingConfiguration.applyByPostProcess = false;
            }
        }

        if (this.sharpenEnabled) {
            if (!this.sharpen.isReady()) {
                this.sharpen.updateEffect();
            }
            this.addEffect(this._sharpenEffect);
            this._setAutoClearAndTextureSharing(this.sharpen);
        }

        if (this.grainEnabled) {
            if (!this.grain.isReady()) {
                this.grain.updateEffect();
            }
            this.addEffect(this._grainEffect);
            this._setAutoClearAndTextureSharing(this.grain);
        }

        if (this.chromaticAberrationEnabled) {
            if (!this.chromaticAberration.isReady()) {
                this.chromaticAberration.updateEffect();
            }
            this.addEffect(this._chromaticAberrationEffect);
            this._setAutoClearAndTextureSharing(this.chromaticAberration);
        }

        if (this.fxaaEnabled) {
            this.fxaa = new FxaaPostProcess("fxaa", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
            this.addEffect(new PostProcessRenderEffect(engine, this.FxaaPostProcessId, () => { return this.fxaa; }, true));
            this._setAutoClearAndTextureSharing(this.fxaa, true);
        }

        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }

        // In multicamera mode, the scene needs to autoclear in between cameras.
        if (this._scene.activeCameras && this._scene.activeCameras.length > 1) {
            this._scene.autoClear = true;
        }

        if (!this._enableMSAAOnFirstPostProcess(this.samples) && this.samples > 1) {
            Logger.Warn("MSAA failed to enable, MSAA is only supported in browsers that support webGL >= 2.0");
        }
    }

    private _disposePostProcesses(disposeNonRecreated = false): void {
        for (var i = 0; i < this._cameras.length; i++) {
            var camera = this._cameras[i];

            if (this.fxaa) {
                this.fxaa.dispose(camera);
            }

            // These are created in the constructor and should not be disposed on every pipeline change
            if (disposeNonRecreated) {
                if (this.imageProcessing) {
                    this.imageProcessing.dispose(camera);
                }

                if (this.sharpen) {
                    this.sharpen.dispose(camera);
                }

                if (this.depthOfField) {
                    this._scene.onAfterRenderTargetsRenderObservable.remove(this._depthOfFieldSceneObserver);
                    this.depthOfField.disposeEffects(camera);
                }

                if (this.bloom) {
                    this.bloom.disposeEffects(camera);
                }

                if (this.chromaticAberration) {
                    this.chromaticAberration.dispose(camera);
                }

                if (this.grain) {
                    this.grain.dispose(camera);
                }
                if (this._glowLayer) {
                    this._glowLayer.dispose();
                }
            }
        }

        (<any>this.fxaa) = null;

        if (disposeNonRecreated) {
            (<any>this.imageProcessing) = null;
            (<any>this.sharpen) = null;
            (<any>this._sharpenEffect) = null;
            (<any>this.depthOfField) = null;
            (<any>this.bloom) = null;
            (<any>this.chromaticAberration) = null;
            (<any>this._chromaticAberrationEffect) = null;
            (<any>this.grain) = null;
            (<any>this._grainEffect) = null;
            this._glowLayer = null;
        }
    }

    /**
     * Adds a camera to the pipeline
     * @param camera the camera to be added
     */
    public addCamera(camera: Camera): void {
        this._camerasToBeAttached.push(camera);
        this._buildPipeline();
    }

    /**
     * Removes a camera from the pipeline
     * @param camera the camera to remove
     */
    public removeCamera(camera: Camera): void {
        var index = this._camerasToBeAttached.indexOf(camera);
        this._camerasToBeAttached.splice(index, 1);
        this._buildPipeline();
    }

    /**
     * Dispose of the pipeline and stop all post processes
     */
    public dispose(): void {
        this._disposePostProcesses(true);
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        this._scene.autoClear = true;
        if (this._resizeObserver) {
            this._scene.getEngine().onResizeObservable.remove(this._resizeObserver);
            this._resizeObserver = null;
        }
        this._scene.imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingConfigurationObserver);
        super.dispose();
    }

    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "DefaultRenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): DefaultRenderingPipeline {
        return SerializationHelper.Parse(() => new DefaultRenderingPipeline(source._name, source._name._hdr, scene), source, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.DefaultRenderingPipeline"] = DefaultRenderingPipeline;
