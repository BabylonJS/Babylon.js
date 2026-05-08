/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.multiRender.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.multiRender.pure";

import { registerEnginesExtensionsEngineMultiRender } from "./engine.multiRender.pure";
registerEnginesExtensionsEngineMultiRender();
