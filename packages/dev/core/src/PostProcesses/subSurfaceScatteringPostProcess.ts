import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Scene } from "../scene";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";

import "../Shaders/imageProcessing.fragment";
import "../Shaders/subSurfaceScattering.fragment";
import "../Shaders/postprocess.vertex";

import "../ShadersWGSL/imageProcessing.fragment";
import "../ShadersWGSL/subSurfaceScattering.fragment";
import "../ShadersWGSL/postprocess.vertex";

/**
 * Sub surface scattering post process
 */
export class SubSurfaceScatteringPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "SubSurfaceScatteringPostProcess" string
     */
    public override getClassName(): string {
        return "SubSurfaceScatteringPostProcess";
    }

    constructor(
        name: string,
        scene: Scene,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        const localOptions = {
            uniforms: ["texelSize", "viewportSize", "metersPerUnit"],
            samplers: ["diffusionS", "diffusionD", "filterRadii", "irradianceSampler", "depthSampler", "albedoSampler"],
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            ...(options as PostProcessOptions),
            blockCompilation: true,
        };

        super(name, "subSurfaceScattering", { ...localOptions, samplingMode: samplingMode || Texture.BILINEAR_SAMPLINGMODE });
        this._scene = scene;

        this.updateEffect();

        this.onApplyObservable.add((effect: Effect) => {
            if (!scene.prePassRenderer || !scene.subSurfaceConfiguration) {
                Logger.Error("PrePass and subsurface configuration needs to be enabled for subsurface scattering.");
                return;
            }
            const texelSize = this.texelSize;
            effect.setFloat("metersPerUnit", scene.subSurfaceConfiguration.metersPerUnit);
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            effect.setTexture("irradianceSampler", scene.prePassRenderer.getRenderTarget().textures[scene.prePassRenderer.getIndex(Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE)]);
            effect.setTexture("depthSampler", scene.prePassRenderer.getRenderTarget().textures[scene.prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE)]);
            effect.setTexture("albedoSampler", scene.prePassRenderer.getRenderTarget().textures[scene.prePassRenderer.getIndex(Constants.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE)]);
            effect.setFloat2(
                "viewportSize",
                Math.tan(scene.activeCamera!.fov / 2) * scene.getEngine().getAspectRatio(scene.activeCamera!, true),
                Math.tan(scene.activeCamera!.fov / 2)
            );
            effect.setArray3("diffusionS", scene.subSurfaceConfiguration.ssDiffusionS);
            effect.setArray("diffusionD", scene.subSurfaceConfiguration.ssDiffusionD);
            effect.setArray("filterRadii", scene.subSurfaceConfiguration.ssFilterRadii);
        });
    }
}
