/* eslint-disable @typescript-eslint/naming-convention */
import { Logger } from "../../../Misc/logger";
import { serialize, SerializationHelper } from "../../../Misc/decorators";
import { Vector3, Matrix, Quaternion, TmpVectors } from "../../../Maths/math.vector";
import type { Camera } from "../../../Cameras/camera";
import type { Effect } from "../../../Materials/effect";
import { PostProcess } from "../../postProcess";
import { PostProcessRenderPipeline } from "../postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../postProcessRenderEffect";
import type { Scene } from "../../../scene";
import { RegisterClass } from "../../../Misc/typeStore";
import { ScreenSpaceReflections2Configuration } from "../../../Rendering/screenSpaceReflections2Configuration";
import type { PrePassRenderer } from "../../../Rendering/prePassRenderer";
import { GeometryBufferRenderer } from "../../../Rendering/geometryBufferRenderer";
import { Constants } from "../../../Engines/constants";
import type { Nullable } from "../../../types";
import type { CubeTexture } from "../../../Materials/Textures/cubeTexture";
import { DepthRenderer } from "../../../Rendering/depthRenderer";
import type { ISize } from "../../../Maths/math.size";

import "../postProcessRenderPipelineManagerSceneComponent";

import "../../../Shaders/screenSpaceReflection2.fragment";
import "../../../Shaders/screenSpaceReflection2Blur.fragment";
import "../../../Shaders/screenSpaceReflection2BlurCombiner.fragment";

const trs = Matrix.Compose(new Vector3(0.5, 0.5, 0.5), Quaternion.Identity(), new Vector3(0.5, 0.5, 0.5));
const trsWebGPU = Matrix.Compose(new Vector3(0.5, 0.5, 1), Quaternion.Identity(), new Vector3(0.5, 0.5, 0));

/**
 * Render pipeline to produce Screen Space Reflections (SSR) effect
 *
 * References:
 *   Screen Space Ray Tracing:
 *     - http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html
 *     - https://sourceforge.net/p/g3d/code/HEAD/tree/G3D10/data-files/shader/screenSpaceRayTrace.glsl
 *     - https://github.com/kode80/kode80SSR
 *   SSR:
 *     - general tips: https://sakibsaikia.github.io/graphics/2016/12/26/Screen-Space-Reflection-in-Killing-Floor-2.html
 *     - computation of blur radius from roughness and distance: https://github.com/godotengine/godot/blob/master/servers/rendering/renderer_rd/shaders/effects/screen_space_reflection.glsl
 *     - blur and usage of back depth buffer: https://github.com/kode80/kode80SSR
 */
export class SSRRenderingPipeline extends PostProcessRenderPipeline {
    /**
     * The SSR PostProcess effect id in the pipeline
     */
    public SSRRenderEffect: string = "SSRRenderEffect";
    /**
     * The blur PostProcess effect id in the pipeline
     */
    public SSRBlurRenderEffect: string = "SSRBlurRenderEffect";
    /**
     * The PostProcess effect id in the pipeline that combines the SSR-Blur output with the original scene color
     */
    public SSRCombineRenderEffect: string = "SSRCombineRenderEffect";

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
     * Gets or sets the maxDistance used to define how far we look for reflection during the ray-marching on the reflected ray (default: 1000).
     * Note that this value is a view (camera) space distance (not pixels!).
     */
    @serialize()
    public maxDistance: number = 1000.0;
    /**
     * Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel. Should be an integer \>= 1 as it is the number of pixels we advance at each step (default: 1).
     * Use higher values to improve performances (but at the expense of quality).
     */
    @serialize()
    public step: number = 1.0;
    /**
     * Gets or sets the thickness value used as tolerance when computing the intersection between the reflected ray and the scene (default: 0.5).
     * If setting "enableAutomaticThicknessComputation" to true, you can use lower values for "thickness" (even 0), as the geometry thickness
     * is automatically computed thank to the regular depth buffer + the backface depth buffer
     */
    @serialize()
    public thickness: number = 0.5;
    /**
     * Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results (default: 1).
     */
    @serialize()
    public strength: number = 1;
    /**
     * Gets or sets the falloff exponent used to compute the reflection strength. Higher values lead to fainter reflections (default: 1).
     */
    @serialize()
    public reflectionSpecularFalloffExponent: number = 1;
    /**
     * Maximum number of steps during the ray marching process after which we consider an intersection could not be found (default: 1000)
     */
    @serialize()
    public maxSteps: number = 1000.0;
    /**
     * Gets or sets the factor applied when computing roughness. Default value is 0.2.
     * When blurring based on roughness is enabled (meaning blurDispersionStrength \> 0), roughnessFactor is used as a global roughness factor applied on all objects.
     * If you want to disable this global roughness set it to 0.
     */
    @serialize()
    public roughnessFactor: number = 0.2;
    /**
     * Number of steps to skip at start when marching the ray to avoid self collisions (default: 1)
     * 1 should normally be a good value, depending on the scene you may need to use a higher value (2 or 3)
     */
    @serialize()
    public selfCollisionNumSkip = 1;

