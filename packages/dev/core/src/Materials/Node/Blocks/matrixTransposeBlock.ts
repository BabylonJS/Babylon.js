/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixTransposeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixTransposeBlock.pure";

import { RegisterMatrixTransposeBlock } from "./matrixTransposeBlock.pure";
RegisterMatrixTransposeBlock();
