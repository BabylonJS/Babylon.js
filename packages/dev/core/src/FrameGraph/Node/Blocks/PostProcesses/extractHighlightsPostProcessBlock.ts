/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extractHighlightsPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcessBlock.pure";

import { RegisterExtractHighlightsPostProcessBlock } from "./extractHighlightsPostProcessBlock.pure";
RegisterExtractHighlightsPostProcessBlock();
