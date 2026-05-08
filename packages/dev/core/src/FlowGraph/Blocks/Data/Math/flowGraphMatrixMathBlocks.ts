/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMatrixMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMatrixMathBlocks.pure";

import { RegisterFlowGraphMatrixMathBlocks } from "./flowGraphMatrixMathBlocks.pure";
RegisterFlowGraphMatrixMathBlocks();
