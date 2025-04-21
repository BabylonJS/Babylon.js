// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { Vector2 } from "../Maths/math.vector";

/**
 * @internal
 */
export class ThinSSRBlurPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "screenSpaceReflection2Blur";

    public static readonly Uniforms = ["texelOffsetScale"];

    public static readonly Samplers = ["textureSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/screenSpaceReflection2Blur.fragment"));
        } else {
            list.push(import("../Shaders/screenSpaceReflection2Blur.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, direction?: Vector2, blurStrength?: number, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
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
