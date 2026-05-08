/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cylinderShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderShapeBlock.pure";

import { RegisterCylinderShapeBlock } from "./cylinderShapeBlock.pure";
RegisterCylinderShapeBlock();
