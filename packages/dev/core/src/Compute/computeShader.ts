/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import computeShader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeShader.pure";
export * from "./computeShader.types";

import { RegisterComputeShader } from "./computeShader.pure";
RegisterComputeShader();
