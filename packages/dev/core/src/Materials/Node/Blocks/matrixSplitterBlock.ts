/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixSplitterBlock.pure";

import { registerMatrixSplitterBlock } from "./matrixSplitterBlock.pure";
registerMatrixSplitterBlock();
