export * from "./engine.multiview.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.multiview.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.multiview.pure";

import { RegisterEngineMultiview } from "./engine.multiview.pure";
RegisterEngineMultiview();
