export * from "./engine.computeShader.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.computeShader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.computeShader.pure";

import { registerEnginesExtensionsEngineComputeShader } from "./engine.computeShader.pure";
registerEnginesExtensionsEngineComputeShader();
