import type { EffectWrapperCreationOptions, Nullable, Scene } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Texture } from "../Materials/Textures/texture";

/**
 * Post process used to apply color correction
 */
export class ThinColorCorrectionPostProcess extends EffectWrapper {
    private _colorTableTexture: Texture;

    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "colorCorrection";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Samplers = ["colorTable"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/colorCorrection.fragment"));
        } else {
            list.push(import("../Shaders/colorCorrection.fragment"));
        }
    }

    /**
     * Constructs a new black and white post process
     * @param name Name of the effect
     * @param scene The scene the effect belongs to
     * @param colorTableUrl URL of the color table texture
     * @param options Options to configure the effect
     */
    constructor(name: string, scene: Nullable<Scene>, colorTableUrl: string, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: scene?.getEngine(),
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinColorCorrectionPostProcess.FragmentUrl,
            samplers: ThinColorCorrectionPostProcess.Samplers,
        });

        this._colorTableTexture = new Texture(colorTableUrl, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
        this._colorTableTexture.anisotropicFilteringLevel = 1;
        this._colorTableTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._colorTableTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        this.colorTableUrl = colorTableUrl;
    }

    /**
     * Gets the color table url used to create the LUT texture
     */
    public readonly colorTableUrl: string;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);
        this._drawWrapper.effect!.setTexture("colorTable", this._colorTableTexture);
    }
}
