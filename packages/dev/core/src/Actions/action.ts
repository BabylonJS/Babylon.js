/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import action.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./action.pure";

import { registerAction } from "./action.pure";
registerAction();
