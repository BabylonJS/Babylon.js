/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.renderTargetTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.renderTargetTexture.pure";

import { registerEnginesExtensionsEngineRenderTargetTexture } from "./engine.renderTargetTexture.pure";
registerEnginesExtensionsEngineRenderTargetTexture();
