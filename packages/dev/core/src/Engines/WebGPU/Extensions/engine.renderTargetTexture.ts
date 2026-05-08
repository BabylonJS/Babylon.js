export * from "./engine.renderTargetTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.renderTargetTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.renderTargetTexture.pure";

import { registerEnginesWebGPUExtensionsEngineRenderTargetTexture } from "./engine.renderTargetTexture.pure";
registerEnginesWebGPUExtensionsEngineRenderTargetTexture();
