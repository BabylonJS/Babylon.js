/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./displayGrid.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./displayGrid.pure";

import { RegisterDisplayGrid } from "./displayGrid.pure";
RegisterDisplayGrid();
