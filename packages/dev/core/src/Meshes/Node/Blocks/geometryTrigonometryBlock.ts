/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryTrigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTrigonometryBlock.pure";

import { registerGeometryTrigonometryBlock } from "./geometryTrigonometryBlock.pure";
registerGeometryTrigonometryBlock();
