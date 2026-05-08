/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import customShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./customShapeBlock.pure";

import { registerCustomShapeBlock } from "./customShapeBlock.pure";
registerCustomShapeBlock();
