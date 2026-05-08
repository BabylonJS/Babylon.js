/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import math.vector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.vector.pure";

import { RegisterMathVector } from "./math.vector.pure";
RegisterMathVector();
