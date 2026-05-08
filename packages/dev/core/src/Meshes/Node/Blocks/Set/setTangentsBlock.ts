/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setTangentsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setTangentsBlock.pure";

import { RegisterSetTangentsBlock } from "./setTangentsBlock.pure";
RegisterSetTangentsBlock();
