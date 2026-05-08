/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateScaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateScaleBlock.pure";

import { registerUpdateScaleBlock } from "./updateScaleBlock.pure";
registerUpdateScaleBlock();
