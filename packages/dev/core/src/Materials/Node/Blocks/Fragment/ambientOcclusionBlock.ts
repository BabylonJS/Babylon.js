/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import ambientOcclusionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ambientOcclusionBlock.pure";

import { RegisterAmbientOcclusionBlock } from "./ambientOcclusionBlock.pure";
RegisterAmbientOcclusionBlock();
