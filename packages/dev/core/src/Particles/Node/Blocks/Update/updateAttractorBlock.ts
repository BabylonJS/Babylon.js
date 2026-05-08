/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateAttractorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAttractorBlock.pure";

import { RegisterUpdateAttractorBlock } from "./updateAttractorBlock.pure";
RegisterUpdateAttractorBlock();
