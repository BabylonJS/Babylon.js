/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import interpolateValueAction.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./interpolateValueAction.pure";

import { RegisterInterpolateValueAction } from "./interpolateValueAction.pure";
RegisterInterpolateValueAction();
