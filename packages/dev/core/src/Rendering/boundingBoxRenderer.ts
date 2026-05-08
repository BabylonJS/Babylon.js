export * from "./boundingBoxRenderer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boundingBoxRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boundingBoxRenderer.pure";

import { RegisterBoundingBoxRenderer } from "./boundingBoxRenderer.pure";
RegisterBoundingBoxRenderer();
