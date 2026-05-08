export * from "./engine.renderTargetCube.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.renderTargetCube.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.renderTargetCube.pure";

import { registerEnginesExtensionsEngineRenderTargetCube } from "./engine.renderTargetCube.pure";
registerEnginesExtensionsEngineRenderTargetCube();
