/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./RadialGradient.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./RadialGradient.pure";

import { RegisterRadialGradient } from "./RadialGradient.pure";
RegisterRadialGradient();
