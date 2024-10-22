// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, ThinPostProcessOptions } from "core/index";
import { ThinPostProcess } from "./thinPostProcess";
import type { Camera } from "core/Cameras/camera";

export interface ThinCircleOfConfusionPostProcessOptions extends ThinPostProcessOptions {
    /**
     * If the (view) depth is normalized (0.0 to 1.0 from near to far) or not (0 to camera max distance)
     */
    depthNotNormalized?: boolean;
}

export class ThinCircleOfConfusionPostProcess extends ThinPostProcess {
    public static readonly FragmentUrl = "circleOfConfusion";

    public static readonly Uniforms = ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"];

    public static readonly Samplers = ["depthSampler"];

    public static readonly DefinesDepthNotNormalized = "#define COC_DEPTH_NOT_NORMALIZED";

    public override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/circleOfConfusion.fragment"));
        } else {
            list.push(import("../Shaders/circleOfConfusion.fragment"));
        }
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: ThinCircleOfConfusionPostProcessOptions) {
        super(name, ThinCircleOfConfusionPostProcess.FragmentUrl, engine, {
            uniforms: ThinCircleOfConfusionPostProcess.Uniforms,
            samplers: ThinCircleOfConfusionPostProcess.Samplers,
            defines: options?.depthNotNormalized ? ThinCircleOfConfusionPostProcess.DefinesDepthNotNormalized : undefined,
            ...options,
        });
    }

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

    public override bind() {
        super.bind();

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
