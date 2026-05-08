/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeShaderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShaderBlock.pure";

import { registerComputeShaderBlock } from "./computeShaderBlock.pure";
registerComputeShaderBlock();
