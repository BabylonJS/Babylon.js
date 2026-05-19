/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tubeBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tubeBuilder.pure";

import { RegisterTubeBuilder } from "./tubeBuilder.pure";
RegisterTubeBuilder();
