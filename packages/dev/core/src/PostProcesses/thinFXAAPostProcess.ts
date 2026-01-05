import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { Vector2 } from "../Maths/math.vector";

/**
 * Postprocess used to apply FXAA (antialiasing) to the scene
 */
export class ThinFXAAPostProcess extends EffectWrapper {
    private static _GetDefines(engine: AbstractEngine): Nullable<string> {
        if (!engine) {
            return null;
        }

        const driverInfo = engine.extractDriverInfo();
        if (driverInfo.toLowerCase().indexOf("mali") > -1) {
            return "#define MALI 1\n";
        }

        return null;
    }

    /**
     * The vertex shader url
     */
    public static readonly VertexUrl = "fxaa";

    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "fxaa";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["texelSize"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/fxaa.fragment"), import("../ShadersWGSL/fxaa.vertex")]));
        } else {
            list.push(Promise.all([import("../Shaders/fxaa.fragment"), import("../Shaders/fxaa.vertex")]));
        }
    }

    /**
     * Constructs a new FXAA post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        const localOptions = {
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            vertexShader: ThinFXAAPostProcess.VertexUrl,
            fragmentShader: ThinFXAAPostProcess.FragmentUrl,
            uniforms: ThinFXAAPostProcess.Uniforms,
        };

        super({
            ...localOptions,
            defines: ThinFXAAPostProcess._GetDefines(localOptions.engine),
        });
    }

    /**
     * The texel size of the texture to apply FXAA on
     */
    public texelSize = new Vector2(0, 0);

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);
        this._drawWrapper.effect!.setFloat2("texelSize", this.texelSize.x, this.texelSize.y);
    }
}
