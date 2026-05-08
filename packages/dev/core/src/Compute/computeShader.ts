/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeShader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShader.pure";

import { registerComputeShader } from "./computeShader.pure";
registerComputeShader();
