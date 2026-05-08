/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extractHighlightsPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcess.pure";

import { registerExtractHighlightsPostProcess } from "./extractHighlightsPostProcess.pure";
registerExtractHighlightsPostProcess();
