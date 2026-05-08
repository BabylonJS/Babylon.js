/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import outputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./outputBlock.pure";

import { registerOutputBlock } from "./outputBlock.pure";
registerOutputBlock();
