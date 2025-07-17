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
}
