/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphFunctionReferenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphFunctionReferenceBlock.pure";

import { RegisterFlowGraphFunctionReferenceBlock } from "./flowGraphFunctionReferenceBlock.pure";
RegisterFlowGraphFunctionReferenceBlock();
