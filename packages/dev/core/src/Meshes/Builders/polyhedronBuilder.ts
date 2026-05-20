/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import polyhedronBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./polyhedronBuilder.pure";

import { RegisterPolyhedronBuilder } from "./polyhedronBuilder.pure";
RegisterPolyhedronBuilder();
