import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";

import "../Shaders/tonemap.fragment";

declare type Engine = import("../Engines/engine").Engine;

/** Defines operator used for tonemapping */
export enum TonemappingOperator {
    /** Hable */
    Hable = 0,
    /** Reinhard */
    Reinhard = 1,
    /** HejiDawson */
    HejiDawson = 2,
    /** Photographic */
    Photographic = 3,
}

/**
 * Defines a post process to apply tone mapping
 */
export class TonemapPostProcess extends PostProcess {

    /**
     * Creates a new TonemapPostProcess
     * @param name defines the name of the postprocess
     * @param _operator defines the operator to use
     * @param exposureAdjustment defines the required exposure adjustement
     * @param camera defines the camera to use (can be null)
     * @param samplingMode defines the required sampling mode (BABYLON.Texture.BILINEAR_SAMPLINGMODE by default)
     * @param engine defines the hosting engine (can be ignore if camera is set)
     * @param textureFormat defines the texture format to use (BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT by default)
     */
    constructor(name: string, private _operator: TonemappingOperator,
        /** Defines the required exposure adjustement */
        public exposureAdjustment: number, camera: Camera, samplingMode: number = Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine?: Engine, textureFormat = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "tonemap", ["_ExposureAdjustment"], null, 1.0, camera, samplingMode, engine, true, null, textureFormat);

        var defines = "#define ";

        if (this._operator === TonemappingOperator.Hable) {
            defines += "HABLE_TONEMAPPING";
        }
        else if (this._operator === TonemappingOperator.Reinhard) {
            defines += "REINHARD_TONEMAPPING";
        }
        else if (this._operator === TonemappingOperator.HejiDawson) {
            defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
        }
        else if (this._operator === TonemappingOperator.Photographic) {
            defines += "PHOTOGRAPHIC_TONEMAPPING";
        }

        //sadly a second call to create the effect.
        this.updateEffect(defines);

        this.onApply = (effect: Effect) => {
            effect.setFloat("_ExposureAdjustment", this.exposureAdjustment);
        };
    }
}
