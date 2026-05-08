/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import edgesRenderer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./edgesRenderer.pure";

import { registerEdgesRenderer } from "./edgesRenderer.pure";
registerEdgesRenderer();
