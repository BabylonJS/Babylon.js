/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphJsonPointerParserBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphJsonPointerParserBlock.pure";

import { registerFlowGraphJsonPointerParserBlock } from "./flowGraphJsonPointerParserBlock.pure";
registerFlowGraphJsonPointerParserBlock();
