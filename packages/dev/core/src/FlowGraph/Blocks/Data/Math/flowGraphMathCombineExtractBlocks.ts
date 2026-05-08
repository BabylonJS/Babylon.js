/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMathCombineExtractBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMathCombineExtractBlocks.pure";

import { RegisterFlowGraphMathCombineExtractBlocks } from "./flowGraphMathCombineExtractBlocks.pure";
RegisterFlowGraphMathCombineExtractBlocks();
