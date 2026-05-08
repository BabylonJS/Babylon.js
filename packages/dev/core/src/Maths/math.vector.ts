/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import math.vector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.vector.pure";

import { registerMathVector } from "./math.vector.pure";
registerMathVector();
