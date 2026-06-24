/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./stackPanel.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./stackPanel.pure";

import { RegisterStackPanel } from "./stackPanel.pure";
RegisterStackPanel();
