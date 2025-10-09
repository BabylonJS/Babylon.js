/** This file must only contain pure code and pure imports */

import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import type { Effect } from "./effect";

// All non-type imports must be pure

import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";

// All code must be pure

/**
 * Binds the logarithmic depth information from the scene to the effect for the given defines.
 * @param defines The generated defines used in the effect
 * @param effect The effect we are binding the data to
 * @param scene The scene we are willing to render with logarithmic scale for
 */
export function BindLogDepth(defines: any, effect: Effect, scene: Scene): void {
    if (!defines || defines["LOGARITHMICDEPTH"] || (defines.indexOf && defines.indexOf("LOGARITHMICDEPTH") >= 0)) {
        const camera = scene.activeCamera as Camera;
        if (camera.mode === Constants.ORTHOGRAPHIC_CAMERA) {
            Logger.Error("Logarithmic depth is not compatible with orthographic cameras!", 20);
        }
        effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(camera.maxZ + 1.0) / Math.LN2));
    }
}
