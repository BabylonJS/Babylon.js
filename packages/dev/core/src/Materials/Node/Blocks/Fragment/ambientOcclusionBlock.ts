/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ambientOcclusionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ambientOcclusionBlock.pure";

import { registerAmbientOcclusionBlock } from "./ambientOcclusionBlock.pure";
registerAmbientOcclusionBlock();
