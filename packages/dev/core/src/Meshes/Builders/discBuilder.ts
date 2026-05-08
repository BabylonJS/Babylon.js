/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import discBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./discBuilder.pure";

import { registerDiscBuilder } from "./discBuilder.pure";
registerDiscBuilder();
