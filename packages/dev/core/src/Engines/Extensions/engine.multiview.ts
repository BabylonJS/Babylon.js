export * from "./engine.multiview.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.multiview.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.multiview.pure";

import { registerEngineMultiview } from "./engine.multiview.pure";
registerEngineMultiview();
