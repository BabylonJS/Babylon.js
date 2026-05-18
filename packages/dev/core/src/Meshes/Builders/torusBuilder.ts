/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBuilder.pure";

import { RegisterTorusBuilder } from "./torusBuilder.pure";
RegisterTorusBuilder();
