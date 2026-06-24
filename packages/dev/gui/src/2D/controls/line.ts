/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./line.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./line.pure";

import { RegisterLine } from "./line.pure";
RegisterLine();
