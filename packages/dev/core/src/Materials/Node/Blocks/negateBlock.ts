/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import negateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./negateBlock.pure";

import { RegisterNegateBlock } from "./negateBlock.pure";
RegisterNegateBlock();
