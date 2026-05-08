/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vectorSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorSplitterBlock.pure";

import { registerVectorSplitterBlock } from "./vectorSplitterBlock.pure";
registerVectorSplitterBlock();
