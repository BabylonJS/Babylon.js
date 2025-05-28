// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Scene, CubeTexture, Camera, EffectWrapperCreationOptions } from "core/index";
import { Constants } from "core/Engines/constants";
import { EffectWrapper } from "core/Materials/effectRenderer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Vector3, Matrix, Quaternion, TmpVectors } from "core/Maths/math.vector";

const Trs = Matrix.Compose(new Vector3(0.5, 0.5, 0.5), Quaternion.Identity(), new Vector3(0.5, 0.5, 0.5));
const TrsWebGPU = Matrix.Compose(new Vector3(0.5, 0.5, 1), Quaternion.Identity(), new Vector3(0.5, 0.5, 0));

/**
 * @internal
 */
export class ThinSSRPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "screenSpaceReflection2";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = [
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
        "farPlaneZ",
        "maxDistance",
        "selfCollisionNumSkip",
        "vReflectionPosition",
        "vReflectionSize",
        "backSizeFactor",
        "reflectivityThreshold",
    ];

    public static readonly Samplers = ["textureSampler", "normalSampler", "reflectivitySampler", "depthSampler", "envCubeSampler", "backDepthSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/screenSpaceReflection2.fragment"));
        } else {
            list.push(import("../Shaders/screenSpaceReflection2.fragment"));
        }
    }

    public isSSRSupported = true;

    public maxDistance = 1000.0;

    public step = 1.0;

    public thickness = 0.5;

    public strength = 1;

    public reflectionSpecularFalloffExponent = 1;

    public maxSteps = 1000.0;

    public roughnessFactor = 0.2;

    public selfCollisionNumSkip = 1;

    private _reflectivityThreshold = 0.04;

    public get reflectivityThreshold() {
        return this._reflectivityThreshold;
    }

    public set reflectivityThreshold(threshold: number) {
        if (threshold === this._reflectivityThreshold) {
            return;
        }

        if ((threshold === 0 && this._reflectivityThreshold !== 0) || (threshold !== 0 && this._reflectivityThreshold === 0)) {
            this._reflectivityThreshold = threshold;
            this._updateEffectDefines();
        } else {
            this._reflectivityThreshold = threshold;
        }
    }

    private _useBlur = false;

    public get useBlur() {
        return this._useBlur;
    }

    public set useBlur(blur: boolean) {
        if (this._useBlur === blur) {
            return;
        }

        this._useBlur = blur;
        this._updateEffectDefines();
    }

    private _enableSmoothReflections = false;

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

    public get environmentTexture() {
        return this._environmentTexture;
    }

    public set environmentTexture(texture: Nullable<CubeTexture>) {
        this._environmentTexture = texture;
        this._updateEffectDefines();
    }

    private _environmentTextureIsProbe = false;

    public get environmentTextureIsProbe(): boolean {
        return this._environmentTextureIsProbe;
    }

    public set environmentTextureIsProbe(isProbe: boolean) {
        this._environmentTextureIsProbe = isProbe;
        this._updateEffectDefines();
    }

    private _attenuateScreenBorders = true;

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

    private _attenuateIntersectionDistance = true;

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

    private _attenuateIntersectionIterations = true;

    public get attenuateIntersectionIterations() {
        return this._attenuateIntersectionIterations;
    }

    public set attenuateIntersectionIterations(attenuate: boolean) {
        if (this._attenuateIntersectionIterations === attenuate) {
            return;
        }
        this._attenuateIntersectionIterations = attenuate;
        this._updateEffectDefines();
    }

    private _attenuateFacingCamera = false;

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

    private _attenuateBackfaceReflection = false;

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

    private _clipToFrustum = true;

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

    private _useFresnel = false;

    public get useFresnel() {
        return this._useFresnel;
    }

    public set useFresnel(fresnel: boolean) {
        if (this._useFresnel === fresnel) {
            return;
        }
        this._useFresnel = fresnel;
        this._updateEffectDefines();
    }

    private _enableAutomaticThicknessComputation = false;

    public get enableAutomaticThicknessComputation(): boolean {
        return this._enableAutomaticThicknessComputation;
    }

    public set enableAutomaticThicknessComputation(automatic: boolean) {
        if (this._enableAutomaticThicknessComputation === automatic) {
            return;
        }

        this._enableAutomaticThicknessComputation = automatic;

        this._updateEffectDefines();
    }

    private _inputTextureColorIsInGammaSpace = true;

    public get inputTextureColorIsInGammaSpace(): boolean {
        return this._inputTextureColorIsInGammaSpace;
    }

    public set inputTextureColorIsInGammaSpace(gammaSpace: boolean) {
        if (this._inputTextureColorIsInGammaSpace === gammaSpace) {
            return;
        }

        this._inputTextureColorIsInGammaSpace = gammaSpace;

        this._updateEffectDefines();
    }

    private _generateOutputInGammaSpace = true;

    public get generateOutputInGammaSpace(): boolean {
        return this._generateOutputInGammaSpace;
    }

    public set generateOutputInGammaSpace(gammaSpace: boolean) {
        if (this._generateOutputInGammaSpace === gammaSpace) {
            return;
        }

        this._generateOutputInGammaSpace = gammaSpace;

        this._updateEffectDefines();
    }

    private _debug = false;

    public get debug(): boolean {
        return this._debug;
    }

    public set debug(value: boolean) {
        if (this._debug === value) {
            return;
        }

        this._debug = value;

        this._updateEffectDefines();
    }

    private _textureWidth = 0;

    public get textureWidth() {
        return this._textureWidth;
    }

    public set textureWidth(width: number) {
        if (this._textureWidth === width) {
            return;
        }
        this._textureWidth = width;
    }

    private _textureHeight = 0;

    public get textureHeight() {
        return this._textureHeight;
    }

    public set textureHeight(height: number) {
        if (this._textureHeight === height) {
            return;
        }
        this._textureHeight = height;
    }

    public camera: Nullable<Camera> = null;

    private _useScreenspaceDepth = false;

    public get useScreenspaceDepth() {
        return this._useScreenspaceDepth;
    }

    public set useScreenspaceDepth(value: boolean) {
        if (this._useScreenspaceDepth === value) {
            return;
        }

        this._useScreenspaceDepth = value;
        this._updateEffectDefines();
    }

    private _normalsAreInWorldSpace = false;

    public get normalsAreInWorldSpace() {
        return this._normalsAreInWorldSpace;
    }

    public set normalsAreInWorldSpace(value: boolean) {
        if (this._normalsAreInWorldSpace === value) {
            return;
        }

        this._normalsAreInWorldSpace = value;
        this._updateEffectDefines();
    }

    private _normalsAreUnsigned = false;

    public get normalsAreUnsigned() {
        return this._normalsAreUnsigned;
    }

    public set normalsAreUnsigned(value: boolean) {
        if (this._normalsAreUnsigned === value) {
            return;
        }

        this._normalsAreUnsigned = value;
        this._updateEffectDefines();
    }

    private _scene: Scene;

    constructor(name: string, scene: Scene, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: scene.getEngine(),
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSSRPostProcess.FragmentUrl,
            uniforms: ThinSSRPostProcess.Uniforms,
            samplers: ThinSSRPostProcess.Samplers,
            shaderLanguage: scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });

        this._scene = scene;
        this._updateEffectDefines();
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        const camera = this.camera;
        if (!camera) {
            return;
        }

        const viewMatrix = camera.getViewMatrix();
        const projectionMatrix = camera.getProjectionMatrix();

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
        effect.setFloat("farPlaneZ", camera.maxZ);
        effect.setFloat("maxDistance", this.maxDistance);
        effect.setFloat("selfCollisionNumSkip", this.selfCollisionNumSkip);
        effect.setFloat("reflectivityThreshold", this._reflectivityThreshold);

        Matrix.ScalingToRef(this.textureWidth, this.textureHeight, 1, TmpVectors.Matrix[2]);

        projectionMatrix.multiplyToRef(this._scene.getEngine().isWebGPU ? TrsWebGPU : Trs, TmpVectors.Matrix[3]);

        TmpVectors.Matrix[3].multiplyToRef(TmpVectors.Matrix[2], TmpVectors.Matrix[4]);

        effect.setMatrix("projectionPixel", TmpVectors.Matrix[4]);

        if (this._environmentTexture) {
            effect.setTexture("envCubeSampler", this._environmentTexture);

            if (this._environmentTexture.boundingBoxSize) {
                effect.setVector3("vReflectionPosition", this._environmentTexture.boundingBoxPosition);
                effect.setVector3("vReflectionSize", this._environmentTexture.boundingBoxSize);
            }
        }
    }

    private _updateEffectDefines() {
        const defines: string[] = [];

        if (this.isSSRSupported) {
            defines.push("#define SSR_SUPPORTED");
        }
        if (this._enableSmoothReflections) {
            defines.push("#define SSRAYTRACE_ENABLE_REFINEMENT");
        }
        if (this._scene.useRightHandedSystem) {
            defines.push("#define SSRAYTRACE_RIGHT_HANDED_SCENE");
        }
        if (this._useScreenspaceDepth) {
            defines.push("#define SSRAYTRACE_SCREENSPACE_DEPTH");
        }
        if (this._environmentTexture) {
            defines.push("#define SSR_USE_ENVIRONMENT_CUBE");
            if (this._environmentTexture.boundingBoxSize) {
                defines.push("#define SSR_USE_LOCAL_REFLECTIONMAP_CUBIC");
            }
            if (this._environmentTexture.gammaSpace) {
                defines.push("#define SSR_ENVIRONMENT_CUBE_IS_GAMMASPACE");
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
        if (this._attenuateIntersectionIterations) {
            defines.push("#define SSR_ATTENUATE_INTERSECTION_NUMITERATIONS");
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
        if (this.useBlur) {
            defines.push("#define SSR_USE_BLUR");
        }
        if (this._debug) {
            defines.push("#define SSRAYTRACE_DEBUG");
        }
        if (this._inputTextureColorIsInGammaSpace) {
            defines.push("#define SSR_INPUT_IS_GAMMA_SPACE");
        }
        if (this._generateOutputInGammaSpace) {
            defines.push("#define SSR_OUTPUT_IS_GAMMA_SPACE");
        }
        if (this._useFresnel) {
            defines.push("#define SSR_BLEND_WITH_FRESNEL");
        }
        if (this._reflectivityThreshold === 0) {
            defines.push("#define SSR_DISABLE_REFLECTIVITY_TEST");
        }

        if (this._normalsAreInWorldSpace) {
            defines.push("#define SSR_NORMAL_IS_IN_WORLDSPACE");
        }

        if (this._normalsAreUnsigned) {
            defines.push("#define SSR_DECODE_NORMAL");
        }

        if (this.camera && this.camera.mode === Constants.ORTHOGRAPHIC_CAMERA) {
            defines.push("#define ORTHOGRAPHIC_CAMERA");
        }

        this.updateEffect(defines.join("\n"));
    }
}
