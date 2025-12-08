import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * @internal
 */
export class ThinSSAO2BlurPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "ssao2";

    public static readonly Uniforms = ["outSize", "samples", "soften", "tolerance"];

    public static readonly Samplers = ["textureSampler", "depthSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/ssao2.fragment"));
        } else {
            list.push(import("../Shaders/ssao2.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, isHorizontal: boolean, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSSAO2BlurPostProcess.FragmentUrl,
            uniforms: ThinSSAO2BlurPostProcess.Uniforms,
            samplers: ThinSSAO2BlurPostProcess.Samplers,
            defines: "#define BLUR\n" + (isHorizontal ? "#define BLUR_H\n" : ""),
        });

        this._isHorizontal = isHorizontal;

        const defines = this._getDefinesForBlur(this.expensiveBlur, this.bypassBlur);
        const samplers = this._getSamplersForBlur(this.bypassBlur);

        this.updateEffect(defines, null, samplers);
    }

    private readonly _isHorizontal: boolean;
    private _bypassBlur: boolean = false;

    public textureSize: number = 0;

    public bilateralSamples: number = 16;

    public bilateralSoften: number = 0;

    public bilateralTolerance: number = 0;

    public set bypassBlur(b: boolean) {
        const defines = this._getDefinesForBlur(this.expensiveBlur, b);
        const samplers = this._getSamplersForBlur(b);

        this.updateEffect(defines, null, samplers);

        this._bypassBlur = b;
    }
    public get bypassBlur(): boolean {
        return this._bypassBlur;
    }

    private _expensiveBlur: boolean = true;

    public set expensiveBlur(b: boolean) {
        const defines = this._getDefinesForBlur(b, this._bypassBlur);

        this.updateEffect(defines);

        this._expensiveBlur = b;
    }
    public get expensiveBlur(): boolean {
        return this._expensiveBlur;
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat("outSize", this.textureSize);
        effect.setInt("samples", this.bilateralSamples);
        effect.setFloat("soften", this.bilateralSoften);
        effect.setFloat("tolerance", this.bilateralTolerance);
    }

    private _getSamplersForBlur(disabled: boolean): Array<string> {
        return disabled ? ["textureSampler"] : ["textureSampler", "depthSampler"];
    }

    private _getDefinesForBlur(bilateral: boolean, disabled: boolean): string {
        let define = "#define BLUR\n";
        if (disabled) {
            define += "#define BLUR_BYPASS\n";
        }
        if (!bilateral) {
            define += "#define BLUR_LEGACY\n";
        }
        return this._isHorizontal ? define + "#define BLUR_H\n" : define;
    }
}
