/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extrudeGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extrudeGeometryBlock.pure";

import { RegisterExtrudeGeometryBlock } from "./extrudeGeometryBlock.pure";
RegisterExtrudeGeometryBlock();
