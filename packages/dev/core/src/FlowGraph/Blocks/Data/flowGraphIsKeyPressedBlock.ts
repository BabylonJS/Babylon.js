/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphIsKeyPressedBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphIsKeyPressedBlock.pure";

import { RegisterFlowGraphIsKeyPressedBlock } from "./flowGraphIsKeyPressedBlock.pure";
RegisterFlowGraphIsKeyPressedBlock();
