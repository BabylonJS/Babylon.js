/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import groundBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./groundBuilder.pure";

import { registerGroundBuilder } from "./groundBuilder.pure";
registerGroundBuilder();
