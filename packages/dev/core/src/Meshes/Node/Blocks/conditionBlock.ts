/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import conditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./conditionBlock.pure";

import { registerConditionBlock } from "./conditionBlock.pure";
registerConditionBlock();
