/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pbrMetallicRoughnessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMetallicRoughnessBlock.pure";

import { registerPbrMetallicRoughnessBlock } from "./pbrMetallicRoughnessBlock.pure";
registerPbrMetallicRoughnessBlock();
