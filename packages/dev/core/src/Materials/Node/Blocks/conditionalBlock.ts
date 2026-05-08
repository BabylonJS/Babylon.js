/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import conditionalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./conditionalBlock.pure";

import { registerConditionalBlock } from "./conditionalBlock.pure";
registerConditionalBlock();
