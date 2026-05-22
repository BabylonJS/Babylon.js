/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import condition.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./condition.pure";

import { RegisterCondition } from "./condition.pure";
RegisterCondition();