    @serialize("blurDispersionStrength")
    private _blurDispersionStrength = 1 / 20;

    /**
     * Gets or sets the blur dispersion strength. Set this value to 0 to disable blurring (default: 0.05)
     * The reflections are blurred based on the distance between the pixel shaded and the reflected pixel: the higher the distance the more blurry the reflection is.
     * blurDispersionStrength allows to increase or decrease this effect.
     */
    public get blurDispersionStrength() {
        return this._blurDispersionStrength;
    }

    public set blurDispersionStrength(strength: number) {
        if (strength === this._blurDispersionStrength) {
            return;
        }

        const rebuild = (strength === 0 && this._blurDispersionStrength !== 0) || (strength !== 0 && this._blurDispersionStrength === 0);

        this._blurDispersionStrength = strength;

        if (rebuild) {
            this._buildPipeline();
        }
    }

    /**
     * Apply different weighting when blurring.
     * Must be a value between 2 and 5
     */
    @serialize()
    public blurQuality = 2;

    @serialize("enableSmoothReflections")
    private _enableSmoothReflections: boolean = false;

    /**
     * Gets or sets whether or not smoothing reflections is enabled.
     * Enabling smoothing will require more GPU power and can generate a drop in FPS.
     * Note that this setting has no effect if step = 1: it's only used if step \> 1.
     */
    public get enableSmoothReflections(): boolean {
        return this._enableSmoothReflections;
    }

    public set enableSmoothReflections(enabled: boolean) {
        if (enabled === this._enableSmoothReflections) {
            return;
        }

        this._enableSmoothReflections = enabled;
        this._updateEffectDefines();
    }

    @serialize("environmentTexture")
    private _environmentTexture: Nullable<CubeTexture>;

    /**
     * Gets or sets the environment cube texture used to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance/maxSteps is reached.
     */
    public get environmentTexture() {
        return this._environmentTexture;
    }

    public set environmentTexture(texture: Nullable<CubeTexture>) {
        this._environmentTexture = texture;
        this._updateEffectDefines();
    }

    @serialize("environmentTextureIsProbe")
    private _environmentTextureIsProbe: boolean = false;

    /**
     * Gets or sets the boolean defining if the environment texture is a standard cubemap (false) or a probe (true). Default value is false.
     * Note: a probe cube texture is treated differently than an ordinary cube texture because the Y axis is reversed.
     */
    public get environmentTextureIsProbe(): boolean {
        return this._environmentTextureIsProbe;
    }

    public set environmentTextureIsProbe(isProbe: boolean) {
        this._environmentTextureIsProbe = isProbe;
        this._updateEffectDefines();
    }

    @serialize("attenuateScreenBorders")
    private _attenuateScreenBorders = true;

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated at the screen borders (default: true).
     */
    public get attenuateScreenBorders() {
        return this._attenuateScreenBorders;
    }

    public set attenuateScreenBorders(attenuate: boolean) {
        if (this._attenuateScreenBorders === attenuate) {
            return;
        }
        this._attenuateScreenBorders = attenuate;
        this._updateEffectDefines();
    }

    @serialize("attenuateIntersectionDistance")
    private _attenuateIntersectionDistance = true;

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the distance of the intersection (default: true).
     */
    public get attenuateIntersectionDistance() {
        return this._attenuateIntersectionDistance;
    }

