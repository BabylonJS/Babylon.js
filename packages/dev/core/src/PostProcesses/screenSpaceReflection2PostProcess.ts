import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import { serialize, SerializationHelper } from "../Misc/decorators";
import type { PrePassRenderer } from "../Rendering/prePassRenderer";
import { ScreenSpaceReflections2Configuration } from "../Rendering/screenSpaceReflections2Configuration";
import { RegisterClass } from "../Misc/typeStore";
import { Matrix, Vector3, Quaternion, TmpVectors } from "../Maths/math.vector";
import type { CubeTexture } from "../Materials/Textures/cubeTexture";
import { DepthRenderer } from "../Rendering/depthRenderer";
import type { Observer } from "../Misc/observable";
import type { Scene } from "../scene";
import type { Engine } from "../Engines/engine";
import type { ISize } from "../Maths/math.size";

import "../Shaders/screenSpaceReflection2.fragment";
import "../Shaders/screenSpaceReflection2Blur.fragment";
import "../Shaders/screenSpaceReflection2BlurCombiner.fragment";

const trs = Matrix.Compose(new Vector3(0.5, 0.5, 0.5), Quaternion.Identity(), new Vector3(0.5, 0.5, 0.5));
const trsWebGPU = Matrix.Compose(new Vector3(0.5, 0.5, 1), Quaternion.Identity(), new Vector3(0.5, 0.5, 0));

/**
 * The ScreenSpaceReflection2PostProcess performs realtime reflections using only and only the available informations on the screen (positions and normals).
 * Basically, the screen space reflection post-process will compute reflections according the material's reflectivity.
 */
export class ScreenSpaceReflection2PostProcess extends PostProcess {
    /**
     * Gets or sets the maxDistance used to define how far we look for reflection during the ray-marching on the reflected ray (default: 1000).
     * Note that this value is a view (camera) space distance (not pixels!).
     */
    @serialize()
    public maxDistance: number = 1000.0;
    /**
     * Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel. Should be an integer >= 1 as it is the number of pixels we advance at each step (default: 1).
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
     * When blurring based on roughness is enabled (meaning blurDispersionStrength > 0), roughnessFactor is used as a global roughness factor applied on all objects.
     * If you want to disable this global roughness set it to 0
     */
    @serialize()
    public roughnessFactor: number = 0.2;
    /**
     * Number of steps to skip at start when marching the ray to avoid self collisions (default: 1)
     * 1 should normally be a good value, depending on the scene you may need to use a higher value (2 or 3)
     */
    @serialize()
    public selfCollisionNumSkip = 1;

    private _blurDispersionStrength = 1 / 20;

    /**
     * Gets or sets the blur dispersion strength. Set this value to 0 to disable blurring.
     * The reflections are blurred based on the distance between the pixel shaded and the reflected pixel: the higher the distance the more blurry the reflection is.
     * blurDispersionStrength allows to increase or decrease this effect.
     */
    @serialize()
    public get blurDispersionStrength() {
        return this._blurDispersionStrength;
    }

    public set blurDispersionStrength(strength: number) {
        if (strength === this._blurDispersionStrength) {
            return;
        }

        const updateDefines = (strength === 0 && this._blurDispersionStrength !== 0) || (strength !== 0 && this._blurDispersionStrength === 0);

        this._blurDispersionStrength = strength;

        if (updateDefines) {
            this._createBlurPostProcesses();
            this._updateEffectDefines();
        }
    }

