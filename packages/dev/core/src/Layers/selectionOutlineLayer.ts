/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import selectionOutlineLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./selectionOutlineLayer.pure";

import { registerSelectionOutlineLayer } from "./selectionOutlineLayer.pure";
registerSelectionOutlineLayer();
