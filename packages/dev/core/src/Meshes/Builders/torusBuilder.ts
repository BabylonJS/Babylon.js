/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBuilder.pure";

import { registerTorusBuilder } from "./torusBuilder.pure";
registerTorusBuilder();
