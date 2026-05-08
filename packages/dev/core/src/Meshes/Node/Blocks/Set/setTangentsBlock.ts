/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setTangentsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setTangentsBlock.pure";

import { registerSetTangentsBlock } from "./setTangentsBlock.pure";
registerSetTangentsBlock();
