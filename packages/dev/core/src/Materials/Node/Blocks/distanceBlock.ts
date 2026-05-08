/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import distanceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./distanceBlock.pure";

import { RegisterDistanceBlock } from "./distanceBlock.pure";
RegisterDistanceBlock();
