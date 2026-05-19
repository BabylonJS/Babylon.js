/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import remapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./remapBlock.pure";

import { RegisterRemapBlock } from "./remapBlock.pure";
RegisterRemapBlock();
