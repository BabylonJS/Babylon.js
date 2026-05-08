/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import linesBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./linesBuilder.pure";

import { registerLinesBuilder } from "./linesBuilder.pure";
registerLinesBuilder();
