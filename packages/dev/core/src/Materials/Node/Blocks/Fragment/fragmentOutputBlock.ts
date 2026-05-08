/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fragmentOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragmentOutputBlock.pure";

import { registerFragmentOutputBlock } from "./fragmentOutputBlock.pure";
registerFragmentOutputBlock();
