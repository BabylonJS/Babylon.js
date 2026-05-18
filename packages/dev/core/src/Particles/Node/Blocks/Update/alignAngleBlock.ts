/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import alignAngleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./alignAngleBlock.pure";

import { RegisterAlignAngleBlock } from "./alignAngleBlock.pure";
RegisterAlignAngleBlock();
