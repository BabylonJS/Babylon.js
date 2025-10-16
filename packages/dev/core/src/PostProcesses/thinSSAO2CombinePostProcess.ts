import type { Nullable, AbstractEngine, EffectWrapperCreationOptions, Camera } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { TmpVectors } from "core/Maths/math.vector";

/**
 * @internal
 */
export class ThinSSAO2CombinePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "ssaoCombine";

    public static readonly Uniforms = ["viewport"];

    public static readonly Samplers = ["originalColor"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/ssaoCombine.fragment"));
        } else {
            list.push(import("../Shaders/ssaoCombine.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSSAO2CombinePostProcess.FragmentUrl,
            uniforms: ThinSSAO2CombinePostProcess.Uniforms,
            samplers: ThinSSAO2CombinePostProcess.Samplers,
        });
    }

    public camera: Nullable<Camera> = null;

    public useViewportInCombineStage = true;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        if (this.camera) {
            const viewport = this.camera.viewport;
            if (this.useViewportInCombineStage) {
                effect.setVector4("viewport", TmpVectors.Vector4[0].copyFromFloats(viewport.x, viewport.y, viewport.width, viewport.height));
            } else {
                effect.setVector4("viewport", TmpVectors.Vector4[0].copyFromFloats(0, 0, 1, 1));
            }
        }
    }
}
