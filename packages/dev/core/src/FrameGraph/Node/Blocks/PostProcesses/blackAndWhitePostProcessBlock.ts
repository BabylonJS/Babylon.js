/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blackAndWhitePostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blackAndWhitePostProcessBlock.pure";

import { registerBlackAndWhitePostProcessBlock } from "./blackAndWhitePostProcessBlock.pure";
registerBlackAndWhitePostProcessBlock();
