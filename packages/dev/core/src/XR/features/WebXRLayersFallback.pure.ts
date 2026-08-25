/** This file must only contain pure code and pure imports */

export * from "./Layers/WebXRFallbackLayer";

import { RegisterEnginesExtensionsEngineVideoTexture } from "../../Engines/Extensions/engine.videoTexture.pure";
import { RegisterEnginesWebGPUExtensionsEngineVideoTexture } from "../../Engines/WebGPU/Extensions/engine.videoTexture.pure";
import { VideoTexture } from "../../Materials/Textures/videoTexture.pure";
import { Logger } from "../../Misc/logger";
import { WebXRFallbackLayerWrapper } from "./Layers/WebXRFallbackLayer";
import { _RegisterWebXRFallbackLayerFactory } from "./WebXRLayers.pure";

let _Registered = false;

/**
 * Registers the optional WebXR mesh-fallback implementation.
 */
export function RegisterWebXRLayersFallback(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    _RegisterWebXRFallbackLayerFactory((context) => {
        let texture = context.texture;
        let ownsTexture = false;
        if (context.video) {
            if (context.isWebGPU) {
                RegisterEnginesWebGPUExtensionsEngineVideoTexture();
            } else {
                RegisterEnginesExtensionsEngineVideoTexture();
            }
            texture = new VideoTexture(`WebXR ${context.layerType} fallback video`, context.video, context.scene, false, false, undefined, {
                independentVideoSource: true,
            });
            ownsTexture = true;
        } else if (!texture) {
            Logger.Warn(`fallbackTexture must be provided to emulate an ${context.layerType} graphics layer with a mesh.`);
            return null;
        }

        if (context.layerType === "XRCubeLayer" && !texture.isCube) {
            Logger.Warn("fallbackTexture must be a cube texture to emulate an XRCubeLayer.");
            return null;
        }

        return new WebXRFallbackLayerWrapper(
            context.scene,
            context.layerType,
            texture,
            context.transformNode,
            context.ownsTransformNode,
            ownsTexture,
            context.dimensions,
            context.worldScalingFactor
        );
    });
}
