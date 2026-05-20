/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphVectorMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphVectorMathBlocks.pure";

import { RegisterFlowGraphVectorMathBlocks } from "./flowGraphVectorMathBlocks.pure";
RegisterFlowGraphVectorMathBlocks();
