/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import polygonBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./polygonBuilder.pure";

import { registerPolygonBuilder } from "./polygonBuilder.pure";
registerPolygonBuilder();
