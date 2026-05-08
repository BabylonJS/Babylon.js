/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import refractBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractBlock.pure";

import { registerRefractBlock } from "./refractBlock.pure";
registerRefractBlock();
