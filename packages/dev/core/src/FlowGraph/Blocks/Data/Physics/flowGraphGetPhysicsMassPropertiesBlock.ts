/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetPhysicsMassPropertiesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetPhysicsMassPropertiesBlock.pure";

import { registerFlowGraphGetPhysicsMassPropertiesBlock } from "./flowGraphGetPhysicsMassPropertiesBlock.pure";
registerFlowGraphGetPhysicsMassPropertiesBlock();
