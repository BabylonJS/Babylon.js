/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.videoTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.videoTexture.pure";

import { registerEnginesWebGPUExtensionsEngineVideoTexture } from "./engine.videoTexture.pure";
registerEnginesWebGPUExtensionsEngineVideoTexture();
