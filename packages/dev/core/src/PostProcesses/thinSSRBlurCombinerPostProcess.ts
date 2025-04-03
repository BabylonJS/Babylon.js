// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions, Camera } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { TmpVectors } from "../Maths/math.vector";

/**
 * @internal
 */
export class ThinSSRBlurCombinerPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "screenSpaceReflection2BlurCombiner";

    public static readonly Uniforms = [
        "strength",
        "reflectionSpecularFalloffExponent",
        "reflectivityThreshold",
        "projection",
        "invProjectionMatrix",
        "nearPlaneZ",
        "farPlaneZ",
        "view",
    ];

    public static readonly Samplers = ["textureSampler", "depthSampler", "normalSampler", "mainSampler", "reflectivitySampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/screenSpaceReflection2BlurCombiner.fragment"));
        } else {
            list.push(import("../Shaders/screenSpaceReflection2BlurCombiner.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSSRBlurCombinerPostProcess.FragmentUrl,
            uniforms: ThinSSRBlurCombinerPostProcess.Uniforms,
            samplers: ThinSSRBlurCombinerPostProcess.Samplers,
        });

        this._updateEffectDefines();
    }

    public strength = 1;

    public reflectionSpecularFalloffExponent = 1;

    public camera: Nullable<Camera> = null;

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

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat("strength", this.strength);
        effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
        effect.setFloat("reflectivityThreshold", this.reflectivityThreshold);

        if (this.useFresnel && this.camera) {
            const projectionMatrix = this.camera.getProjectionMatrix();

            projectionMatrix.invertToRef(TmpVectors.Matrix[0]);

            effect.setMatrix("projection", projectionMatrix);
            effect.setMatrix("invProjectionMatrix", TmpVectors.Matrix[0]);
            effect.setMatrix("view", this.camera.getViewMatrix());

            if (this.useScreenspaceDepth) {
                effect.setFloat("nearPlaneZ", this.camera.minZ);
                effect.setFloat("farPlaneZ", this.camera.maxZ);
            }
        }
    }

    private _updateEffectDefines() {
        let defines = "";

        if (this._debug) {
            defines += "#define SSRAYTRACE_DEBUG\n";
        }
        if (this._inputTextureColorIsInGammaSpace) {
            defines += "#define SSR_INPUT_IS_GAMMA_SPACE\n";
        }
        if (this._generateOutputInGammaSpace) {
            defines += "#define SSR_OUTPUT_IS_GAMMA_SPACE\n";
        }
        if (this._useFresnel) {
            defines += "#define SSR_BLEND_WITH_FRESNEL\n";
        }
        if (this._useScreenspaceDepth) {
            defines += "#define SSRAYTRACE_SCREENSPACE_DEPTH\n";
        }
        if (this._reflectivityThreshold === 0) {
            defines += "#define SSR_DISABLE_REFLECTIVITY_TEST\n";
        }
        if (this._normalsAreInWorldSpace) {
            defines += "#define SSR_NORMAL_IS_IN_WORLDSPACE\n";
        }
        if (this._normalsAreUnsigned) {
            defines += "#define SSR_DECODE_NORMAL\n";
        }

        this.updateEffect(defines);
    }
}
