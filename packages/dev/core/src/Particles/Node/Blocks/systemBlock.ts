/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import systemBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./systemBlock.pure";

import { registerSystemBlock } from "./systemBlock.pure";
registerSystemBlock();
