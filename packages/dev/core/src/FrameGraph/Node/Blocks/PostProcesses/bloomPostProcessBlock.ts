/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bloomPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bloomPostProcessBlock.pure";

import { registerBloomPostProcessBlock } from "./bloomPostProcessBlock.pure";
registerBloomPostProcessBlock();
