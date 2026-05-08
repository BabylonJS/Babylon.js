/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import renderTargetTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./renderTargetTexture.pure";

import { registerRenderTargetTexture } from "./renderTargetTexture.pure";
registerRenderTargetTexture();
