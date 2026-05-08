/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.alpha.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.alpha.pure";

import { registerEnginesWebGPUExtensionsEngineAlpha } from "./engine.alpha.pure";
registerEnginesWebGPUExtensionsEngineAlpha();
