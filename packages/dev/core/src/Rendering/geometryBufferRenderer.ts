/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryBufferRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryBufferRenderer.pure";

import { registerGeometryBufferRenderer } from "./geometryBufferRenderer.pure";
registerGeometryBufferRenderer();
