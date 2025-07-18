import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Engine } from "core/Engines/engine";
import { EffectWrapper, type EffectWrapperCreationOptions } from "core/Materials/effectRenderer";
import type { Nullable } from "core/types";

export class ThinFSR1UpscalePostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "fsr1Upscale";

    constructor(name: string, engine?: Nullable<AbstractEngine>, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine ?? Engine.LastCreatedEngine ?? undefined,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinFSR1UpscalePostProcess.FragmentUrl,
        });
    }

    protected override _gatherImports(useWebGPU = false, list: Promise<any>[]): void {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/fsr1Upscale.fragment"));
        }
    }

    public override bind(noDefaultBindings?: boolean): void {
        super.bind(noDefaultBindings);
        const engine = this.options.engine;
        const effect = this.drawWrapper.effect!;

        const outputWidth = engine.getRenderWidth();
        const outputHeight = engine.getRenderHeight();
        const inputWidth = outputWidth / 1.5;
        const inputHeight = outputHeight / 1.5;
        // TODO: use a uniform buffer
        effect.setFloat4("con0", inputWidth / outputWidth, inputHeight / outputHeight, (0.5 * inputWidth) / outputWidth - 0.5, (0.5 * inputHeight) / outputHeight - 0.5);
        effect.setFloat4("con1", 1 / inputWidth, 1 / inputHeight, 1 / inputWidth, -1 / inputHeight);
        effect.setFloat4("con2", -1 / inputWidth, 2 / inputHeight, 1 / inputWidth, 2 / inputHeight);
        effect.setFloat4("con3", 0, 4 / inputHeight, 0, 0);
    }
}
