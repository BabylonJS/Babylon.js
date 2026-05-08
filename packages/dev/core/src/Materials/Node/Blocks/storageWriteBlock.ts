/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import storageWriteBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./storageWriteBlock.pure";

import { registerStorageWriteBlock } from "./storageWriteBlock.pure";
registerStorageWriteBlock();
