/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import booleanGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./booleanGeometryBlock.pure";

import { registerBooleanGeometryBlock } from "./booleanGeometryBlock.pure";
registerBooleanGeometryBlock();
