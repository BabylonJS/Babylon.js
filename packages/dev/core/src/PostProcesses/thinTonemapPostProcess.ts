import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/** Defines operator used for tonemapping */
export const enum TonemappingOperator {
    /** Hable */
    Hable = 0,
    /** Reinhard */
    Reinhard = 1,
    /** HejiDawson */
    HejiDawson = 2,
    /** Photographic */
    Photographic = 3,
}

/**
 * Options used to create a ThinTonemapPostProcess.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ThinTonemapPostProcessOptions extends EffectWrapperCreationOptions {
    /** Defines the operator to use (default: Reinhard) */
    operator?: TonemappingOperator;

    /** Defines the required exposure adjustment (default: 1.0) */
    exposureAdjustment?: number;
}

/**
 * Post process used to apply a tone mapping operator
 */
export class ThinTonemapPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "tonemap";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["_ExposureAdjustment"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/tonemap.fragment"));
        } else {
            list.push(import("../Shaders/tonemap.fragment"));
        }
    }

    /**
     * Constructs a new tone mapping post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: ThinTonemapPostProcessOptions) {
        const operator = options?.operator ?? TonemappingOperator.Reinhard;

        let defines = "#define ";

        if (operator === TonemappingOperator.Hable) {
            defines += "HABLE_TONEMAPPING";
        } else if (operator === TonemappingOperator.Reinhard) {
            defines += "REINHARD_TONEMAPPING";
        } else if (operator === TonemappingOperator.HejiDawson) {
            defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
        } else if (operator === TonemappingOperator.Photographic) {
            defines += "PHOTOGRAPHIC_TONEMAPPING";
        }

        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinTonemapPostProcess.FragmentUrl,
            uniforms: ThinTonemapPostProcess.Uniforms,
            defines,
        });

        this.operator = operator;
        this.exposureAdjustment = options?.exposureAdjustment ?? 1;
    }

    /**
     * Gets the operator to use (default: Reinhard)
     */
    public readonly operator: TonemappingOperator = TonemappingOperator.Reinhard;

    /**
     * Defines the required exposure adjustment (default: 1.0)
     */
    public exposureAdjustment = 1;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);
        this._drawWrapper.effect!.setFloat("_ExposureAdjustment", this.exposureAdjustment);
    }
}
