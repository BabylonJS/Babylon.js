/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import boxBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxBuilder.pure";

import { registerBoxBuilder } from "./boxBuilder.pure";
registerBoxBuilder();
