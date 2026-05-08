/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cylinderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderBlock.pure";

import { registerCylinderBlock } from "./cylinderBlock.pure";
registerCylinderBlock();
