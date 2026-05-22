/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateScaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateScaleBlock.pure";

import { RegisterUpdateScaleBlock } from "./updateScaleBlock.pure";
RegisterUpdateScaleBlock();
