/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixComposeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixComposeBlock.pure";

import { registerMatrixComposeBlock } from "./matrixComposeBlock.pure";
registerMatrixComposeBlock();
