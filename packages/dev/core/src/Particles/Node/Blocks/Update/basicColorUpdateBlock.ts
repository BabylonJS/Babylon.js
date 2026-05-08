/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basicColorUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicColorUpdateBlock.pure";

import { registerBasicColorUpdateBlock } from "./basicColorUpdateBlock.pure";
registerBasicColorUpdateBlock();
