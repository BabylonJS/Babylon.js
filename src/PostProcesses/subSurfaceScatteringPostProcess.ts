import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { Scene } from "../scene";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";

import "../Shaders/imageProcessing.fragment";
import "../Shaders/subSurfaceScattering.fragment";
import "../Shaders/postprocess.vertex";

/**
 * Sub surface scattering post process
 */
export class SubSurfaceScatteringPostProcess extends PostProcess {
    /** @hidden */
    public texelWidth: number;
    /** @hidden */
    public texelHeight: number;

    constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "subSurfaceScattering", ["texelSize", "viewportSize", "metersPerUnit"], ["diffusionS", "diffusionD", "filterRadii", "irradianceSampler", "depthSampler", "albedoSampler"], options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "postprocess", undefined, true);
        this._scene = scene;

        const defines = this._getDefines();
        this.updateEffect(defines);

        this.onApplyObservable.add((effect: Effect) => {
            if (!scene.prePassRenderer) {
                Logger.Error("PrePass needs to be enabled for subsurface scattering.");
                return;
            }
            var texelSize = this.texelSize;
            effect.setFloat("metersPerUnit", scene.prePassRenderer.metersPerUnit);
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            effect.setTexture("irradianceSampler", scene.prePassRenderer.prePassRT.textures[1]);
            effect.setTexture("depthSampler", scene.prePassRenderer.prePassRT.textures[2]);
            effect.setTexture("albedoSampler", scene.prePassRenderer.prePassRT.textures[3]);
            effect.setFloat2("viewportSize",
                Math.tan(scene.activeCamera!.fov / 2) * scene.getEngine().getAspectRatio(scene.activeCamera!, true),
                Math.tan(scene.activeCamera!.fov / 2));
            effect.setArray3("diffusionS", scene.prePassRenderer.ssDiffusionS);
            effect.setArray("diffusionD", scene.prePassRenderer.ssDiffusionD);
            effect.setArray("filterRadii", scene.prePassRenderer.ssFilterRadii);
        });

    }

    private _getDefines(): Nullable<string> {
        const engine = this.getEngine();
        if (!engine) {
            return null;
        }

        let defines = "";

        return defines;
    }
}
