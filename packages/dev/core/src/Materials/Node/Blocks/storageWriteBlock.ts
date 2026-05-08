/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import storageWriteBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./storageWriteBlock.pure";

import { RegisterStorageWriteBlock } from "./storageWriteBlock.pure";
RegisterStorageWriteBlock();