    public set attenuateIntersectionDistance(attenuate: boolean) {
        if (this._attenuateIntersectionDistance === attenuate) {
            return;
        }
        this._attenuateIntersectionDistance = attenuate;
        this._updateEffectDefines();
    }

    @serialize("attenuateFacingCamera")
    private _attenuateFacingCamera = false;

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated when the reflection ray is facing the camera (the view direction) (default: false).
     */
    public get attenuateFacingCamera() {
        return this._attenuateFacingCamera;
    }

    public set attenuateFacingCamera(attenuate: boolean) {
        if (this._attenuateFacingCamera === attenuate) {
            return;
        }
        this._attenuateFacingCamera = attenuate;
        this._updateEffectDefines();
    }

    @serialize("attenuateBackfaceReflection")
    private _attenuateBackfaceReflection = false;

    /**
     * Gets or sets a boolean indicating if the backface reflections should be attenuated (default: false).
     */
    public get attenuateBackfaceReflection() {
        return this._attenuateBackfaceReflection;
    }

    public set attenuateBackfaceReflection(attenuate: boolean) {
        if (this._attenuateBackfaceReflection === attenuate) {
            return;
        }
        this._attenuateBackfaceReflection = attenuate;
        this._updateEffectDefines();
    }

    @serialize("clipToFrustum")
    private _clipToFrustum = true;

    /**
     * Gets or sets a boolean indicating if the ray should be clipped to the frustum (default: true).
     * You can try to set this parameter to false to save some performances: it may produce some artefacts in some cases, but generally they won't really be visible
     */
    public get clipToFrustum() {
        return this._clipToFrustum;
    }

    public set clipToFrustum(clip: boolean) {
        if (this._clipToFrustum === clip) {
            return;
        }
        this._clipToFrustum = clip;
        this._updateEffectDefines();
    }

    @serialize("enableAutomaticThicknessComputation")
    private _enableAutomaticThicknessComputation: boolean = false;

    /**
     * Gets or sets a boolean defining if geometry thickness should be computed automatically (default: false).
     * When enabled, a depth renderer is created which will render the back faces of the scene to a depth texture (meaning additional work for the GPU).
     * In that mode, the "thickness" property is still used as an offset to compute the ray intersection, but you can typically use a much lower
     * value than when enableAutomaticThicknessComputation is false (it's even possible to use a value of 0 when using low values for "step")
     * Note that for performance reasons, this option will only apply to the first camera to which the the rendering pipeline is attached!
     */
    public get enableAutomaticThicknessComputation(): boolean {
        return this._enableAutomaticThicknessComputation;
    }

    public set enableAutomaticThicknessComputation(automatic: boolean) {
        if (this._enableAutomaticThicknessComputation === automatic) {
            return;
        }

        this._enableAutomaticThicknessComputation = automatic;

        this._buildPipeline();
    }

    /**
     * Gets the depth renderer used to render the back faces of the scene to a depth texture.
     */
    public get backfaceDepthRenderer(): Nullable<DepthRenderer> {
        return this._depthRenderer;
    }

    @serialize("backfaceDepthTextureSizeFactor")
    private _backfaceDepthTextureSizeFactor = 1;

    /**
     * Gets or sets the size factor used to create the backface depth texture, used only if enableAutomaticThicknessComputation = true (default: 1).
     * This factor is used as a divisor of the full screen size (so, 2 means that the backface depth texture will be created at half the screen size, meaning better performances).
     * Note that you will get rendering artefacts when using a value different from 1: it's a tradeoff between image quality and performances.
     */
    public get backfaceDepthTextureSizeFactor() {
        return this._backfaceDepthTextureSizeFactor;
    }

    public set backfaceDepthTextureSizeFactor(factor: number) {
        if (this._backfaceDepthTextureSizeFactor === factor) {
            return;
        }

        this._backfaceDepthTextureSizeFactor = factor;
        this._resizeDepthRenderer();
    }

    @serialize("isEnabled")
    private _isEnabled = true;

