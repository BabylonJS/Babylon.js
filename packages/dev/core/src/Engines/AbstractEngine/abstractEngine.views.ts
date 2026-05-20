export * from "./abstractEngine.views.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.views.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.views.pure";

import { RegisterAbstractEngineViews } from "./abstractEngine.views.pure";
RegisterAbstractEngineViews();