    private _createBlurPostProcesses() {
        if ((this._blurPostProcessX && this._blurDispersionStrength > 0) || (!this._blurPostProcessX && this._blurDispersionStrength === 0)) {
            return;
        }

        const camera = this.getCamera();

        if (this._blurDispersionStrength > 0) {
            this._blurPostProcessX = new PostProcess(
                "SSRblurX",
                "screenSpaceReflection2Blur",
                ["blurQuality", "texelOffsetScale"],
                ["textureSampler"],
                1,
                null,
                Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                this.getEngine(),
                false,
                "",
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            this._blurPostProcessX.autoClear = false;

            this._blurPostProcessX.onApplyObservable.add((effect) => {
                let width = this.getEngine().getRenderWidth();

                if (this._prePassRenderer) {
                    const colorIndex = this._prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
                    const renderTarget = this._prePassRenderer.getRenderTarget();

                    if (renderTarget && renderTarget.textures) {
                        width = renderTarget.textures[colorIndex].getSize().width;
                    }
                } else {
                    width = this.inputTexture.width ?? width;
                }

                effect.setFloat("blurQuality", this.blurQuality);
                effect.setFloat2("texelOffsetScale", this._blurDispersionStrength / width, 0);
            });

            let postProcessIndex = camera._postProcesses!.indexOf(this);

            postProcessIndex = camera.attachPostProcess(this._blurPostProcessX, postProcessIndex + 1);

            this._blurPostProcessY = new PostProcess(
                "SSRblurY",
                "screenSpaceReflection2Blur",
                ["blurQuality", "texelOffsetScale"],
                ["textureSampler"],
                1,
                null,
                Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                this.getEngine(),
                false,
                "",
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            this._blurPostProcessY.autoClear = false;

            this._blurPostProcessY.onApplyObservable.add((effect) => {
                let height = this.getEngine().getRenderHeight();

                if (this._prePassRenderer) {
                    const colorIndex = this._prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
                    const renderTarget = this._prePassRenderer.getRenderTarget();

                    if (renderTarget && renderTarget.textures) {
                        height = renderTarget.textures[colorIndex].getSize().height;
                    }
                } else {
                    height = this.inputTexture.height ?? height;
                }

                effect.setFloat("blurQuality", this.blurQuality);
                effect.setFloat2("texelOffsetScale", 0, this._blurDispersionStrength / height);
            });

            postProcessIndex = camera.attachPostProcess(this._blurPostProcessY, postProcessIndex + 1);

            this._blurCombinerPostProcess = new PostProcess(
                "SSRblurCombiner",
                "screenSpaceReflection2BlurCombiner",
                ["strength", "reflectionSpecularFalloffExponent"],
                ["textureSampler", "mainSampler", "reflectivitySampler"],
                1,
                null,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                this.getEngine(),
                false,
                "",
                Constants.TEXTURETYPE_UNSIGNED_BYTE
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
                    effect._bindTexture("mainSampler", this.inputTexture.texture);
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

            camera.attachPostProcess(this._blurCombinerPostProcess, postProcessIndex + 1);
        } else {
            if (this._blurCombinerPostProcess) {
                camera.detachPostProcess(this._blurCombinerPostProcess);
                this._blurCombinerPostProcess.dispose();
                this._blurCombinerPostProcess = null;
            }
            if (this._blurPostProcessY) {
                camera.detachPostProcess(this._blurPostProcessY);
                this._blurPostProcessY?.dispose();
                this._blurPostProcessY = null;
            }
            if (this._blurPostProcessX) {
                camera.detachPostProcess(this._blurPostProcessX);
                this._blurPostProcessX?.dispose();
                this._blurPostProcessX = null;
            }
        }
    }

    /**
     * Apply different weighting when blurring.
     * Must be a value between 2 and 5
     */
    public blurQuality = 2;

    private _enableSmoothReflections: boolean = false;

    /**
     * Gets or sets whether or not smoothing reflections is enabled.
     * Enabling smoothing will require more GPU power and can generate a drop in FPS.
     * Note that this setting has no effect if step = 1: it's only used if step > 1.
     */
    @serialize()
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

    private _environmentTexture: Nullable<CubeTexture>;

    /**
     * Gets or sets the environment cube texture used to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance is reached.
     */
    public get environmentTexture() {
        return this._environmentTexture;
    }

    public set environmentTexture(texture: Nullable<CubeTexture>) {
        this._environmentTexture = texture;
        this._updateEffectDefines();
    }

    @serialize()
    private _environmentTextureIsProbe: boolean = false;

    /**
     * Gets or sets the boolean defining if the environment texture is a standard cubemap (false) or a probe (true). Default value is false.
     */
    public get environmentTextureIsProbe(): boolean {
        return this._environmentTextureIsProbe;
    }

    public set environmentTextureIsProbe(isProbe: boolean) {
        this._environmentTextureIsProbe = isProbe;
        this._updateEffectDefines();
    }

    @serialize()
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

    @serialize()
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

    @serialize()
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

    @serialize()
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

    @serialize()
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

    @serialize()
    private _enableAutomaticThicknessComputation: boolean = false;
    private _resizeObserver: Nullable<Observer<Engine>> = null;

    /**
     * Gets or sets a boolean defining if geometry thickness should be computed automatically (default: false).
     * When enabled, a depth renderer is created which will render the back faces of the scene to a depth texture (meaning additional work for the GPU).
     * In that mode, the "thickness" property is still used as an offset to compute the ray intersection, but you can typically use a much lower
     * value than when enableAutomaticThicknessComputation is false (it's even possible to use a value of 0 when using low values for "step")
     */
    public get enableAutomaticThicknessComputation(): boolean {
        return this._enableAutomaticThicknessComputation;
    }

    public set enableAutomaticThicknessComputation(automatic: boolean) {
        if (this._enableAutomaticThicknessComputation === automatic) {
            return;
        }
        if (this._enableAutomaticThicknessComputation) {
            this._disposeDepthRenderer();
            this._scene.getEngine().onResizeObservable.remove(this._resizeObserver);
            this._resizeObserver = null;
        }

        this._enableAutomaticThicknessComputation = automatic;

        if (this._enableAutomaticThicknessComputation) {
            this._depthRenderer = new DepthRenderer(this._scene, undefined, undefined, undefined, Constants.TEXTURE_NEAREST_SAMPLINGMODE, true, "SSRBackDepth");
            this._depthRenderer.clearColor.r = 1e8;
            this._depthRenderer.reverseCulling = true;

            this._resizeDepthRenderer();

            this._scene.customRenderTargets.push(this._depthRenderer.getDepthMap());

            this._resizeObserver = this._scene.getEngine().onResizeObservable.add(this._resizeDepthRenderer.bind(this));
        }

        this._updateEffectDefines();
    }

    @serialize()
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

    private _resizeDepthRenderer() {
        const textureSize = this._getTextureSize();

        const width = Math.floor(textureSize.width / this._backfaceDepthTextureSizeFactor);
        const height = Math.floor(textureSize.height / this._backfaceDepthTextureSizeFactor);

        this._depthRenderer?.getDepthMap().resize({ width, height });
    }

    private _disposeDepthRenderer() {
        if (this._depthRenderer) {
            const idx = this._scene.customRenderTargets.indexOf(this._depthRenderer.getDepthMap());
            if (idx !== -1) {
                this._scene.customRenderTargets.splice(idx, 1);
            }
            this._depthRenderer.getDepthMap().dispose();
        }
        this._depthRenderer = null;
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

    private _isSceneRightHanded: boolean;
    private _depthRenderer: Nullable<DepthRenderer>;
    private _blurPostProcessX: Nullable<PostProcess>;
    private _blurPostProcessY: Nullable<PostProcess>;
    private _blurCombinerPostProcess: Nullable<PostProcess>;

    /**
     * Gets a string identifying the name of the class
     * @returns "ScreenSpaceReflection2PostProcess" string
     */
    public getClassName(): string {
        return "ScreenSpaceReflection2PostProcess";
    }

    /**
     * Creates a new instance of ScreenSpaceReflectionPostProcess.
     * @param name The name of the effect.
     * @param scene The scene containing the objects to calculate reflections.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: true)
     * @param forceGeometryBuffer If this post process should use geometry buffer instead of prepass (default: false)
     */
    constructor(
        name: string,
        scene: Scene,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: Engine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false,
        forceGeometryBuffer = false
    ) {
        super(
            name,
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
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            "",
            textureType,
            undefined,
            null,
            blockCompilation
        );

        this._forceGeometryBuffer = forceGeometryBuffer;
        this._blurPostProcessX = null;
        this._blurPostProcessY = null;
        this._blurCombinerPostProcess = null;

        if (this._forceGeometryBuffer) {
            // Get geometry buffer renderer and update effect
            const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
            if (geometryBufferRenderer) {
                if (geometryBufferRenderer.isSupported) {
                    geometryBufferRenderer.enableReflectivity = true;
                }
            }
        } else {
            const prePassRenderer = scene.enablePrePassRenderer();
            prePassRenderer?.markAsDirty();
            this._prePassEffectConfiguration = new ScreenSpaceReflections2Configuration();
        }

        this._createBlurPostProcesses();
        this._updateEffectDefines();

        // On apply, send uniforms
        this.onApply = (effect: Effect) => {
            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;

            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }

            if (geometryBufferRenderer) {
                // Samplers
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);

                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[1]);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
                effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[0]);
            } else if (prePassRenderer) {
                // Samplers
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

            // Uniforms
            const camera = scene.activeCamera;
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

            projectionMatrix.multiplyToRef(scene.getEngine().isWebGPU ? trsWebGPU : trs, TmpVectors.Matrix[3]);

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

        this._isSceneRightHanded = scene.useRightHandedSystem;
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

    public dispose() {
        this._disposeDepthRenderer();
        this._scene.getEngine().onResizeObservable.remove(this._resizeObserver);
        this._resizeObserver = null;
        this._blurPostProcessX?.dispose();
        this._blurPostProcessY?.dispose();
        this._blurCombinerPostProcess?.dispose();
        super.dispose();
    }

    private _updateEffectDefines(): void {
        const defines: string[] = [];
        if (this._geometryBufferRenderer || this._prePassRenderer) {
            defines.push("#define SSR_SUPPORTED");
        }
        if (this._enableSmoothReflections) {
            defines.push("#define ENABLE_REFINEMENT");
        }
        if (this._isSceneRightHanded) {
            defines.push("#define RIGHT_HANDED_SCENE");
        }
        if (this._environmentTexture) {
            defines.push("#define USE_ENVIRONMENT_CUBE");
            if (this._environmentTexture.boundingBoxSize) {
                defines.push("#define USE_LOCAL_REFLECTIONMAP_CUBIC");
            }
        }
        if (this._environmentTextureIsProbe) {
            defines.push("#define INVERTCUBICMAP");
        }
        if (this._enableAutomaticThicknessComputation) {
            defines.push("#define USE_BACK_DEPTHBUFFER");
        }
        if (this._attenuateScreenBorders) {
            defines.push("#define ATTENUATE_SCREEN_BORDERS");
        }
        if (this._attenuateIntersectionDistance) {
            defines.push("#define ATTENUATE_INTERSECTION_DISTANCE");
        }
        if (this._attenuateFacingCamera) {
            defines.push("#define ATTENUATE_FACING_CAMERA");
        }
        if (this._attenuateBackfaceReflection) {
            defines.push("#define ATTENUATE_BACKFACE_REFLECTION");
        }
        if (this._clipToFrustum) {
            defines.push("#define CLIP_TO_FRUSTUM");
        }
        if (this._blurDispersionStrength > 0) {
            defines.push("#define USE_BLUR");
        }

        this.updateEffect(defines.join("\n"));
    }

    /**
     * @param parsedPostProcess
     * @param targetCamera
     * @param scene
     * @param rootUrl
     * @hidden
     */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new ScreenSpaceReflection2PostProcess(
                    parsedPostProcess.name,
                    scene,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.textureType,
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.ScreenSpaceReflectionPostProcess", ScreenSpaceReflection2PostProcess);
