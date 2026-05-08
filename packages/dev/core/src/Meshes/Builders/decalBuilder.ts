/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import decalBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./decalBuilder.pure";

import { RegisterDecalBuilder } from "./decalBuilder.pure";
RegisterDecalBuilder();
