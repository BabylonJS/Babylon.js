import { type Nullable, type AbstractEngine, type EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "../Engines/engineStore";
import { Vector2 } from "../Maths/math.vector.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderLoader } from "core/Misc/shaderLoader";

/**
 * @internal
 */
export class ThinSSRBlurPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "screenSpaceReflection2Blur";

    public static readonly Uniforms = ["texelOffsetScale"];

    public static readonly Samplers = ["textureSampler"];

    private static readonly _ShaderLoader = /*#__PURE__*/ new ShaderLoader({
        webGL: () => [import("../Shaders/screenSpaceReflection2Blur.fragment")],
        webGPU: () => [import("../ShadersWGSL/screenSpaceReflection2Blur.fragment")],
    });

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
        }

        const promise = ThinSSRBlurPostProcess._ShaderLoader.load(useWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL);
        if (promise !== null) {
            list.push(promise);
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, direction?: Vector2, blurStrength?: number, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || EngineStore.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSSRBlurPostProcess.FragmentUrl,
            uniforms: ThinSSRBlurPostProcess.Uniforms,
            samplers: ThinSSRBlurPostProcess.Samplers,
        });

        if (direction !== undefined) {
            this.direction = direction;
        }

        if (blurStrength !== undefined) {
            this.blurStrength = blurStrength;
        }
    }

    public textureWidth: number = 0;

    public textureHeight: number = 0;

    public direction = new Vector2(1, 0);

    public blurStrength = 0.03;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        this._drawWrapper.effect!.setFloat2(
            "texelOffsetScale",
            (1 / this.textureWidth) * this.direction.x * this.blurStrength,
            (1 / this.textureHeight) * this.direction.y * this.blurStrength
        );
    }
}
