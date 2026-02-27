/* eslint-disable @typescript-eslint/naming-convention */
import { serialize } from "../../../Misc/decorators";
import { SerializationHelper } from "../../../Misc/decorators.serialization";
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
import { ThinSSRRenderingPipeline } from "./thinSSRRenderingPipeline";
import { ThinSSRPostProcess } from "core/PostProcesses/thinSSRPostProcess";
import { ThinSSRBlurPostProcess } from "core/PostProcesses/thinSSRBlurPostProcess";
import { ThinSSRBlurCombinerPostProcess } from "core/PostProcesses/thinSSRBlurCombinerPostProcess";

import "../postProcessRenderPipelineManagerSceneComponent";
import "../../../Rendering/geometryBufferRendererSceneComponent";

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

    private _thinSSRRenderingPipeline: ThinSSRRenderingPipeline;

    private _samples = 1;
    /**
     * MSAA sample count, setting this to 4 will provide 4x anti aliasing. (default: 1)
     */
    public set samples(sampleCount: number) {
        if (this._samples === sampleCount) {
            return;
        }
        this._samples = sampleCount;
        if (this._ssrPostProcess) {
            this._ssrPostProcess.samples = this.samples;
        }
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
    public get maxDistance() {
        return this._thinSSRRenderingPipeline.maxDistance;
    }

    public set maxDistance(distance: number) {
        this._thinSSRRenderingPipeline.maxDistance = distance;
    }

    /**
     * Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel. Should be an integer \>= 1 as it is the number of pixels we advance at each step (default: 1).
     * Use higher values to improve performances (but at the expense of quality).
     */
    @serialize()
    public get step() {
        return this._thinSSRRenderingPipeline.step;
    }

    public set step(step: number) {
        this._thinSSRRenderingPipeline.step = step;
    }

    /**
     * Gets or sets the thickness value used as tolerance when computing the intersection between the reflected ray and the scene (default: 0.5).
     * If setting "enableAutomaticThicknessComputation" to true, you can use lower values for "thickness" (even 0), as the geometry thickness
     * is automatically computed thank to the regular depth buffer + the backface depth buffer
     */
    @serialize()
    public get thickness() {
        return this._thinSSRRenderingPipeline.thickness;
    }

    public set thickness(thickness: number) {
        this._thinSSRRenderingPipeline.thickness = thickness;
    }

    /**
     * Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results (default: 1).
     */
    @serialize()
    public get strength() {
        return this._thinSSRRenderingPipeline.strength;
    }

    public set strength(strength: number) {
        this._thinSSRRenderingPipeline.strength = strength;
    }

    /**
     * Gets or sets the falloff exponent used to compute the reflection strength. Higher values lead to fainter reflections (default: 1).
     */
    @serialize()
    public get reflectionSpecularFalloffExponent() {
        return this._thinSSRRenderingPipeline.reflectionSpecularFalloffExponent;
    }

    public set reflectionSpecularFalloffExponent(exponent: number) {
        this._thinSSRRenderingPipeline.reflectionSpecularFalloffExponent = exponent;
    }

    /**
     * Maximum number of steps during the ray marching process after which we consider an intersection could not be found (default: 1000).
     * Should be an integer value.
     */
    @serialize()
    public get maxSteps() {
        return this._thinSSRRenderingPipeline.maxSteps;
    }

    public set maxSteps(steps: number) {
        this._thinSSRRenderingPipeline.maxSteps = steps;
    }

    /**
     * Gets or sets the factor applied when computing roughness. Default value is 0.2.
     * When blurring based on roughness is enabled (meaning blurDispersionStrength \> 0), roughnessFactor is used as a global roughness factor applied on all objects.
     * If you want to disable this global roughness set it to 0.
     */
    @serialize()
    public get roughnessFactor() {
        return this._thinSSRRenderingPipeline.roughnessFactor;
    }

    public set roughnessFactor(factor: number) {
        this._thinSSRRenderingPipeline.roughnessFactor = factor;
    }

    /**
     * Number of steps to skip at start when marching the ray to avoid self collisions (default: 1)
     * 1 should normally be a good value, depending on the scene you may need to use a higher value (2 or 3)
     */
    @serialize()
    public get selfCollisionNumSkip() {
        return this._thinSSRRenderingPipeline.selfCollisionNumSkip;
    }

    public set selfCollisionNumSkip(skip: number) {
        this._thinSSRRenderingPipeline.selfCollisionNumSkip = skip;
    }

    /**
     * Gets or sets the minimum value for one of the reflectivity component of the material to consider it for SSR (default: 0.04).
     * If all r/g/b components of the reflectivity is below or equal this value, the pixel will not be considered reflective and SSR won't be applied.
     */
    @serialize()
    public get reflectivityThreshold() {
        return this._thinSSRRenderingPipeline.reflectivityThreshold;
    }

    public set reflectivityThreshold(threshold: number) {
        const currentThreshold = this.reflectivityThreshold;

        if (threshold === currentThreshold) {
            return;
        }

        this._thinSSRRenderingPipeline.reflectivityThreshold = threshold;

        if ((threshold === 0 && currentThreshold !== 0) || (threshold !== 0 && currentThreshold === 0)) {
            this._buildPipeline();
        }
    }

    /**
     * Gets or sets the downsample factor used to reduce the size of the texture used to compute the SSR contribution (default: 0).
     * Use 0 to render the SSR contribution at full resolution, 1 to render at half resolution, 2 to render at 1/3 resolution, etc.
     * Note that it is used only when blurring is enabled (blurDispersionStrength \> 0), because in that mode the SSR contribution is generated in a separate texture.
     */
    @serialize()
    public get ssrDownsample() {
        return this._thinSSRRenderingPipeline.ssrDownsample;
    }

    public set ssrDownsample(downsample: number) {
        this._thinSSRRenderingPipeline.ssrDownsample = downsample;
        this._buildPipeline();
    }

    /**
     * Gets or sets the blur dispersion strength. Set this value to 0 to disable blurring (default: 0.03)
     * The reflections are blurred based on the roughness of the surface and the distance between the pixel shaded and the reflected pixel: the higher the distance the more blurry the reflection is.
     * blurDispersionStrength allows to increase or decrease this effect.
     */
    @serialize("blurDispersionStrength")
    public get blurDispersionStrength() {
        return this._thinSSRRenderingPipeline.blurDispersionStrength;
    }

    public set blurDispersionStrength(strength: number) {
        const currentStrength = this.blurDispersionStrength;

        if (strength === currentStrength) {
            return;
        }

        this._thinSSRRenderingPipeline.blurDispersionStrength = strength;

        if ((strength === 0 && currentStrength !== 0) || (strength !== 0 && currentStrength === 0)) {
            this._buildPipeline();
        }
    }

    private _useBlur() {
        return this.blurDispersionStrength > 0;
    }

    /**
     * Gets or sets the downsample factor used to reduce the size of the textures used to blur the reflection effect (default: 0).
     * Use 0 to blur at full resolution, 1 to render at half resolution, 2 to render at 1/3 resolution, etc.
     */
    @serialize("blurDownsample")
    public get blurDownsample() {
        return this._thinSSRRenderingPipeline.blurDownsample;
    }

    public set blurDownsample(downsample: number) {
        this._thinSSRRenderingPipeline.blurDownsample = downsample;
        this._buildPipeline();
    }

    /**
     * Gets or sets whether or not smoothing reflections is enabled (default: false)
     * Enabling smoothing will require more GPU power.
     * Note that this setting has no effect if step = 1: it's only used if step \> 1.
     */
    @serialize("enableSmoothReflections")
    public get enableSmoothReflections(): boolean {
        return this._thinSSRRenderingPipeline.enableSmoothReflections;
    }

    public set enableSmoothReflections(enabled: boolean) {
        this._thinSSRRenderingPipeline.enableSmoothReflections = enabled;
    }

    private get _useScreenspaceDepth() {
        return this._thinSSRRenderingPipeline.useScreenspaceDepth;
    }

    /**
     * Gets or sets the environment cube texture used to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance/maxSteps is reached.
     */
    @serialize("environmentTexture")
    public get environmentTexture() {
        return this._thinSSRRenderingPipeline.environmentTexture;
    }

    public set environmentTexture(texture: Nullable<CubeTexture>) {
        this._thinSSRRenderingPipeline.environmentTexture = texture;
    }

    /**
     * Gets or sets the boolean defining if the environment texture is a standard cubemap (false) or a probe (true). Default value is false.
     * Note: a probe cube texture is treated differently than an ordinary cube texture because the Y axis is reversed.
     */
    @serialize("environmentTextureIsProbe")
    public get environmentTextureIsProbe(): boolean {
        return this._thinSSRRenderingPipeline.environmentTextureIsProbe;
    }

    public set environmentTextureIsProbe(isProbe: boolean) {
        this._thinSSRRenderingPipeline.environmentTextureIsProbe = isProbe;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated at the screen borders (default: true).
     */
    @serialize("attenuateScreenBorders")
    public get attenuateScreenBorders() {
        return this._thinSSRRenderingPipeline.attenuateScreenBorders;
    }

    public set attenuateScreenBorders(attenuate: boolean) {
        this._thinSSRRenderingPipeline.attenuateScreenBorders = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the distance of the intersection (default: true).
     */
    @serialize("attenuateIntersectionDistance")
    public get attenuateIntersectionDistance() {
        return this._thinSSRRenderingPipeline.attenuateIntersectionDistance;
    }

    public set attenuateIntersectionDistance(attenuate: boolean) {
        this._thinSSRRenderingPipeline.attenuateIntersectionDistance = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the number of iterations performed to find the intersection (default: true).
     */
    @serialize("attenuateIntersectionIterations")
    public get attenuateIntersectionIterations() {
        return this._thinSSRRenderingPipeline.attenuateIntersectionIterations;
    }

    public set attenuateIntersectionIterations(attenuate: boolean) {
        this._thinSSRRenderingPipeline.attenuateIntersectionIterations = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated when the reflection ray is facing the camera (the view direction) (default: false).
     */
    @serialize("attenuateFacingCamera")
    public get attenuateFacingCamera() {
        return this._thinSSRRenderingPipeline.attenuateFacingCamera;
    }

    public set attenuateFacingCamera(attenuate: boolean) {
        this._thinSSRRenderingPipeline.attenuateFacingCamera = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the backface reflections should be attenuated (default: false).
     */
    @serialize("attenuateBackfaceReflection")
    public get attenuateBackfaceReflection() {
        return this._thinSSRRenderingPipeline.attenuateBackfaceReflection;
    }

    public set attenuateBackfaceReflection(attenuate: boolean) {
        this._thinSSRRenderingPipeline.attenuateBackfaceReflection = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the ray should be clipped to the frustum (default: true).
     * You can try to set this parameter to false to save some performances: it may produce some artefacts in some cases, but generally they won't really be visible
     */
    @serialize("clipToFrustum")
    public get clipToFrustum() {
        return this._thinSSRRenderingPipeline.clipToFrustum;
    }

    public set clipToFrustum(clip: boolean) {
        this._thinSSRRenderingPipeline.clipToFrustum = clip;
    }

    /**
     * Gets or sets a boolean indicating whether the blending between the current color pixel and the reflection color should be done with a Fresnel coefficient (default: false).
     * It is more physically accurate to use the Fresnel coefficient (otherwise it uses the reflectivity of the material for blending), but it is also more expensive when you use blur (when blurDispersionStrength \> 0).
     */
    @serialize("useFresnel")
    public get useFresnel() {
        return this._thinSSRRenderingPipeline.useFresnel;
    }

    public set useFresnel(fresnel: boolean) {
        this._thinSSRRenderingPipeline.useFresnel = fresnel;
        this._buildPipeline();
    }

    /**
     * Gets or sets a boolean defining if geometry thickness should be computed automatically (default: false).
     * When enabled, a depth renderer is created which will render the back faces of the scene to a depth texture (meaning additional work for the GPU).
     * In that mode, the "thickness" property is still used as an offset to compute the ray intersection, but you can typically use a much lower
     * value than when enableAutomaticThicknessComputation is false (it's even possible to use a value of 0 when using low values for "step")
     * Note that for performance reasons, this option will only apply to the first camera to which the rendering pipeline is attached!
     */
    @serialize("enableAutomaticThicknessComputation")
    public get enableAutomaticThicknessComputation(): boolean {
        return this._thinSSRRenderingPipeline.enableAutomaticThicknessComputation;
    }

    public set enableAutomaticThicknessComputation(automatic: boolean) {
        this._thinSSRRenderingPipeline.enableAutomaticThicknessComputation = automatic;
        this._buildPipeline();
    }

    /**
     * Gets the depth renderer used to render the back faces of the scene to a depth texture.
     */
    public get backfaceDepthRenderer(): Nullable<DepthRenderer> {
        return this._depthRenderer;
    }

    @serialize("backfaceDepthTextureDownsample")
    private _backfaceDepthTextureDownsample = 0;

    /**
     * Gets or sets the downsample factor (default: 0) used to create the backface depth texture - used only if enableAutomaticThicknessComputation = true.
     * Use 0 to render the depth at full resolution, 1 to render at half resolution, 2 to render at 1/4 resolution, etc.
     * Note that you will get rendering artefacts when using a value different from 0: it's a tradeoff between image quality and performances.
     */
    public get backfaceDepthTextureDownsample() {
        return this._backfaceDepthTextureDownsample;
    }

    public set backfaceDepthTextureDownsample(factor: number) {
        if (this._backfaceDepthTextureDownsample === factor) {
            return;
        }

        this._backfaceDepthTextureDownsample = factor;
        this._resizeDepthRenderer();
    }

    @serialize("backfaceForceDepthWriteTransparentMeshes")
    private _backfaceForceDepthWriteTransparentMeshes = true;

    /**
     * Gets or sets a boolean (default: true) indicating if the depth of transparent meshes should be written to the backface depth texture (when automatic thickness computation is enabled).
     */
    public get backfaceForceDepthWriteTransparentMeshes() {
        return this._backfaceForceDepthWriteTransparentMeshes;
    }

    public set backfaceForceDepthWriteTransparentMeshes(force: boolean) {
        if (this._backfaceForceDepthWriteTransparentMeshes === force) {
            return;
        }

        this._backfaceForceDepthWriteTransparentMeshes = force;

        if (this._depthRenderer) {
            this._depthRenderer.forceDepthWriteTransparentMeshes = force;
        }
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

    /**
     * Gets or sets a boolean defining if the input color texture is in gamma space (default: true)
     * The SSR effect works in linear space, so if the input texture is in gamma space, we must convert the texture to linear space before applying the effect
     */
    @serialize("inputTextureColorIsInGammaSpace")
    public get inputTextureColorIsInGammaSpace(): boolean {
        return this._thinSSRRenderingPipeline.inputTextureColorIsInGammaSpace;
    }

    public set inputTextureColorIsInGammaSpace(gammaSpace: boolean) {
        this._thinSSRRenderingPipeline.inputTextureColorIsInGammaSpace = gammaSpace;
        this._buildPipeline();
    }

    /**
     * Gets or sets a boolean defining if the output color texture generated by the SSR pipeline should be in gamma space (default: true)
     * If you have a post-process that comes after the SSR and that post-process needs the input to be in a linear space, you must disable generateOutputInGammaSpace
     */
    @serialize("generateOutputInGammaSpace")
    public get generateOutputInGammaSpace(): boolean {
        return this._thinSSRRenderingPipeline.generateOutputInGammaSpace;
    }

    public set generateOutputInGammaSpace(gammaSpace: boolean) {
        this._thinSSRRenderingPipeline.generateOutputInGammaSpace = gammaSpace;
        this._buildPipeline();
    }

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
    @serialize("debug")
    public get debug(): boolean {
        return this._thinSSRRenderingPipeline.debug;
    }

    public set debug(value: boolean) {
        this._thinSSRRenderingPipeline.debug = value;
        this._buildPipeline();
    }

    /**
     * Checks if all the post processes in the pipeline are ready.
     * @returns True if all the post processes in the pipeline are ready
     */
    public isReady() {
        return this._thinSSRRenderingPipeline.isReady();
    }

    /**
     * Gets the scene the effect belongs to.
     * @returns the scene the effect belongs to.
     */
    public getScene() {
        return this._scene;
    }

    private _forceGeometryBuffer = false;
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
     * Returns true if SSR is supported by the running hardware
     */
    public override get isSupported(): boolean {
        const caps = this._scene.getEngine().getCaps();

        return caps.drawBuffersExtension && caps.texelFetch;
    }

    /**
     * Constructor of the SSR rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param cameras The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param forceGeometryBuffer Set to true if you want to use the legacy geometry buffer renderer (default: false)
     * @param textureType The texture type used by the different post processes created by SSR (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     * @param useScreenspaceDepth Indicates if the depth buffer should be linear or screenspace (default: false). This allows sharing the buffer with other effect pipelines that may require the depth to be in screenspace.
     */
    constructor(name: string, scene: Scene, cameras?: Camera[], forceGeometryBuffer = false, textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE, useScreenspaceDepth = false) {
        super(scene.getEngine(), name);

        this._thinSSRRenderingPipeline = new ThinSSRRenderingPipeline(name, scene);
        this._thinSSRRenderingPipeline.isSSRSupported = false;
        this._thinSSRRenderingPipeline.useScreenspaceDepth = useScreenspaceDepth;

        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();

        this._scene = scene;
        this._textureType = textureType;
        this._forceGeometryBuffer = forceGeometryBuffer;

        if (this.isSupported) {
            this._createSSRPostProcess();

            scene.postProcessRenderPipelineManager.addPipeline(this);

            if (this._forceGeometryBuffer) {
                const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
                if (geometryBufferRenderer) {
                    geometryBufferRenderer.enableReflectivity = true;
                    geometryBufferRenderer.useSpecificClearForDepthTexture = true;
                    geometryBufferRenderer.enableScreenspaceDepth = this._useScreenspaceDepth;
                    geometryBufferRenderer.enableDepth = !this._useScreenspaceDepth;
                }
            } else {
                const prePassRenderer = scene.enablePrePassRenderer();
                if (prePassRenderer) {
                    prePassRenderer.useSpecificClearForDepthTexture = true;
                    prePassRenderer.markAsDirty();
                }
            }

            this._thinSSRRenderingPipeline.isSSRSupported = !!this._geometryBufferRenderer || !!this._prePassRenderer;

            this._buildPipeline();
        }
    }

    /**
     * Get the class name
     * @returns "SSRRenderingPipeline"
     */
    public override getClassName(): string {
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
     * @param disableGeometryBufferRenderer if the geometry buffer renderer should be disabled
     */
    public override dispose(disableGeometryBufferRenderer: boolean = false): void {
        this._disposeDepthRenderer();
        this._disposeSSRPostProcess();
        this._disposeBlurPostProcesses();

        if (disableGeometryBufferRenderer) {
            this._scene.disableGeometryBufferRenderer();
        }

        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

        this._scene.postProcessRenderPipelineManager.removePipeline(this._name);

        this._thinSSRRenderingPipeline.dispose();

        super.dispose();
    }

    private _getTextureSize() {
        const engine = this._scene.getEngine();
        const prePassRenderer = this._prePassRenderer;

        let textureSize: ISize = { width: engine.getRenderWidth(), height: engine.getRenderHeight() };

        if (prePassRenderer && this._scene.activeCamera?._getFirstPostProcess() === this._ssrPostProcess) {
            const renderTarget = prePassRenderer.getRenderTarget();

            if (renderTarget && renderTarget.textures) {
                textureSize = renderTarget.textures[prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE)].getSize();
            }
        } else if (this._ssrPostProcess?.inputTexture) {
            textureSize.width = this._ssrPostProcess.inputTexture.width;
            textureSize.height = this._ssrPostProcess.inputTexture.height;
        }

        return textureSize;
    }

    private _buildPipeline() {
        if (!this.isSupported) {
            return;
        }

        if (!this._isEnabled) {
            this._isDirty = true;
            return;
        }

        this._isDirty = false;

        const engine = this._scene.getEngine();

        this._disposeDepthRenderer();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
            if (this._cameras.length > 0) {
                this._thinSSRRenderingPipeline.camera = this._cameras[0];
            }
        }
        this._reset();

        this._thinSSRRenderingPipeline.normalsAreInWorldSpace = !!(this._geometryBufferRenderer?.generateNormalsInWorldSpace ?? this._prePassRenderer?.generateNormalsInWorldSpace);

        if (this.enableAutomaticThicknessComputation) {
            const camera = this._cameras?.[0];

            if (camera) {
                this._depthRendererCamera = camera;
                this._depthRenderer = new DepthRenderer(
                    this._scene,
                    undefined,
                    undefined,
                    this._useScreenspaceDepth,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    !this._useScreenspaceDepth,
                    "SSRBackDepth"
                );
                this._depthRenderer.reverseCulling = true; // we generate depth for the back faces
                this._depthRenderer.forceDepthWriteTransparentMeshes = this.backfaceForceDepthWriteTransparentMeshes;

                this._resizeDepthRenderer();

                camera.customRenderTargets.push(this._depthRenderer.getDepthMap());
            }
        }

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

        this._disposeBlurPostProcesses();

        if (this._useBlur()) {
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

        const width = Math.floor(textureSize.width / (this.backfaceDepthTextureDownsample + 1));
        const height = Math.floor(textureSize.height / (this.backfaceDepthTextureDownsample + 1));

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

    private _disposeBlurPostProcesses(): void {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];

            this._blurPostProcessX?.dispose(camera);
            this._blurPostProcessY?.dispose(camera);
            this._blurCombinerPostProcess?.dispose(camera);
        }

        this._blurPostProcessX = null;
        this._blurPostProcessY = null;
        this._blurCombinerPostProcess = null;
    }

    private _disposeSSRPostProcess(): void {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];

            this._ssrPostProcess?.dispose(camera);
        }

        this._ssrPostProcess = null;
    }

    private _createSSRPostProcess(): void {
        this._ssrPostProcess = new PostProcess("ssr", ThinSSRPostProcess.FragmentUrl, {
            uniformNames: ThinSSRPostProcess.Uniforms,
            samplerNames: ThinSSRPostProcess.Samplers,
            size: 1.0,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            textureType: this._textureType,
            effectWrapper: this._thinSSRRenderingPipeline._ssrPostProcess,
        });

        this._ssrPostProcess.onApply = (effect: Effect) => {
            this._resizeDepthRenderer();

            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;

            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }

            if (geometryBufferRenderer) {
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);

                const normalIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[normalIndex]);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
                if (this._useScreenspaceDepth) {
                    const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
                    effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
                } else {
                    const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE);
                    effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
                }
            } else if (prePassRenderer) {
                const depthIndex = prePassRenderer.getIndex(this._useScreenspaceDepth ? Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE : Constants.PREPASS_DEPTH_TEXTURE_TYPE);
                const roughnessIndex = prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                const normalIndex = prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE);

                effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
            }

            if (this.enableAutomaticThicknessComputation && this._depthRenderer) {
                effect.setTexture("backDepthSampler", this._depthRenderer.getDepthMap());
                effect.setFloat("backSizeFactor", this.backfaceDepthTextureDownsample + 1);
            }

            const textureSize = this._getTextureSize();

            this._thinSSRRenderingPipeline._ssrPostProcess.textureWidth = textureSize.width;
            this._thinSSRRenderingPipeline._ssrPostProcess.textureHeight = textureSize.height;
        };

        this._ssrPostProcess.samples = this.samples;

        if (!this._forceGeometryBuffer) {
            this._ssrPostProcess._prePassEffectConfiguration = new ScreenSpaceReflections2Configuration(this._useScreenspaceDepth);
        }
    }

    private _createBlurAndCombinerPostProcesses() {
        const engine = this._scene.getEngine();

        this._blurPostProcessX = new PostProcess("SSRblurX", ThinSSRBlurPostProcess.FragmentUrl, {
            uniformNames: ThinSSRBlurPostProcess.Uniforms,
            samplerNames: ThinSSRBlurPostProcess.Samplers,
            size: 1 / (this.ssrDownsample + 1),
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine,
            textureType: this._textureType,
            effectWrapper: this._thinSSRRenderingPipeline._ssrBlurXPostProcess,
        });
        this._blurPostProcessX.autoClear = false;

        this._blurPostProcessX.onApplyObservable.add(() => {
            this._thinSSRRenderingPipeline._ssrBlurXPostProcess.textureWidth = this._blurPostProcessX?.inputTexture.width ?? this._scene.getEngine().getRenderWidth();
            this._thinSSRRenderingPipeline._ssrBlurXPostProcess.textureHeight = 1; // not used
        });

        this._blurPostProcessY = new PostProcess("SSRblurY", ThinSSRBlurPostProcess.FragmentUrl, {
            uniformNames: ThinSSRBlurPostProcess.Uniforms,
            samplerNames: ThinSSRBlurPostProcess.Samplers,
            size: 1 / (this.blurDownsample + 1),
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine,
            textureType: this._textureType,
            effectWrapper: this._thinSSRRenderingPipeline._ssrBlurYPostProcess,
        });
        this._blurPostProcessY.autoClear = false;

        this._blurPostProcessY.onApplyObservable.add(() => {
            this._thinSSRRenderingPipeline._ssrBlurYPostProcess.textureWidth = 1; // not used
            this._thinSSRRenderingPipeline._ssrBlurYPostProcess.textureHeight = this._blurPostProcessY?.inputTexture.height ?? this._scene.getEngine().getRenderHeight();
        });

        this._blurCombinerPostProcess = new PostProcess("SSRblurCombiner", ThinSSRBlurCombinerPostProcess.FragmentUrl, {
            uniformNames: ThinSSRBlurCombinerPostProcess.Uniforms,
            samplerNames: ThinSSRBlurCombinerPostProcess.Samplers,
            size: 1 / (this.blurDownsample + 1),
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            engine,
            textureType: this._textureType,
            effectWrapper: this._thinSSRRenderingPipeline._ssrBlurCombinerPostProcess,
        });
        this._blurCombinerPostProcess.autoClear = false;

        this._blurCombinerPostProcess.onApplyObservable.add((effect) => {
            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;

            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }

            if (prePassRenderer && this._scene.activeCamera?._getFirstPostProcess() === this._ssrPostProcess) {
                const renderTarget = prePassRenderer.getRenderTarget();

                if (renderTarget && renderTarget.textures) {
                    effect.setTexture("mainSampler", renderTarget.textures[prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE)]);
                }
            } else {
                effect.setTextureFromPostProcess("mainSampler", this._ssrPostProcess);
            }

            if (geometryBufferRenderer) {
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
                if (this.useFresnel) {
                    effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[1]);
                    if (this._useScreenspaceDepth) {
                        const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
                        effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
                    } else {
                        effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[0]);
                    }
                }
            } else if (prePassRenderer) {
                const roughnessIndex = prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
                if (this.useFresnel) {
                    const depthIndex = prePassRenderer.getIndex(
                        this._useScreenspaceDepth ? Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE : Constants.PREPASS_DEPTH_TEXTURE_TYPE
                    );
                    const normalIndex = prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE);

                    effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                    effect.setTexture("depthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
                }
            }
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
