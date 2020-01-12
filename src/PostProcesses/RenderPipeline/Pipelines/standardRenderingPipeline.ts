import { Nullable } from "../../../types";
import { serialize, serializeAsTexture, SerializationHelper } from "../../../Misc/decorators";
import { IAnimatable } from '../../../Animations/animatable.interface';
import { Logger } from "../../../Misc/logger";
import { Vector2, Vector3, Matrix, Vector4 } from "../../../Maths/math.vector";
import { Scalar } from "../../../Maths/math.scalar";
import { Camera } from "../../../Cameras/camera";
import { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import { PostProcess } from "../../../PostProcesses/postProcess";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { BlurPostProcess } from "../../../PostProcesses/blurPostProcess";
import { FxaaPostProcess } from "../../../PostProcesses/fxaaPostProcess";
import { IDisposable } from "../../../scene";
import { SpotLight } from "../../../Lights/spotLight";
import { DirectionalLight } from "../../../Lights/directionalLight";
import { GeometryBufferRenderer } from "../../../Rendering/geometryBufferRenderer";
import { Scene } from "../../../scene";
import { Constants } from "../../../Engines/constants";
import { _TypeStore } from '../../../Misc/typeStore';
import { MotionBlurPostProcess } from "../../motionBlurPostProcess";
import { ScreenSpaceReflectionPostProcess } from "../../screenSpaceReflectionPostProcess";

declare type Animation = import("../../../Animations/animation").Animation;

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

import "../../../Shaders/standard.fragment";
/**
 * Standard rendering pipeline
 * Default pipeline should be used going forward but the standard pipeline will be kept for backwards compatibility.
 * @see https://doc.babylonjs.com/how_to/using_standard_rendering_pipeline
 */
export class StandardRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
    /**
    * Public members
    */
    // Post-processes
    /**
     * Post-process which contains the original scene color before the pipeline applies all the effects
     */
    public originalPostProcess: Nullable<PostProcess>;
    /**
     * Post-process used to down scale an image x4
     */
    public downSampleX4PostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to calculate the illuminated surfaces controlled by a threshold
     */
    public brightPassPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process array storing all the horizontal blur post-processes used by the pipeline
     */
    public blurHPostProcesses: PostProcess[] = [];
    /**
     * Post-process array storing all the vertical blur post-processes used by the pipeline
     */
    public blurVPostProcesses: PostProcess[] = [];
    /**
     * Post-process used to add colors of 2 textures (typically brightness + real scene color)
     */
    public textureAdderPostProcess: Nullable<PostProcess> = null;

    /**
     * Post-process used to create volumetric lighting effect
     */
    public volumetricLightPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to smooth the previous volumetric light post-process on the X axis
     */
    public volumetricLightSmoothXPostProcess: Nullable<BlurPostProcess> = null;
    /**
     * Post-process used to smooth the previous volumetric light post-process on the Y axis
     */
    public volumetricLightSmoothYPostProcess: Nullable<BlurPostProcess> = null;
    /**
     * Post-process used to merge the volumetric light effect and the real scene color
     */
    public volumetricLightMergePostProces: Nullable<PostProcess> = null;
    /**
     * Post-process used to store the final volumetric light post-process (attach/detach for debug purpose)
     */
    public volumetricLightFinalPostProcess: Nullable<PostProcess> = null;

    /**
     * Base post-process used to calculate the average luminance of the final image for HDR
     */
    public luminancePostProcess: Nullable<PostProcess> = null;
    /**
     * Post-processes used to create down sample post-processes in order to get
     * the average luminance of the final image for HDR
     * Array of length "StandardRenderingPipeline.LuminanceSteps"
     */
    public luminanceDownSamplePostProcesses: PostProcess[] = [];
    /**
     * Post-process used to create a HDR effect (light adaptation)
     */
    public hdrPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to store the final texture adder post-process (attach/detach for debug purpose)
     */
    public textureAdderFinalPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to store the final lens flare post-process (attach/detach for debug purpose)
     */
    public lensFlareFinalPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to merge the final HDR post-process and the real scene color
     */
    public hdrFinalPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to create a lens flare effect
     */
    public lensFlarePostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process that merges the result of the lens flare post-process and the real scene color
     */
    public lensFlareComposePostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to create a motion blur effect
     */
    public motionBlurPostProcess: Nullable<PostProcess> = null;
    /**
     * Post-process used to create a depth of field effect
     */
    public depthOfFieldPostProcess: Nullable<PostProcess> = null;
    /**
     * The Fast Approximate Anti-Aliasing post process which attemps to remove aliasing from an image.
     */
    public fxaaPostProcess: Nullable<FxaaPostProcess> = null;
    /**
     * Post-process used to simulate realtime reflections using the screen space and geometry renderer.
     */
    public screenSpaceReflectionPostProcess: Nullable<ScreenSpaceReflectionPostProcess> = null;

    // Values

    /**
     * Represents the brightness threshold in order to configure the illuminated surfaces
     */
    @serialize()
    public brightThreshold: number = 1.0;

    /**
     * Configures the blur intensity used for surexposed surfaces are highlighted surfaces (light halo)
     */
    @serialize()
    public blurWidth: number = 512.0;
    /**
     * Sets if the blur for highlighted surfaces must be only horizontal
     */
    @serialize()
    public horizontalBlur: boolean = false;

    /**
     * Gets the overall exposure used by the pipeline
     */
    @serialize()
    public get exposure(): number {
        return this._fixedExposure;
    }
    /**
     * Sets the overall exposure used by the pipeline
     */
    public set exposure(value: number) {
        this._fixedExposure = value;
        this._currentExposure = value;
    }

    /**
     * Texture used typically to simulate "dirty" on camera lens
     */
    @serializeAsTexture("lensTexture")
    public lensTexture: Nullable<Texture> = null;

    /**
     * Represents the offset coefficient based on Rayleigh principle. Typically in interval [-0.2, 0.2]
     */
    @serialize()
    public volumetricLightCoefficient: number = 0.2;
    /**
     * The overall power of volumetric lights, typically in interval [0, 10] maximum
     */
    @serialize()
    public volumetricLightPower: number = 4.0;
    /**
     * Used the set the blur intensity to smooth the volumetric lights
     */
    @serialize()
    public volumetricLightBlurScale: number = 64.0;
    /**
     * Light (spot or directional) used to generate the volumetric lights rays
     * The source light must have a shadow generate so the pipeline can get its
     * depth map
     */
    public sourceLight: Nullable<SpotLight | DirectionalLight> = null;

    /**
     * For eye adaptation, represents the minimum luminance the eye can see
     */
    @serialize()
    public hdrMinimumLuminance: number = 1.0;
    /**
     * For eye adaptation, represents the decrease luminance speed
     */
    @serialize()
    public hdrDecreaseRate: number = 0.5;
    /**
     * For eye adaptation, represents the increase luminance speed
     */
    @serialize()
    public hdrIncreaseRate: number = 0.5;
    /**
     * Gets wether or not the exposure of the overall pipeline should be automatically adjusted by the HDR post-process
     */
    @serialize()
    public get hdrAutoExposure(): boolean {
        return this._hdrAutoExposure;
    }
    /**
     * Sets wether or not the exposure of the overall pipeline should be automatically adjusted by the HDR post-process
     */
    public set hdrAutoExposure(value: boolean) {
        this._hdrAutoExposure = value;
        if (this.hdrPostProcess) {
            const defines = ["#define HDR"];
            if (value) {
                defines.push("#define AUTO_EXPOSURE");
            }
            this.hdrPostProcess.updateEffect(defines.join("\n"));
        }
    }

    /**
     * Lens color texture used by the lens flare effect. Mandatory if lens flare effect enabled
     */
    @serializeAsTexture("lensColorTexture")
    public lensColorTexture: Nullable<Texture> = null;
    /**
     * The overall strengh for the lens flare effect
     */
    @serialize()
    public lensFlareStrength: number = 20.0;
    /**
     * Dispersion coefficient for lens flare ghosts
     */
    @serialize()
    public lensFlareGhostDispersal: number = 1.4;
    /**
     * Main lens flare halo width
     */
    @serialize()
    public lensFlareHaloWidth: number = 0.7;
    /**
     * Based on the lens distortion effect, defines how much the lens flare result
     * is distorted
     */
    @serialize()
    public lensFlareDistortionStrength: number = 16.0;
    /**
     * Configures the blur intensity used for for lens flare (halo)
     */
    @serialize()
    public lensFlareBlurWidth: number = 512.0;
    /**
     * Lens star texture must be used to simulate rays on the flares and is available
     * in the documentation
     */
    @serializeAsTexture("lensStarTexture")
    public lensStarTexture: Nullable<Texture> = null;
    /**
     * As the "lensTexture" (can be the same texture or different), it is used to apply the lens
     * flare effect by taking account of the dirt texture
     */
    @serializeAsTexture("lensFlareDirtTexture")
    public lensFlareDirtTexture: Nullable<Texture> = null;

    /**
     * Represents the focal length for the depth of field effect
     */
    @serialize()
    public depthOfFieldDistance: number = 10.0;
    /**
     * Represents the blur intensity for the blurred part of the depth of field effect
     */
    @serialize()
    public depthOfFieldBlurWidth: number = 64.0;

    /**
     * Gets how much the image is blurred by the movement while using the motion blur post-process
     */
    @serialize()
    public get motionStrength(): number {
        return this._motionStrength;
    }
    /**
     * Sets how much the image is blurred by the movement while using the motion blur post-process
     */
    public set motionStrength(strength: number) {
        this._motionStrength = strength;

        if (this._isObjectBasedMotionBlur && this.motionBlurPostProcess) {
            (this.motionBlurPostProcess as MotionBlurPostProcess).motionStrength = strength;
        }
    }

    /**
     * Gets wether or not the motion blur post-process is object based or screen based.
     */
    @serialize()
    public get objectBasedMotionBlur(): boolean {
        return this._isObjectBasedMotionBlur;
    }
    /**
     * Sets wether or not the motion blur post-process should be object based or screen based
     */
    public set objectBasedMotionBlur(value: boolean) {
        const shouldRebuild = this._isObjectBasedMotionBlur !== value;
        this._isObjectBasedMotionBlur = value;

        if (shouldRebuild) {
            this._buildPipeline();
        }
    }

    /**
     * List of animations for the pipeline (IAnimatable implementation)
     */
    public animations: Animation[] = [];

    /**
    * Private members
    */
    private _scene: Scene;
    private _currentDepthOfFieldSource: Nullable<PostProcess> = null;
    private _basePostProcess: Nullable<PostProcess>;

    private _fixedExposure: number = 1.0;
    private _currentExposure: number = 1.0;
    private _hdrAutoExposure: boolean = false;
    private _hdrCurrentLuminance: number = 1.0;
    private _motionStrength: number = 1.0;
    private _isObjectBasedMotionBlur: boolean = false;

    private _floatTextureType: number;

    private _camerasToBeAttached: Array<Camera> = [];

    @serialize()
    private _ratio: number;

    // Getters and setters
    private _bloomEnabled: boolean = false;
    private _depthOfFieldEnabled: boolean = false;
    private _vlsEnabled: boolean = false;
    private _lensFlareEnabled: boolean = false;
    private _hdrEnabled: boolean = false;
    private _motionBlurEnabled: boolean = false;
    private _fxaaEnabled: boolean = false;
    private _screenSpaceReflectionsEnabled: boolean = false;

    private _motionBlurSamples: number = 64.0;
    private _volumetricLightStepsCount: number = 50.0;
    private _samples: number = 1;

    /**
     * @ignore
     * Specifies if the bloom pipeline is enabled
     */
    @serialize()
    public get BloomEnabled(): boolean {
        return this._bloomEnabled;
    }

    public set BloomEnabled(enabled: boolean) {
        if (this._bloomEnabled === enabled) {
            return;
        }

        this._bloomEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * @ignore
     * Specifies if the depth of field pipeline is enabed
     */
    @serialize()
    public get DepthOfFieldEnabled(): boolean {
        return this._depthOfFieldEnabled;
    }

    public set DepthOfFieldEnabled(enabled: boolean) {
        if (this._depthOfFieldEnabled === enabled) {
            return;
        }

        this._depthOfFieldEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * @ignore
     * Specifies if the lens flare pipeline is enabed
     */
    @serialize()
    public get LensFlareEnabled(): boolean {
        return this._lensFlareEnabled;
    }

    public set LensFlareEnabled(enabled: boolean) {
        if (this._lensFlareEnabled === enabled) {
            return;
        }

        this._lensFlareEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * @ignore
     * Specifies if the HDR pipeline is enabled
     */
    @serialize()
    public get HDREnabled(): boolean {
        return this._hdrEnabled;
    }

    public set HDREnabled(enabled: boolean) {
        if (this._hdrEnabled === enabled) {
            return;
        }

        this._hdrEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * @ignore
     * Specifies if the volumetric lights scattering effect is enabled
     */
    @serialize()
    public get VLSEnabled(): boolean {
        return this._vlsEnabled;
    }

    public set VLSEnabled(enabled) {
        if (this._vlsEnabled === enabled) {
            return;
        }

        if (enabled) {
            var geometry = this._scene.enableGeometryBufferRenderer();
            if (!geometry) {
                Logger.Warn("Geometry renderer is not supported, cannot create volumetric lights in Standard Rendering Pipeline");
                return;
            }
        }

        this._vlsEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * @ignore
     * Specifies if the motion blur effect is enabled
     */
    @serialize()
    public get MotionBlurEnabled(): boolean {
        return this._motionBlurEnabled;
    }

    public set MotionBlurEnabled(enabled: boolean) {
        if (this._motionBlurEnabled === enabled) {
            return;
        }

        this._motionBlurEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * Specifies if anti-aliasing is enabled
     */
    @serialize()
    public get fxaaEnabled(): boolean {
        return this._fxaaEnabled;
    }

    public set fxaaEnabled(enabled: boolean) {
        if (this._fxaaEnabled === enabled) {
            return;
        }

        this._fxaaEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * Specifies if screen space reflections are enabled.
     */
    @serialize()
    public get screenSpaceReflectionsEnabled(): boolean {
        return this._screenSpaceReflectionsEnabled;
    }

    public set screenSpaceReflectionsEnabled(enabled: boolean) {
        if (this._screenSpaceReflectionsEnabled === enabled) {
            return;
        }

        this._screenSpaceReflectionsEnabled = enabled;
        this._buildPipeline();
    }

    /**
     * Specifies the number of steps used to calculate the volumetric lights
     * Typically in interval [50, 200]
     */
    @serialize()
    public get volumetricLightStepsCount(): number {
        return this._volumetricLightStepsCount;
    }

    public set volumetricLightStepsCount(count: number) {
        if (this.volumetricLightPostProcess) {
            this.volumetricLightPostProcess.updateEffect("#define VLS\n#define NB_STEPS " + count.toFixed(1));
        }

        this._volumetricLightStepsCount = count;
    }

    /**
     * Specifies the number of samples used for the motion blur effect
     * Typically in interval [16, 64]
     */
    @serialize()
    public get motionBlurSamples(): number {
        return this._motionBlurSamples;
    }

    public set motionBlurSamples(samples: number) {
        if (this.motionBlurPostProcess) {
            if (this._isObjectBasedMotionBlur) {
                (this.motionBlurPostProcess as MotionBlurPostProcess).motionBlurSamples = samples;
            } else {
                this.motionBlurPostProcess.updateEffect("#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + samples.toFixed(1));
            }
        }

        this._motionBlurSamples = samples;
    }

    /**
     * Specifies MSAA sample count, setting this to 4 will provide 4x anti aliasing. (default: 1)
     */
    @serialize()
    public get samples(): number {
        return this._samples;
    }

    public set samples(sampleCount: number) {
        if (this._samples === sampleCount) {
            return;
        }

        this._samples = sampleCount;
        this._buildPipeline();
    }

    /**
     * Default pipeline should be used going forward but the standard pipeline will be kept for backwards compatibility.
     * @constructor
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param ratio The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
     * @param originalPostProcess the custom original color post-process. Must be "reusable". Can be null.
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     */
    constructor(name: string, scene: Scene, ratio: number, originalPostProcess: Nullable<PostProcess> = null, cameras?: Camera[]) {
        super(scene.getEngine(), name);
        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();

        // Initialize
        this._scene = scene;
        this._basePostProcess = originalPostProcess;
        this._ratio = ratio;

        // Misc
        this._floatTextureType = scene.getEngine().getCaps().textureFloatRender ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_HALF_FLOAT;

        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        this._buildPipeline();
    }

    private _buildPipeline(): void {
        var ratio = this._ratio;
        var scene = this._scene;

        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();

        // Create pass post-process
        if (this._screenSpaceReflectionsEnabled) {
            this.screenSpaceReflectionPostProcess = new ScreenSpaceReflectionPostProcess("HDRPass", scene, ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, this._floatTextureType);
            this.screenSpaceReflectionPostProcess.onApplyObservable.add(() => {
                this._currentDepthOfFieldSource = this.screenSpaceReflectionPostProcess;
            });
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRScreenSpaceReflections", () => this.screenSpaceReflectionPostProcess, true));
        }

        if (!this._basePostProcess) {
            this.originalPostProcess = new PostProcess("HDRPass", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", this._floatTextureType);
        }
        else {
            this.originalPostProcess = this._basePostProcess;
        }

        this.originalPostProcess.autoClear = !this.screenSpaceReflectionPostProcess;
        this.originalPostProcess.onApplyObservable.add(() => {
            this._currentDepthOfFieldSource = this.originalPostProcess;
        });

        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", () => this.originalPostProcess, true));

        if (this._bloomEnabled) {
            // Create down sample X4 post-process
            this._createDownSampleX4PostProcess(scene, ratio / 4);

            // Create bright pass post-process
            this._createBrightPassPostProcess(scene, ratio / 4);

            // Create gaussian blur post-processes (down sampling blurs)
            this._createBlurPostProcesses(scene, ratio / 4, 1);

            // Create texture adder post-process
            this._createTextureAdderPostProcess(scene, ratio);

            // Create depth-of-field source post-process
            this.textureAdderFinalPostProcess = new PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Constants.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBaseDepthOfFieldSource", () => { return this.textureAdderFinalPostProcess; }, true));
        }

        if (this._vlsEnabled) {
            // Create volumetric light
            this._createVolumetricLightPostProcess(scene, ratio);

            // Create volumetric light final post-process
            this.volumetricLightFinalPostProcess = new PostProcess("HDRVLSFinal", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Constants.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLSFinal", () => { return this.volumetricLightFinalPostProcess; }, true));
        }

        if (this._lensFlareEnabled) {
            // Create lens flare post-process
            this._createLensFlarePostProcess(scene, ratio);

            // Create depth-of-field source post-process post lens-flare and disable it now
            this.lensFlareFinalPostProcess = new PostProcess("HDRPostLensFlareDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Constants.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostLensFlareDepthOfFieldSource", () => { return this.lensFlareFinalPostProcess; }, true));
        }

        if (this._hdrEnabled) {
            // Create luminance
            this._createLuminancePostProcesses(scene, this._floatTextureType);

            // Create HDR
            this._createHdrPostProcess(scene, ratio);

            // Create depth-of-field source post-process post hdr and disable it now
            this.hdrFinalPostProcess = new PostProcess("HDRPostHDReDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Constants.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostHDReDepthOfFieldSource", () => { return this.hdrFinalPostProcess; }, true));
        }

        if (this._depthOfFieldEnabled) {
            // Create gaussian blur used by depth-of-field
            this._createBlurPostProcesses(scene, ratio / 2, 3, "depthOfFieldBlurWidth");

            // Create depth-of-field post-process
            this._createDepthOfFieldPostProcess(scene, ratio);
        }

        if (this._motionBlurEnabled) {
            // Create motion blur post-process
            this._createMotionBlurPostProcess(scene, ratio);
        }

        if (this._fxaaEnabled) {
            // Create fxaa post-process
            this.fxaaPostProcess = new FxaaPostProcess("fxaa", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, Constants.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRFxaa", () => { return this.fxaaPostProcess; }, true));
        }

        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }

        if (!this._enableMSAAOnFirstPostProcess(this._samples) && this._samples > 1) {
            Logger.Warn("MSAA failed to enable, MSAA is only supported in browsers that support webGL >= 2.0");
        }
    }

    // Down Sample X4 Post-Processs
    private _createDownSampleX4PostProcess(scene: Scene, ratio: number): void {
        var downSampleX4Offsets = new Array<number>(32);
        this.downSampleX4PostProcess = new PostProcess("HDRDownSampleX4", "standard", ["dsOffsets"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4", this._floatTextureType);

        this.downSampleX4PostProcess.onApply = (effect: Effect) => {
            var id = 0;
            let width = (<PostProcess>this.downSampleX4PostProcess).width;
            let height = (<PostProcess>this.downSampleX4PostProcess).height;

            for (var i = -2; i < 2; i++) {
                for (var j = -2; j < 2; j++) {
                    downSampleX4Offsets[id] = (i + 0.5) * (1.0 / width);
                    downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / height);
                    id += 2;
                }
            }

            effect.setArray2("dsOffsets", downSampleX4Offsets);
        };

        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4", () => { return this.downSampleX4PostProcess; }, true));
    }

    // Brightpass Post-Process
    private _createBrightPassPostProcess(scene: Scene, ratio: number): void {
        var brightOffsets = new Array<number>(8);
        this.brightPassPostProcess = new PostProcess("HDRBrightPass", "standard", ["dsOffsets", "brightThreshold"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS", this._floatTextureType);

        this.brightPassPostProcess.onApply = (effect: Effect) => {
            var sU = (1.0 / (<PostProcess>this.brightPassPostProcess).width);
            var sV = (1.0 / (<PostProcess>this.brightPassPostProcess).height);

            brightOffsets[0] = -0.5 * sU;
            brightOffsets[1] = 0.5 * sV;
            brightOffsets[2] = 0.5 * sU;
            brightOffsets[3] = 0.5 * sV;
            brightOffsets[4] = -0.5 * sU;
            brightOffsets[5] = -0.5 * sV;
            brightOffsets[6] = 0.5 * sU;
            brightOffsets[7] = -0.5 * sV;

            effect.setArray2("dsOffsets", brightOffsets);
            effect.setFloat("brightThreshold", this.brightThreshold);
        };

        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBrightPass", () => { return this.brightPassPostProcess; }, true));
    }

    // Create blur H&V post-processes
    private _createBlurPostProcesses(scene: Scene, ratio: number, indice: number, blurWidthKey: string = "blurWidth"): void {
        var engine = scene.getEngine();

        var blurX = new BlurPostProcess("HDRBlurH" + "_" + indice, new Vector2(1, 0), (<any>this)[blurWidthKey], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, this._floatTextureType);
        var blurY = new BlurPostProcess("HDRBlurV" + "_" + indice, new Vector2(0, 1), (<any>this)[blurWidthKey], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, this._floatTextureType);

        blurX.onActivateObservable.add(() => {
            let dw = blurX.width / engine.getRenderWidth();
            blurX.kernel = (<any>this)[blurWidthKey] * dw;
        });

        blurY.onActivateObservable.add(() => {
            let dw = blurY.height / engine.getRenderHeight();
            blurY.kernel = this.horizontalBlur ? 64 * dw : (<any>this)[blurWidthKey] * dw;
        });

        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBlurH" + indice, () => { return blurX; }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBlurV" + indice, () => { return blurY; }, true));

        this.blurHPostProcesses.push(blurX);
        this.blurVPostProcesses.push(blurY);
    }

    // Create texture adder post-process
    private _createTextureAdderPostProcess(scene: Scene, ratio: number): void {
        this.textureAdderPostProcess = new PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", this._floatTextureType);
        this.textureAdderPostProcess.onApply = (effect: Effect) => {
            effect.setTextureFromPostProcess("otherSampler", this._vlsEnabled ? this._currentDepthOfFieldSource : this.originalPostProcess);
            effect.setTexture("lensSampler", this.lensTexture);

            effect.setFloat("exposure", this._currentExposure);

            this._currentDepthOfFieldSource = this.textureAdderFinalPostProcess;
        };

        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", () => { return this.textureAdderPostProcess; }, true));
    }

    private _createVolumetricLightPostProcess(scene: Scene, ratio: number): void {
        var geometryRenderer = <GeometryBufferRenderer>scene.enableGeometryBufferRenderer();
        geometryRenderer.enablePosition = true;

        var geometry = geometryRenderer.getGBuffer();

        // Base post-process
        this.volumetricLightPostProcess = new PostProcess("HDRVLS", "standard",
            ["shadowViewProjection", "cameraPosition", "sunDirection", "sunColor", "scatteringCoefficient", "scatteringPower", "depthValues"],
            ["shadowMapSampler", "positionSampler"],
            ratio / 8,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false, "#define VLS\n#define NB_STEPS " + this._volumetricLightStepsCount.toFixed(1));

        var depthValues = Vector2.Zero();

        this.volumetricLightPostProcess.onApply = (effect: Effect) => {
            if (this.sourceLight && this.sourceLight.getShadowGenerator() && this._scene.activeCamera) {
                var generator = this.sourceLight.getShadowGenerator()!;

                effect.setTexture("shadowMapSampler", generator.getShadowMap());
                effect.setTexture("positionSampler", geometry.textures[2]);

                effect.setColor3("sunColor", this.sourceLight.diffuse);
                effect.setVector3("sunDirection", this.sourceLight.getShadowDirection());

                effect.setVector3("cameraPosition", this._scene.activeCamera.globalPosition);
                effect.setMatrix("shadowViewProjection", generator.getTransformMatrix());

                effect.setFloat("scatteringCoefficient", this.volumetricLightCoefficient);
                effect.setFloat("scatteringPower", this.volumetricLightPower);

                depthValues.x = this.sourceLight.getDepthMinZ(this._scene.activeCamera);
                depthValues.y = this.sourceLight.getDepthMaxZ(this._scene.activeCamera);
                effect.setVector2("depthValues", depthValues);
            }
        };

        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLS", () => { return this.volumetricLightPostProcess; }, true));

        // Smooth
        this._createBlurPostProcesses(scene, ratio / 4, 0, "volumetricLightBlurScale");

        // Merge
        this.volumetricLightMergePostProces = new PostProcess("HDRVLSMerge", "standard", [], ["originalSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define VLSMERGE");

        this.volumetricLightMergePostProces.onApply = (effect: Effect) => {
            effect.setTextureFromPostProcess("originalSampler", this._bloomEnabled ? this.textureAdderFinalPostProcess : this.originalPostProcess);

            this._currentDepthOfFieldSource = this.volumetricLightFinalPostProcess;
        };

        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLSMerge", () => { return this.volumetricLightMergePostProces; }, true));
    }

    // Create luminance
    private _createLuminancePostProcesses(scene: Scene, textureType: number): void {
        // Create luminance
        var size = Math.pow(3, StandardRenderingPipeline.LuminanceSteps);
        this.luminancePostProcess = new PostProcess("HDRLuminance", "standard", ["lumOffsets"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE", textureType);

        var offsets: number[] = [];
        this.luminancePostProcess.onApply = (effect: Effect) => {
            var sU = (1.0 / (<PostProcess>this.luminancePostProcess).width);
            var sV = (1.0 / (<PostProcess>this.luminancePostProcess).height);

            offsets[0] = -0.5 * sU;
            offsets[1] = 0.5 * sV;
            offsets[2] = 0.5 * sU;
            offsets[3] = 0.5 * sV;
            offsets[4] = -0.5 * sU;
            offsets[5] = -0.5 * sV;
            offsets[6] = 0.5 * sU;
            offsets[7] = -0.5 * sV;

            effect.setArray2("lumOffsets", offsets);
        };

        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLuminance", () => { return this.luminancePostProcess; }, true));

        // Create down sample luminance
        for (var i = StandardRenderingPipeline.LuminanceSteps - 1; i >= 0; i--) {
            var size = Math.pow(3, i);

            var defines = "#define LUMINANCE_DOWN_SAMPLE\n";
            if (i === 0) {
                defines += "#define FINAL_DOWN_SAMPLER";
            }

            var postProcess = new PostProcess("HDRLuminanceDownSample" + i, "standard", ["dsOffsets", "halfDestPixelSize"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, defines, textureType);
            this.luminanceDownSamplePostProcesses.push(postProcess);
        }

        // Create callbacks and add effects
        var lastLuminance: Nullable<PostProcess> = this.luminancePostProcess;

        this.luminanceDownSamplePostProcesses.forEach((pp, index) => {
            var downSampleOffsets = new Array<number>(18);

            pp.onApply = (effect: Effect) => {
                if (!lastLuminance) {
                    return;
                }

                var id = 0;
                for (var x = -1; x < 2; x++) {
                    for (var y = -1; y < 2; y++) {
                        downSampleOffsets[id] = x / lastLuminance.width;
                        downSampleOffsets[id + 1] = y / lastLuminance.height;
                        id += 2;
                    }
                }

                effect.setArray2("dsOffsets", downSampleOffsets);
                effect.setFloat("halfDestPixelSize", 0.5 / lastLuminance.width);

                if (index === this.luminanceDownSamplePostProcesses.length - 1) {
                    lastLuminance = this.luminancePostProcess;
                } else {
                    lastLuminance = pp;
                }
            };

            if (index === this.luminanceDownSamplePostProcesses.length - 1) {
                pp.onAfterRender = () => {
                    var pixel = scene.getEngine().readPixels(0, 0, 1, 1);
                    var bit_shift = new Vector4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
                    this._hdrCurrentLuminance = (pixel[0] * bit_shift.x + pixel[1] * bit_shift.y + pixel[2] * bit_shift.z + pixel[3] * bit_shift.w) / 100.0;
                };
            }

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLuminanceDownSample" + index, () => { return pp; }, true));
        });
    }

    // Create HDR post-process
    private _createHdrPostProcess(scene: Scene, ratio: number): void {
        const defines = ["#define HDR"];
        if (this._hdrAutoExposure) {
            defines.push("#define AUTO_EXPOSURE");
        }
        this.hdrPostProcess = new PostProcess("HDR", "standard", ["averageLuminance"], ["textureAdderSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, defines.join("\n"), Constants.TEXTURETYPE_UNSIGNED_INT);

        var outputLiminance = 1;
        var time = 0;
        var lastTime = 0;

        this.hdrPostProcess.onApply = (effect: Effect) => {
            effect.setTextureFromPostProcess("textureAdderSampler", this._currentDepthOfFieldSource);

            time += scene.getEngine().getDeltaTime();

            if (outputLiminance < 0) {
                outputLiminance = this._hdrCurrentLuminance;
            } else {
                var dt = (lastTime - time) / 1000.0;

                if (this._hdrCurrentLuminance < outputLiminance + this.hdrDecreaseRate * dt) {
                    outputLiminance += this.hdrDecreaseRate * dt;
                }
                else if (this._hdrCurrentLuminance > outputLiminance - this.hdrIncreaseRate * dt) {
                    outputLiminance -= this.hdrIncreaseRate * dt;
                }
                else {
                    outputLiminance = this._hdrCurrentLuminance;
                }
            }

            if (this.hdrAutoExposure) {
                this._currentExposure = this._fixedExposure / outputLiminance;
            } else {
                outputLiminance = Scalar.Clamp(outputLiminance, this.hdrMinimumLuminance, 1e20);
                effect.setFloat("averageLuminance", outputLiminance);
            }

            lastTime = time;

            this._currentDepthOfFieldSource = this.hdrFinalPostProcess;
        };

        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDR", () => { return this.hdrPostProcess; }, true));
    }

    // Create lens flare post-process
    private _createLensFlarePostProcess(scene: Scene, ratio: number): void {
        this.lensFlarePostProcess = new PostProcess("HDRLensFlare", "standard", ["strength", "ghostDispersal", "haloWidth", "resolution", "distortionStrength"], ["lensColorSampler"], ratio / 2, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE", Constants.TEXTURETYPE_UNSIGNED_INT);
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlare", () => { return this.lensFlarePostProcess; }, true));

        this._createBlurPostProcesses(scene, ratio / 4, 2, "lensFlareBlurWidth");

        this.lensFlareComposePostProcess = new PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", Constants.TEXTURETYPE_UNSIGNED_INT);
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", () => { return this.lensFlareComposePostProcess; }, true));

        var resolution = new Vector2(0, 0);

        // Lens flare
        this.lensFlarePostProcess.onApply = (effect: Effect) => {
            effect.setTextureFromPostProcess("textureSampler", this._bloomEnabled ? this.blurHPostProcesses[0] : this.originalPostProcess);
            effect.setTexture("lensColorSampler", this.lensColorTexture);
            effect.setFloat("strength", this.lensFlareStrength);
            effect.setFloat("ghostDispersal", this.lensFlareGhostDispersal);
            effect.setFloat("haloWidth", this.lensFlareHaloWidth);

            // Shift
            resolution.x = (<PostProcess>this.lensFlarePostProcess).width;
            resolution.y = (<PostProcess>this.lensFlarePostProcess).height;
            effect.setVector2("resolution", resolution);

            effect.setFloat("distortionStrength", this.lensFlareDistortionStrength);
        };

        // Compose
        var scaleBias1 = Matrix.FromValues(
            2.0, 0.0, -1.0, 0.0,
            0.0, 2.0, -1.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        );

        var scaleBias2 = Matrix.FromValues(
            0.5, 0.0, 0.5, 0.0,
            0.0, 0.5, 0.5, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        );

        this.lensFlareComposePostProcess.onApply = (effect: Effect) => {
            if (!this._scene.activeCamera) {
                return;
            }

            effect.setTextureFromPostProcess("otherSampler", this.lensFlarePostProcess);
            effect.setTexture("lensDirtSampler", this.lensFlareDirtTexture);
            effect.setTexture("lensStarSampler", this.lensStarTexture);

            // Lens start rotation matrix
            var camerax = (<Vector4>this._scene.activeCamera.getViewMatrix().getRow(0));
            var cameraz = (<Vector4>this._scene.activeCamera.getViewMatrix().getRow(2));
            var camRot = Vector3.Dot(camerax.toVector3(), new Vector3(1.0, 0.0, 0.0)) + Vector3.Dot(cameraz.toVector3(), new Vector3(0.0, 0.0, 1.0));
            camRot *= 4.0;

            var starRotation = Matrix.FromValues(
                Math.cos(camRot) * 0.5, -Math.sin(camRot), 0.0, 0.0,
                Math.sin(camRot), Math.cos(camRot) * 0.5, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            );

            var lensStarMatrix = scaleBias2.multiply(starRotation).multiply(scaleBias1);

            effect.setMatrix("lensStarMatrix", lensStarMatrix);

            this._currentDepthOfFieldSource = this.lensFlareFinalPostProcess;
        };
    }

    // Create depth-of-field post-process
    private _createDepthOfFieldPostProcess(scene: Scene, ratio: number): void {
        this.depthOfFieldPostProcess = new PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", Constants.TEXTURETYPE_UNSIGNED_INT);
        this.depthOfFieldPostProcess.onApply = (effect: Effect) => {
            effect.setTextureFromPostProcess("otherSampler", this._currentDepthOfFieldSource);
            effect.setTexture("depthSampler", this._getDepthTexture());

            effect.setFloat("distance", this.depthOfFieldDistance);
        };

        // Add to pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", () => { return this.depthOfFieldPostProcess; }, true));
    }

    // Create motion blur post-process
    private _createMotionBlurPostProcess(scene: Scene, ratio: number): void {
        if (this._isObjectBasedMotionBlur) {
            const mb = new MotionBlurPostProcess("HDRMotionBlur", scene, ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, Constants.TEXTURETYPE_UNSIGNED_INT);
            mb.motionStrength = this.motionStrength;
            mb.motionBlurSamples = this.motionBlurSamples;
            this.motionBlurPostProcess = mb;
        } else {
            this.motionBlurPostProcess = new PostProcess("HDRMotionBlur", "standard",
                ["inverseViewProjection", "prevViewProjection", "screenSize", "motionScale", "motionStrength"],
                ["depthSampler"],
                ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + this.motionBlurSamples.toFixed(1), Constants.TEXTURETYPE_UNSIGNED_INT);

            var motionScale: number = 0;
            var prevViewProjection = Matrix.Identity();
            var invViewProjection = Matrix.Identity();
            var viewProjection = Matrix.Identity();
            var screenSize = Vector2.Zero();

            this.motionBlurPostProcess.onApply = (effect: Effect) => {
                viewProjection = scene.getProjectionMatrix().multiply(scene.getViewMatrix());

                viewProjection.invertToRef(invViewProjection);
                effect.setMatrix("inverseViewProjection", invViewProjection);

                effect.setMatrix("prevViewProjection", prevViewProjection);
                prevViewProjection = viewProjection;

                screenSize.x = (<PostProcess>this.motionBlurPostProcess).width;
                screenSize.y = (<PostProcess>this.motionBlurPostProcess).height;
                effect.setVector2("screenSize", screenSize);

                motionScale = scene.getEngine().getFps() / 60.0;
                effect.setFloat("motionScale", motionScale);
                effect.setFloat("motionStrength", this.motionStrength);

                effect.setTexture("depthSampler", this._getDepthTexture());
            };
        }

        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRMotionBlur", () => { return this.motionBlurPostProcess; }, true));
    }

    private _getDepthTexture(): Texture {
        if (this._scene.getEngine().getCaps().drawBuffersExtension) {
            let renderer = <GeometryBufferRenderer>this._scene.enableGeometryBufferRenderer();
            return renderer.getGBuffer().textures[0];
        }

        return this._scene.enableDepthRenderer().getDepthMap();
    }

    private _disposePostProcesses(): void {
        for (var i = 0; i < this._cameras.length; i++) {
            var camera = this._cameras[i];

            if (this.originalPostProcess) { this.originalPostProcess.dispose(camera); }
            if (this.screenSpaceReflectionPostProcess) { this.screenSpaceReflectionPostProcess.dispose(camera); }

            if (this.downSampleX4PostProcess) { this.downSampleX4PostProcess.dispose(camera); }
            if (this.brightPassPostProcess) { this.brightPassPostProcess.dispose(camera); }
            if (this.textureAdderPostProcess) { this.textureAdderPostProcess.dispose(camera); }

            if (this.volumetricLightPostProcess) { this.volumetricLightPostProcess.dispose(camera); }
            if (this.volumetricLightSmoothXPostProcess) { this.volumetricLightSmoothXPostProcess.dispose(camera); }
            if (this.volumetricLightSmoothYPostProcess) { this.volumetricLightSmoothYPostProcess.dispose(camera); }
            if (this.volumetricLightMergePostProces) { this.volumetricLightMergePostProces.dispose(camera); }
            if (this.volumetricLightFinalPostProcess) { this.volumetricLightFinalPostProcess.dispose(camera); }

            if (this.lensFlarePostProcess) { this.lensFlarePostProcess.dispose(camera); }
            if (this.lensFlareComposePostProcess) { this.lensFlareComposePostProcess.dispose(camera); }

            for (var j = 0; j < this.luminanceDownSamplePostProcesses.length; j++) {
                this.luminanceDownSamplePostProcesses[j].dispose(camera);
            }

            if (this.luminancePostProcess) { this.luminancePostProcess.dispose(camera); }
            if (this.hdrPostProcess) { this.hdrPostProcess.dispose(camera); }
            if (this.hdrFinalPostProcess) { this.hdrFinalPostProcess.dispose(camera); }

            if (this.depthOfFieldPostProcess) { this.depthOfFieldPostProcess.dispose(camera); }

            if (this.motionBlurPostProcess) { this.motionBlurPostProcess.dispose(camera); }

            if (this.fxaaPostProcess) { this.fxaaPostProcess.dispose(camera); }

            for (var j = 0; j < this.blurHPostProcesses.length; j++) {
                this.blurHPostProcesses[j].dispose(camera);
            }

            for (var j = 0; j < this.blurVPostProcesses.length; j++) {
                this.blurVPostProcesses[j].dispose(camera);
            }
        }

        this.originalPostProcess = null;
        this.downSampleX4PostProcess = null;
        this.brightPassPostProcess = null;
        this.textureAdderPostProcess = null;
        this.textureAdderFinalPostProcess = null;
        this.volumetricLightPostProcess = null;
        this.volumetricLightSmoothXPostProcess = null;
        this.volumetricLightSmoothYPostProcess = null;
        this.volumetricLightMergePostProces = null;
        this.volumetricLightFinalPostProcess = null;
        this.lensFlarePostProcess = null;
        this.lensFlareComposePostProcess = null;
        this.luminancePostProcess = null;
        this.hdrPostProcess = null;
        this.hdrFinalPostProcess = null;
        this.depthOfFieldPostProcess = null;
        this.motionBlurPostProcess = null;
        this.fxaaPostProcess = null;
        this.screenSpaceReflectionPostProcess = null;

        this.luminanceDownSamplePostProcesses = [];
        this.blurHPostProcesses = [];
        this.blurVPostProcesses = [];
    }

    /**
     * Dispose of the pipeline and stop all post processes
     */
    public dispose(): void {
        this._disposePostProcesses();

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

        super.dispose();
    }

    /**
     * Serialize the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);

        if (this.sourceLight) {
            serializationObject.sourceLightId = this.sourceLight.id;
        }

        if (this.screenSpaceReflectionPostProcess) {
            serializationObject.screenSpaceReflectionPostProcess = SerializationHelper.Serialize(this.screenSpaceReflectionPostProcess);
        }

        serializationObject.customType = "StandardRenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): StandardRenderingPipeline {
        var p = SerializationHelper.Parse(() => new StandardRenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);

        if (source.sourceLightId) {
            p.sourceLight = <SpotLight | DirectionalLight>scene.getLightByID(source.sourceLightId);
        }

        if (source.screenSpaceReflectionPostProcess) {
            SerializationHelper.Parse(() => p.screenSpaceReflectionPostProcess, source.screenSpaceReflectionPostProcess, scene, rootUrl);
        }

        return p;
    }

    /**
     * Luminance steps
     */
    public static LuminanceSteps: number = 6;
}

_TypeStore.RegisteredTypes["BABYLON.StandardRenderingPipeline"] = StandardRenderingPipeline;
