/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iridescenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iridescenceBlock.pure";

import { registerIridescenceBlock } from "./iridescenceBlock.pure";
registerIridescenceBlock();
