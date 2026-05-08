/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryArcTan2Block.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryArcTan2Block.pure";

import { registerGeometryArcTan2Block } from "./geometryArcTan2Block.pure";
registerGeometryArcTan2Block();
