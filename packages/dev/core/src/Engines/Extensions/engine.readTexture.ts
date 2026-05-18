export * from "./engine.readTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.readTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.readTexture.pure";

import { RegisterEnginesExtensionsEngineReadTexture } from "./engine.readTexture.pure";
RegisterEnginesExtensionsEngineReadTexture();
