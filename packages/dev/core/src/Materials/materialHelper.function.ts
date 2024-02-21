import { Logger } from "../Misc/logger";
import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import type { Effect } from "./effect";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { SceneConstants } from "../scene.constants";
import { Constants } from "../Engines/constants";
import { Color3 } from "../Maths/math.color";

// Temps
const _TempFogColor = Color3.Black();

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



/**
 * Binds the fog information from the scene to the effect for the given mesh.
 * @param scene The scene the lights belongs to
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param linearSpace Defines if the fog effect is applied in linear space
 */
export function BindFogParameters(scene: Scene, mesh?: AbstractMesh, effect?: Effect, linearSpace = false): void {
    if (effect && scene.fogEnabled && (!mesh || mesh.applyFog) && scene.fogMode !== SceneConstants.FOGMODE_NONE) {
        effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
        // Convert fog color to linear space if used in a linear space computed shader.
        if (linearSpace) {
            scene.fogColor.toLinearSpaceToRef(_TempFogColor, scene.getEngine().useExactSrgbConversions);
            effect.setColor3("vFogColor", _TempFogColor);
        } else {
            effect.setColor3("vFogColor", scene.fogColor);
        }
    }
}