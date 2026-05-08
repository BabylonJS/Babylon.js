/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import storageReadBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./storageReadBlock.pure";

import { registerStorageReadBlock } from "./storageReadBlock.pure";
registerStorageReadBlock();
