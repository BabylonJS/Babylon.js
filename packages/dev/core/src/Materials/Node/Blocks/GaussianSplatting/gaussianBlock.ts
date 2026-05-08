/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianBlock.pure";

import { registerGaussianBlock } from "./gaussianBlock.pure";
registerGaussianBlock();
