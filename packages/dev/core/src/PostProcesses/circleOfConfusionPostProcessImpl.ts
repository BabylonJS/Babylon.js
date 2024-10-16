import { AbstractPostProcessImpl } from "./abstractPostProcessImpl";
import type { Camera } from "core/Cameras";
import type { CircleOfConfusionPostProcessOptions } from "./circleOfConfusionPostProcess";

/**
 * @internal
 */
export class CircleOfConfusionPostProcessImpl extends AbstractPostProcessImpl {
    public static readonly FragmentUrl = "circleOfConfusion";

    public static readonly Uniforms = ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"];

    public static readonly Samplers = ["depthSampler"];

    public static readonly DefinesDepthNotNormalized = "#define COC_DEPTH_NOT_NORMALIZED";

    public gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this.postProcess._webGPUReady = true;
            list.push(import("../ShadersWGSL/circleOfConfusion.fragment"));
        } else {
            list.push(import("../Shaders/circleOfConfusion.fragment"));
        }
    }

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

    public bind(camera: Camera) {
        const options = this.postProcess.options as CircleOfConfusionPostProcessOptions;

        const effect = this._drawWrapper.effect!;

        if (!options.depthNotNormalized) {
            effect.setFloat2("cameraMinMaxZ", camera.minZ, camera.maxZ - camera.minZ);
        }

        // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
        const aperture = this.lensSize / this.fStop;
        const cocPrecalculation = (aperture * this.focalLength) / (this.focusDistance - this.focalLength); // * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]

        effect.setFloat("focusDistance", this.focusDistance);
        effect.setFloat("cocPrecalculation", cocPrecalculation);
    }
}
