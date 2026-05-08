/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extrudeGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extrudeGeometryBlock.pure";

import { registerExtrudeGeometryBlock } from "./extrudeGeometryBlock.pure";
registerExtrudeGeometryBlock();
