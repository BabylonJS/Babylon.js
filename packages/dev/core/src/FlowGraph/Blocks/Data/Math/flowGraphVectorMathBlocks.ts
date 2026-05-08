/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphVectorMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphVectorMathBlocks.pure";

import { registerFlowGraphVectorMathBlocks } from "./flowGraphVectorMathBlocks.pure";
registerFlowGraphVectorMathBlocks();
