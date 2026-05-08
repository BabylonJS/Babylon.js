/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import directActions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./directActions.pure";

import { registerDirectActions } from "./directActions.pure";
registerDirectActions();
