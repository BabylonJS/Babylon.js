export * from "./engine.dynamicTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.dynamicTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.dynamicTexture.pure";

import { RegisterEnginesWebGPUExtensionsEngineDynamicTexture } from "./engine.dynamicTexture.pure";
RegisterEnginesWebGPUExtensionsEngineDynamicTexture();
