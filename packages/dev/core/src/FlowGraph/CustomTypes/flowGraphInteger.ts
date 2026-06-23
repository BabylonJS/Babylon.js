/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphInteger.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphInteger.pure";

import { RegisterFlowGraphInteger } from "./flowGraphInteger.pure";
RegisterFlowGraphInteger();
