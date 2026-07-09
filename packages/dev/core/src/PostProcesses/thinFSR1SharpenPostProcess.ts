import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Engine } from "core/Engines/engine";
import { EffectWrapper, type EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import type { Nullable } from "core/types";

/**
 * Robust Contrast Adaptive Sharpening (RCAS) post-process used by FSR 1
 */
export class ThinFSR1SharpenPostProcess extends EffectWrapper {
    /**
     * The fragment shader URL
     */
    public static readonly FragmentUrl = "fsr1Sharpen";

    /**
     * The list of uniform buffers used by the effect
     */
    public static readonly UniformBuffers = ["constants"];

    private readonly _uniformBuffer: UniformBuffer;

    /**
     * Creates a new FSR 1 sharpen post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine?: Nullable<AbstractEngine>, options?: EffectWrapperCreationOptions) {
        engine ??= Engine.LastCreatedEngine!;
        super({
            ...options,
            name,
            engine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinFSR1SharpenPostProcess.FragmentUrl,
            shaderLanguage: ShaderLanguage.WGSL,
            uniformBuffers: ThinFSR1SharpenPostProcess.UniformBuffers,
        });

        this._uniformBuffer = new UniformBuffer(engine, [], false, name);
        this._uniformBuffer.addUniform("con", 4);
        this._uniformBuffer.create();
        this._uniformBuffer.bindToEffect(this.effect, "constants");
    }

    protected override _gatherImports(useWebGPU: boolean | undefined, list: Promise<any>[]): void {
        list.push(import("../ShadersWGSL/fsr1Sharpen.fragment"));
    }

    /**
     * Binds the data to the effect.
     * @param noDefaultBindings if true, the default bindings (scale and alpha mode) will not be set.
     */
    public override bind(noDefaultBindings?: boolean): void {
        super.bind(noDefaultBindings);
        this._uniformBuffer.bindUniformBuffer();
    }

    /**
     * Call to setup required constant values
     * @param sharpness The number of stops (halving) of the reduction of sharpness (0 = maximum sharpness)
     */
    public updateConstants(sharpness: number): void {
        // Code based on FsrRcasCon from FSR 1:
        // https://github.com/GPUOpen-Effects/FidelityFX-FSR/blob/a21ffb8f6c13233ba336352bdff293894c706575/ffx-fsr/ffx_fsr1.h#L662
        sharpness = Math.pow(2, -sharpness);

        // Technically these are uints in the shader but they're bitwise converted to floats anyway
        // Since we haven't added the half-float shader yet, we don't need the second constant, which would require JS half-float calculation
        this._uniformBuffer.updateFloat4("con", sharpness, 0, 0, 0);
        this._uniformBuffer.update();
    }
}
