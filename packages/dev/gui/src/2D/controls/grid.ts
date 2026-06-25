/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./grid.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./grid.pure";

import { RegisterGrid } from "./grid.pure";
RegisterGrid();
