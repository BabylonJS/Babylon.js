/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import matrixBuilderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixBuilderBlock.pure";

import { registerMatrixBuilderBlock } from "./matrixBuilderBlock.pure";
registerMatrixBuilderBlock();
