/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subtractBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subtractBlock.pure";

import { registerSubtractBlock } from "./subtractBlock.pure";
registerSubtractBlock();
