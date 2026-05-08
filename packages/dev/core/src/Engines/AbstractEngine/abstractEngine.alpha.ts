/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.alpha.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.alpha.pure";

import { registerAbstractEngineAlpha } from "./abstractEngine.alpha.pure";
registerAbstractEngineAlpha();