    /**
     * Gets or sets a boolean indicating if the effect is enabled (default: true).
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;

        if (!value) {
            if (this._cameras !== null) {
                this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
                this._cameras = this._camerasToBeAttached.slice();
            }
        } else if (value) {
            if (!this._isDirty) {
                if (this._cameras !== null) {
                    this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
                }
            } else {
                this._buildPipeline();
            }
        }
    }

    @serialize("debug")
    private _debug = false;

    /**
     * Gets or sets a boolean indicating if the effect should be rendered in debug mode (default: false).
     * In this mode, colors have this meaning:
     *   - blue: the ray hit the max distance (we reached maxDistance)
     *   - red: the ray ran out of steps (we reached maxSteps)
     *   - yellow: the ray went off screen
     *   - green: the ray hit a surface. The brightness of the green color is proportional to the distance between the ray origin and the intersection point: A brighter green means more computation than a darker green.
     * In the first 3 cases, the final color is calculated by mixing the skybox color with the pixel color (if environmentTexture is defined), otherwise the pixel color is not modified
     * You should try to get as few blue/red/yellow pixels as possible, as this means that the ray has gone further than if it had hit a surface.
     */
    public get debug(): boolean {
        return this._debug;
    }

    public set debug(value: boolean) {
        if (this._debug === value) {
            return;
        }

        this._debug = value;

        this._buildPipeline();
    }

    private _forceGeometryBuffer: boolean = false;
    private get _geometryBufferRenderer(): Nullable<GeometryBufferRenderer> {
        if (!this._forceGeometryBuffer) {
            return null;
        }

        return this._scene.geometryBufferRenderer;
    }

    private get _prePassRenderer(): Nullable<PrePassRenderer> {
        if (this._forceGeometryBuffer) {
            return null;
        }

        return this._scene.prePassRenderer;
    }

    private _scene: Scene;
    private _isDirty = false;
    private _camerasToBeAttached: Array<Camera> = [];
    private _textureType: number;
    private _ssrPostProcess: Nullable<PostProcess>;
    private _blurPostProcessX: Nullable<PostProcess>;
    private _blurPostProcessY: Nullable<PostProcess>;
    private _blurCombinerPostProcess: Nullable<PostProcess>;
    private _depthRenderer: Nullable<DepthRenderer>;
    private _depthRendererCamera: Nullable<Camera>;

