/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryInterceptorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInterceptorBlock.pure";

import { registerGeometryInterceptorBlock } from "./geometryInterceptorBlock.pure";
registerGeometryInterceptorBlock();
