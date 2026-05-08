/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphRichTypes.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphRichTypes.pure";

import { registerFlowGraphRichTypes } from "./flowGraphRichTypes.pure";
registerFlowGraphRichTypes();
