/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import math.color.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./math.color.pure";

import { registerMathColor } from "./math.color.pure";
registerMathColor();
