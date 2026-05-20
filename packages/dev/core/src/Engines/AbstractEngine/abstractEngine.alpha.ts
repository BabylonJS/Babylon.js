export * from "./abstractEngine.alpha.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.alpha.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.alpha.pure";

import { RegisterAbstractEngineAlpha } from "./abstractEngine.alpha.pure";
RegisterAbstractEngineAlpha();
