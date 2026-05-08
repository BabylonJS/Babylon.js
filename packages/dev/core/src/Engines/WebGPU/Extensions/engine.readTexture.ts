/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.readTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.readTexture.pure";

import { registerEnginesWebGPUExtensionsEngineReadTexture } from "./engine.readTexture.pure";
registerEnginesWebGPUExtensionsEngineReadTexture();
