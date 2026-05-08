/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import animation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./animation.pure";

import { RegisterAnimation } from "./animation.pure";
RegisterAnimation();
