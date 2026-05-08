/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import loadingScreen.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./loadingScreen.pure";

import { registerLoadingScreen } from "./loadingScreen.pure";
registerLoadingScreen();
