/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import animatable.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./animatable.pure";

import { registerAnimatable } from "./animatable.pure";
registerAnimatable();
