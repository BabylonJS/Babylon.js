/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tools.pure";

import { RegisterTools } from "./tools.pure";
RegisterTools();
