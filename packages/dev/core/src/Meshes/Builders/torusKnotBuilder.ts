/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusKnotBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusKnotBuilder.pure";

import { RegisterTorusKnotBuilder } from "./torusKnotBuilder.pure";
RegisterTorusKnotBuilder();
