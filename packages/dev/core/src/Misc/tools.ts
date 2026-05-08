/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tools.pure";

import { registerTools } from "./tools.pure";
registerTools();
