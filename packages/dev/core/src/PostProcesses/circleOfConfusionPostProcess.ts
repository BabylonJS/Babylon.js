import type { Nullable } from "../types";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Effect } from "../Materials/effect";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { Camera } from "../Cameras/camera";
import { Logger } from "../Misc/logger";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import type { AbstractEngine } from "core/Engines/abstractEngine";

/**
 * The CircleOfConfusionPostProcess computes the circle of confusion value for each pixel given required lens parameters. See https://en.wikipedia.org/wiki/Circle_of_confusion
 */
export class CircleOfConfusionPostProcess extends PostProcess {
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    @serialize()
    public lensSize = 50;
    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    @serialize()
    public fStop = 1.4;
    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    @serialize()
    public focusDistance = 2000;
    /**
     * Focal length of the effect's camera in scene units/1000 (eg. millimeter). (default: 50)
     */
    @serialize()
    public focalLength = 50;

    /**
     * Gets a string identifying the name of the class
     * @returns "CircleOfConfusionPostProcess" string
     */
    public override getClassName(): string {
        return "CircleOfConfusionPostProcess";
    }

    private _depthTexture: Nullable<RenderTargetTexture> = null;
    /**
     * Creates a new instance CircleOfConfusionPostProcess
     * @param name The name of the effect.
     * @param depthTexture The depth texture of the scene to compute the circle of confusion. This must be set in order for this to function but may be set after initialization if needed.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        depthTexture: Nullable<RenderTargetTexture>,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(
            name,
            "circleOfConfusion",
            ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"],
            ["depthSampler"],
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            null,
            textureType,
            undefined,
            null,
            blockCompilation
        );
        this._depthTexture = depthTexture;
        this.onApplyObservable.add((effect: Effect) => {
            if (!this._depthTexture) {
                Logger.Warn("No depth texture set on CircleOfConfusionPostProcess");
                return;
            }
            effect.setTexture("depthSampler", this._depthTexture);

            // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
            const aperture = this.lensSize / this.fStop;
            const cocPrecalculation = (aperture * this.focalLength) / (this.focusDistance - this.focalLength); // * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]

            effect.setFloat("focusDistance", this.focusDistance);
            effect.setFloat("cocPrecalculation", cocPrecalculation);
            const activeCamera = this._depthTexture.activeCamera!;
            effect.setFloat2("cameraMinMaxZ", activeCamera.minZ, activeCamera.maxZ - activeCamera.minZ);
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/circleOfConfusion.fragment"));
        } else {
            list.push(import("../Shaders/circleOfConfusion.fragment"));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * Depth texture to be used to compute the circle of confusion. This must be set here or in the constructor in order for the post process to function.
     */
    public set depthTexture(value: RenderTargetTexture) {
        this._depthTexture = value;
    }
}

RegisterClass("BABYLON.CircleOfConfusionPostProcess", CircleOfConfusionPostProcess);
