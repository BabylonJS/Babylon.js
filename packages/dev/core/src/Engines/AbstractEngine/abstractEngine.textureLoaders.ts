/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.textureLoaders.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.textureLoaders.pure";

import { RegisterAbstractEngineTextureLoaders } from "./abstractEngine.textureLoaders.pure";
RegisterAbstractEngineTextureLoaders();
