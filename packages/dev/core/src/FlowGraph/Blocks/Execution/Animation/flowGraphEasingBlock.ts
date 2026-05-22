/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphEasingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphEasingBlock.pure";

import { RegisterFlowGraphEasingBlock } from "./flowGraphEasingBlock.pure";
RegisterFlowGraphEasingBlock();
