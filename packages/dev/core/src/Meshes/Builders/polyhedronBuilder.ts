/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import polyhedronBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./polyhedronBuilder.pure";

import { registerPolyhedronBuilder } from "./polyhedronBuilder.pure";
registerPolyhedronBuilder();
