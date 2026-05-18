/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetAssetBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetAssetBlock.pure";

import { RegisterFlowGraphGetAssetBlock } from "./flowGraphGetAssetBlock.pure";
RegisterFlowGraphGetAssetBlock();
