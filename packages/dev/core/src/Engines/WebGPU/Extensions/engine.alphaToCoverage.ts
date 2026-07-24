export * from "./engine.alphaToCoverage.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.alphaToCoverage.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.alphaToCoverage.pure";

import { RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage } from "./engine.alphaToCoverage.pure";
RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage();
