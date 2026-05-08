/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.readTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.readTexture.pure";

import { registerEnginesExtensionsEngineReadTexture } from "./engine.readTexture.pure";
registerEnginesExtensionsEngineReadTexture();
