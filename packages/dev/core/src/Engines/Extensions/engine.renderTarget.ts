export * from "./engine.renderTarget.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.renderTarget.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.renderTarget.pure";

import { registerEnginesExtensionsEngineRenderTarget } from "./engine.renderTarget.pure";
registerEnginesExtensionsEngineRenderTarget();
