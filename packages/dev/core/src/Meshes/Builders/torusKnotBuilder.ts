/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusKnotBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusKnotBuilder.pure";

import { registerTorusKnotBuilder } from "./torusKnotBuilder.pure";
registerTorusKnotBuilder();
