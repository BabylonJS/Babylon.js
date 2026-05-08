/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basis.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basis.pure";

import { registerBasis } from "./basis.pure";
registerBasis();
