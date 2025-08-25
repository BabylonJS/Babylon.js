import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Engine } from "core/Engines/engine";
import { EffectWrapper, type EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import type { Nullable } from "core/types";

/**
 * Edge Adaptive Spatial Upsampling (EASU) post-process used by FSR 1
 */
export class ThinFSR1UpscalePostProcess extends EffectWrapper {
    /**
     * The fragment shader URL
     */
    public static readonly FragmentUrl = "fsr1Upscale";

    /**
     * The list of uniform buffers used by the effect
     */
    public static readonly UniformBuffers = ["constants"];

    private readonly _uniformBuffer: UniformBuffer;

    /**
     * Creates a new FSR 1 upscale post process
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
            fragmentShader: ThinFSR1UpscalePostProcess.FragmentUrl,
            shaderLanguage: ShaderLanguage.WGSL,
            uniformBuffers: ThinFSR1UpscalePostProcess.UniformBuffers,
        });

        this._uniformBuffer = new UniformBuffer(engine, [], false, name);
        this._uniformBuffer.addUniform("con0", 4);
        this._uniformBuffer.addUniform("con1", 4);
        this._uniformBuffer.addUniform("con2", 4);
        this._uniformBuffer.addUniform("con3", 4);
        this._uniformBuffer.create();
        this._uniformBuffer.bindToEffect(this.effect, "constants");
    }

    protected override _gatherImports(useWebGPU: boolean | undefined, list: Promise<any>[]): void {
        list.push(import("../ShadersWGSL/fsr1Upscale.fragment"));
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
     * @param viewportWidth The rendered input width being upscaled
     * @param viewportHeight The rendered input height being upscaled
     * @param inputWidth The width of the texture containing the input viewport
     * @param inputHeight The height of the texture containing the input viewport
     * @param outputWidth The display width which the input image gets upscaled to
     * @param outputHeight The display height which the input image gets upscaled to
     */
    public updateConstants(viewportWidth: number, viewportHeight: number, inputWidth: number, inputHeight: number, outputWidth: number, outputHeight: number): void {
        // Code based on FsrEasuCon from FSR 1:
        // https://github.com/GPUOpen-Effects/FidelityFX-FSR/blob/a21ffb8f6c13233ba336352bdff293894c706575/ffx-fsr/ffx_fsr1.h#L156
        const rcpInputWidth = 1 / inputWidth;
        const rcpInputHeight = 1 / inputHeight;
        const rcpOutputWidth = 1 / outputWidth;
        const rcpOutputHeight = 1 / outputHeight;

        // Technically these are uints in the shader but they're bitwise converted to floats anyway
        this._uniformBuffer.updateFloat4(
            "con0",
            viewportWidth * rcpOutputWidth,
            viewportHeight * rcpOutputHeight,
            0.5 * viewportWidth * rcpOutputWidth - 0.5,
            0.5 * viewportHeight * rcpOutputHeight - 0.5
        );
        this._uniformBuffer.updateFloat4("con1", rcpInputWidth, rcpInputHeight, 1 * rcpInputWidth, -1 * rcpInputHeight);
        this._uniformBuffer.updateFloat4("con2", -1 * rcpInputWidth, 2 * rcpInputHeight, 1 * rcpInputWidth, 2 * rcpInputHeight);
        this._uniformBuffer.updateFloat4("con3", 0 * rcpInputWidth, 4 * rcpInputHeight, 0, 0);
        this._uniformBuffer.update();
    }
}
