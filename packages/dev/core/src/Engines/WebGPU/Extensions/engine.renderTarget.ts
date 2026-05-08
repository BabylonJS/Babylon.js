/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.renderTarget.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.renderTarget.pure";

import { registerEnginesWebGPUExtensionsEngineRenderTarget } from "./engine.renderTarget.pure";
registerEnginesWebGPUExtensionsEngineRenderTarget();
