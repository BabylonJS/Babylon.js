/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./LinearGradient.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./LinearGradient.pure";

import { RegisterLinearGradient } from "./LinearGradient.pure";
RegisterLinearGradient();
