/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import customBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./customBlock.pure";

import { registerCustomBlock } from "./customBlock.pure";
registerCustomBlock();
