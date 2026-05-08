/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryStepBlock.pure";

import { registerGeometryStepBlock } from "./geometryStepBlock.pure";
registerGeometryStepBlock();
