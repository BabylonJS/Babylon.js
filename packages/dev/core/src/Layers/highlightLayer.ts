export * from "./highlightLayer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import highlightLayer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./highlightLayer.pure";

import { RegisterHighlightLayer } from "./highlightLayer.pure";
RegisterHighlightLayer();
