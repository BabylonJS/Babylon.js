/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fileTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fileTools.pure";

import { registerFileTools } from "./fileTools.pure";
registerFileTools();
