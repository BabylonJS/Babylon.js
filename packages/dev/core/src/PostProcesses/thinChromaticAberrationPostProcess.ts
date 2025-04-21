// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { Vector2 } from "../Maths/math.vector";

/**
 * The ChromaticAberrationPostProcess separates the rgb channels in an image to produce chromatic distortion around the edges of the screen
 */
export class ThinChromaticAberrationPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "chromaticAberration";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/chromaticAberration.fragment"));
        } else {
            list.push(import("../Shaders/chromaticAberration.fragment"));
        }
    }

    /**
     * Constructs a new chromatic aberration post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinChromaticAberrationPostProcess.FragmentUrl,
            uniforms: ThinChromaticAberrationPostProcess.Uniforms,
        });
    }

    /**
     * The amount of separation of rgb channels (default: 30)
     */
    public aberrationAmount = 30;

    /**
     * The amount the effect will increase for pixels closer to the edge of the screen. (default: 0)
     */
    public radialIntensity = 0;

    /**
     * The normalized direction in which the rgb channels should be separated. If set to 0,0 radial direction will be used. (default: Vector2(0.707,0.707))
     */
    public direction = new Vector2(0.707, 0.707);

    /**
     * The center position where the radialIntensity should be around. [0.5,0.5 is center of screen, 1,1 is top right corner] (default: Vector2(0.5 ,0.5))
     */
    public centerPosition = new Vector2(0.5, 0.5);

    /** The width of the source texture to which the effect is applied */
    public screenWidth: number;

    /** The height of the source texture to which the effect is applied */
    public screenHeight: number;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat("chromatic_aberration", this.aberrationAmount);
        effect.setFloat("screen_width", this.screenWidth);
        effect.setFloat("screen_height", this.screenHeight);
        effect.setFloat("radialIntensity", this.radialIntensity);
        effect.setFloat2("direction", this.direction.x, this.direction.y);
        effect.setFloat2("centerPosition", this.centerPosition.x, this.centerPosition.y);
    }
}
