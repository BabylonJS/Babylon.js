/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import posterizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./posterizeBlock.pure";

import { registerPosterizeBlock } from "./posterizeBlock.pure";
registerPosterizeBlock();
