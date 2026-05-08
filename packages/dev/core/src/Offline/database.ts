/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import database.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./database.pure";

import { registerDatabase } from "./database.pure";
registerDatabase();
