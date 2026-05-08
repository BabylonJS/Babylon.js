/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shapeBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shapeBuilder.pure";

import { registerShapeBuilder } from "./shapeBuilder.pure";
registerShapeBuilder();
