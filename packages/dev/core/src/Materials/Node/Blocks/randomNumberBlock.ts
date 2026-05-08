/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import randomNumberBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomNumberBlock.pure";

import { registerRandomNumberBlock } from "./randomNumberBlock.pure";
registerRandomNumberBlock();
