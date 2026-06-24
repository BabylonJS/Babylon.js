/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./scrollBar.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./scrollBar.pure";

import { RegisterScrollBar } from "./scrollBar.pure";
RegisterScrollBar();