    /**
     * Gets active scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Constructor of the SSR rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param cameras The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param forceGeometryBuffer Set to true if you want to use the legacy geometry buffer renderer (default: false)
     * @param textureType The texture type used by the different post processes created by SSR (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    constructor(name: string, scene: Scene, cameras?: Camera[], forceGeometryBuffer = false, textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE) {
        super(scene.getEngine(), name);

        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();

        this._scene = scene;
        this._textureType = textureType;
        this._forceGeometryBuffer = forceGeometryBuffer;

        if (!this.isSupported) {
            Logger.Error("The current engine does not support SSR.");
            return;
        }

        scene.postProcessRenderPipelineManager.addPipeline(this);

        if (this._forceGeometryBuffer) {
            const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
            if (geometryBufferRenderer) {
                geometryBufferRenderer.enableReflectivity = true;
            }
        } else {
            const prePassRenderer = scene.enablePrePassRenderer();
            prePassRenderer?.markAsDirty();
        }

        this._buildPipeline();
    }

    /**
     * Get the class name
     * @returns "SSRRenderingPipeline"
     */
    public getClassName(): string {
        return "SSRRenderingPipeline";
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
        const index = this._camerasToBeAttached.indexOf(camera);
        this._camerasToBeAttached.splice(index, 1);
        this._buildPipeline();
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableGeometryBufferRenderer
     */
    public dispose(disableGeometryBufferRenderer: boolean = false): void {
        this._disposeDepthRenderer();
        this._disposePostProcesses();

        if (disableGeometryBufferRenderer) {
            this._scene.disableGeometryBufferRenderer();
        }

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

        super.dispose();
    }

    private _getTextureSize() {
        const engine = this._scene.getEngine();
        const geometryBufferRenderer = this._geometryBufferRenderer;
        const prePassRenderer = this._prePassRenderer;

        let textureSize: ISize = { width: engine.getRenderWidth(), height: engine.getRenderHeight() };

        if (geometryBufferRenderer) {
            textureSize = geometryBufferRenderer.getGBuffer().textures[0].getSize();
        } else if (prePassRenderer) {
            const depthIndex = prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
            const renderTarget = prePassRenderer.getRenderTarget();

            if (renderTarget && renderTarget.textures) {
                textureSize = renderTarget.textures[depthIndex].getSize();
            }
        }

        return textureSize;
    }

    private _updateEffectDefines(): void {
        const defines: string[] = [];

        if (this._geometryBufferRenderer || this._prePassRenderer) {
            defines.push("#define SSR_SUPPORTED");
        }
        if (this._enableSmoothReflections) {
            defines.push("#define SSRAYTRACE_ENABLE_REFINEMENT");
        }
        if (this._scene.useRightHandedSystem) {
            defines.push("#define SSRAYTRACE_RIGHT_HANDED_SCENE");
        }
        if (this._environmentTexture) {
            defines.push("#define SSR_USE_ENVIRONMENT_CUBE");
            if (this._environmentTexture.boundingBoxSize) {
                defines.push("#define SSR_USE_LOCAL_REFLECTIONMAP_CUBIC");
            }
        }
        if (this._environmentTextureIsProbe) {
            defines.push("#define SSR_INVERTCUBICMAP");
        }
        if (this._enableAutomaticThicknessComputation) {
            defines.push("#define SSRAYTRACE_USE_BACK_DEPTHBUFFER");
        }
        if (this._attenuateScreenBorders) {
            defines.push("#define SSR_ATTENUATE_SCREEN_BORDERS");
        }
        if (this._attenuateIntersectionDistance) {
            defines.push("#define SSR_ATTENUATE_INTERSECTION_DISTANCE");
        }
        if (this._attenuateFacingCamera) {
            defines.push("#define SSR_ATTENUATE_FACING_CAMERA");
        }
        if (this._attenuateBackfaceReflection) {
            defines.push("#define SSR_ATTENUATE_BACKFACE_REFLECTION");
        }
        if (this._clipToFrustum) {
            defines.push("#define SSRAYTRACE_CLIP_TO_FRUSTUM");
        }
        if (this._blurDispersionStrength > 0) {
            defines.push("#define SSR_USE_BLUR");
        }
        if (this._debug) {
            defines.push("#define SSRAYTRACE_DEBUG");
        }

        this._ssrPostProcess?.updateEffect(defines.join("\n"));
    }

    private _buildPipeline() {
        if (!this._isEnabled) {
            this._isDirty = true;
            return;
        }

        this._isDirty = false;

        const engine = this._scene.getEngine();

        this._disposeDepthRenderer();
        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();

        if (this._enableAutomaticThicknessComputation) {
            const camera = this._cameras?.[0];

            if (camera) {
                this._depthRendererCamera = camera;
                this._depthRenderer = new DepthRenderer(this._scene, undefined, undefined, undefined, Constants.TEXTURE_NEAREST_SAMPLINGMODE, true, "SSRBackDepth");
                this._depthRenderer.clearColor.r = 1e8; // put a big value because we use the storeCameraSpaceZ mode
                this._depthRenderer.reverseCulling = true; // we generate depth for the back faces
                this._depthRenderer.getDepthMap().noPrePassRenderer = true; // we don't want the prepass renderer to attach to our depth buffer!

                this._resizeDepthRenderer();

                camera.customRenderTargets.push(this._depthRenderer.getDepthMap());
            }
        }

        this._createSSRPostProcess();
        this.addEffect(
            new PostProcessRenderEffect(
                engine,
                this.SSRRenderEffect,
                () => {
                    return this._ssrPostProcess;
                },
                true
            )
        );

        if (this._blurDispersionStrength > 0) {
            this._createBlurAndCombinerPostProcesses();
            this.addEffect(
                new PostProcessRenderEffect(
                    engine,
                    this.SSRBlurRenderEffect,
                    () => {
                        return [this._blurPostProcessX!, this._blurPostProcessY!];
                    },
                    true
                )
            );
            this.addEffect(
                new PostProcessRenderEffect(
                    engine,
                    this.SSRCombineRenderEffect,
                    () => {
                        return this._blurCombinerPostProcess;
                    },
                    true
                )
            );
        }

        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }
    }

