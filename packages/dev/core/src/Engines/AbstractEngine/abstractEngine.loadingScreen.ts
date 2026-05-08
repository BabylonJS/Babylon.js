/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.loadingScreen.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.loadingScreen.pure";

import { registerAbstractEngineLoadingScreen } from "./abstractEngine.loadingScreen.pure";
registerAbstractEngineLoadingScreen();
