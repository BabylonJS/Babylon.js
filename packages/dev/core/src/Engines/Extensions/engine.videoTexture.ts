export * from "./engine.videoTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.videoTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.videoTexture.pure";

import { registerEnginesExtensionsEngineVideoTexture } from "./engine.videoTexture.pure";
registerEnginesExtensionsEngineVideoTexture();
