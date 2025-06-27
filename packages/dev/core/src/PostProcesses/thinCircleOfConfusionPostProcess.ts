import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import type { Camera } from "core/Cameras/camera";
import { Engine } from "../Engines/engine";

/**
 * Options used to create a ThinCircleOfConfusionPostProcess.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ThinCircleOfConfusionPostProcessOptions extends EffectWrapperCreationOptions {
    /**
     * If the (view) depth is normalized (0.0 to 1.0 from near to far) or not (0 to camera max distance)
     */
    depthNotNormalized?: boolean;
}

/**
 * Post process used to calculate the circle of confusion (used for depth of field, for example)
 */
export class ThinCircleOfConfusionPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "circleOfConfusion";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"];

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["depthSampler"];

    /**
     * Defines if the depth is normalized or not
     */
    public static readonly DefinesDepthNotNormalized = "#define COC_DEPTH_NOT_NORMALIZED";

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/circleOfConfusion.fragment"));
        } else {
            list.push(import("../Shaders/circleOfConfusion.fragment"));
        }
    }

    /**
     * Constructs a new circle of confusion post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: ThinCircleOfConfusionPostProcessOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinCircleOfConfusionPostProcess.FragmentUrl,
            uniforms: ThinCircleOfConfusionPostProcess.Uniforms,
            samplers: ThinCircleOfConfusionPostProcess.Samplers,
            defines: options?.depthNotNormalized ? ThinCircleOfConfusionPostProcess.DefinesDepthNotNormalized : undefined,
        });
    }

    /**
     * The camera to use to calculate the circle of confusion
     */
    public camera: Camera;

    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    public lensSize = 50;

    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    public fStop = 1.4;

    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    public focusDistance = 2000;

    /**
     * Focal length of the effect's camera in scene units/1000 (eg. millimeter). (default: 50)
     */
    public focalLength = 50;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const options = this.options as ThinCircleOfConfusionPostProcessOptions;

        const effect = this._drawWrapper.effect!;

        if (!options.depthNotNormalized) {
            effect.setFloat2("cameraMinMaxZ", this.camera.minZ, this.camera.maxZ - this.camera.minZ);
        }

        // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
        const aperture = this.lensSize / this.fStop;
        const cocPrecalculation = (aperture * this.focalLength) / (this.focusDistance - this.focalLength); // * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]

        effect.setFloat("focusDistance", this.focusDistance);
        effect.setFloat("cocPrecalculation", cocPrecalculation);
    }
}
