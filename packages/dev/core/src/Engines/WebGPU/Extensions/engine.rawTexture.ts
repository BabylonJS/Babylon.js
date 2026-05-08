/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.rawTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.rawTexture.pure";

import { registerEnginesWebGPUExtensionsEngineRawTexture } from "./engine.rawTexture.pure";
registerEnginesWebGPUExtensionsEngineRawTexture();
