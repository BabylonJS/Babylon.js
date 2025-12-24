import type { AbstractEngine } from "../Engines/abstractEngine";
import { Engine } from "../Engines/engine";
import type { EffectWrapperCreationOptions } from "../Materials/effectRenderer";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Color3 } from "../Maths/math.color";
import type { Nullable } from "../types";

/**
 * Post process used to render a thin outline around selected objects
 */
export class ThinSelectionOutlinePostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "selectionOutline";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["screenSize", "outlineColor", "outlineThickness", "occlusionStrength"];

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["maskSampler", "depthSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]): void {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/selectionOutline.fragment"));
        } else {
            list.push(import("../Shaders/selectionOutline.fragment"));
        }
    }

    /**
     * Constructs a new thin selection outline post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    public constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSelectionOutlinePostProcess.FragmentUrl,
            uniforms: ThinSelectionOutlinePostProcess.Uniforms,
            samplers: ThinSelectionOutlinePostProcess.Samplers,
        });
    }

    /**
     * THe outline color
     */
    public outlineColor: Color3 = new Color3(1, 0.5, 0);

    /**
     * The thickness of the edges
     */
    public outlineThickness: number = 2.0;

    /**
     * The strength of the occlusion effect (default: 0.8)
     */
    public occlusionStrength: number = 0.8;

    /**
     * The width of the source texture
     */
    public textureWidth: number = 0;

    /**
     * The height of the source texture
     */
    public textureHeight: number = 0;

    public override bind(noDefaultBindings = false): void {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        effect.setColor3("outlineColor", this.outlineColor);
        effect.setFloat("outlineThickness", this.outlineThickness);
        effect.setFloat("occlusionStrength", this.occlusionStrength);
    }
}
