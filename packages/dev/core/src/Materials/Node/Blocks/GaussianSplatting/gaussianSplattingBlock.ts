/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gaussianSplattingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingBlock.pure";

import { RegisterGaussianSplattingBlock } from "./gaussianSplattingBlock.pure";
RegisterGaussianSplattingBlock();
