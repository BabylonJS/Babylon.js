/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphFlipFlopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphFlipFlopBlock.pure";

import { RegisterFlowGraphFlipFlopBlock } from "./flowGraphFlipFlopBlock.pure";
RegisterFlowGraphFlipFlopBlock();
