import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Engine } from "core/Engines/engine";
import { EffectWrapper, type EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import type { Nullable } from "core/types";

export class ThinFSR1SharpenPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "fsr1Sharpen";
    public static readonly UniformBuffers = ["constants"];

    private readonly _uniformBuffer: UniformBuffer;

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

    public override bind(noDefaultBindings?: boolean): void {
        super.bind(noDefaultBindings);
        this._uniformBuffer.bindUniformBuffer();
    }

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
