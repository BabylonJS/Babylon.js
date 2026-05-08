/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.views.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.views.pure";

import { registerAbstractEngineViews } from "./abstractEngine.views.pure";
registerAbstractEngineViews();
