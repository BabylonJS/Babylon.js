/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import condition.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./condition.pure";

import { registerCondition } from "./condition.pure";
registerCondition();
