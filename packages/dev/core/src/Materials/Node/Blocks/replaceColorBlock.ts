/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import replaceColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./replaceColorBlock.pure";

import { RegisterReplaceColorBlock } from "./replaceColorBlock.pure";
RegisterReplaceColorBlock();
