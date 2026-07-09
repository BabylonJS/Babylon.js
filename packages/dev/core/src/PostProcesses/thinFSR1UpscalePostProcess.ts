import { type AbstractEngine } from "core/Engines/abstractEngine";
import { type Effect } from "core/Materials/effect";
import { Engine } from "core/Engines/engine";
import { EffectWrapper, type EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import { type Nullable } from "core/types";

/**
 * Edge Adaptive Spatial Upsampling (EASU) post-process used by FSR 1
 */
export class ThinFSR1UpscalePostProcess extends EffectWrapper {
    /**
     * The fragment shader URL
     */
    public static readonly FragmentUrl = "fsr1Upscale";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["con0", "con1", "con2", "con3"];

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
            uniforms: ThinFSR1UpscalePostProcess.Uniforms,
        });
    }

    protected override _gatherImports(useWebGPU: boolean | undefined, list: Promise<any>[]): void {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/fsr1Upscale.fragment"));
        } else {
            list.push(import("../Shaders/fsr1Upscale.fragment"));
        }
    }

    /**
     * Sets the required constant values on the effect. Plain uniforms are used (rather than a uniform
     * buffer) so this works on every backend, including Babylon Native, which disables uniform buffers.
     * @param effect The effect to set the constants on (typically the one provided by onApplyObservable).
     * @param viewportWidth The rendered input width being upscaled
     * @param viewportHeight The rendered input height being upscaled
     * @param inputWidth The width of the texture containing the input viewport
     * @param inputHeight The height of the texture containing the input viewport
     * @param outputWidth The display width which the input image gets upscaled to
     * @param outputHeight The display height which the input image gets upscaled to
     */
    public updateConstants(
        effect: Effect,
        viewportWidth: number,
        viewportHeight: number,
        inputWidth: number,
        inputHeight: number,
        outputWidth: number,
        outputHeight: number
    ): void {
        // Code based on FsrEasuCon from FSR 1:
        // https://github.com/GPUOpen-Effects/FidelityFX-FSR/blob/a21ffb8f6c13233ba336352bdff293894c706575/ffx-fsr/ffx_fsr1.h#L156
        const rcpInputWidth = 1 / inputWidth;
        const rcpInputHeight = 1 / inputHeight;
        const rcpOutputWidth = 1 / outputWidth;
        const rcpOutputHeight = 1 / outputHeight;

        // Technically these are uints in the shader but they're bitwise converted to floats anyway
        effect.setFloat4(
            "con0",
            viewportWidth * rcpOutputWidth,
            viewportHeight * rcpOutputHeight,
            0.5 * viewportWidth * rcpOutputWidth - 0.5,
            0.5 * viewportHeight * rcpOutputHeight - 0.5
        );
        effect.setFloat4("con1", rcpInputWidth, rcpInputHeight, 1 * rcpInputWidth, -1 * rcpInputHeight);
        effect.setFloat4("con2", -1 * rcpInputWidth, 2 * rcpInputHeight, 1 * rcpInputWidth, 2 * rcpInputHeight);
        effect.setFloat4("con3", 0 * rcpInputWidth, 4 * rcpInputHeight, 0, 0);
    }
}
