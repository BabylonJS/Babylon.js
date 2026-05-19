export * from "./edgesRenderer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import edgesRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./edgesRenderer.pure";

import { RegisterEdgesRenderer } from "./edgesRenderer.pure";
RegisterEdgesRenderer();
