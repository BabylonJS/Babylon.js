/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryElbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryElbowBlock.pure";

import { registerGeometryElbowBlock } from "./geometryElbowBlock.pure";
registerGeometryElbowBlock();
