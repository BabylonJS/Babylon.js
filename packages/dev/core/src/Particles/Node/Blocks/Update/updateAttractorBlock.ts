/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateAttractorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAttractorBlock.pure";

import { registerUpdateAttractorBlock } from "./updateAttractorBlock.pure";
registerUpdateAttractorBlock();
