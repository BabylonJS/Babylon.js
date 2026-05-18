export * from "./abstractEngine.texture.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.texture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.texture.pure";

import { RegisterAbstractEngineTexture } from "./abstractEngine.texture.pure";
RegisterAbstractEngineTexture();
