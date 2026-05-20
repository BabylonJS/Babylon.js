/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import extractHighlightsPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extractHighlightsPostProcess.pure";

import { RegisterExtractHighlightsPostProcess } from "./extractHighlightsPostProcess.pure";
RegisterExtractHighlightsPostProcess();
