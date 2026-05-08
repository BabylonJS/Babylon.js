/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import splatReaderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./splatReaderBlock.pure";

import { registerSplatReaderBlock } from "./splatReaderBlock.pure";
registerSplatReaderBlock();
