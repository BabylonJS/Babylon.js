import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { PostProcess } from "./postProcess";

import "../Shaders/vrMultiviewToSingleview.fragment";
import "../Engines/Extensions/engine.multiview";
import type { Nullable } from "../types";

/**
 * VRMultiviewToSingleview used to convert multiview texture arrays to standard textures for scenarios such as webVR
 * This will not be used for webXR as it supports displaying texture arrays directly
 */
export class VRMultiviewToSingleviewPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "VRMultiviewToSingleviewPostProcess" string
     */
    public getClassName(): string {
        return "VRMultiviewToSingleviewPostProcess";
    }

    /**
     * Initializes a VRMultiviewToSingleview
     * @param name name of the post process
     * @param camera camera to be applied to
     * @param scaleFactor scaling factor to the size of the output texture
     */
    constructor(name: string, camera: Nullable<Camera>, scaleFactor: number) {
        super(name, "vrMultiviewToSingleview", ["imageIndex"], ["multiviewSampler"], scaleFactor, camera, Texture.BILINEAR_SAMPLINGMODE);

        const cam = camera ?? this.getCamera();
        this.onSizeChangedObservable.add(() => {});
        this.onApplyObservable.add((effect: Effect) => {
            if (cam._scene.activeCamera && cam._scene.activeCamera.isLeftCamera) {
                effect.setInt("imageIndex", 0);
            } else {
                effect.setInt("imageIndex", 1);
            }
            effect.setTexture("multiviewSampler", cam._multiviewTexture);
        });
    }
}
