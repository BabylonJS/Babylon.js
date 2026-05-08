/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import remapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./remapBlock.pure";

import { registerRemapBlock } from "./remapBlock.pure";
registerRemapBlock();
