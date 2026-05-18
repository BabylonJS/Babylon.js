/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphConsoleLogBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConsoleLogBlock.pure";

import { RegisterFlowGraphConsoleLogBlock } from "./flowGraphConsoleLogBlock.pure";
RegisterFlowGraphConsoleLogBlock();