    private _resizeDepthRenderer() {
        if (!this._depthRenderer) {
            return;
        }

        const textureSize = this._getTextureSize();
        const depthRendererSize = this._depthRenderer.getDepthMap().getSize();

        const width = Math.floor(textureSize.width / this._backfaceDepthTextureSizeFactor);
        const height = Math.floor(textureSize.height / this._backfaceDepthTextureSizeFactor);

        if (depthRendererSize.width !== width || depthRendererSize.height !== height) {
            this._depthRenderer.getDepthMap().resize({ width, height });
        }
    }

    private _disposeDepthRenderer() {
        if (this._depthRenderer) {
            if (this._depthRendererCamera) {
                const idx = this._depthRendererCamera.customRenderTargets.indexOf(this._depthRenderer.getDepthMap()) ?? -1;
                if (idx !== -1) {
                    this._depthRendererCamera.customRenderTargets.splice(idx, 1);
                }
            }
            this._depthRendererCamera = null;
            this._depthRenderer.getDepthMap().dispose();
        }
        this._depthRenderer = null;
    }

    private _disposePostProcesses(): void {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];

            this._ssrPostProcess?.dispose(camera);
            this._blurPostProcessX?.dispose(camera);
            this._blurPostProcessY?.dispose(camera);
            this._blurCombinerPostProcess?.dispose(camera);
        }

        this._ssrPostProcess = null;
        this._blurPostProcessX = null;
        this._blurPostProcessY = null;
        this._blurCombinerPostProcess = null;
    }

    private _createSSRPostProcess(): void {
        this._ssrPostProcess = new PostProcess(
            "ssr",
            "screenSpaceReflection2",
            [
                "projection",
                "invProjectionMatrix",
                "view",
                "invView",
                "thickness",
                "reflectionSpecularFalloffExponent",
                "strength",
                "stepSize",
                "maxSteps",
                "roughnessFactor",
                "projectionPixel",
                "nearPlaneZ",
                "maxDistance",
                "selfCollisionNumSkip",
                "vReflectionPosition",
                "vReflectionSize",
                "backSizeFactor",
            ],
            ["textureSampler", "normalSampler", "reflectivitySampler", "depthSampler", "envCubeSampler", "backDepthSampler"],
            1.0,
            null,
            this._textureType,
            this._scene.getEngine(),
            false,
            "",
            this._textureType
        );

        this._updateEffectDefines();

        this._ssrPostProcess.onApply = (effect: Effect) => {
            this._resizeDepthRenderer();

            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;

            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }

            if (geometryBufferRenderer) {
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);

                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[1]);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
                effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[0]);
            } else if (prePassRenderer) {
                const depthIndex = prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
                const roughnessIndex = prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                const normalIndex = prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE);

                effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
            }

            if (this._enableAutomaticThicknessComputation && this._depthRenderer) {
                effect.setTexture("backDepthSampler", this._depthRenderer.getDepthMap());
                effect.setFloat("backSizeFactor", this._backfaceDepthTextureSizeFactor);
            }

            const camera = this._scene.activeCamera;
            if (!camera) {
                return;
            }

            const viewMatrix = camera.getViewMatrix(true);
            const projectionMatrix = camera.getProjectionMatrix(true);

            projectionMatrix.invertToRef(TmpVectors.Matrix[0]);
            viewMatrix.invertToRef(TmpVectors.Matrix[1]);

            effect.setMatrix("projection", projectionMatrix);
            effect.setMatrix("view", viewMatrix);
            effect.setMatrix("invView", TmpVectors.Matrix[1]);
            effect.setMatrix("invProjectionMatrix", TmpVectors.Matrix[0]);
            effect.setFloat("thickness", this.thickness);
            effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
            effect.setFloat("strength", this.strength);
            effect.setFloat("stepSize", this.step);
            effect.setFloat("maxSteps", this.maxSteps);
            effect.setFloat("roughnessFactor", this.roughnessFactor);
            effect.setFloat("nearPlaneZ", camera.minZ);
            effect.setFloat("maxDistance", this.maxDistance);
            effect.setFloat("selfCollisionNumSkip", this.selfCollisionNumSkip);

            const textureSize = this._getTextureSize();

            Matrix.ScalingToRef(textureSize!.width, textureSize!.height, 1, TmpVectors.Matrix[2]);

            projectionMatrix.multiplyToRef(this._scene.getEngine().isWebGPU ? trsWebGPU : trs, TmpVectors.Matrix[3]);

            TmpVectors.Matrix[3].multiplyToRef(TmpVectors.Matrix[2], TmpVectors.Matrix[4]);

            effect.setMatrix("projectionPixel", TmpVectors.Matrix[4]);

            if (this._environmentTexture) {
                effect.setTexture("envCubeSampler", this._environmentTexture);

                if (this._environmentTexture.boundingBoxSize) {
                    effect.setVector3("vReflectionPosition", this._environmentTexture.boundingBoxPosition);
                    effect.setVector3("vReflectionSize", this._environmentTexture.boundingBoxSize);
                }
            }
        };
        this._ssrPostProcess.samples = this.samples;

        if (!this._forceGeometryBuffer) {
            this._ssrPostProcess._prePassEffectConfiguration = new ScreenSpaceReflections2Configuration();
        }
    }

    private _createBlurAndCombinerPostProcesses() {
        const engine = this._scene.getEngine();

        this._blurPostProcessX = new PostProcess(
            "SSRblurX",
            "screenSpaceReflection2Blur",
            ["blurQuality", "texelOffsetScale"],
            ["textureSampler"],
            1,
            null,
            Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine,
            false,
            "",
            this._textureType
        );
        this._blurPostProcessX.autoClear = false;

        this._blurPostProcessX.onApplyObservable.add((effect) => {
            let width = this._scene.getEngine().getRenderWidth();

            if (this._prePassRenderer) {
                const colorIndex = this._prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
                const renderTarget = this._prePassRenderer.getRenderTarget();

                if (renderTarget && renderTarget.textures) {
                    width = renderTarget.textures[colorIndex].getSize().width;
                }
            } else {
                width = this._ssrPostProcess?.inputTexture.width ?? width;
            }

            effect.setFloat("blurQuality", this.blurQuality);
            effect.setFloat2("texelOffsetScale", this._blurDispersionStrength / width, 0);
        });

        this._blurPostProcessY = new PostProcess(
            "SSRblurY",
            "screenSpaceReflection2Blur",
            ["blurQuality", "texelOffsetScale"],
            ["textureSampler"],
            1,
            null,
            Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine,
            false,
            "",
            this._textureType
        );
        this._blurPostProcessY.autoClear = false;

        this._blurPostProcessY.onApplyObservable.add((effect) => {
            let height = this._scene.getEngine().getRenderHeight();

            if (this._prePassRenderer) {
                const colorIndex = this._prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
                const renderTarget = this._prePassRenderer.getRenderTarget();

                if (renderTarget && renderTarget.textures) {
                    height = renderTarget.textures[colorIndex].getSize().height;
                }
            } else {
                height = this._ssrPostProcess?.inputTexture.height ?? height;
            }

            effect.setFloat("blurQuality", this.blurQuality);
            effect.setFloat2("texelOffsetScale", 0, this._blurDispersionStrength / height);
        });

        this._blurCombinerPostProcess = new PostProcess(
            "SSRblurCombiner",
            "screenSpaceReflection2BlurCombiner",
            ["strength", "reflectionSpecularFalloffExponent"],
            ["textureSampler", "mainSampler", "reflectivitySampler"],
            1,
            null,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            engine,
            false,
            "",
            this._textureType
        );
        this._blurCombinerPostProcess.autoClear = false;

        this._blurCombinerPostProcess.onApplyObservable.add((effect) => {
            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;

            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }

            if (prePassRenderer) {
                const colorIndex = prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
                const renderTarget = prePassRenderer.getRenderTarget();

                if (renderTarget && renderTarget.textures) {
                    effect.setTexture("mainSampler", renderTarget.textures[colorIndex]);
                }
            } else {
                effect._bindTexture("mainSampler", this._ssrPostProcess!.inputTexture.texture);
            }

            if (geometryBufferRenderer) {
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
            } else if (prePassRenderer) {
                const roughnessIndex = prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
            }

            effect.setFloat("strength", this.strength);
            effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
        });
    }

    /**
     * Serializes the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "SSRRenderingPipeline";

        return serializationObject;
    }

    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): SSRRenderingPipeline {
        return SerializationHelper.Parse(() => new SSRRenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.SSRRenderingPipeline", SSRRenderingPipeline);
