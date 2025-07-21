import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Engine } from "core/Engines/engine";
import { EffectWrapper, type EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import type { Nullable } from "core/types";

export class ThinFSR1UpscalePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "fsr1Upscale";
    public static readonly UniformBuffers = ["RcpEasuCon"];

    private readonly _uniformBuffer: UniformBuffer;

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
        this._uniformBuffer.bindToEffect(this.effect, "RcpEasuCon");
    }

    protected override _gatherImports(useWebGPU: boolean | undefined, list: Promise<any>[]): void {
        list.push(import("../ShadersWGSL/fsr1Upscale.fragment"));
    }

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
