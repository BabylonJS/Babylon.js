/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import coneShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./coneShapeBlock.pure";

import { RegisterConeShapeBlock } from "./coneShapeBlock.pure";
RegisterConeShapeBlock();
