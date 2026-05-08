/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import maxBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./maxBlock.pure";

import { registerMaxBlock } from "./maxBlock.pure";
registerMaxBlock();
