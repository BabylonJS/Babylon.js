/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import loopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./loopBlock.pure";

import { registerLoopBlock } from "./loopBlock.pure";
registerLoopBlock();
