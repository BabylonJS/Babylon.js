/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryPowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryPowBlock.pure";

import { registerGeometryPowBlock } from "./geometryPowBlock.pure";
registerGeometryPowBlock();
