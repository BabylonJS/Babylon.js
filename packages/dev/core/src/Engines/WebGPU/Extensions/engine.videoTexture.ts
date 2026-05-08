export * from "./engine.videoTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.videoTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.videoTexture.pure";

import { RegisterEnginesWebGPUExtensionsEngineVideoTexture } from "./engine.videoTexture.pure";
RegisterEnginesWebGPUExtensionsEngineVideoTexture();
