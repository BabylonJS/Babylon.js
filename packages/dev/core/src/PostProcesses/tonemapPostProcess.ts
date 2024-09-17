import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";

import type { Nullable } from "../types";

import type { AbstractEngine } from "core/Engines/abstractEngine";

/** Defines operator used for tonemapping */
export const enum TonemappingOperator {
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
     * Gets a string identifying the name of the class
     * @returns "TonemapPostProcess" string
     */
    public override getClassName(): string {
        return "TonemapPostProcess";
    }

    /**
     * Creates a new TonemapPostProcess
     * @param name defines the name of the postprocess
     * @param _operator defines the operator to use
     * @param exposureAdjustment defines the required exposure adjustment
     * @param camera defines the camera to use (can be null)
     * @param samplingMode defines the required sampling mode (BABYLON.Texture.BILINEAR_SAMPLINGMODE by default)
     * @param engine defines the hosting engine (can be ignore if camera is set)
     * @param textureFormat defines the texture format to use (BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(
        name: string,
        private _operator: TonemappingOperator,
        /** Defines the required exposure adjustment */
        public exposureAdjustment: number,
        camera: Nullable<Camera>,
        samplingMode: number = Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        engine?: AbstractEngine,
        textureFormat = Constants.TEXTURETYPE_UNSIGNED_INT,
        reusable?: boolean
    ) {
        super(name, "tonemap", ["_ExposureAdjustment"], null, 1.0, camera, samplingMode, engine, reusable, null, textureFormat);

        let defines = "#define ";

        if (this._operator === TonemappingOperator.Hable) {
            defines += "HABLE_TONEMAPPING";
        } else if (this._operator === TonemappingOperator.Reinhard) {
            defines += "REINHARD_TONEMAPPING";
        } else if (this._operator === TonemappingOperator.HejiDawson) {
            defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
        } else if (this._operator === TonemappingOperator.Photographic) {
            defines += "PHOTOGRAPHIC_TONEMAPPING";
        }

        //sadly a second call to create the effect.
        this.updateEffect(defines);

        this.onApply = (effect: Effect) => {
            effect.setFloat("_ExposureAdjustment", this.exposureAdjustment);
        };
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/tonemap.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/tonemap.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }
}
