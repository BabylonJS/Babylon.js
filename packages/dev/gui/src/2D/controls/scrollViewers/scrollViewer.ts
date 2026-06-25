/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./scrollViewer.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./scrollViewer.pure";

import { RegisterScrollViewer } from "./scrollViewer.pure";
RegisterScrollViewer();
