/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gradientBlock.pure";

import { registerGradientBlock } from "./gradientBlock.pure";
registerGradientBlock();
