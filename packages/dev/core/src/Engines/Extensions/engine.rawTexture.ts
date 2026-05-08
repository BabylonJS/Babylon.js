export * from "./engine.rawTexture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.rawTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.rawTexture.pure";

import { RegisterEnginesExtensionsEngineRawTexture } from "./engine.rawTexture.pure";
RegisterEnginesExtensionsEngineRawTexture();
