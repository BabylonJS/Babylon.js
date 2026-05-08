/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import smartFilterFragmentOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smartFilterFragmentOutputBlock.pure";

import { registerSmartFilterFragmentOutputBlock } from "./smartFilterFragmentOutputBlock.pure";
registerSmartFilterFragmentOutputBlock();
